import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEthereumAddress, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ChainType } from '@common/types/base.types';

export class SiweMessageDto {
  @ApiProperty({ description: 'Ethereum address' })
  @IsEthereumAddress()
  address!: string;

  @ApiProperty({ description: 'Chain ID' })
  @IsNumber()
  chainId!: number;

  @ApiProperty({ description: 'Optional statement' })
  @IsOptional()
  @IsString()
  statement?: string;
}

export class SiweVerifyDto {
  @ApiProperty({ description: 'SIWE message' })
  @IsString()
  message!: string;

  @ApiProperty({ description: 'Signature' })
  @IsString()
  signature!: string;
}

export class SolanaMessageDto {
  @ApiProperty({ description: 'Solana public key' })
  @IsString()
  publicKey!: string;

  @ApiProperty({ description: 'Optional statement' })
  @IsOptional()
  @IsString()
  statement?: string;
}

export class SolanaVerifyDto {
  @ApiProperty({ description: 'Message that was signed' })
  @IsString()
  message!: string;

  @ApiProperty({ description: 'Base64 encoded signature' })
  @IsString()
  signature!: string;

  @ApiProperty({ description: 'Public key' })
  @IsString()
  publicKey!: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Primary wallet address' })
  primaryWallet!: string;

  @ApiProperty({ description: 'Token expiration time' })
  expiresIn!: string;
}

export class ChallengeResponseDto {
  @ApiProperty({ description: 'Challenge nonce' })
  nonce!: string;

  @ApiProperty({ description: 'Challenge expiration time' })
  expiresAt!: string;

  @ApiProperty({ description: 'Complete message to sign', required: false })
  message?: string;
}