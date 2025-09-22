import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_CONFIG, getApiUrl } from '../config/api.config';
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
  GameStats,
  PlayerProgression,
  ChainType,
  SessionType,
  PenaltyDirection,
  PlayerStats
} from '../types';
import { REAL_PLAYERS_DATA } from '../data/players.data';
import { ReferralStatsDto, ReferralCodeDto } from '../types/referral';

// Función para detectar si estamos en desarrollo
const isDevelopment = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  if (typeof window !== 'undefined') {
    try {
      // Verificar si estamos en desarrollo por hostname
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    } catch (e) {
      return false;
    }
  }
  return false;
};

// Crear instancia de axios configurada
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.DEFAULT_HEADERS,
  });

  // Interceptor para añadir token de autenticación
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(API_CONFIG.AUTH.TOKEN_KEY);
      if (token) {
        config.headers[API_CONFIG.AUTH.TOKEN_HEADER] = `Bearer ${token}`;
      }
      
      // Log de debugging para desarrollo
      if (isDevelopment()) {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor para manejar respuestas y errores
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Log de debugging para desarrollo
      if (isDevelopment()) {
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url}`, error.response?.status, error.message);
      }
      
      if (error.response?.status === 401) {
        localStorage.removeItem(API_CONFIG.AUTH.TOKEN_KEY);
        localStorage.removeItem(API_CONFIG.AUTH.REFRESH_TOKEN_KEY);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Instancia global del cliente API
let apiClient = createApiClient();

// Función para recrear el cliente cuando cambie la URL base
export const reinitializeApiClient = () => {
  apiClient = createApiClient();
  console.log(`🔄 API client reinitializado con URL: ${API_CONFIG.BASE_URL}`);
};

// Wrapper robusto para requests con fallback
const makeRequest = async <T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  config?: any
): Promise<T> => {
  try {
    // Log de debugging para desarrollo
    if (isDevelopment()) {
      console.log(`🌐 Making ${method} request to: ${API_CONFIG.BASE_URL}${endpoint}`);
    }
    
    let response: AxiosResponse<T>;
    
    switch (method) {
      case 'GET':
        response = await apiClient.get(endpoint, config);
        break;
      case 'POST':
        response = await apiClient.post(endpoint, data, config);
        break;
      case 'PUT':
        response = await apiClient.put(endpoint, data, config);
        break;
      case 'DELETE':
        response = await apiClient.delete(endpoint, config);
        break;
      default:
        throw new Error(`Método no soportado: ${method}`);
    }
    
    // Log de éxito para desarrollo
    if (isDevelopment()) {
      console.log(`✅ API Success: ${method} ${endpoint}`, response.status);
    }
    
    return response.data;
  } catch (error: any) {
    // Si el backend no está disponible, usar datos de fallback
    if (error.code === 'ECONNREFUSED' || 
        error.message?.includes('Network Error') ||
        error.message?.includes('ERR_CONNECTION_REFUSED') ||
        error.message?.includes('ERR_NETWORK') ||
        error.response?.status >= 500) {
      
      console.warn(`🔄 Backend no disponible para ${method} ${endpoint}, usando datos mock`);
      return getFallbackData(endpoint, method, data) as T;
    }
    
    // Log de error para desarrollo
    if (isDevelopment()) {
      console.error(`❌ API Error: ${method} ${endpoint}`, error.response?.status, error.message);
    }
    
    throw error;
  }
};

// Datos de fallback para cuando el backend no esté disponible
const getFallbackData = (endpoint: string, method: string, data?: any): any => {
  const cleanEndpoint = endpoint.replace(/^\//, '');
  
  switch (cleanEndpoint) {
    case 'products':
      return FALLBACK_DATA.products;
      
    case 'orders':
      if (method === 'POST') {
        return {
          id: `mock-order-${Date.now()}`,
          ...data,
          status: 'pending',
          totalPriceUSDT: '25.00',
          receivingWallet: '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return FALLBACK_DATA.orders;
      
    case 'owned-players':
      return FALLBACK_DATA.ownedPlayers;
      
    case 'penalty/sessions':
      if (method === 'POST') {
        return {
          id: `mock-session-${Date.now()}`,
          ...data,
          status: 'in_progress',
          hostScore: 0,
          guestScore: 0,
          currentRound: 1,
          createdAt: new Date().toISOString()
        };
      }
      return FALLBACK_DATA.sessions;
      
    case 'health':
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3600,
        memory: { rss: '45 MB' }
      };
      
    case '':
      return {
        name: 'Football Gaming Platform API',
        version: '1.0.0',
        status: 'running (mock)',
        features: ['Mock Mode Active']
      };
      
    case 'referral/my-code':
      return {
        id: 'mock-code-1',
        userId: 'mock-user',
        walletAddress: '0x742d35Cc...',
        code: 'DEMO123',
        isActive: true,
        totalReferrals: 0,
        totalCommissions: '0.00'
      };
      
    case 'referral/stats':
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        totalCommissions: '0.00',
        pendingCommissions: '0.00',
        paidCommissions: '0.00',
        thisMonthCommissions: '0.00',
        referralLink: 'https://goalplay.pro?ref=DEMO123',
        recentReferrals: [],
        recentCommissions: []
      };
      
    default:
      if (cleanEndpoint.includes('variants')) {
        return FALLBACK_DATA.variants;
      }
      if (cleanEndpoint.includes('progression')) {
        return FALLBACK_DATA.progression;
      }
      if (cleanEndpoint.includes('farming-status')) {
        return FALLBACK_DATA.farmingStatus;
      }
      return null;
  }
};

// Datos de fallback
const FALLBACK_DATA = {
  gameStats: {
    totalUsers: 7542,
    totalGames: 38291,
    totalRewards: '892456.78',
    activeUsers: 743
  },
  leaderboard: Array.from({ length: 10 }, (_, index) => ({
    rank: index + 1,
    userId: `user-${index + 1}`,
    username: `Player ${index + 1}`,
    wins: Math.floor(Math.random() * 100) + 10,
    totalGames: Math.floor(Math.random() * 200) + 50,
    winRate: ((Math.random() * 0.4) + 0.6) * 100,
    rewards: (Math.random() * 10000 + 1000).toFixed(2)
  })),
  products: [
    {
      id: 'product-tercera',
      name: 'Pack Tercera División',
      description: 'Comienza tu aventura con jugadores básicos',
      type: 'character_pack',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'product-segunda',
      name: 'Pack Segunda División',
      description: 'Jugadores intermedios con mejores estadísticas',
      type: 'character_pack',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'product-primera',
      name: 'Pack Primera División',
      description: 'Jugadores de élite para gamers profesionales',
      type: 'character_pack',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  variants: [
    {
      id: 'variant-tercera-1',
      productId: 'product-tercera',
      name: 'Pack Tercera División - Nivel 1',
      description: 'Pack básico de tercera división',
      division: 'tercera',
      level: 1,
      priceUSDT: '30.00',
      isActive: true,
      gachaPoolId: 'pool_tercera'
    },
    {
      id: 'variant-segunda-1',
      productId: 'product-segunda',
      name: 'Pack Segunda División - Nivel 1',
      description: 'Pack intermedio de segunda división',
      division: 'segunda',
      level: 1,
      priceUSDT: '200.00',
      isActive: true,
      gachaPoolId: 'pool_segunda'
    },
    {
      id: 'variant-primera-1',
      productId: 'product-primera',
      name: 'Pack Primera División - Nivel 1',
      description: 'Pack élite de primera división',
      division: 'primera',
      level: 1,
      priceUSDT: '1000.00',
      isActive: true,
      gachaPoolId: 'pool_primera'
    }
  ],
  orders: [],
  ownedPlayers: [],
  sessions: [],
  progression: {
    level: 1,
    experience: 0,
    requiredExperience: 100,
    stats: {
      speed: 50,
      shooting: 50,
      passing: 50,
      defending: 50,
      goalkeeping: 50,
      overall: 50
    },
    bonuses: {
      speed: 0,
      shooting: 0,
      passing: 0,
      defending: 0,
      goalkeeping: 0,
      overall: 0
    },
    totalStats: {
      speed: 50,
      shooting: 50,
      passing: 50,
      defending: 50,
      goalkeeping: 50,
      overall: 50
    }
  },
  farmingStatus: {
    canPlay: true,
    farmingProgress: 100,
    reason: 'Player is ready to play',
    requirements: {
      level: { current: 5, required: 5, met: true },
      experience: { current: 500, required: 500, met: true }
    }
  }
};

// API Service Class
export class ApiService {
  static getAuthToken(): string | null {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      return window.localStorage.getItem(API_CONFIG.AUTH.TOKEN_KEY);
    }

    if (typeof process !== 'undefined' && process.env && process.env.AUTH_TOKEN) {
      return process.env.AUTH_TOKEN;
    }

    return null;
  }

  static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Función para cambiar la URL base de la API
  static setBaseUrl(newUrl: string) {
    API_CONFIG.BASE_URL = newUrl;
    reinitializeApiClient();
    console.log(`🔄 API URL actualizada a: ${newUrl}`);
  }

  // Función para verificar conectividad con el backend
  static async checkConnection(): Promise<boolean> {
    try {
      await makeRequest('GET', API_CONFIG.ENDPOINTS.HEALTH);
      return true;
    } catch (error) {
      return false;
    }
  }

  // AUTENTICACIÓN
  static async createSiweChallenge(address: string, chainId: number) {
    return makeRequest('POST', API_CONFIG.ENDPOINTS.AUTH_SIWE_CHALLENGE, {
      address,
      chainId,
      statement: 'Sign in to Gol Play'
    });
  }

  static async verifySiweSignature(message: string, signature: string) {
    return makeRequest('POST', API_CONFIG.ENDPOINTS.AUTH_SIWE_VERIFY, {
      message,
      signature
    });
  }

  static async createSolanaChallenge(publicKey: string) {
    return makeRequest('POST', API_CONFIG.ENDPOINTS.AUTH_SOLANA_CHALLENGE, {
      publicKey,
      statement: 'Sign in to Gol Play'
    });
  }

  static async verifySolanaSignature(message: string, signature: string, publicKey: string) {
    return makeRequest('POST', API_CONFIG.ENDPOINTS.AUTH_SOLANA_VERIFY, {
      message,
      signature,
      publicKey
    });
  }

  // PRODUCTOS Y TIENDA
  static async getProducts(): Promise<Product[]> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.PRODUCTS);
  }

  static async getProductVariants(productId: string): Promise<ProductVariant[]> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.PRODUCT_VARIANTS(productId));
  }

  // ÓRDENES
  static async createOrder(productVariantId: string, quantity: number, chainType: ChainType, paymentWallet: string) {
    return makeRequest('POST', API_CONFIG.ENDPOINTS.ORDERS, {
      productVariantId,
      quantity,
      chainType,
      paymentWallet
    });
  }

  static async getUserOrders(): Promise<Order[]> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.ORDERS);
  }

  static async getOrderDetails(orderId: string) {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.ORDER_DETAILS(orderId));
  }

  static async getOrderPaymentStatus(orderId: string) {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.ORDER_PAYMENT_STATUS(orderId));
  }

  // INVENTARIO
  static async getOwnedPlayers(): Promise<OwnedPlayer[]> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.OWNED_PLAYERS);
  }

  static async getPlayerProgression(ownedPlayerId: string): Promise<PlayerProgression> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.PLAYER_PROGRESSION(ownedPlayerId));
  }

  static async getPlayerKit(ownedPlayerId: string): Promise<PlayerKit> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.PLAYER_KIT(ownedPlayerId));
  }

  static async updatePlayerKit(ownedPlayerId: string, kitData: any) {
    return makeRequest('PUT', API_CONFIG.ENDPOINTS.PLAYER_KIT(ownedPlayerId), kitData);
  }

  static async getFarmingStatus(ownedPlayerId: string) {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.FARMING_STATUS(ownedPlayerId));
  }

  static async processFarmingSession(ownedPlayerId: string, farmingType: string = 'general') {
    return makeRequest('POST', API_CONFIG.ENDPOINTS.FARMING_SESSION(ownedPlayerId), {
      farmingType
    });
  }

  // PENALTY GAMEPLAY
  static async createPenaltySession(type: SessionType, playerId: string, maxRounds: number = 5) {
    return makeRequest('POST', API_CONFIG.ENDPOINTS.PENALTY_SESSIONS, {
      type,
      playerId,
      maxRounds
    });
  }

  static async attemptPenalty(sessionId: string, direction: PenaltyDirection, power: number) {
    return makeRequest('POST', API_CONFIG.ENDPOINTS.PENALTY_ATTEMPTS(sessionId), {
      direction,
      power
    });
  }

  static async getUserSessions(): Promise<PenaltySession[]> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.PENALTY_SESSIONS);
  }

  static async getSessionDetails(sessionId: string) {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.PENALTY_SESSION_DETAILS(sessionId));
  }

  static async joinSession(sessionId: string, playerId: string) {
    return makeRequest('POST', API_CONFIG.ENDPOINTS.PENALTY_JOIN(sessionId), {
      playerId
    });
  }

  // WALLETS
  static async getAllUserWallets(): Promise<Wallet[]> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.WALLETS);
  }

  static async linkWallet(address: string, chainType: ChainType, signedMessage: string, signature: string) {
    return makeRequest('POST', API_CONFIG.ENDPOINTS.WALLET_LINK, {
      address,
      chainType,
      signedMessage,
      signature
    });
  }

  static async unlinkWallet(address: string) {
    return makeRequest('DELETE', API_CONFIG.ENDPOINTS.WALLET_UNLINK(address));
  }

  static async setPrimaryWallet(address: string) {
    return makeRequest('PUT', API_CONFIG.ENDPOINTS.WALLET_SET_PRIMARY(address));
  }

  // CONTABILIDAD
  static async getTransactions(filters?: any): Promise<any[]> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.LEDGER_TRANSACTIONS, { params: filters });
  }

  static async getBalance(account?: string, currency?: string) {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.LEDGER_BALANCE, {
      params: { account, currency }
    });
  }

  // REFERIDOS
  static async getMyReferralCode(): Promise<ReferralCodeDto | null> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.REFERRAL_MY_CODE);
  }

  static async createReferralCode(customCode?: string): Promise<ReferralCodeDto> {
    return makeRequest('POST', API_CONFIG.ENDPOINTS.REFERRAL_CREATE_CODE, {
      customCode
    });
  }

  static async registerReferral(referralCode: string) {
    return makeRequest('POST', API_CONFIG.ENDPOINTS.REFERRAL_REGISTER, {
      referralCode
    });
  }

  static async getReferralStats(): Promise<ReferralStatsDto> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.REFERRAL_STATS);
  }

  static async validateReferralCode(code: string) {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.REFERRAL_VALIDATE(code));
  }

  // BLOCKCHAIN PAYMENTS
  static async notifyPaymentCompleted(orderId: string, transactionHash: string) {
    return makeRequest('POST', `/orders/${orderId}/payment-completed`, {
      transactionHash
    });
  }

  static async verifyBlockchainTransaction(txHash: string, fromAddress: string, toAddress: string, expectedAmount: string) {
    return makeRequest('POST', '/blockchain/verify-transaction', {
      txHash,
      fromAddress,
      toAddress,
      expectedAmount
    });
  }

  static async getUSDTBalance(address: string) {
    return makeRequest('GET', `/blockchain/balance/${address}`);
  }

  // SISTEMA
  static async getHealthCheck() {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.HEALTH);
  }

  static async getApiInfo() {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.API_INFO);
  }

  static async getVersion() {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.VERSION);
  }

  static async getStatus() {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.STATUS);
  }

  // ESTADÍSTICAS
  static async getGameStats(): Promise<GameStats> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.GLOBAL_STATS);
  }

  static async getLeaderboard(): Promise<any[]> {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.LEADERBOARD);
  }

  static async getUserStats() {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.USER_STATS);
  }

  // DATOS AUXILIARES
  static async getRealPlayersData() {
    try {
      return await makeRequest('GET', '/gacha/real-players');
    } catch (error) {
      console.warn('Using local real players data');
      return REAL_PLAYERS_DATA;
    }
  }

  static async getMarketData() {
    try {
      const products = await this.getProducts();

      if (!this.isAuthenticated()) {
        return {
          products,
          recentOrders: [],
          totalVolume: 0,
        };
      }

      const orders = await this.getUserOrders();
      
      return {
        products,
        recentOrders: orders?.slice(0, 10) || [],
        totalVolume: orders?.reduce((sum, order) => sum + parseFloat(order.totalPriceUSDT), 0) || 0
      };
    } catch (error) {
      console.warn('Market data not available');
      return {
        products: FALLBACK_DATA.products,
        recentOrders: [],
        totalVolume: 0
      };
    }
  }

  static async getCompleteUserProfile(): Promise<CompleteUserProfile> {
    if (!this.isAuthenticated()) {
      return {
        wallets: [],
        players: [],
        orders: [],
        totalSpent: 0,
        totalPlayers: 0,
        transactions: [],
        referralStats: { totalCommissions: '0.00' },
      };
    }

    try {
      const [wallets, players, orders] = await Promise.all([
        this.getAllUserWallets(),
        this.getOwnedPlayers(),
        this.getUserOrders()
      ]);
      
      const profile: CompleteUserProfile = {
        wallets,
        players,
        orders,
        totalSpent: orders?.reduce((sum, order) => sum + parseFloat(order.totalPriceUSDT), 0) || 0,
        totalPlayers: players?.length || 0,
        transactions: [], 
        referralStats: { totalCommissions: '0.00' },
      };
      
      return profile;
    } catch (error) {
      console.warn('Complete profile data not available');
      const fallbackProfile: CompleteUserProfile = {
        wallets: [],
        players: [],
        orders: [],
        totalSpent: 0,
        totalPlayers: 0,
        transactions: [],
        referralStats: { totalCommissions: '0.00' },
      };
      
      return fallbackProfile;
    }
  }

  static async getGlobalStatistics() {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.GLOBAL_STATS);
  }

  static async getSystemHealth() {
    return makeRequest('GET', API_CONFIG.ENDPOINTS.HEALTH);
  }

  // FUNCIONES AUXILIARES
  static async calculatePenaltyChance(playerStats: PlayerStats, division: string): Promise<number> {
    try {
      console.log(`🎯 Calculating penalty chance for division: ${division}`, playerStats);
      return await makeRequest('POST', '/penalty/calculate-chance', {
        playerStats,
        division
      });
    } catch (error) {
      console.warn('⚠️ Backend penalty calculation not available, using fallback');
      // Fallback calculation
      const totalStats = playerStats.speed + playerStats.shooting + playerStats.passing + 
                        playerStats.defending + playerStats.goalkeeping;
      
      const divisionRanges = {
        primera: { min: 95, max: 171, minChance: 50, maxChance: 90 },
        segunda: { min: 76, max: 152, minChance: 40, maxChance: 80 },
        tercera: { min: 57, max: 133, minChance: 30, maxChance: 70 }
      };
      
      const range = divisionRanges[division.toLowerCase() as keyof typeof divisionRanges] || divisionRanges.tercera;
      const ratio = Math.max(0, Math.min(1, (totalStats - range.min) / (range.max - range.min)));
      const chance = range.minChance + (range.maxChance - range.minChance) * ratio;
      
      const finalChance = Math.floor(Math.max(5, Math.min(95, chance)));
      console.log(`📊 Fallback calculation result: ${finalChance}%`);
      return Math.floor(Math.max(5, Math.min(95, chance)));
    }
  }
}

// Interfaces locales para el servicio
export interface LedgerEntry {
  id: string;
  type: string;
  amount: string;
  currency: string;
  timestamp: string;
  description?: string;
}

export interface CompleteUserProfile {
  wallets: Wallet[];
  players: OwnedPlayer[];
  orders: Order[];
  totalSpent: number;
  totalPlayers: number;
  transactions: LedgerEntry[];
  referralStats: {
    totalCommissions: string;
    [key: string]: any;
  };
}

export default ApiService;
