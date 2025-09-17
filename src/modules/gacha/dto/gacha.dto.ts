import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsArray, IsOptional } from 'class-validator';
import { Division, Position, Rarity } from '@common/types/base.types';
import { BaseDto } from '@common/types/base.types';
import { PlayerStats } from '../entities/gacha.entity';

export class GachaPoolDto extends BaseDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: Division })
  division!: Division;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  antiDuplicatePolicy!: string;

  @ApiProperty({ enum: Rarity, required: false })
  guaranteedRarity?: Rarity;
}

export class GachaPlayerDto extends BaseDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: Position })
  position!: Position;

  @ApiProperty({ enum: Rarity })
  rarity!: Rarity;

  @ApiProperty({ enum: Division })
  division!: Division;

  @ApiProperty()
  baseStats!: PlayerStats;

  @ApiProperty({ required: false })
  imageUrl?: string;
}

export class DrawResultDto {
  @ApiProperty({ type: [GachaPlayerDto] })
  players!: GachaPlayerDto[];

  @ApiProperty()
  drawId!: string;

  @ApiProperty()
  poolName!: string;

  @ApiProperty()
  drawDate!: string;
}

export class ExecuteDrawDto {
  @ApiProperty({ description: 'Order ID that triggers the draw' })
  @IsString()
  orderId!: string;

  @ApiProperty({ description: 'Number of draws to execute' })
  @IsNumber()
  drawCount!: number;
}