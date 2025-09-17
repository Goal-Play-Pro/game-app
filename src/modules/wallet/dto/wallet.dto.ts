import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEthereumAddress, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ChainType } from '@common/types/base.types';
import { BaseDto } from '@common/types/base.types';

export class LinkWalletDto {
  @ApiProperty({ description: 'Wallet address' })
  @IsString()
  address!: string;

  @ApiProperty({ enum: ChainType, description: 'Blockchain type' })
  @IsEnum(ChainType)
  chainType!: ChainType;

  @ApiProperty({ description: 'Message that was signed for verification' })
  @IsString()
  signedMessage!: string;

  @ApiProperty({ description: 'Signature' })
  @IsString()
  signature!: string;
}

export class WalletResponseDto extends BaseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty({ enum: ChainType })
  chainType!: ChainType;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  linkedAt!: string;

  @ApiProperty({ required: false })
  lastUsedAt?: string;
}

export class SetPrimaryWalletDto {
  @ApiProperty({ description: 'Wallet address to set as primary' })
  @IsString()
  address!: string;
}