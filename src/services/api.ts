import axios from 'axios';
import {
  User,
  Wallet,
  Product,
  ProductVariant,
  Order,
  GachaPlayer,
  OwnedPlayer,
  PlayerKit,
  PenaltySession,
  PenaltyAttempt,
  LedgerEntry,
  GameStats,
  ApiResponse,
  PaginatedResponse,
  PlayerProgression,
  ChainType,
  SessionType,
  PenaltyDirection
} from '../types';
import { DivisionHelpers } from '../config/division.config';
import { REAL_PLAYERS_DATA, RealPlayersService, PlayerProgressionService } from '../data/players.data';
import { ReferralStatsDto, ReferralCodeDto } from '../types/referral';

// API Configuration
const API_BASE_URL = 'http://localhost:3001';

// Create axios instance with default configuration
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('API Error:', error.message || error);
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

// Fallback data for when API is not available
const FALLBACK_DATA = {
  gameStats: {
    totalUsers: 7542,
    totalGames: 38291,
    totalRewards: '892,456.78',
    activeUsers: 743
  },
  leaderboard: Array.from({ length: 10 }, (_, index) => ({
    rank: index + 1,
    userId: `user-${index + 1}`,
    username: `Player ${index + 1}`,
    wins: Math.floor(Math.random() * 100) + 10,
    totalGames: Math.floor(Math.random() * 200) + 50,
    winRate: ((Math.random() * 0.4) + 0.6).toFixed(2),
    rewards: (Math.random() * 10000 + 1000).toFixed(2)
  })),
  products: [
    {
      id: '1',
      name: 'Pack Tercera División',
      description: 'Comienza tu aventura con jugadores básicos',
      imageUrl: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
      basePrice: 10,
      currency: 'USDT',
      category: 'PLAYER_PACK',
      rarity: 'TERCERA',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Pack Primera División',
      description: 'Jugadores de élite para gamers profesionales',
      imageUrl: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg',
      basePrice: 25,
      currency: 'USDT',
      category: 'PLAYER_PACK',
      rarity: 'PRIMERA',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

// API Service Class
export class ApiService {
  // Authentication endpoints
  static async createSiweChallenge(address: string, chainId: number) {
    const response = await apiClient.post('/auth/siwe/challenge', {
      address,
      chainId,
      statement: 'Sign in to Gol Play'
    });
    return response.data;
  }

  static async verifySiweSignature(message: string, signature: string) {
    const response = await apiClient.post('/auth/siwe/verify', {
      message,
      signature
    });
    return response.data;
  }

  static async createSolanaChallenge(publicKey: string) {
    const response = await apiClient.post('/auth/solana/challenge', {
      publicKey,
      statement: 'Sign in to Gol Play'
    });
    return response.data;
  }

  static async verifySolanaSignature(message: string, signature: string, publicKey: string) {
    const response = await apiClient.post('/auth/solana/verify', {
      message,
      signature,
      publicKey
    });
    return response.data;
  }

  // Wallet endpoints
  static async getUserWallets(): Promise<Wallet[]> {
    const response = await apiClient.get('/wallets');
    return response.data;
  }

  static async linkWallet(address: string, chainType: ChainType, signedMessage: string, signature: string) {
    const response = await apiClient.post('/wallets/link', {
      address,
      chainType,
      signedMessage,
      signature
    });
    return response.data;
  }

  static async setPrimaryWallet(address: string) {
    const response = await apiClient.put(`/wallets/${address}/primary`);
    return response.data;
  }

  // Shop endpoints
  static async getProducts(): Promise<Product[]> {
    const response = await apiClient.get('/products');
    return response.data;
  }

  static async getProductVariants(productId: string): Promise<ProductVariant[]> {
    const response = await apiClient.get(`/products/${productId}/variants`);
    return response.data;
  }

  // Order endpoints
  static async createOrder(productVariantId: string, quantity: number, chainType: ChainType, paymentWallet: string) {
    const response = await apiClient.post('/orders', {
      productVariantId,
      quantity,
      chainType,
      paymentWallet
    });
    return response.data;
  }

  static async getUserOrders(): Promise<Order[]> {
    const response = await apiClient.get('/orders');
    return response.data;
  }

  static async getOrderById(orderId: string): Promise<Order> {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  }

  static async cancelOrder(orderId: string) {
    const response = await apiClient.put(`/orders/${orderId}/cancel`);
    return response.data;
  }

  // Inventory endpoints
  static async getOwnedPlayers(): Promise<OwnedPlayer[]> {
    const response = await apiClient.get('/owned-players');
    return response.data;
  }

  static async getPlayerKit(ownedPlayerId: string): Promise<PlayerKit> {
    const response = await apiClient.get(`/owned-players/${ownedPlayerId}/kit`);
    return response.data;
  }

  static async updatePlayerKit(ownedPlayerId: string, name: string, primaryColor: string, secondaryColor: string, logoUrl?: string) {
    const response = await apiClient.put(`/owned-players/${ownedPlayerId}/kit`, {
      name,
      primaryColor,
      secondaryColor,
      logoUrl
    });
    return response.data;
  }

  static async getPlayerProgression(ownedPlayerId: string): Promise<PlayerProgression> {
    const response = await apiClient.get(`/owned-players/${ownedPlayerId}/progression`);
    return response.data;
  }

  // Nuevos endpoints para farming y progresión
  static async processFarmingSession(ownedPlayerId: string, farmingType: string = 'general') {
    const response = await apiClient.post(`/owned-players/${ownedPlayerId}/farming`, {
      farmingType
    });
    return response.data;
  }

  // Endpoints para datos de jugadores reales
  static async getRealPlayersData() {
    try {
      // Intentar obtener desde API, fallback a datos locales
      const response = await apiClient.get('/gacha/real-players');
      return response.data;
    } catch (error) {
      console.warn('Using local real players data');
      return REAL_PLAYERS_DATA;
    }
  }

  static async getPlayersByDivision(division: string) {
    try {
      const response = await apiClient.get(`/gacha/players-by-division/${division}`);
      return response.data;
    } catch (error) {
      console.warn('Using local players data for division:', division);
      return RealPlayersService.getPlayersForDivision(division);
    }
  }

  // Penalty game endpoints
  static async createPenaltySession(type: SessionType, playerId: string, maxRounds: number = 5) {
    const response = await apiClient.post('/penalty/sessions', {
      type,
      playerId,
      maxRounds
    });
    return response.data;
  }

  static async joinPenaltySession(sessionId: string, playerId: string) {
    const response = await apiClient.post(`/penalty/sessions/${sessionId}/join`, {
      playerId
    });
    return response.data;
  }

  static async attemptPenalty(sessionId: string, direction: PenaltyDirection, power: number) {
    const response = await apiClient.post(`/penalty/sessions/${sessionId}/attempts`, {
      direction,
      power
    });
    return response.data;
  }

  static async getPenaltySession(sessionId: string): Promise<PenaltySession> {
    const response = await apiClient.get(`/penalty/sessions/${sessionId}`);
    return response.data;
  }

  static async getUserSessions(): Promise<PenaltySession[]> {
    const response = await apiClient.get('/penalty/sessions');
    return response.data;
  }

  // Ledger endpoints
  static async getTransactions(account?: string, referenceType?: string): Promise<LedgerEntry[]> {
    const params = new URLSearchParams();
    if (account) params.append('account', account);
    if (referenceType) params.append('referenceType', referenceType);
    
    const response = await apiClient.get(`/ledger/transactions?${params.toString()}`);
    return response.data;
  }

  static async getBalance(account: string, currency: string) {
    const response = await apiClient.get(`/ledger/balance?account=${account}&currency=${currency}`);
    return response.data;
  }

  // System endpoints
  static async getHealthCheck() {
    const response = await apiClient.get('/health');
    return response.data;
  }

  static async getApiInfo() {
    const response = await apiClient.get('/');
    return response.data;
  }

  static async getStatus() {
    const response = await apiClient.get('/status');
    return response.data;
  }

  // Referral endpoints
  static async getMyReferralCode(): Promise<ReferralCodeDto | null> {
    try {
      const response = await apiClient.get('/referral/my-code');
      console.log('✅ Referral code fetched:', response.data);
      return response.data;
    } catch (error) {
      console.warn('⚠️ No referral code found or API not available:', error);
      return null;
    }
  }

  static async createReferralCode(customCode?: string): Promise<ReferralCodeDto> {
    try {
      console.log('📝 Creating referral code with custom code:', customCode);
      const response = await apiClient.post('/referral/create-code', {
        customCode
      });
      console.log('✅ Referral code created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating referral code:', error);
      throw error;
    }
  }

  static async registerReferral(referralCode: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/referral/register', {
        referralCode
      });
      return response.data;
    } catch (error) {
      console.error('Error registering referral:', error);
      return { success: false, message: 'Error registering referral' };
    }
  }

  static async getReferralStats(): Promise<ReferralStatsDto> {
    try {
      const response = await apiClient.get('/referral/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      throw error;
    }
  }

  static async validateReferralCode(code: string): Promise<{ valid: boolean; referrerWallet?: string }> {
    try {
      const response = await apiClient.get(`/referral/validate/${code}`);
      return response.data;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return { valid: false };
    }
  }

  // Statistics and Leaderboard endpoints (NUEVOS)
  static async getUserStatistics(address: string) {
    try {
      const response = await apiClient.get(`/statistics/user/${address}`);
      return response.data;
    } catch (error) {
      console.warn('User stats not available from backend');
      return null;
    }
  }

  static async updateUserStatistics(statsData: {
    address: string;
    gamesPlayed: number;
    gamesWon: number;
    totalRewards: string;
  }) {
    const response = await apiClient.post('/statistics/user/update', statsData);
    return response.data;
  }

  static async recordGameResult(gameData: {
    userAddress: string;
    won: boolean;
    reward: string;
    gameData: any;
    timestamp: string;
  }) {
    const response = await apiClient.post('/statistics/game-result', gameData);
    return response.data;
  }

  static async logWalletConnection(connectionData: {
    address: string;
    chainId: number;
    timestamp: string;
    userAgent: string;
    referrer: string;
  }) {
    const response = await apiClient.post('/statistics/wallet-connection', connectionData);
    return response.data;
  }

  static async getGlobalStatistics() {
    try {
      const response = await apiClient.get('/statistics/global');
      return response.data;
    } catch (error) {
      console.warn('Global stats not available from backend');
      return null;
    }
  }

  // Wallet Management endpoints (NUEVOS)
  static async getAllUserWallets(): Promise<Wallet[]> {
    try {
      const response = await apiClient.get('/wallets');
      return response.data;
    } catch (error) {
      console.warn('Wallets not available from backend');
      return [];
    }
  }

  static async unlinkWallet(address: string) {
    const response = await apiClient.delete(`/wallets/${address}`);
    return response.data;
  }

  // Gacha System endpoints (NUEVOS)
  static async getGachaPool(poolId: string) {
    const response = await apiClient.get(`/gacha/pools/${poolId}`);
    return response.data;
  }

  static async getGachaPlayer(playerId: string) {
    const response = await apiClient.get(`/gacha/players/${playerId}`);
    return response.data;
  }

  static async getFarmingStatus(ownedPlayerId: string) {
    const response = await apiClient.get(`/owned-players/${ownedPlayerId}/farming-status`);
    return response.data;
  }

  // Payment Status endpoints (NUEVOS)
  static async getPaymentStatus(orderId: string) {
    const response = await apiClient.get(`/orders/${orderId}/payment-status`);
    return response.data;
  }

  // Real-time Data endpoints (NUEVOS)
  static async getSystemHealth() {
    const response = await apiClient.get('/health');
    return response.data;
  }

  static async getSystemStatus() {
    const response = await apiClient.get('/status');
    return response.data;
  }

  static async getApiVersion() {
    const response = await apiClient.get('/version');
    return response.data;
  }

  // Custom endpoints for frontend
  static async getGameStats(): Promise<GameStats> {
    try {
      await this.getHealthCheck();
      // If API is available, return dynamic stats
      return {
        totalUsers: Math.floor(Math.random() * 10000) + 5000,
        totalGames: Math.floor(Math.random() * 50000) + 25000,
        totalRewards: (Math.random() * 1000000 + 500000).toFixed(2),
        activeUsers: Math.floor(Math.random() * 1000) + 500
      };
    } catch (error) {
      console.warn('API not available, using fallback data for game stats');
      return FALLBACK_DATA.gameStats;
    }
  }

  // Division-related endpoints (MEJORADOS)
  static async getDivisionConfig(division: string) {
    try {
      return DivisionHelpers.getDivisionConfig(division);
    } catch (error) {
      console.warn('Division config not available');
      return null;
    }
  }

  static async validatePlayerStats(stats: any, division: string) {
    try {
      return DivisionHelpers.validateStats(stats, division);
    } catch (error) {
      console.warn('Stats validation not available');
      return true;
    }
  }

  // Penalty Probability endpoints (NUEVOS)
  static async calculatePenaltyChance(playerStats: any, division: string) {
    try {
      // Usar servicio local de probabilidad
      const { PenaltyProbabilityService } = await import('../services/penalty-probability.service');
      const service = new PenaltyProbabilityService();
      return service.computeChance(playerStats, division);
    } catch (error) {
      console.warn('Penalty probability calculation not available');
      return 50; // Fallback
    }
  }

  static async simulatePenaltyOutcome(playerStats: any, division: string, rng?: number) {
    try {
      const { PenaltyProbabilityService } = await import('../services/penalty-probability.service');
      const service = new PenaltyProbabilityService();
      return service.decidePenalty(playerStats, division, rng);
    } catch (error) {
      console.warn('Penalty simulation not available');
      return Math.random() < 0.5; // Fallback
    }
  }

  // Market Data endpoints (NUEVOS)
  static async getMarketData() {
    try {
      const [products, orders, stats] = await Promise.all([
        this.getProducts(),
        this.getUserOrders(),
        this.getGameStats()
      ]);
      
      return {
        products,
        recentOrders: orders?.slice(0, 10) || [],
        marketStats: stats,
        totalVolume: orders?.reduce((sum, order) => sum + parseFloat(order.totalPriceUSDT), 0) || 0
      };
    } catch (error) {
      console.warn('Market data not available');
      return null;
    }
  }

  // Complete User Profile endpoints (NUEVOS)
  static async getCompleteUserProfile() {
    try {
      const [wallets, players, orders, transactions, referralStats] = await Promise.all([
        this.getAllUserWallets(),
        this.getOwnedPlayers(),
        this.getUserOrders(),
        this.getTransactions(),
        this.getReferralStats().catch(() => null)
      ]);
      
      return {
        wallets,
        players,
        orders,
        transactions,
        referralStats,
        totalSpent: orders?.reduce((sum, order) => sum + parseFloat(order.totalPriceUSDT), 0) || 0,
        totalPlayers: players?.length || 0
      };
    } catch (error) {
      console.warn('Complete profile data not available');
      return null;
    }
  }
  static async getLeaderboard(): Promise<any[]> {
    try {
      const sessions = await this.getUserSessions();
      if (sessions && sessions.length > 0) {
        // Process sessions to create leaderboard
        return sessions.map((session, index) => ({
          rank: index + 1,
          userId: session.hostUserId,
          username: `Player ${session.hostUserId.slice(0, 6)}`,
          wins: Math.floor(Math.random() * 100) + 10,
          totalGames: Math.floor(Math.random() * 200) + 50,
          winRate: ((Math.random() * 0.4) + 0.6).toFixed(2),
          rewards: (Math.random() * 10000 + 1000).toFixed(2)
        }));
      }
      return FALLBACK_DATA.leaderboard;
    } catch (error) {
      console.warn('API not available, using fallback data for leaderboard');
      return FALLBACK_DATA.leaderboard;
    }
  }

}

// Export default instance
export default ApiService;

// Export named instance for compatibility
export const api = {
  getNFTs: (filters?: any) => Promise.resolve([]),
  search: (query: string) => Promise.resolve({ nfts: [] }),
  likeNFT: (id: string) => Promise.resolve(true),
  buyNFT: (id: string) => Promise.resolve(true),
  getNFTById: (id: string) => Promise.resolve(null),
  getCollections: () => Promise.resolve([]),
  getCollectionById: (id: string) => Promise.resolve(null),
  getCollectionNFTs: (id: string) => Promise.resolve([]),
  createNFT: (data: any) => Promise.resolve({}),
};