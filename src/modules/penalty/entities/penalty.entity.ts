import { BaseEntity, SessionType, SessionStatus } from '@common/types/base.types';

export interface PenaltySession extends BaseEntity {
  hostUserId: string;
  guestUserId?: string;
  type: SessionType;
  status: SessionStatus;
  hostPlayerId: string;
  guestPlayerId?: string;
  maxRounds: number;
  currentRound: number;
  hostScore: number;
  guestScore: number;
  winnerId?: string;
  seed: string;
  startedAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface PenaltyAttempt extends BaseEntity {
  sessionId: string;
  round: number;
  shooterUserId: string;
  goalkeeperId: string;
  shooterPlayerId: string;
  goalkeeperPlayerId: string;
  direction: PenaltyDirection;
  power: number;
  keeperDirection: PenaltyDirection;
  isGoal: boolean;
  attemptedAt: string;
  seed: string;
  metadata?: Record<string, any>;
}

export enum PenaltyDirection {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
}

export interface PenaltyOutcome {
  isGoal: boolean;
  description: string;
  shooterStats: any;
  goalkeeperStats: any;
  factors: string[];
}