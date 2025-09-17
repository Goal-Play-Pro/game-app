import { BaseEntity, ChainType } from '@common/types/base.types';

export interface Wallet extends BaseEntity {
  userId: string;
  address: string;
  chainType: ChainType;
  isPrimary: boolean;
  isActive: boolean;
  linkedAt: string;
  lastUsedAt?: string;
  metadata?: Record<string, any>;
}