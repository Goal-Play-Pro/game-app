// Configuración centralizada de la API

type EnvMap = Record<string, string | undefined> | undefined;

const resolveViteEnv = (): EnvMap => {
  try {
    // Durante el build y en el navegador, Vite inyecta import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env as EnvMap;
    }
  } catch (error) {
    // Ignorar si no está disponible (por ejemplo, en Node CommonJS)
  }
  return undefined;
};

const viteEnv = resolveViteEnv();

// Función robusta para obtener variables de entorno
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // En Node.js (SSR, tests, etc.), usar process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }

  // En el navegador con Vite
  if (viteEnv && viteEnv[key] !== undefined) {
    return viteEnv[key] as string;
  }

  // Último intento: leer de window.__APP_ENV__ (por si se inyecta manualmente)
  if (typeof window !== 'undefined' && (window as any).__APP_ENV__?.[key]) {
    return (window as any).__APP_ENV__[key];
  }

  return defaultValue;
};

export const API_CONFIG = {
  // URL base de la API: por defecto usa el proxy /api del frontend
  BASE_URL: getEnvVar('VITE_API_URL', '/api'),
  
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
