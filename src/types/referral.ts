export interface ReferralCodeDto {
  id: string;
  userId: string;
  walletAddress: string;
  code: string;
  isActive: boolean;
  totalReferrals: number;
  totalCommissions: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralRegistrationDto {
  id: string;
  referrerUserId: string;
  referrerWallet: string;
  referredUserId: string;
  referredWallet: string;
  referralCode: string;
  registeredAt: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralCommissionDto {
  id: string;
  referrerUserId: string;
  referrerWallet: string;
  referredUserId: string;
  referredWallet: string;
  orderId: string;
  orderAmount: string;
  commissionAmount: string;
  commissionPercentage: number;
  status: 'pending' | 'paid' | 'failed';
  paidAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralStatsDto {
  totalReferrals: number;
  activeReferrals: number;
  totalCommissions: string;
  pendingCommissions: string;
  paidCommissions: string;
  thisMonthCommissions: string;
  referralLink: string;
  recentReferrals: ReferralRegistrationDto[];
  recentCommissions: ReferralCommissionDto[];
}