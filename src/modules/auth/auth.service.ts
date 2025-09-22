import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoService } from '../../common/services/crypto.service';
import { User } from '../../database/entities/user.entity';
import { Challenge } from '../../database/entities/challenge.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
  ) {}

  async createSiweChallenge(address: string, chainId: number, statement: string) {
    const nonce = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const message = this.buildSiweMessage(address, chainId, statement, nonce, expiresAt);
    
    // Store challenge
    await this.challengeRepository.save({
      nonce,
      address: address.toLowerCase(),
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

  async verifySiweSignature(message: string, signature: string) {
    // Extract address from message
    const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
    if (!addressMatch) {
      throw new UnauthorizedException('Invalid message format');
    }
    
    const address = addressMatch[0].toLowerCase();
    console.log(`🔐 Verifying SIWE signature for address: ${address}`);
    
    // Verify signature
    const isValid = await this.cryptoService.verifySiweSignature(message, signature, address);
    if (!isValid) {
      console.error(`❌ Invalid signature for address: ${address}`);
      throw new UnauthorizedException('Invalid signature');
    }
    
    console.log(`✅ Valid signature for address: ${address}`);

    // Find and mark challenge as used
    const challenge = await this.challengeRepository.findOne({
      where: { 
        address, 
        used: false,
      }
    });
    
    if (!challenge || new Date(challenge.expiresAt) <= new Date()) {
      console.error(`❌ Challenge not found or expired for address: ${address}`);
      throw new UnauthorizedException('Challenge not found or expired');
    }

    await this.challengeRepository.update(challenge.id, { used: true });
    console.log(`✅ Challenge marked as used: ${challenge.id}`);

    // Find or create user
    let user = await this.userRepository.findOne({
      where: { walletAddress: address }
    });

    if (!user) {
      console.log(`👤 Creating new user for address: ${address}`);
      user = await this.userRepository.save({
        walletAddress: address,
        chain: this.getChainType(1), // Default to ethereum
        isActive: true,
        lastLogin: new Date(),
        metadata: JSON.stringify({
          preferences: {
            language: 'en',
            notifications: true,
          },
        }),
      });
      console.log(`✅ New user created: ${user.id}`);
    } else {
      console.log(`👤 Existing user found: ${user.id}`);
      await this.userRepository.update(user.id, {
        lastLogin: new Date(),
        isActive: true,
      });
    }

    // Generate JWT
    const payload = {
      sub: user.id,
      wallet: address,
      chainType: user.chain,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      userId: user.id,
      primaryWallet: address,
      expiresIn: '24h',
    };
  }

  async createSolanaChallenge(publicKey: string, statement: string) {
    const nonce = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    const message = `Goal Play wants you to sign in with your Solana account:\n${publicKey}\n\n${statement}\n\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}\nExpiration Time: ${expiresAt.toISOString()}`;
    
    await this.challengeRepository.save({
      nonce,
      address: publicKey,
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

  async verifySolanaSignature(message: string, signature: string, publicKey: string) {
    const isValid = await this.cryptoService.verifySolanaSignature(message, signature, publicKey);
    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Similar flow to SIWE but for Solana
    let user = await this.userRepository.findOne({
      where: { walletAddress: publicKey }
    });

    if (!user) {
      user = await this.userRepository.save({
        walletAddress: publicKey,
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
    }

    const payload = {
      sub: user.id,
      wallet: publicKey,
      chainType: 'solana',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      userId: user.id,
      primaryWallet: publicKey,
      expiresIn: '24h',
    };
  }

  private buildSiweMessage(address: string, chainId: number, statement: string, nonce: string, expiresAt: Date): string {
    const domain = 'localhost:3001';
    const uri = 'http://localhost:3001';
    const version = '1';
    const issuedAt = new Date().toISOString();

    return `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}\n\nURI: ${uri}\nVersion: ${version}\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}\nExpiration Time: ${expiresAt.toISOString()}`;
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
}