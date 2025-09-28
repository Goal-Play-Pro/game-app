export interface ReferralCodeDto {
  id: string;
  userId: string;
  walletAddress: string;
  walletAddressCaip10?: string;
  code: string;
  isActive: boolean;
  totalReferrals: number;
  totalCommissions: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralRegistrationDto {
  id: string;
  referrerUserId: string;
  referrerWallet: string;
  referrerWalletCaip10?: string;
  referredUserId: string;
  referredWallet: string;
  referredWalletCaip10?: string;
  referralCode: string;
  registeredAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralCommissionDto {
  id: string;
  referrerUserId: string;
  referrerWallet: string;
  referrerWalletCaip10?: string;
  referredUserId: string;
  referredWallet: string;
  referredWalletCaip10?: string;
  orderId: string;
  orderAmount: string;
  commissionAmount: string;
  commissionPercentage: number;
  status: 'pending' | 'paid' | 'failed';
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
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
