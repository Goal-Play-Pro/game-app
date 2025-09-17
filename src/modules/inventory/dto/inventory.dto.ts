import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsHexColor } from 'class-validator';
import { BaseDto } from '@common/types/base.types';
import { PlayerStats } from '../../gacha/entities/gacha.entity';
import { PlayerProgression } from '../entities/inventory.entity';

export class OwnedPlayerDto extends BaseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  playerName!: string;

  @ApiProperty()
  division!: string;
  @ApiProperty()
  acquiredAt!: string;

  @ApiProperty()
  currentLevel!: number;

  @ApiProperty()
  experience!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ required: false })
  canPlay?: boolean;

  @ApiProperty({ required: false })
  farmingProgress?: number;
}

export class PlayerKitDto extends BaseDto {
  @ApiProperty()
  ownedPlayerId!: string;

  @ApiProperty()
  version!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  primaryColor!: string;

  @ApiProperty()
  secondaryColor!: string;

  @ApiProperty({ required: false })
  logoUrl?: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ required: false })
  equippedAt?: string;
}

export class UpdatePlayerKitDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Primary kit color (hex)' })
  @IsHexColor()
  primaryColor!: string;

  @ApiProperty({ description: 'Secondary kit color (hex)' })
  @IsHexColor()
  secondaryColor!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class PlayerProgressionDto {
  @ApiProperty()
  ownedPlayerId!: string;

  @ApiProperty()
  level!: number;

  @ApiProperty()
  experience!: number;

  @ApiProperty()
  requiredExperience!: number;

  @ApiProperty()
  stats!: PlayerStats;

  @ApiProperty()
  bonuses!: PlayerStats;

  @ApiProperty()
  totalStats!: PlayerStats;

  @ApiProperty({ required: false })
  farmingStatus?: {
    canPlay: boolean;
    progressPercentage: number;
    requirements: {
      level: { current: number; required: number; met: boolean };
      experience: { current: number; required: number; met: boolean };
    };
  };

  @ApiProperty({ required: false })
  maxPossibleStats?: PlayerStats;
}

export class FarmingSessionDto {
  @ApiProperty({ enum: ['speed', 'shooting', 'passing', 'defense', 'goalkeeping', 'general'] })
  @IsOptional()
  farmingType?: 'speed' | 'shooting' | 'passing' | 'defense' | 'goalkeeping' | 'general' = 'general';
}

export class FarmingResultDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  experienceGained!: number;

  @ApiProperty()
  leveledUp!: boolean;

  @ApiProperty()
  newLevel!: number;

  @ApiProperty()
  canPlayNow!: boolean;
}