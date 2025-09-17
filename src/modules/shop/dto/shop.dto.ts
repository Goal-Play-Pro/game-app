import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, IsDecimal } from 'class-validator';
import { ProductType, Division } from '@common/types/base.types';
import { BaseDto } from '@common/types/base.types';

export class ProductDto extends BaseDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: ProductType })
  type!: ProductType;

  @ApiProperty()
  isActive!: boolean;
}

export class ProductVariantDto extends BaseDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: Division })
  division!: Division;

  @ApiProperty()
  level!: number;

  @ApiProperty({ description: 'Price in USDT' })
  priceUSDT!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ required: false })
  maxPurchasesPerUser?: number;

  @ApiProperty()
  gachaPoolId!: string;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class CreateProductVariantDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty({ enum: Division })
  @IsEnum(Division)
  division!: Division;

  @ApiProperty()
  @IsNumber()
  level!: number;

  @ApiProperty({ description: 'Price in USDT' })
  @IsDecimal()
  priceUSDT!: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxPurchasesPerUser?: number;

  @ApiProperty()
  @IsString()
  gachaPoolId!: string;
}