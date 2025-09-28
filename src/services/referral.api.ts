import { API_CONFIG } from '../config/api.config';

// Referral API Service - Mock implementation for development
export class ReferralApiService {
  static async getMyReferralCode() {
    console.log('📝 Mock: Getting referral code');
    return {
      id: 'mock-code-1',
      userId: 'mock-user',
      walletAddress: '0x742d35Cc...',
      code: 'DEMO123',
      isActive: true,
      totalReferrals: 0,
      totalCommissions: '0.00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static async createReferralCode(customCode?: string) {
    console.log('📝 Mock: Creating referral code:', customCode);
    return {
      id: 'mock-code-new',
      userId: 'mock-user',
      walletAddress: '0x742d35Cc...',
      code: customCode || 'DEMO123',
      isActive: true,
      totalReferrals: 0,
      totalCommissions: '0.00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static async getReferralStats() {
    console.log('📝 Mock: Getting referral stats');
    return {
      totalReferrals: 0,
      activeReferrals: 0,
      totalCommissions: '0.00',
      pendingCommissions: '0.00',
      paidCommissions: '0.00',
      thisMonthCommissions: '0.00',
      referralLink: `${API_CONFIG.FRONTEND_URL}?ref=DEMO123`,
      recentReferrals: [],
      recentCommissions: []
    };
  }

  static async registerReferral(referralCode: string) {
    console.log('📝 Mock: Registering referral:', referralCode);
    return {
      success: true,
      message: 'Referral registered successfully'
    };
  }

  static async validateReferralCode(code: string) {
    console.log('📝 Mock: Validating referral code:', code);
    return {
      valid: true,
      referrerWallet: '0x742d35Cc...'
    };
  }
}
