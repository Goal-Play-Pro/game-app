import { BaseEntity, Chain } from '@/common/types/base.types';

export interface User extends BaseEntity {
  walletAddress: string;
  chain: Chain;
  isActive: boolean;
  lastLogin: Date;
  metadata: {
    nickname?: string;
    avatar?: string;
    preferences: {
      language: string;
      notifications: boolean;
    };
  };
}

export interface AuthChallenge extends BaseEntity {
  walletAddress: string;
  chain: Chain;
  challenge: string;
  expiresAt: Date;
  used: boolean;
}