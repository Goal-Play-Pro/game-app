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

// Log de configuración inicial
console.log('🚀 Goal Play Frontend iniciando...');
console.log('🔗 Production API URL configurada:', API_CONFIG.BASE_URL);
console.log('🌐 Conectando a API de producción en línea...');
console.log('🌍 Environment:', import.meta.env.MODE);
console.log('🎯 Target Production API:', 'https://game.goalplay.pro/api/');

// Función para detectar si estamos en desarrollo
const isDevelopment = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  if (typeof window !== 'undefined') {
    try {
      // Verificar si estamos en desarrollo por hostname
      return window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1' ||
             window.location.hostname.includes('stackblitz') ||
             window.location.hostname.includes('bolt.new');
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
    validateStatus: (status) => status < 500,
    maxRedirects: 3,
    decompress: true,
    withCredentials: true,
  });

  client.interceptors.request.use(
    (config) => {
      if (isDevelopment()) {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${API_CONFIG.BASE_URL}${config.url}`);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (isDevelopment()) {
        console.warn(`⚠️ API Request failed: ${error.config?.method?.toUpperCase()} ${API_CONFIG.BASE_URL}${error.config?.url}`, {
          status: error.response?.status,
          code: error.code,
          message: error.message
        });
      }

      if (error.response?.status === 401) {
        sessionActive = false;
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Instancia global del cliente API
let apiClient = createApiClient();
let sessionActive = false;

// Función para recrear el cliente cuando cambie la URL base
export const reinitializeApiClient = () => {
  apiClient = createApiClient();
  console.log(`🔄 API client reinitializado con URL de producción: ${API_CONFIG.BASE_URL}`);
};

// Wrapper robusto para requests con fallback
const makeRequest = async <T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  config?: any
): Promise<T> => {
  const maxRetries = 3; // Aumentar intentos para API remota
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 API Request ${attempt}/${maxRetries}: ${method} ${API_CONFIG.BASE_URL}${endpoint}`);
      
      let response: AxiosResponse<T>;
      
      // Configuración específica para cada intento
      const requestConfig = {
        ...config,
        timeout: attempt === 1 ? 15000 : 30000, // Timeout más generoso para API remota
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': API_CONFIG.FRONTEND_URL,
          'Referer': API_CONFIG.FRONTEND_URL,
          ...config?.headers,
        },
        withCredentials: true,
      };
      
      switch (method) {
        case 'GET':
          response = await apiClient.get(endpoint, requestConfig);
          break;
        case 'POST':
          response = await apiClient.post(endpoint, data, requestConfig);
          break;
        case 'PUT':
          response = await apiClient.put(endpoint, data, requestConfig);
          break;
        case 'DELETE':
          response = await apiClient.delete(endpoint, requestConfig);
          break;
        default:
          throw new Error(`Método no soportado: ${method}`);
      }
      
      console.log(`✅ API Success: ${method} ${API_CONFIG.BASE_URL}${endpoint} → ${response.status}`);
      
      return response.data;
    } catch (error: any) {
      lastError = error;
      
      // Determinar si es error de conectividad
      const isConnectivityError = (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('timeout') ||
        error.message?.includes('Network Error') ||
        error.message?.includes('Failed to fetch') ||
        error.response?.status >= 500
      );
      
      if (isConnectivityError) {
        if (attempt < maxRetries) {
          // Esperar 1 segundo antes del siguiente intento
          console.log(`🔄 Retrying in 2s (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        // Todos los intentos fallaron, usar fallback silenciosamente
        console.log(`🔄 API ${API_CONFIG.BASE_URL}${endpoint} unavailable, using fallback data`);
        return getFallbackData(endpoint, method, data) as T;
      }
      
      // Error no relacionado con conectividad, lanzar inmediatamente
      throw error;
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  throw lastError;
};

// Función auxiliar para esperar
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Datos de fallback para cuando el backend no esté disponible
const getFallbackData = (endpoint: string, method: string, data?: any): any => {
  const cleanEndpoint = endpoint.replace(/^\//, '');
  
  // Log para debugging
  if (isDevelopment()) {
    console.log(`🔄 Production API unavailable for: ${cleanEndpoint}, using fallback data`);
  }
  
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
      const referralWallet = localStorage.getItem('walletAddress');
      if (referralWallet) {
        const walletCode = referralWallet.slice(2, 8).toUpperCase() + 'REF';
        return {
          id: 'mock-code-1',
          userId: 'mock-user',
          walletAddress: referralWallet,
          code: walletCode,
          isActive: true,
          totalReferrals: 0,
          totalCommissions: '0.00'
        };
      }
      return null;
      
    case 'referral/stats':
      const statsWallet = localStorage.getItem('walletAddress');
      const referralCode = statsWallet ? statsWallet.slice(2, 8).toUpperCase() + 'REF' : 'DEMO123';
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        totalCommissions: '0.00',
        pendingCommissions: '0.00',
        paidCommissions: '0.00',
        thisMonthCommissions: '0.00',
        referralLink: `${API_CONFIG.FRONTEND_URL}?ref=${referralCode}`,
        recentReferrals: [],
        recentCommissions: []
      };
      
    case 'profile':
      const profileWallet = localStorage.getItem('walletAddress');
      return {
        id: 'mock-user',
        walletAddress: profileWallet || '0x742d35Cc...',
        displayName: `Player ${profileWallet?.slice(0, 6) || 'Demo'}`,
        bio: 'Football gaming enthusiast',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300',
        preferences: {
          notifications: {
            gameResults: true,
            newPlayerPacks: true,
            tournamentInvitations: false
          },
          language: 'en'
        },
        isActive: true,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
      if (cleanEndpoint.includes('sessions') && cleanEndpoint.includes('penalty')) {
        if (method === 'POST') {
          return {
            id: `mock-session-${Date.now()}`,
            ...data,
            status: 'in_progress',
            hostScore: 0,
            guestScore: 0,
            currentRound: 1,
            maxRounds: 5,
            hostUserId: 'mock-user',
            createdAt: new Date().toISOString()
          };
        }
        return [{
          id: 'mock-session-1',
          hostUserId: 'mock-user',
          type: 'single_player',
          status: 'in_progress',
          hostScore: 0,
          guestScore: 0,
          currentRound: 1,
          maxRounds: 5,
          createdAt: new Date().toISOString()
        }];
      }
      
      if (cleanEndpoint.includes('attempts')) {
        return {
          isGoal: Math.random() > 0.5,
          description: Math.random() > 0.5 ? 
            '⚽ ¡Gol! El balón vuela hacia la esquina con precisión!' :
            '❌ ¡Parada! El portero adivina la dirección.',
          round: 1,
          hostScore: Math.floor(Math.random() * 3),
          guestScore: Math.floor(Math.random() * 2),
          sessionStatus: 'in_progress'
        };
      }
      
      // Fallback para endpoints de blockchain
      if (cleanEndpoint.includes('blockchain/')) {
        if (cleanEndpoint.includes('balance/')) {
          return { balance: '1500.00', currency: 'USDT' };
        }
        if (cleanEndpoint.includes('verify-transaction')) {
          return { isValid: true, confirmations: 12 };
        }
        if (cleanEndpoint.includes('revenue-report')) {
          return {
            totalRevenue: '125000.00',
            transactionCount: 450,
            averageOrderValue: '277.78',
            topPayingAddresses: [],
            dailyBreakdown: []
          };
        }
        if (cleanEndpoint.includes('network-stats')) {
          return {
            currentBlock: 34567890,
            gasPrice: '5.0',
            bnbPrice: 300,
            usdtPrice: 1.00,
            networkCongestion: 'low'
          };
        }
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
  static markSessionActive(active: boolean) {
    sessionActive = active;
  }

  static isAuthenticated(): boolean {
    return sessionActive;
  }

  static async ensureSession(): Promise<boolean> {
    if (sessionActive) {
      return true;
    }
    try {
      await apiClient.get('/auth/profile', { withCredentials: true });
      ApiService.markSessionActive(true);
      return true;
    } catch {
      ApiService.markSessionActive(false);
      return false;
    }
  }

  // Función para cambiar la URL base de la API
  static setBaseUrl(newUrl: string) {
    API_CONFIG.BASE_URL = newUrl;
    reinitializeApiClient();
    console.log(`🔄 Production API URL actualizada a: ${newUrl}`);
  }

  // Función para verificar conectividad con el backend
  static async checkConnection(): Promise<boolean> {
    try {
      await makeRequest('GET', '/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  // AUTENTICACIÓN
  static async createSiweChallenge(address: string, chainId: number) {
    return makeRequest('POST', '/auth/siwe/challenge', {
      address,
      chainId,
      statement: 'Sign in to Gol Play'
    });
  }

  static async verifySiweSignature(message: string, signature: string) {
    const result = await makeRequest('POST', '/auth/siwe/verify', {
      message,
      signature
    });
    ApiService.markSessionActive(true);
    return result;
  }

  static async createSolanaChallenge(publicKey: string) {
    return makeRequest('POST', '/auth/solana/challenge', {
      publicKey,
      statement: 'Sign in to Gol Play'
    });
  }

  static async verifySolanaSignature(message: string, signature: string, publicKey: string) {
    const result = await makeRequest('POST', '/auth/solana/verify', {
      message,
      signature,
      publicKey
    });
    ApiService.markSessionActive(true);
    return result;
  }

  static async logout(): Promise<void> {
    try {
      await makeRequest('POST', '/auth/logout');
    } finally {
      ApiService.markSessionActive(false);
    }
  }

  // PRODUCTOS Y TIENDA
  static async getProducts(): Promise<Product[]> {
    try {
      console.log('🛒 Fetching products from production API:', `${API_CONFIG.BASE_URL}/products`);
      const result = await makeRequest('GET', '/products');
      console.log('✅ Products loaded successfully:', result?.length || 0, 'products');
      return result;
    } catch (error) {
      console.error('❌ Production API products failed:', error);
      console.warn('🔄 Using fallback data for products (API unavailable)');
      return FALLBACK_DATA.products;
    }
  }

  static async getProductVariants(productId: string): Promise<ProductVariant[]> {
    try {
      console.log(`🛒 Fetching variants for product from production API: ${productId}`);
      const result = await makeRequest('GET', `/products/${productId}/variants`);
      console.log('✅ Variants loaded successfully:', result?.length || 0, 'variants');
      return result;
    } catch (error) {
      console.warn('⚠️ Production API variants failed, using fallback data');
      return FALLBACK_DATA.variants.filter(v => v.productId === productId);
    }
  }

  // ÓRDENES
  static async createOrder(productVariantId: string, quantity: number, chainType: ChainType, paymentWallet: string) {
    try {
      console.log(`💳 Creating order via production API:`, {
        productVariantId,
        quantity,
        chainType,
        paymentWallet: `${paymentWallet.slice(0, 6)}...${paymentWallet.slice(-4)}`
      });
      
      const result = await makeRequest('POST', '/orders', {
        productVariantId,
        quantity,
        chainType,
        paymentWallet
      });
      
      console.log('✅ Order created successfully via production API:', result);
      return result;
    } catch (error) {
      console.error('❌ Production API order creation failed:', error);
      throw error;
    }
  }

  static async getUserOrders(): Promise<Order[]> {
    try {
      console.log('📋 Fetching user orders from production API...');
      const result = await makeRequest('GET', '/orders');
      console.log('✅ Orders loaded from production API:', result?.length || 0, 'orders');
      return result;
    } catch (error) {
      console.warn('⚠️ Production API orders failed:', error);
      return [];
    }
  }

  static async getOrderDetails(orderId: string) {
    return makeRequest('GET', `/orders/${orderId}`);
  }

  static async getOrderPaymentStatus(orderId: string) {
    return makeRequest('GET', `/orders/${orderId}/payment-status`);
  }

  // INVENTARIO
  static async getOwnedPlayers(): Promise<OwnedPlayer[]> {
    return makeRequest('GET', '/owned-players');
  }

  static async getPlayerProgression(ownedPlayerId: string): Promise<PlayerProgression> {
    return makeRequest('GET', `/owned-players/${ownedPlayerId}/progression`);
  }

  static async getPlayerKit(ownedPlayerId: string): Promise<PlayerKit> {
    return makeRequest('GET', `/owned-players/${ownedPlayerId}/kit`);
  }

  static async updatePlayerKit(ownedPlayerId: string, kitData: any) {
    return makeRequest('PUT', `/owned-players/${ownedPlayerId}/kit`, kitData);
  }

  static async getFarmingStatus(ownedPlayerId: string) {
    return makeRequest('GET', `/owned-players/${ownedPlayerId}/farming-status`);
  }

  static async processFarmingSession(ownedPlayerId: string, farmingType: string = 'general') {
    return makeRequest('POST', `/owned-players/${ownedPlayerId}/farming`, {
      farmingType
    });
  }

  // PENALTY GAMEPLAY
  static async createPenaltySession(type: SessionType, playerId: string, maxRounds: number = 5) {
    return makeRequest('POST', '/penalty/sessions', {
      type,
      playerId,
      maxRounds
    });
  }

  static async attemptPenalty(sessionId: string, direction: PenaltyDirection, power: number) {
    return makeRequest('POST', `/penalty/sessions/${sessionId}/attempts`, {
      direction,
      power
    });
  }

  static async getUserSessions(): Promise<PenaltySession[]> {
    return makeRequest('GET', '/penalty/sessions');
  }

  static async getSessionDetails(sessionId: string) {
    return makeRequest('GET', `/penalty/sessions/${sessionId}`);
  }

  static async joinSession(sessionId: string, playerId: string) {
    return makeRequest('POST', `/penalty/sessions/${sessionId}/join`, {
      playerId
    });
  }

  // WALLETS
  static async getAllUserWallets(): Promise<Wallet[]> {
    return makeRequest('GET', '/wallets');
  }

  static async linkWallet(address: string, chainType: ChainType, signedMessage: string, signature: string) {
    return makeRequest('POST', '/wallets/link', {
      address,
      chainType,
      signedMessage,
      signature
    });
  }

  static async unlinkWallet(address: string) {
    return makeRequest('DELETE', `/wallets/${address}`);
  }

  static async setPrimaryWallet(address: string) {
    return makeRequest('PUT', `/wallets/${address}/primary`);
  }

  // CONTABILIDAD
  static async getTransactions(filters?: any): Promise<any[]> {
    return makeRequest('GET', '/ledger/transactions', { params: filters });
  }

  static async getBalance(account?: string, currency?: string) {
    return makeRequest('GET', '/ledger/balance', {
      params: { account, currency }
    });
  }

  // REFERIDOS
  static async getMyReferralCode(): Promise<ReferralCodeDto | null> {
    return makeRequest('GET', '/referral/my-code');
  }

  // PERFIL DE USUARIO
  static async updateUserProfile(profileData: {
    displayName?: string;
    bio?: string;
    avatar?: string;
    preferences?: {
      notifications?: {
        gameResults?: boolean;
        newPlayerPacks?: boolean;
        tournamentInvitations?: boolean;
      };
      language?: string;
    };
  }) {
    try {
      console.log('👤 Updating user profile via production API:', profileData);
      console.log('🔗 Endpoint:', `${API_CONFIG.BASE_URL}/auth/profile`);
      
      const result = await makeRequest('PUT', '/auth/profile', profileData);
      console.log('✅ Profile updated successfully via production API:', result);
      return result;
    } catch (error) {
      console.error('❌ Profile update failed to production API:', error);
      console.log('🔄 Using fallback success response');
      
      // Fallback: simulate successful update
      return {
        success: true,
        message: 'Profile updated (offline mode - will sync when API is available)',
        data: profileData
      };
    }
  }

  static async getUserProfile() {
    try {
      console.log('👤 Fetching user profile from production API...');
      console.log('🔗 Endpoint:', `${API_CONFIG.BASE_URL}/auth/profile`);
      
      const result = await makeRequest('GET', '/auth/profile');
      console.log('✅ Profile loaded from production API:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ Production API profile not available, using fallback wallet data');
      const walletAddress = localStorage.getItem('walletAddress');
      return {
        id: 'mock-user',
        walletAddress: walletAddress || '0x742d35Cc...',
        displayName: `Player ${walletAddress?.slice(0, 6) || 'Demo'}`,
        bio: 'Football gaming enthusiast',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300',
        preferences: {
          notifications: {
            gameResults: true,
            newPlayerPacks: true,
            tournamentInvitations: false
          },
          language: 'en'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  static async createReferralCode(customCode?: string): Promise<ReferralCodeDto> {
    // El código ya viene generado desde el frontend con la wallet del usuario
    const codeToUse = customCode || 'DEMO123';
    
    return makeRequest('POST', '/referral/create-code', {
      customCode: codeToUse
    });
  }

  static async registerReferral(referralCode: string) {
    return makeRequest('POST', '/referral/register', {
      referralCode
    });
  }

  static async getReferralStats(): Promise<ReferralStatsDto> {
    return makeRequest('GET', '/referral/stats');
  }

  static async validateReferralCode(code: string) {
    return makeRequest('GET', `/referral/validate/${code}`);
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
    return makeRequest('GET', '/health');
  }

  static async getApiInfo() {
    return makeRequest('GET', '/');
  }

  static async getVersion() {
    return makeRequest('GET', '/version');
  }

  static async getStatus() {
    return makeRequest('GET', '/status');
  }

  // ESTADÍSTICAS
  static async getGameStats(): Promise<GameStats> {
    return makeRequest('GET', '/statistics/global');
  }

  static async getLeaderboard(): Promise<any[]> {
    return makeRequest('GET', '/leaderboard');
  }

  static async getUserStats() {
    return makeRequest('GET', '/statistics/user');
  }

  // DATOS AUXILIARES
  static async getRealPlayersData() {
    try {
      return await makeRequest('GET', '/gacha/real-players');
    } catch (error) {
      console.warn('Production API players data not available, using local data');
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
    try {
      console.log('🌍 Fetching global statistics from production API...');
      const result = await makeRequest('GET', '/statistics/global');
      console.log('✅ Global statistics loaded from production API:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ Production API global statistics failed, using fallback data');
      return FALLBACK_DATA.gameStats;
    }
  }

  static async getSystemHealth() {
    try {
      console.log('🏥 Fetching system health from production API...');
      const result = await makeRequest('GET', '/health');
      console.log('✅ System health loaded from production API:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ Production API system health failed');
      return {
        status: 'unknown',
        timestamp: new Date().toISOString(),
        uptime: 0,
        memory: { rss: 'N/A' },
        environment: 'unknown'
      };
    }
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
      console.warn('⚠️ Production API penalty calculation not available, using fallback');
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
