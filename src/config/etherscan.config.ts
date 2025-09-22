import { Logger } from '@nestjs/common';

export type EtherscanLimitScope = 'global' | 'per-chain';

export interface EtherscanConfig {
  baseUrl: string;
  apiKey: string;
  defaultChainId: string;
  maxCallsPerSecond?: number;
  maxDailyCalls?: number;
  limitScope: EtherscanLimitScope;
  dailyResetHourUtc: number;
  retryMaxAttempts: number;
  retryBaseDelayMs: number;
  retryWithJitter: boolean;
  timeoutMs: number;
  featureFlagV2: boolean;
}

const logger = new Logger('EtherscanConfig');

const toOptionalInt = (value?: string | null): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toBoolean = (value: string | undefined | null, defaultValue: boolean): boolean => {
  if (value === undefined || value === null || value.trim() === '') {
    return defaultValue;
  }

  return value.trim().toLowerCase() === 'true';
};

const toLimitScope = (value: string | undefined | null): EtherscanLimitScope => {
  if (!value) {
    return 'global';
  }

  const normalized = value.trim().toLowerCase();
  return normalized === 'per-chain' ? 'per-chain' : 'global';
};

const clampHour = (value: number | undefined, fallback: number): number => {
  if (value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 23) {
    return 23;
  }

  return value;
};

export const ETHERSCAN_CONFIG: EtherscanConfig = {
  baseUrl: process.env.ETHERSCAN_BASE_URL || 'https://api.etherscan.io/v2/api',
  apiKey: process.env.ETHERSCAN_API_KEY || '',
  defaultChainId: process.env.ETHERSCAN_DEFAULT_CHAINID || '56',
  maxCallsPerSecond: toOptionalInt(process.env.ETHERSCAN_MAX_CPS),
  maxDailyCalls: toOptionalInt(process.env.ETHERSCAN_MAX_DAILY),
  limitScope: toLimitScope(process.env.ETHERSCAN_LIMIT_SCOPE),
  dailyResetHourUtc: clampHour(toOptionalInt(process.env.ETHERSCAN_DAILY_RESET_HOUR_UTC), 0),
  retryMaxAttempts: toOptionalInt(process.env.ETHERSCAN_RETRY_MAX_ATTEMPTS) || 3,
  retryBaseDelayMs: toOptionalInt(process.env.ETHERSCAN_RETRY_BASE_MS) || 250,
  retryWithJitter: toBoolean(process.env.ETHERSCAN_RETRY_JITTER, true),
  timeoutMs: toOptionalInt(process.env.ETHERSCAN_TIMEOUT_MS) || 10000,
  featureFlagV2: toBoolean(process.env.ETHERSCAN_FEATURE_FLAG_V2, true),
};

let configValidated = false;

export const validateEtherscanConfig = (): boolean => {
  if (configValidated) {
    return true;
  }

  if (!ETHERSCAN_CONFIG.apiKey) {
    logger.error('ETHERSCAN_API_KEY is required for blockchain operations');
    return false;
  }

  if (ETHERSCAN_CONFIG.maxCallsPerSecond !== undefined && ETHERSCAN_CONFIG.maxCallsPerSecond <= 0) {
    logger.warn('ETHERSCAN_MAX_CPS must be positive when provided. Rate limiting will be disabled.');
    ETHERSCAN_CONFIG.maxCallsPerSecond = undefined;
  }

  if (ETHERSCAN_CONFIG.maxDailyCalls !== undefined && ETHERSCAN_CONFIG.maxDailyCalls <= 0) {
    logger.warn('ETHERSCAN_MAX_DAILY must be positive when provided. Daily limiting will be disabled.');
    ETHERSCAN_CONFIG.maxDailyCalls = undefined;
  }

  configValidated = true;
  return true;
};

export const getEtherscanScopeKey = (chainId?: string): string => {
  return chainId ? chainId : ETHERSCAN_CONFIG.defaultChainId;
};
