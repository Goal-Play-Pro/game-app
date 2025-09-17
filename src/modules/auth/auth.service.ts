import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataAdapterService } from '../../common/services/data-adapter.service';
import { User } from './entities/user.entity';
import { 
  SiweMessageDto, 
  SiweVerifyDto, 
  SolanaMessageDto, 
  SolanaVerifyDto,
  AuthResponseDto,
  ChallengeResponseDto 
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private dataAdapter: DataAdapterService,
  ) {}

  async createSiweChallenge(dto: SiweMessageDto): Promise<ChallengeResponseDto> {
    const nonce = Math.random().toString(36).substring(2);
    const domain = this.configService.get<string>('APP_DOMAIN') || 'localhost:3001';
    const uri = this.configService.get<string>('APP_URI') || 'http://localhost:3001';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const message = `${domain} wants you to sign in with your Ethereum account:
${dto.address}

${dto.statement || 'Sign in to Football Gaming Platform'}

URI: ${uri}
Version: 1
Chain ID: ${dto.chainId}
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}
Expiration Time: ${expiresAt}`;

    await this.dataAdapter.create('challenges', {
      nonce,
      address: dto.address.toLowerCase(),
      chainType: 'ethereum',
      expiresAt: new Date(expiresAt),
      message,
    });

    console.log(`SIWE challenge created for ${dto.address}`);

    return {
      nonce,
      expiresAt,
      message,
    };
  }

  async verifySiweSignature(dto: SiweVerifyDto): Promise<AuthResponseDto> {
    // Parse address from message
    const addressMatch = dto.message.match(/^.+wants you to sign in with your Ethereum account:\n([^\n]+)/);
    if (!addressMatch) {
      throw new BadRequestException('Invalid SIWE message format');
    }

    const address = addressMatch[1].toLowerCase();
    
    // Find and validate challenge
    const challenge = await this.dataAdapter.findOne('challenges', 
      (c: any) => c.address === address && c.message === dto.message
    );

    if (!challenge) {
      throw new UnauthorizedException('Challenge not found or expired');
    }

    if (new Date(challenge.expiresAt) < new Date()) {
      await this.dataAdapter.delete('challenges', challenge.id);
      throw new UnauthorizedException('Challenge expired');
    }

    // Mock signature verification - always succeeds in development
    const isValid = true;

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Clean up challenge
    await this.dataAdapter.delete('challenges', challenge.id);

    // Get or create user
    const user = await this.getOrCreateUser(address);

    // Generate JWT
    const payload = { 
      sub: user.id, 
      wallet: address,
      chainType: 'ethereum',
    };
    const accessToken = await this.jwtService.signAsync(payload);

    // Update last login
    await this.dataAdapter.update('users', user.id, { lastLogin: new Date() });

    console.log(`SIWE login successful for user ${user.id}`);

    return {
      accessToken,
      userId: user.id,
      primaryWallet: address,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '24h',
    };
  }

  async createSolanaChallenge(dto: SolanaMessageDto): Promise<ChallengeResponseDto> {
    const nonce = Math.random().toString(36).substring(2);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const message = `Football Gaming Platform wants you to sign in with your Solana account:
${dto.publicKey}

${dto.statement || 'Sign in to Football Gaming Platform'}

Nonce: ${nonce}
Issued At: ${new Date().toISOString()}
Expiration Time: ${expiresAt}`;

    await this.dataAdapter.create('challenges', {
      nonce,
      address: dto.publicKey,
      chainType: 'solana',
      expiresAt: new Date(expiresAt),
      message,
    });

    console.log(`Solana challenge created for ${dto.publicKey}`);

    return {
      nonce,
      expiresAt,
      message,
    };
  }

  async verifySolanaSignature(dto: SolanaVerifyDto): Promise<AuthResponseDto> {
    // Find and validate challenge
    const challenge = await this.dataAdapter.findOne('challenges',
      (c: any) => c.address === dto.publicKey && c.message === dto.message
    );

    if (!challenge) {
      throw new UnauthorizedException('Challenge not found or expired');
    }

    if (new Date(challenge.expiresAt) < new Date()) {
      await this.dataAdapter.delete('challenges', challenge.id);
      throw new UnauthorizedException('Challenge expired');
    }

    // Mock signature verification - always succeeds in development
    const isValid = true;

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Clean up challenge
    await this.dataAdapter.delete('challenges', challenge.id);

    // Get or create user
    const user = await this.getOrCreateUser(dto.publicKey);

    // Generate JWT
    const payload = { 
      sub: user.id, 
      wallet: dto.publicKey,
      chainType: 'solana',
    };
    const accessToken = await this.jwtService.signAsync(payload);

    // Update last login
    await this.dataAdapter.update('users', user.id, { lastLogin: new Date() });

    console.log(`Solana login successful for user ${user.id}`);

    return {
      accessToken,
      userId: user.id,
      primaryWallet: dto.publicKey,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '24h',
    };
  }

  private async getOrCreateUser(walletAddress: string): Promise<User> {
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Check if user exists
    let user = await this.dataAdapter.findOne('users', (u: User) => u.walletAddress === normalizedAddress);

    if (!user) {
      user = await this.dataAdapter.create('users', {
        walletAddress: normalizedAddress,
        chain: 'ethereum',
        isActive: true,
        lastLogin: new Date(),
        metadata: {
          preferences: {
            language: 'en',
            notifications: true,
          },
        },
      });

      console.log(`New user created: ${user.id}`);
    }

    return user;
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.dataAdapter.findById('users', userId);
    return user && user.isActive ? user : null;
  }
}