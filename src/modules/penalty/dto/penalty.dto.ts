import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { SessionType, SessionStatus } from '@common/types/base.types';
import { BaseDto } from '@common/types/base.types';
import { PenaltyDirection } from '../entities/penalty.entity';

export class CreateSessionDto {
  @ApiProperty({ enum: SessionType })
  @IsEnum(SessionType)
  type!: SessionType;

  @ApiProperty({ description: 'Player ID to use in session' })
  @IsString()
  playerId!: string;

  @ApiProperty({ default: 5, minimum: 3, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(10)
  maxRounds?: number = 5;
}

export class JoinSessionDto {
  @ApiProperty({ description: 'Player ID to use in session' })
  @IsString()
  playerId!: string;
}

export class PenaltyAttemptDto {
  @ApiProperty({ enum: PenaltyDirection })
  @IsEnum(PenaltyDirection)
  direction!: PenaltyDirection;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  power!: number;
}

export class PenaltySessionDto extends BaseDto {
  @ApiProperty()
  hostUserId!: string;

  @ApiProperty({ required: false })
  guestUserId?: string;

  @ApiProperty({ enum: SessionType })
  type!: SessionType;

  @ApiProperty({ enum: SessionStatus })
  status!: SessionStatus;

  @ApiProperty()
  hostPlayerId!: string;

  @ApiProperty({ required: false })
  guestPlayerId?: string;

  @ApiProperty()
  maxRounds!: number;

  @ApiProperty()
  currentRound!: number;

  @ApiProperty()
  hostScore!: number;

  @ApiProperty()
  guestScore!: number;

  @ApiProperty({ required: false })
  winnerId?: string;

  @ApiProperty({ required: false })
  startedAt?: string;

  @ApiProperty({ required: false })
  completedAt?: string;
}

export class AttemptResultDto {
  @ApiProperty()
  isGoal!: boolean;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  round!: number;

  @ApiProperty()
  hostScore!: number;

  @ApiProperty()
  guestScore!: number;

  @ApiProperty({ enum: SessionStatus })
  sessionStatus!: SessionStatus;

  @ApiProperty({ required: false })
  winnerId?: string;
}