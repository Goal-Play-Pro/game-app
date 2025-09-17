import axios from 'axios';
import { ReferralStatsDto, ReferralCodeDto, ReferralCommissionDto, ReferralRegistrationDto } from '../types/referral';

const API_BASE_URL = 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export class ReferralApiService {
  // Get user's referral code
  static async getMyReferralCode(): Promise<ReferralCodeDto | null> {
    try {
      const response = await apiClient.get('/referral/my-code');
      return response.data;
    } catch (error) {
      console.warn('No referral code found');
      return null;
    }
  }

  // Create referral code
  static async createReferralCode(customCode?: string): Promise<ReferralCodeDto> {
    const response = await apiClient.post('/referral/create-code', {
      customCode
    });
    return response.data;
  }

  // Register with referral code
  static async registerReferral(referralCode: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/referral/register', {
      referralCode
    });
    return response.data;
  }

  // Get referral statistics
  static async getReferralStats(): Promise<ReferralStatsDto> {
    const response = await apiClient.get('/referral/stats');
    return response.data;
  }

  // Get referral commissions
  static async getCommissions(): Promise<ReferralCommissionDto[]> {
    const response = await apiClient.get('/referral/commissions');
    return response.data;
  }

  // Get user's referrals
  static async getMyReferrals(): Promise<ReferralRegistrationDto[]> {
    const response = await apiClient.get('/referral/my-referrals');
    return response.data;
  }

  // Validate referral code
  static async validateReferralCode(code: string): Promise<{ valid: boolean; referrerWallet?: string }> {
    const response = await apiClient.get(`/referral/validate/${code}`);
    return response.data;
  }
}

export default ReferralApiService;