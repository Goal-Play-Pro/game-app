const resolveEnvValue = (key: string, fallback: string = ''): string => {
  if (typeof process !== 'undefined' && process.env && typeof process.env[key] === 'string') {
    return process.env[key] as string;
  }

  if (typeof globalThis !== 'undefined') {
    const appEnv = (globalThis as any).__APP_ENV__;
    if (appEnv && typeof appEnv[key] === 'string') {
      return appEnv[key] as string;
    }
  }

  return fallback;
};

export const PAYMENT_CONFIG = {
  PAYMENT_GATEWAY_CONTRACT: resolveEnvValue('VITE_PAYMENT_GATEWAY_CONTRACT', ''),
};
