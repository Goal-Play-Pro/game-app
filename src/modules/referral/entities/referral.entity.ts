import { BaseEntity } from '@common/types/base.types';

export interface ReferralCode extends BaseEntity {
  userId: string;
  walletAddress: string;
  code: string;
  isActive: boolean;
  totalReferrals: number;
  totalCommissions: string;
  metadata?: Record<string, any>;
}

export interface ReferralRegistration extends BaseEntity {
  referrerUserId: string;
  referrerWallet: string;
  referredUserId: string;
  referredWallet: string;
  referralCode: string;
  registeredAt: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface ReferralCommission extends BaseEntity {
  referrerUserId: string;
  referrerWallet: string;
  referredUserId: string;
  referredWallet: string;
  orderId: string;
  orderAmount: string;
  commissionAmount: string;
  commissionPercentage: number;
  paidAt?: string;
  status: 'pending' | 'paid' | 'failed';
  metadata?: Record<string, any>;
}