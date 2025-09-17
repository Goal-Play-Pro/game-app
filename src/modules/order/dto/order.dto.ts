import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { OrderStatus, ChainType } from '@common/types/base.types';
import { BaseDto } from '@common/types/base.types';

export class CreateOrderDto {
  @ApiProperty({ description: 'Product variant ID' })
  @IsString()
  productVariantId!: string;

  @ApiProperty({ description: 'Quantity to purchase', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ enum: ChainType, description: 'Blockchain to use for payment' })
  @IsEnum(ChainType)
  chainType!: ChainType;

  @ApiProperty({ description: 'Wallet address to pay from' })
  @IsString()
  paymentWallet!: string;
}

export class OrderDto extends BaseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  productVariantId!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitPriceUSDT!: string;

  @ApiProperty()
  totalPriceUSDT!: string;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty()
  paymentWallet!: string;

  @ApiProperty()
  receivingWallet!: string;

  @ApiProperty({ enum: ChainType })
  chainType!: ChainType;

  @ApiProperty({ required: false })
  transactionHash?: string;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty({ required: false })
  paidAt?: string;

  @ApiProperty({ required: false })
  fulfilledAt?: string;
}

export class PaymentStatusDto {
  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty({ required: false })
  transactionHash?: string;

  @ApiProperty({ required: false })
  confirmations?: number;

  @ApiProperty({ required: false })
  requiredConfirmations?: number;

  @ApiProperty({ required: false })
  estimatedConfirmationTime?: string;
}