// Configuración centralizada de la API

// Función robusta para obtener variables de entorno
const getEnvVar = (key: string, defaultValue: string = '') => {
  // En Node.js (backend), usar process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  // En el navegador con Vite
  if (typeof window !== 'undefined') {
    try {
      // Verificar si import.meta está disponible
      if (typeof globalThis !== 'undefined' && (globalThis as any).importMeta) {
        return (globalThis as any).importMeta.env[key] || defaultValue;
      }
      
      // Fallback para Vite - usar eval para evitar errores de compilación
      const metaEnv = eval('typeof import !== "undefined" && import.meta && import.meta.env');
      if (metaEnv && metaEnv[key]) {
        return metaEnv[key];
      }
    } catch (e) {
      // Fallback silencioso
    }
  }
  
  return defaultValue;
};

export const API_CONFIG = {
  // URL base de la API - CAMBIAR ESTA URL PARA CONECTAR AL BACKEND REAL
  BASE_URL: getEnvVar('VITE_API_URL', 'https://tu-backend-real.ondigitalocean.app'),
  
  // Configuración de timeouts
  TIMEOUT: 10000,
  
  // Configuración de reintentos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Configuración de autenticación
  AUTH: {
    TOKEN_KEY: 'authToken',
    REFRESH_TOKEN_KEY: 'refreshToken',
    TOKEN_HEADER: 'Authorization',
  },
  
  // Endpoints específicos
  ENDPOINTS: {
    // Autenticación
    AUTH_SIWE_CHALLENGE: '/auth/siwe/challenge',
    AUTH_SIWE_VERIFY: '/auth/siwe/verify',
    AUTH_SOLANA_CHALLENGE: '/auth/solana/challenge',
    AUTH_SOLANA_VERIFY: '/auth/solana/verify',
    
    // Productos y tienda
    PRODUCTS: '/products',
    PRODUCT_VARIANTS: (id: string) => `/products/${id}/variants`,
    
    // Órdenes
    ORDERS: '/orders',
    ORDER_DETAILS: (id: string) => `/orders/${id}`,
    ORDER_PAYMENT_STATUS: (id: string) => `/orders/${id}/payment-status`,
    
    // Inventario
    OWNED_PLAYERS: '/owned-players',
    PLAYER_KIT: (id: string) => `/owned-players/${id}/kit`,
    PLAYER_PROGRESSION: (id: string) => `/owned-players/${id}/progression`,
    FARMING_STATUS: (id: string) => `/owned-players/${id}/farming-status`,
    FARMING_SESSION: (id: string) => `/owned-players/${id}/farming`,
    
    // Penalty gameplay
    PENALTY_SESSIONS: '/penalty/sessions',
    PENALTY_SESSION_DETAILS: (id: string) => `/penalty/sessions/${id}`,
    PENALTY_ATTEMPTS: (id: string) => `/penalty/sessions/${id}/attempts`,
    PENALTY_JOIN: (id: string) => `/penalty/sessions/${id}/join`,
    
    // Wallets
    WALLETS: '/wallets',
    WALLET_LINK: '/wallets/link',
    WALLET_UNLINK: (address: string) => `/wallets/${address}`,
    WALLET_SET_PRIMARY: (address: string) => `/wallets/${address}/primary`,
    
    // Contabilidad
    LEDGER_TRANSACTIONS: '/ledger/transactions',
    LEDGER_BALANCE: '/ledger/balance',
    
    // Referidos
    REFERRAL_MY_CODE: '/referral/my-code',
    REFERRAL_CREATE_CODE: '/referral/create-code',
    REFERRAL_REGISTER: '/referral/register',
    REFERRAL_STATS: '/referral/stats',
    REFERRAL_VALIDATE: (code: string) => `/referral/validate/${code}`,
    
    // Sistema
    HEALTH: '/health',
    API_INFO: '/',
    VERSION: '/version',
    STATUS: '/status',
    
    // Estadísticas
    GLOBAL_STATS: '/statistics/global',
    LEADERBOARD: '/leaderboard',
    USER_STATS: '/statistics/user',
  },
};

// Función para cambiar la URL base dinámicamente
export const setApiBaseUrl = (newUrl: string) => {
  API_CONFIG.BASE_URL = newUrl;
  console.log(`🔄 API Base URL changed to: ${newUrl}`);
};

// Función para obtener la URL completa de un endpoint
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Función para verificar si el backend está disponible
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HEALTH), {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};