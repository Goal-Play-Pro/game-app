import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSiweChallenge {
  @ApiProperty({ description: 'Ethereum wallet address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Chain ID (1 for Ethereum, 56 for BSC, etc.)' })
  @IsNumber()
  chainId: number;

  @ApiProperty({ description: 'Statement for the challenge', required: false })
  @IsOptional()
  @IsString()
  statement?: string;
}

export class VerifySiweSignature {
  @ApiProperty({ description: 'SIWE message that was signed' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Signature from wallet' })
  @IsString()
  signature: string;
}

export class CreateSolanaChallenge {
  @ApiProperty({ description: 'Solana public key' })
  @IsString()
  publicKey: string;

  @ApiProperty({ description: 'Statement for the challenge', required: false })
  @IsOptional()
  @IsString()
  statement?: string;
}

export class VerifySolanaSignature {
  @ApiProperty({ description: 'Challenge message that was signed' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Base64 encoded signature' })
  @IsString()
  signature: string;

  @ApiProperty({ description: 'Solana public key' })
  @IsString()
  publicKey: string;
}