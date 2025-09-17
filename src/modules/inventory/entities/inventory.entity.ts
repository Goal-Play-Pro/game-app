import { BaseEntity } from '@common/types/base.types';
import { PlayerStats } from '../../gacha/entities/gacha.entity';

export interface OwnedPlayer extends BaseEntity {
  userId: string;
  playerName: string;
  division: string;
  sourceOrderId?: string;
  sourceDrawId?: string;
  acquiredAt: string;
  currentLevel: number;
  experience: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface PlayerKit extends BaseEntity {
  ownedPlayerId: string;
  version: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  isActive: boolean;
  equippedAt?: string;
  unequippedAt?: string;
}

export interface PlayerProgression {
  ownedPlayerId: string;
  level: number;
  experience: number;
  requiredExperience: number;
  stats: PlayerStats;
  bonuses: PlayerStats;
  totalStats: PlayerStats;
}