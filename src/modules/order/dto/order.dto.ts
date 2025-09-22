import { IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChainType } from '../../../common/types/base.types';

export class CreateOrderDto {
  @ApiProperty({ description: 'Product variant ID' })
  @IsString()
  productVariantId: string;

  @ApiProperty({ description: 'Quantity to purchase', minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  quantity: number;

  @ApiProperty({ description: 'Blockchain network for payment', enum: ChainType })
  @IsEnum(ChainType)
  chainType: ChainType;

  @ApiProperty({ description: 'Wallet address for payment' })
  @IsString()
  paymentWallet: string;
}