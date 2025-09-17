import { BaseEntity, TransactionType } from '@common/types/base.types';

export type ReferenceType = 'order' | 'gacha_draw' | 'penalty_reward' | 'refund' | 'adjustment';

export interface LedgerEntry extends BaseEntity {
  userId: string;
  transactionId: string;
  account: string;
  type: TransactionType;
  amount: string; // Decimal as string
  currency: string;
  description: string;
  referenceType: ReferenceType;
  referenceId: string;
  balanceAfter: string;
  metadata?: Record<string, any>;
}

export interface Account extends BaseEntity {
  userId: string;
  name: string;
  type: 'asset' | 'liability' | 'revenue' | 'expense';
  currency: string;
  balance: string;
  isActive: boolean;
}