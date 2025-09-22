/**
 * Configuración específica del backend
 * Separada del frontend para evitar conflictos de compilación
 */

export const BACKEND_CONFIG = {
  // Puerto del servidor
  PORT: process.env.PORT || 3001,
  
  // Configuración de base de datos (SQLite por defecto, PostgreSQL para producción)
  DB_TYPE: process.env.DB_TYPE || 'sqlite',
  DB_PATH: process.env.DB_PATH || './data/goalplay.db',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_USERNAME: process.env.DB_USERNAME || 'goalplay',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_DATABASE: process.env.DB_DATABASE || 'goalplay',
  DB_SSL: (process.env.DB_SSL || '').toLowerCase() === 'true',
  DB_SSL_REJECT_UNAUTHORIZED: (process.env.DB_SSL_REJECT_UNAUTHORIZED || '').toLowerCase() === 'true',
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Configuración de JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Configuración de CORS
  CORS_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3001',
    'https://localhost:5173',
    'https://localhost:3001',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
  ],
  
  // Configuración de Supabase
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  
  // Configuración de rate limiting
  THROTTLE_TTL: parseInt(process.env.THROTTLE_TTL || '60000'),
  THROTTLE_LIMIT: parseInt(process.env.THROTTLE_LIMIT || '100'),
  
  // Wallets de recepción por blockchain
  RECEIVING_WALLETS: {
    ethereum: process.env.ETH_RECEIVING_WALLET_1 || '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
    bsc: process.env.BSC_RECEIVING_WALLET_1 || '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
    polygon: process.env.POLYGON_RECEIVING_WALLET_1 || '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
    arbitrum: process.env.ARB_RECEIVING_WALLET_1 || '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
    solana: process.env.SOL_RECEIVING_WALLET_1 || '11111111111111111111111111111112',
  },
  
  // URLs de RPC por blockchain
  RPC_URLS: {
    ethereum: process.env.ETH_RPC_URL,
    bsc: process.env.BSC_RPC_URL,
    polygon: process.env.POLYGON_RPC_URL,
    arbitrum: process.env.ARB_RPC_URL,
    solana: process.env.SOL_RPC_URL,
  },
  
  // Configuración del entorno
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

/**
 * Función para obtener wallet de recepción por tipo de blockchain
 */
export const getReceivingWallet = (chainType: string): string => {
  return BACKEND_CONFIG.RECEIVING_WALLETS[chainType as keyof typeof BACKEND_CONFIG.RECEIVING_WALLETS] || 
         BACKEND_CONFIG.RECEIVING_WALLETS.ethereum;
};

/**
 * Función para validar configuración del backend
 */
export const validateBackendConfig = (): boolean => {
  const required = ['JWT_SECRET'];
  
  for (const key of required) {
    if (!BACKEND_CONFIG[key as keyof typeof BACKEND_CONFIG]) {
      console.error(`❌ Missing required config: ${key}`);
      return false;
    }
  }
  
  return true;
};