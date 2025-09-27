import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoService } from '../../common/services/crypto.service';
import { User } from '../../database/entities/user.entity';
import { Challenge } from '../../database/entities/challenge.entity';
import { randomBytes } from 'crypto';
import { SiweMessage } from 'siwe';
import { getAddress } from 'ethers';
import { PublicKey } from '@solana/web3.js';
import { AUTH_COOKIE_MAX_AGE_MS } from './auth.constants';
import { LoggerService } from '../../common/services/logger.service';
import { SecurityMetricsService } from '../../common/services/security-metrics.service';
import { formatCaip10 } from '../../common/utils/caip10.util';
import { domainToASCII } from 'node:url';

interface AuthRequestContext {
  ip?: string;
}

@Injectable()
export class AuthService {
  private readonly sessionMaxAgeMs = AUTH_COOKIE_MAX_AGE_MS;

  constructor(
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    private logger: LoggerService,
    private securityMetrics: SecurityMetricsService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
  ) {}

  async createSiweChallenge(
    address: string,
    chainId: number,
    statement?: string,
    domainOverride?: string,
    originOverride?: string,
  ) {
    let checksumAddress: string;
    try {
      checksumAddress = getAddress(address);
    } catch {
      throw new UnauthorizedException('Invalid address');
    }

    const nonce = this.generateSiweNonce();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const message = this.buildSiweMessage(
      checksumAddress,
      chainId,
      statement ?? 'Sign in to Goal Play',
      nonce,
      expiresAt,
      domainOverride,
      originOverride,
    );

    // Store challenge
    await this.challengeRepository.save({
      nonce,
      address: checksumAddress.toLowerCase(),
      chainType: this.getChainType(chainId),
      message,
      expiresAt,
      used: false,
    });

    return {
      nonce,
      expiresAt: expiresAt.toISOString(),
      message,
    };
  }

  async verifySiweSignature(message: string, signature: string, requestContext?: AuthRequestContext) {
    let address = 'unknown';
    let nonce = '';
    let challenge: Challenge | null = null;
    let user: User | null = null;
    let chainTypeFromMessage: string | undefined;
    let parsedMessage: SiweMessage | null = null;

    try {
      const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
      if (!addressMatch) {
        throw new UnauthorizedException('Invalid message format');
      }

      address = addressMatch[0].toLowerCase();
      nonce = this.extractNonceFromMessage(message) ?? '';
      if (!nonce) {
        throw new UnauthorizedException('Invalid message nonce');
      }

      try {
        parsedMessage = new SiweMessage(message);
      } catch {
        throw new UnauthorizedException('Invalid SIWE message');
      }

      if (parsedMessage.nonce !== nonce || parsedMessage.address.toLowerCase() !== address) {
        throw new UnauthorizedException('Challenge not found or expired');
      }

      chainTypeFromMessage = this.getChainType(parsedMessage.chainId);

      const isValid = await this.cryptoService.verifySiweSignature(
        message,
        signature,
        address,
        parsedMessage.chainId,
      );
      if (!isValid) {
        const candidateCaip = this.safeFormatCaip10(parsedMessage.chainId, address);
        this.securityMetrics.recordLoginFailure({
          method: 'siwe',
          wallet: candidateCaip ?? address,
          ip: requestContext?.ip,
          chainType: chainTypeFromMessage,
        });
        throw new UnauthorizedException('Invalid signature');
      }

      challenge = await this.challengeRepository.findOne({ where: { nonce } });
      const now = new Date();

      if (!challenge || challenge.address.toLowerCase() !== address || challenge.used || new Date(challenge.expiresAt) <= now) {
        throw new UnauthorizedException('Challenge not found or expired');
      }

      let storedSiwe: SiweMessage;
      try {
        storedSiwe = new SiweMessage(challenge.message);
      } catch {
        throw new UnauthorizedException('Challenge not found or expired');
      }

      if (
        parsedMessage.domain !== storedSiwe.domain ||
        parsedMessage.uri !== storedSiwe.uri ||
        parsedMessage.chainId !== storedSiwe.chainId ||
        parsedMessage.nonce !== challenge.nonce ||
        parsedMessage.address.toLowerCase() !== challenge.address.toLowerCase()
      ) {
        throw new UnauthorizedException('Challenge not found or expired');
      }

      const expectedChainId = this.getChainIdFromType(challenge.chainType);
      if (expectedChainId !== undefined && parsedMessage.chainId !== expectedChainId) {
        throw new UnauthorizedException('Challenge not found or expired');
      }

      if (challenge.message !== message) {
        throw new UnauthorizedException('Challenge not found or expired');
      }

      const updateResult = await this.challengeRepository.update({ id: challenge.id, used: false }, { used: true });
      if (!updateResult.affected) {
        throw new UnauthorizedException('Challenge not found or expired');
      }

      if (!parsedMessage) {
        throw new UnauthorizedException('Invalid SIWE message');
      }

      const loginChainType = challenge.chainType ?? chainTypeFromMessage ?? this.getChainType(1);
      const caip10 = formatCaip10(parsedMessage.chainId, address);

      user = await this.userRepository.findOne({
        where: { walletAddress: address }
      });

      if (!user) {
        user = await this.userRepository.save({
          walletAddress: address,
          walletAddressCaip10: caip10,
          chain: loginChainType,
          isActive: true,
          lastLogin: new Date(),
          metadata: JSON.stringify({
            preferences: {
              language: 'en',
              notifications: true,
            },
          }),
        });
        user.chain = loginChainType;
      } else {
        const updatePayload: Partial<User> = {
          lastLogin: new Date(),
          isActive: true,
          walletAddressCaip10: caip10,
        };

        if (user.chain !== loginChainType) {
          updatePayload.chain = loginChainType;
          user.chain = loginChainType;
        }

        await this.userRepository.update(user.id, updatePayload);
      }

      const payload = {
        sub: user.id,
        wallet: address,
        chainType: loginChainType,
      };

      const token = this.jwtService.sign(payload);

      await this.logger.auditLog('auth.login.success', user.id, {
        method: 'siwe',
        wallet: address,
        walletCaip10: caip10,
        chainType: loginChainType,
        challengeId: challenge.id,
        nonce,
      });

      this.securityMetrics.recordLoginSuccess({
        method: 'siwe',
        wallet: caip10,
        ip: requestContext?.ip,
        chainType: loginChainType,
      });

      return {
        token,
        userId: user.id,
        primaryWallet: address,
        primaryWalletCaip10: caip10,
        expiresInMs: this.sessionMaxAgeMs,
      };
    } catch (error) {
      const userId = user?.id ?? 'unknown';
      const fallbackChainId =
        parsedMessage?.chainId ??
        (challenge?.chainType ? this.getChainIdFromType(challenge.chainType) : undefined) ??
        (chainTypeFromMessage ? this.getChainIdFromType(chainTypeFromMessage) : undefined);
      const failureCaip = this.safeFormatCaip10(fallbackChainId, address);

      await this.logger.auditLog('auth.login.failure', userId, {
        method: 'siwe',
        wallet: address,
        walletCaip10: failureCaip,
        nonce: nonce || undefined,
        challengeId: challenge?.id,
        error: error instanceof Error ? error.message : String(error),
      });
      this.securityMetrics.recordLoginFailure({
        method: 'siwe',
        wallet: failureCaip ?? (address !== 'unknown' ? address : undefined),
        ip: requestContext?.ip,
        chainType: challenge?.chainType ?? chainTypeFromMessage,
      });
      throw error;
    }
  }

  async createSolanaChallenge(publicKey: string, statement: string) {
    let normalizedKey: string;
    try {
      normalizedKey = new PublicKey(publicKey).toBase58();
    } catch {
      throw new UnauthorizedException('Invalid public key');
    }

    const nonce = this.generateSiweNonce();
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 10 * 60 * 1000);

    const message = `Goal Play wants you to sign in with your Solana account:\n${normalizedKey}\n\n${statement}\n\nNonce: ${nonce}\nIssued At: ${issuedAt.toISOString()}\nExpiration Time: ${expiresAt.toISOString()}`;

    await this.challengeRepository.save({
      nonce,
      address: normalizedKey,
      chainType: 'solana',
      message,
      expiresAt,
      used: false,
    });

    return {
      nonce,
      expiresAt: expiresAt.toISOString(),
      message,
    };
  }

  async verifySolanaSignature(message: string, signature: string, publicKey: string, requestContext?: AuthRequestContext) {
    let normalizedKey: string;
    try {
      normalizedKey = new PublicKey(publicKey).toBase58();
    } catch {
      throw new UnauthorizedException('Invalid public key');
    }

    const nonce = this.extractNonceFromMessage(message);
    if (!nonce) {
      throw new UnauthorizedException('Invalid message nonce');
    }

    let challenge: Challenge | null = null;
    let user: User | null = null;
    const solanaCaip10 = this.formatSolanaCaip10(normalizedKey);

    try {
      const isValid = await this.cryptoService.verifySolanaSignature(message, signature, normalizedKey);
      if (!isValid) {
        this.securityMetrics.recordLoginFailure({
          method: 'solana',
          wallet: solanaCaip10,
          ip: requestContext?.ip,
          chainType: 'solana',
        });
        throw new UnauthorizedException('Invalid signature');
      }

      challenge = await this.challengeRepository.findOne({ where: { nonce } });
      if (!challenge || challenge.address !== normalizedKey || challenge.used || new Date(challenge.expiresAt) <= new Date()) {
        throw new UnauthorizedException('Challenge not found or expired');
      }

      if (challenge.chainType !== 'solana' || challenge.message !== message) {
        throw new UnauthorizedException('Challenge not found or expired');
      }

      const updateResult = await this.challengeRepository.update({ id: challenge.id, used: false }, { used: true });
      if (!updateResult.affected) {
        throw new UnauthorizedException('Challenge not found or expired');
      }

      user = await this.userRepository.findOne({
        where: { walletAddress: normalizedKey }
      });

      if (!user) {
        user = await this.userRepository.save({
          walletAddress: normalizedKey,
          walletAddressCaip10: solanaCaip10,
          chain: 'solana',
          isActive: true,
          lastLogin: new Date(),
          metadata: JSON.stringify({
            preferences: {
              language: 'en',
              notifications: true,
            },
          }),
        });
      } else {
        await this.userRepository.update(user.id, {
          lastLogin: new Date(),
          isActive: true,
          walletAddressCaip10: solanaCaip10,
        });
      }

      const payload = {
        sub: user.id,
        wallet: normalizedKey,
        chainType: 'solana',
      };

      const token = this.jwtService.sign(payload);

      await this.logger.auditLog('auth.login.success', user.id, {
        method: 'solana',
        wallet: normalizedKey,
        walletCaip10: solanaCaip10,
        chainType: 'solana',
        challengeId: challenge.id,
        nonce,
      });

      this.securityMetrics.recordLoginSuccess({
        method: 'solana',
        wallet: solanaCaip10,
        ip: requestContext?.ip,
        chainType: 'solana',
      });

      return {
        token,
        userId: user.id,
        primaryWallet: normalizedKey,
        primaryWalletCaip10: solanaCaip10,
        expiresInMs: this.sessionMaxAgeMs,
      };
    } catch (error) {
      const userId = user?.id ?? 'unknown';
      await this.logger.auditLog('auth.login.failure', userId, {
        method: 'solana',
        wallet: normalizedKey,
        walletCaip10: solanaCaip10,
        nonce,
        challengeId: challenge?.id,
        error: error instanceof Error ? error.message : String(error),
      });
      this.securityMetrics.recordLoginFailure({
        method: 'solana',
        wallet: solanaCaip10,
        ip: requestContext?.ip,
        chainType: 'solana',
      });
      throw error;
    }
  }

  private extractNonceFromMessage(message: string): string | null {
    const match = message.match(/Nonce:\s*([\w-]+)/);
    return match ? match[1] : null;
  }

  private buildSiweMessage(
    address: string,
    chainId: number,
    statement: string,
    nonce: string,
    expiresAt: Date,
    domainOverride?: string,
    originOverride?: string,
  ): string {
    const { domain, origin } = this.resolveDomainAndOrigin(domainOverride, originOverride);
    const version = '1';
    const issuedAt = new Date().toISOString();

    return `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}\n\nURI: ${origin}\nVersion: ${version}\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}\nExpiration Time: ${expiresAt.toISOString()}`;
  }

  private resolveDomainAndOrigin(domainOverride?: string, originOverride?: string): { domain: string; origin: string } {
    const defaultOrigin = process.env.NODE_ENV === 'production'
      ? 'https://game.goalplay.pro'
      : 'http://localhost:5173';
    const baseOrigin = process.env.FRONTEND_URL || defaultOrigin;

    const originCandidate = originOverride || (domainOverride ? `https://${domainOverride}` : baseOrigin);
    const originUrl = this.safeParseUrl(originCandidate, defaultOrigin);
    const asciiOriginHostname = domainToASCII(originUrl.hostname) || originUrl.hostname;
    originUrl.hostname = asciiOriginHostname;

    let domainCandidate = domainOverride;
    if (!domainCandidate && originCandidate) {
      domainCandidate = originUrl.host;
    }

    const domainUrl = this.safeParseUrl(domainCandidate ? `https://${domainCandidate}` : originUrl.origin, defaultOrigin);
    const asciiDomainHostname = domainToASCII(domainUrl.hostname) || domainUrl.hostname;
    domainUrl.hostname = asciiDomainHostname;

    return {
      domain: domainUrl.hostname,
      origin: originUrl.origin,
    };
  }

  private safeParseUrl(value: string | undefined, fallback: string): URL {
    try {
      if (!value) {
        return new URL(fallback);
      }

      const normalized = value.startsWith('http') ? value : `https://${value}`;
      return new URL(normalized);
    } catch {
      return new URL(fallback);
    }
  }

  private safeFormatCaip10(chainId: number | undefined, address: string): string | undefined {
    if (typeof chainId !== 'number') {
      return undefined;
    }
    try {
      return formatCaip10(chainId, address);
    } catch {
      return undefined;
    }
  }

  private formatSolanaCaip10(address: string): string {
    return `caip10:solana:mainnet:${address}`;
  }

  private getChainType(chainId: number): string {
    switch (chainId) {
      case 1: return 'ethereum';
      case 56: return 'bsc';
      case 137: return 'polygon';
      case 42161: return 'arbitrum';
      default: return 'ethereum';
    }
  }

  private getChainIdFromType(chainType: string): number | undefined {
    switch (chainType) {
      case 'ethereum':
        return 1;
      case 'bsc':
        return 56;
      case 'polygon':
        return 137;
      case 'arbitrum':
        return 42161;
      default:
        return undefined;
    }
  }

  private generateSiweNonce(): string {
    return randomBytes(16).toString('hex');
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Parse metadata if it's a string (SQLite compatibility)
    const metadata = typeof user.metadata === 'string' 
      ? JSON.parse(user.metadata) 
      : user.metadata || {};

    return {
      id: user.id,
      walletAddress: user.walletAddress,
      walletAddressCaip10: user.walletAddressCaip10,
      displayName: metadata.displayName || `Player${user.id.slice(0, 6)}`,
      bio: metadata.bio || 'Football gaming enthusiast',
      avatar: metadata.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300',
      preferences: metadata.preferences || {
        notifications: {
          gameResults: true,
          newPlayerPacks: true,
          tournamentInvitations: false
        },
        language: 'en'
      },
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async updateUserProfile(userId: string, profileData: any) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Parse existing metadata
    const existingMetadata = typeof user.metadata === 'string' 
      ? JSON.parse(user.metadata) 
      : user.metadata || {};

    // Merge new profile data with existing metadata
    const updatedMetadata = {
      ...existingMetadata,
      displayName: profileData.displayName || existingMetadata.displayName,
      bio: profileData.bio || existingMetadata.bio,
      avatar: profileData.avatar || existingMetadata.avatar,
      preferences: {
        ...existingMetadata.preferences,
        ...profileData.preferences
      },
      updatedAt: new Date().toISOString()
    };

    // Update user with new metadata
    await this.userRepository.update(userId, {
      metadata: JSON.stringify(updatedMetadata) as any,
      updatedAt: new Date()
    });

    console.log(`✅ Profile updated for user ${userId}:`, {
      displayName: updatedMetadata.displayName,
      bio: updatedMetadata.bio?.slice(0, 50) + '...',
      avatar: updatedMetadata.avatar ? 'Updated' : 'No change'
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        walletAddress: user.walletAddress,
        displayName: updatedMetadata.displayName,
        bio: updatedMetadata.bio,
        avatar: updatedMetadata.avatar,
        preferences: updatedMetadata.preferences,
        updatedAt: new Date()
      }
    };
  }
}
