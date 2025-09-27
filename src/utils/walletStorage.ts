import { formatCaip10, parseCaip10, isCaip10 } from './caip10';

const STORAGE_KEYS = {
  connected: 'walletConnected',
  chainId: 'walletChainId',
  caip10: 'walletAccountCaip10',
};

export interface StoredWalletAccount {
  isConnected: boolean;
  chainId: number | null;
  caip10: string | null;
  address: string | null;
}

export const persistWallet = (chainId: number, address: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const caip10 = formatCaip10(chainId, address);
  window.localStorage.setItem(STORAGE_KEYS.connected, 'true');
  window.localStorage.setItem(STORAGE_KEYS.chainId, chainId.toString());
  window.localStorage.setItem(STORAGE_KEYS.caip10, caip10);
};

export const clearPersistedWallet = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.connected);
  window.localStorage.removeItem(STORAGE_KEYS.chainId);
  window.localStorage.removeItem(STORAGE_KEYS.caip10);
};

export const getStoredWallet = (): StoredWalletAccount => {
  if (typeof window === 'undefined') {
    return {
      isConnected: false,
      chainId: null,
      caip10: null,
      address: null,
    };
  }

  try {
    const isConnected = window.localStorage.getItem(STORAGE_KEYS.connected) === 'true';
    const chainIdRaw = window.localStorage.getItem(STORAGE_KEYS.chainId);
    const storedCaip10 = window.localStorage.getItem(STORAGE_KEYS.caip10);

    if (!isConnected || !storedCaip10 || !chainIdRaw) {
      // attempt legacy migration when legacy fields exist
      const legacyAddress = window.localStorage.getItem('walletAddress');
      if (legacyAddress && chainIdRaw) {
        const legacyChainId = Number.parseInt(chainIdRaw, 10);
        if (!Number.isNaN(legacyChainId)) {
          const migratedCaip10 = formatCaip10(legacyChainId, legacyAddress);
          window.localStorage.setItem(STORAGE_KEYS.caip10, migratedCaip10);
          window.localStorage.removeItem('walletAddress');
          return {
            isConnected: true,
            chainId: legacyChainId,
            caip10: migratedCaip10,
            address: parseCaip10(migratedCaip10).address,
          };
        }
      }

      return {
        isConnected: false,
        chainId: null,
        caip10: storedCaip10 && isCaip10(storedCaip10) ? storedCaip10 : null,
        address: storedCaip10 && isCaip10(storedCaip10) ? parseCaip10(storedCaip10).address : null,
      };
    }

    const chainId = Number.parseInt(chainIdRaw, 10);
    if (Number.isNaN(chainId)) {
      return {
        isConnected: false,
        chainId: null,
        caip10: null,
        address: null,
      };
    }

    const identifier = isCaip10(storedCaip10) ? storedCaip10 : formatCaip10(chainId, storedCaip10);
    const parsed = parseCaip10(identifier);

    return {
      isConnected: true,
      chainId,
      caip10: identifier,
      address: parsed.address,
    };
  } catch {
    return {
      isConnected: false,
      chainId: null,
      caip10: null,
      address: null,
    };
  }
};

export const getStoredWalletAddress = (): string | null => {
  const { address } = getStoredWallet();
  return address;
};

export const getStoredCaip10 = (): string | null => {
  const { caip10 } = getStoredWallet();
  return caip10;
};

export const ensureCaip10 = (chainId: number, addressOrIdentifier: string): string => {
  return isCaip10(addressOrIdentifier) ? addressOrIdentifier : formatCaip10(chainId, addressOrIdentifier);
};

export const walletStorageKeys = STORAGE_KEYS;
