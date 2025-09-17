import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsDecimal, IsOptional } from 'class-validator';
import { TransactionType } from '@common/types/base.types';
import { BaseDto } from '@common/types/base.types';

export class LedgerEntryDto extends BaseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  transactionId!: string;

  @ApiProperty()
  account!: string;

  @ApiProperty({ enum: TransactionType })
  type!: TransactionType;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  referenceType!: string;

  @ApiProperty()
  referenceId!: string;

  @ApiProperty()
  balanceAfter!: string;
}

export class AccountDto extends BaseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  balance!: string;

  @ApiProperty()
  isActive!: boolean;
}

export class CreateTransactionDto {
  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsDecimal()
  amount!: string;

  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty()
  @IsString()
  referenceType!: string;

  @ApiProperty()
  @IsString()
  referenceId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}