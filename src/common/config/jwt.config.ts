import { ConfigService } from '@nestjs/config';
import type { Algorithm } from 'jsonwebtoken';

const MIN_SECRET_LENGTH = 32;
const DEFAULT_ALGORITHM: Algorithm = 'HS512';
const DEFAULT_EXPIRES_IN = '1h';
const DEFAULT_AUDIENCE = 'goal-play-users';
const DEFAULT_ISSUER = 'goal-play-api';
const DEFAULT_CLOCK_TOLERANCE_SECONDS = 30;

const SUPPORTED_HMAC_ALGORITHMS = new Set<Algorithm>(['HS256', 'HS384', 'HS512']);

export const JWT_SECRET_CONFIG_KEY = 'JWT_SECRET';
export const JWT_SECRET_CURRENT_CONFIG_KEY = 'JWT_SECRET_CURRENT';
export const JWT_SECRET_PREVIOUS_CONFIG_KEY = 'JWT_SECRET_PREVIOUS';
export const JWT_CURRENT_KID_CONFIG_KEY = 'JWT_CURRENT_KID';
export const JWT_PREVIOUS_KID_CONFIG_KEY = 'JWT_PREVIOUS_KID';
export const JWT_ALGORITHM_CONFIG_KEY = 'JWT_ALGORITHM';
export const JWT_EXPIRES_IN_CONFIG_KEY = 'JWT_EXPIRES_IN';
export const JWT_AUDIENCE_CONFIG_KEY = 'JWT_AUDIENCE';
export const JWT_ISSUER_CONFIG_KEY = 'JWT_ISSUER';
export const JWT_CLOCK_TOLERANCE_SECONDS_KEY = 'JWT_CLOCK_TOLERANCE_SECONDS';

export interface JwtKeyConfig {
  kid: string;
  secret: string;
}

export interface ResolvedJwtConfig {
  algorithm: Algorithm;
  expiresIn: string;
  audience: string;
  issuer: string;
  clockTolerance: number;
  current: JwtKeyConfig;
  previous?: JwtKeyConfig;
}

const ensureSecret = (value: string | undefined, context: string): string => {
  if (!value || value.trim().length < MIN_SECRET_LENGTH) {
    throw new Error(
      `${context} must be defined and contain at least ${MIN_SECRET_LENGTH} characters`,
    );
  }
  return value;
};

const coerceKid = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

const resolveAlgorithm = (value: string | undefined): Algorithm => {
  const algorithm = (value ?? DEFAULT_ALGORITHM).toUpperCase() as Algorithm;
  if (!SUPPORTED_HMAC_ALGORITHMS.has(algorithm)) {
    throw new Error(`Unsupported JWT algorithm: ${algorithm}. Allowed: ${Array.from(SUPPORTED_HMAC_ALGORITHMS).join(', ')}`);
  }
  return algorithm;
};

const resolveClockTolerance = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_CLOCK_TOLERANCE_SECONDS;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 300) {
    throw new Error('JWT clock tolerance must be an integer between 0 and 300 seconds');
  }
  return parsed;
};

export const resolveJwtConfig = (configService: ConfigService): ResolvedJwtConfig => {
  const secretCurrent = configService.get<string>(JWT_SECRET_CURRENT_CONFIG_KEY)
    ?? configService.get<string>(JWT_SECRET_CONFIG_KEY);
  const currentSecret = ensureSecret(secretCurrent, JWT_SECRET_CURRENT_CONFIG_KEY);
  const currentKid = coerceKid(configService.get<string>(JWT_CURRENT_KID_CONFIG_KEY), 'current');

  const secretPrevious = configService.get<string>(JWT_SECRET_PREVIOUS_CONFIG_KEY);
  const previousKid = configService.get<string>(JWT_PREVIOUS_KID_CONFIG_KEY);
  let previous: JwtKeyConfig | undefined;
  if (secretPrevious) {
    previous = {
      secret: ensureSecret(secretPrevious, JWT_SECRET_PREVIOUS_CONFIG_KEY),
      kid: coerceKid(previousKid, 'previous'),
    };
  }

  const algorithm = resolveAlgorithm(configService.get<string>(JWT_ALGORITHM_CONFIG_KEY));
  const expiresIn = configService.get<string>(JWT_EXPIRES_IN_CONFIG_KEY) ?? DEFAULT_EXPIRES_IN;
  const audience = configService.get<string>(JWT_AUDIENCE_CONFIG_KEY) ?? DEFAULT_AUDIENCE;
  const issuer = configService.get<string>(JWT_ISSUER_CONFIG_KEY) ?? DEFAULT_ISSUER;
  const clockTolerance = resolveClockTolerance(configService.get<string>(JWT_CLOCK_TOLERANCE_SECONDS_KEY));

  return {
    algorithm,
    expiresIn,
    audience,
    issuer,
    clockTolerance,
    current: {
      kid: currentKid,
      secret: currentSecret,
    },
    previous,
  };
};

export const resolveJwtSecret = (configService: ConfigService): string => {
  return resolveJwtConfig(configService).current.secret;
};
