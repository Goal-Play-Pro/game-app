export interface ProviderErrorLike {
  readonly code?: unknown;
  readonly message?: unknown;
  readonly data?: unknown;
}

interface WalletErrorOptions {
  readonly cause?: unknown;
}

interface WalletErrorOptions {
  readonly cause?: unknown;
}

const USER_REJECTION_CODES = new Set([4001, 5000]);
const USER_REJECTION_PATTERNS = [
  /user rejected/i,
  /request rejected/i,
  /rejected by user/i,
  /user denied/i,
];

const UNSUPPORTED_CHAIN_PATTERNS = [
  /unsupported chain/i,
  /chain .*not supported/i,
  /does not support .*chain/i,
  /chain does not exist/i,
];

const METHOD_FALLBACKS: Record<string, { code: number; message: string }> = {
  eth_requestaccounts: {
    code: 4001,
    message: 'User rejected wallet connection request.',
  },
  wallet_switchethereumchain: {
    code: 4901,
    message: 'Unable to switch to the requested chain.',
  },
  wallet_addethereumchain: {
    code: 4901,
    message: 'Unable to add the requested chain to the wallet.',
  },
  personal_sign: {
    code: 4001,
    message: 'User rejected personal signature request.',
  },
};

const WALLET_ERROR_MESSAGES: Record<number, string> = {
  4001: 'You rejected the request in your wallet. Approve it to continue.',
  4005: 'The request was cancelled by your wallet.',
  4900: 'Your wallet disconnected. Reconnect it and try again.',
  4901: 'Switch to BNB Smart Chain (0x38) in your wallet to continue.',
  4902: 'Add BNB Smart Chain to your wallet, then retry the action.',
  5000: 'The request was cancelled by your wallet.',
};

const parseErrorCode = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
};

export class WalletRpcError extends Error {
  readonly code: number;
  readonly data?: unknown;
  readonly cause?: unknown;

  constructor(code: number, message: string, data?: unknown, options?: WalletErrorOptions) {
    super(message);
    this.name = 'WalletRpcError';
    this.code = code;
    this.data = data;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

const isProviderErrorLike = (value: unknown): value is ProviderErrorLike => {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('code' in value || 'message' in value || 'data' in value)
  );
};

const deriveCodeFromMessage = (message: string): number | null => {
  if (USER_REJECTION_PATTERNS.some((pattern) => pattern.test(message))) {
    return 4001;
  }

  if (UNSUPPORTED_CHAIN_PATTERNS.some((pattern) => pattern.test(message))) {
    return 4901;
  }

  return null;
};

export const createWalletError = (
  code: number,
  message: string,
  data?: unknown,
  options?: WalletErrorOptions,
): WalletRpcError => {
  return new WalletRpcError(code, message, data, options);
};

export const normalizeWalletError = (
  error: unknown,
  fallbackCode: number = -1,
  fallbackMessage = 'Unexpected wallet error occurred.',
): WalletRpcError => {
  if (error instanceof WalletRpcError) {
    return error;
  }

  if (isProviderErrorLike(error)) {
    const candidateCode = parseErrorCode(error.code);
    const message = typeof error.message === 'string' && error.message.trim().length > 0
      ? error.message
      : fallbackMessage;

    const derivedCode = candidateCode ?? deriveCodeFromMessage(message) ?? fallbackCode;
    return new WalletRpcError(derivedCode, message, error.data, { cause: error instanceof Error ? error : undefined });
  }

  if (error instanceof Error) {
    const derivedCode = deriveCodeFromMessage(error.message) ?? fallbackCode;
    return new WalletRpcError(derivedCode, error.message || fallbackMessage, undefined, { cause: error });
  }

  if (typeof error === 'string') {
    const derivedCode = deriveCodeFromMessage(error) ?? fallbackCode;
    return new WalletRpcError(derivedCode, error, undefined);
  }

  return new WalletRpcError(fallbackCode, fallbackMessage, undefined, {
    cause: error instanceof Error ? error : undefined,
  });
};

export const isUserRejectionError = (error: WalletRpcError): boolean => {
  if (USER_REJECTION_CODES.has(error.code)) {
    return true;
  }
  return USER_REJECTION_PATTERNS.some((pattern) => pattern.test(error.message));
};

export const isUnsupportedChainError = (error: WalletRpcError): boolean => {
  if (error.code === 4901 || error.code === 4902) {
    return true;
  }
  return UNSUPPORTED_CHAIN_PATTERNS.some((pattern) => pattern.test(error.message));
};

export const resolveMethodFallback = (method: string): { code: number; message: string } => {
  const normalized = method.toLowerCase();

  if (normalized.startsWith('eth_signtypeddata')) {
    return {
      code: 4001,
      message: 'User rejected typed data signature request.',
    };
  }

  return METHOD_FALLBACKS[normalized] ?? {
    code: -1,
    message: 'Unexpected wallet error occurred.',
  };
};

export const formatWalletErrorMessage = (
  error: WalletRpcError,
  fallbackMessage: string = 'Wallet request failed.',
): string => {
  if (!error) {
    return fallbackMessage;
  }

  const knownMessage = WALLET_ERROR_MESSAGES[error.code];
  if (knownMessage) {
    return knownMessage;
  }

  if (error.message && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
};
