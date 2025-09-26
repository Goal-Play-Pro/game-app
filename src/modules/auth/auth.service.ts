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

  async createSiweChallenge(address: string, chainId: number, statement: string) {
    let checksumAddress: string;
    try {
      checksumAddress = getAddress(address);
    } catch {
      throw new UnauthorizedException('Invalid address');
    }

    const nonce = this.generateSiweNonce();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const message = this.buildSiweMessage(checksumAddress, chainId, statement, nonce, expiresAt);

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

      let parsedMessage: SiweMessage;
      try {
        parsedMessage = new SiweMessage(message);
      } catch {
        throw new UnauthorizedException('Invalid SIWE message');
      }

      if (parsedMessage.nonce !== nonce || parsedMessage.address.toLowerCase() !== address) {
        throw new UnauthorizedException('Challenge not found or expired');
      }

      chainTypeFromMessage = this.getChainType(parsedMessage.chainId);

      const isValid = await this.cryptoService.verifySiweSignature(message, signature, address);
      if (!isValid) {
        this.securityMetrics.recordLoginFailure({
          method: 'siwe',
          wallet: address,
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

      const loginChainType = challenge.chainType ?? chainTypeFromMessage ?? this.getChainType(1);

      user = await this.userRepository.findOne({
        where: { walletAddress: address }
      });

      if (!user) {
        user = await this.userRepository.save({
          walletAddress: address,
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
        chainType: loginChainType,
        challengeId: challenge.id,
        nonce,
      });

      this.securityMetrics.recordLoginSuccess({
        method: 'siwe',
        wallet: address,
        ip: requestContext?.ip,
        chainType: loginChainType,
      });

      return {
        token,
        userId: user.id,
        primaryWallet: address,
        expiresInMs: this.sessionMaxAgeMs,
      };
    } catch (error) {
      const userId = user?.id ?? 'unknown';
      await this.logger.auditLog('auth.login.failure', userId, {
        method: 'siwe',
        wallet: address,
        nonce: nonce || undefined,
        challengeId: challenge?.id,
        error: error instanceof Error ? error.message : String(error),
      });
      this.securityMetrics.recordLoginFailure({
        method: 'siwe',
        wallet: address !== 'unknown' ? address : undefined,
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

    try {
      const isValid = await this.cryptoService.verifySolanaSignature(message, signature, normalizedKey);
      if (!isValid) {
        this.securityMetrics.recordLoginFailure({
          method: 'solana',
          wallet: normalizedKey,
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
        chainType: 'solana',
        challengeId: challenge.id,
        nonce,
      });

      this.securityMetrics.recordLoginSuccess({
        method: 'solana',
        wallet: normalizedKey,
        ip: requestContext?.ip,
        chainType: 'solana',
      });

      return {
        token,
        userId: user.id,
        primaryWallet: normalizedKey,
        expiresInMs: this.sessionMaxAgeMs,
      };
    } catch (error) {
      const userId = user?.id ?? 'unknown';
      await this.logger.auditLog('auth.login.failure', userId, {
        method: 'solana',
        wallet: normalizedKey,
        nonce,
        challengeId: challenge?.id,
        error: error instanceof Error ? error.message : String(error),
      });
      this.securityMetrics.recordLoginFailure({
        method: 'solana',
        wallet: normalizedKey,
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

  private buildSiweMessage(address: string, chainId: number, statement: string, nonce: string, expiresAt: Date): string {
    const defaultUrl = process.env.NODE_ENV === 'production'
      ? 'https://game.goalplay.pro'
      : 'http://localhost:5173';

    const baseUrl = process.env.FRONTEND_URL || defaultUrl;

    let domain = 'game.goalplay.pro';
    let origin = 'https://game.goalplay.pro';

    try {
      const normalizedUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
      const parsed = new URL(normalizedUrl);
      domain = parsed.host;
      origin = parsed.origin;
    } catch (error) {
      console.warn('⚠️ Could not parse FRONTEND_URL, using defaults for SIWE message');
    }

    const version = '1';
    const issuedAt = new Date().toISOString();

    return `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}\n\nURI: ${origin}\nVersion: ${version}\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}\nExpiration Time: ${expiresAt.toISOString()}`;
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
