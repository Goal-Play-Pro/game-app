import { BaseEntity, Division, Position, Rarity } from '@common/types/base.types';

export interface PlayerStats {
  speed: number;
  shooting: number;
  passing: number;
  defending: number;
  goalkeeping: number;
  overall: number;
}

export interface GachaPool extends BaseEntity {
  name: string;
  division: Division;
  isActive: boolean;
  antiDuplicatePolicy: 'ALLOW_DUPLICATES' | 'EXCLUDE_OWNED_AT_DRAW' | 'EXCLUDE_OWNED_GLOBALLY';
  guaranteedRarity?: Rarity;
  boostedRarities?: Rarity[];
  boostMultiplier?: number;
  validFrom?: string;
  validUntil?: string;
  metadata?: Record<string, any>;
}

export interface GachaPlayer extends BaseEntity {
  name: string;
  position: Position;
  rarity: Rarity;
  division: Division;
  baseStats: PlayerStats;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface GachaPoolEntry extends BaseEntity {
  poolId: string;
  playerId: string;
  weight: number;
  isActive: boolean;
}

export interface GachaDraw extends BaseEntity {
  userId: string;
  orderId: string;
  poolId: string;
  playersDrawn: string[];
  seed: string;
  drawDate: string;
  metadata?: Record<string, any>;
}