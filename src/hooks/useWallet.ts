import { useState, useEffect, useCallback, useRef } from 'react';
import { ChainType } from '../types';
import { useReferral } from './useReferral';
import ApiService from '../services/api';
import { persistWallet, clearPersistedWallet, getStoredWallet } from '../utils/walletStorage';
import { formatCaip10 } from '../utils/caip10';
import type {
  Eip1193Provider,
  WalletType,
  Eip6963AnnounceProviderEvent,
  WalletWindow,
  Eip6963ProviderInfo,
  Eip1193DisconnectEvent,
  Eip1193RequestArguments,
} from '../types/wallet';
import {
  getPreferredProvider,
  getPreferredProviderInfo,
  setPreferredProvider,
  clearPreferredProvider,
} from '../utils/providerRegistry';
import {
  createWalletError,
  normalizeWalletError,
  resolveMethodFallback,
} from '../utils/walletErrors';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  caip10Address: string | null;
  chainId: number | null;
  chainType: ChainType | null;
  isConnecting: boolean;
  isAuthenticating: boolean;
  needsAuth: boolean;
  error: string | null;
  errorCode: number | null;
  isFrameBlocked: boolean;
  walletType: WalletType | null;
}

const BSC_NETWORK = {
  chainId: '0x38', // 56 in hex
  chainName: 'BNB Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://bsc-dataseed1.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/'],
};

const getChainType = (chainId: number): ChainType => {
  switch (chainId) {
    case 1:
      return ChainType.ETHEREUM;
    case 56:
      return ChainType.BSC;
    case 137:
      return ChainType.POLYGON;
    case 42161:
      return ChainType.ARBITRUM;
    default:
      return ChainType.BSC;
  }
};

const normalizeWalletType = (value: string | null | undefined): WalletType | null => {
  if (value === 'metamask' || value === 'safepal') {
    return value;
  }
  return null;
};

const DISALLOWED_METHOD = 'eth_sign';
const TYPED_DATA_METHODS = new Set([
  'eth_signtypeddata',
  'eth_signtypeddata_v1',
  'eth_signtypeddata_v3',
  'eth_signtypeddata_v4',
]);

type WalletAuthSnapshot = Pick<WalletState, 'isConnected' | 'needsAuth'>;

const normalizeInfoString = (info?: Eip6963ProviderInfo) => {
  if (!info) {
    return '';
  }
  return `${info.rdns ?? ''} ${info.name ?? ''} ${info.description ?? ''}`.toLowerCase();
};

const isSafePalProvider = (provider?: Eip1193Provider | null, info?: Eip6963ProviderInfo) => {
  if (provider?.isSafePal) {
    return true;
  }
  const normalized = normalizeInfoString(info);
  return normalized.includes('safepal');
};

const isMetaMaskProvider = (provider?: Eip1193Provider | null, info?: Eip6963ProviderInfo) => {
  if (provider?.isMetaMask) {
    return true;
  }
  const normalized = normalizeInfoString(info);
  return normalized.includes('metamask');
};

export const enforceWalletRequestGuards = (method: string, state: WalletAuthSnapshot | null) => {
  const normalized = typeof method === 'string' ? method.toLowerCase() : '';

  if (normalized === DISALLOWED_METHOD) {
    throw new Error('Direct eth_sign requests are blocked for security reasons.');
  }

  if (TYPED_DATA_METHODS.has(normalized)) {
    if (!state?.isConnected || state.needsAuth) {
      throw new Error('Typed data signatures are only allowed after wallet authentication.');
    }
  }
};

export const useWallet = () => {
  const { registerPendingReferral } = useReferral();
  const providerRef = useRef<Eip1193Provider | null>(null);
  const walletStateRef = useRef<WalletState | null>(null);
  const isConnectingRef = useRef(false);
  const initialStoredWallet = getStoredWallet();
  const isAuthenticatingRef = useRef(false);
  const [walletState, setWalletState] = useState<WalletState>(() => {
    return {
      isConnected: initialStoredWallet.isConnected,
      address: initialStoredWallet.address,
      caip10Address: initialStoredWallet.caip10,
      chainId: initialStoredWallet.chainId,
      chainType: initialStoredWallet.chainId ? getChainType(initialStoredWallet.chainId) : null,
      isConnecting: false,
      isAuthenticating: false,
      needsAuth: initialStoredWallet.needsAuth,
      error: null,
      errorCode: null,
      isFrameBlocked: false,
      walletType: normalizeWalletType(initialStoredWallet.walletType),
    };
  });

  walletStateRef.current = walletState;

  const hasRequestedAccountsRef = useRef(initialStoredWallet.isConnected);

  const resolveWindowProviderFromWindow = useCallback((): Eip1193Provider | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    const win = window as WalletWindow;
    if (win.safePal?.request) {
      return win.safePal;
    }
    if (win.ethereum) {
      return win.ethereum;
    }
    return null;
  }, []);

  const resolveWindowProvider = useCallback((): Eip1193Provider | null => {
    const preferred = getPreferredProvider();
    if (preferred) {
      return preferred;
    }

    return resolveWindowProviderFromWindow();
  }, [resolveWindowProviderFromWindow]);

  const deriveWalletType = useCallback(
    (provider?: Eip1193Provider | null): WalletType => {
      const candidate = provider ?? providerRef.current ?? resolveWindowProvider();
      const win = typeof window !== 'undefined' ? (window as WalletWindow) : undefined;

      const info = getPreferredProviderInfo();
      const preferred = getPreferredProvider();
      if (info && (!candidate || !preferred || candidate === preferred)) {
        if (isSafePalProvider(candidate, info)) {
          return 'safepal';
        }
        if (isMetaMaskProvider(candidate, info)) {
          return 'metamask';
        }
      }

      if (isSafePalProvider(candidate, info) || win?.safePal?.isSafePal) {
        return 'safepal';
      }

      if (isMetaMaskProvider(candidate, info) || win?.ethereum?.isMetaMask) {
        return 'metamask';
      }

      if (candidate || win?.ethereum || win?.safePal) {
        return 'metamask';
      }

      return 'unknown';
    },
    [resolveWindowProvider],
  );

  const detectWalletType = useCallback((): WalletType => {
    return deriveWalletType();
  }, [deriveWalletType]);

  const getProvider = useCallback((): Eip1193Provider | null => {
    const nextProvider = providerRef.current ?? resolveWindowProvider();

    if (nextProvider && providerRef.current !== nextProvider) {
      providerRef.current = nextProvider;
    }

    return providerRef.current;
  }, [resolveWindowProvider]);

  const requestWithGuards = useCallback(
    async <TResult = unknown>(
      provider: Eip1193Provider,
      args: Eip1193RequestArguments | string,
    ): Promise<TResult> => {
      const requestObject: Eip1193RequestArguments =
        typeof args === 'string' ? { method: args } : args;

      enforceWalletRequestGuards(requestObject.method, walletStateRef.current);

      const fallback = resolveMethodFallback(requestObject.method);

      try {
        return (await provider.request(requestObject)) as TResult;
      } catch (error: unknown) {
        throw normalizeWalletError(error, fallback.code, fallback.message);
      }
    },
    [],
  );

  const setError = (message: string | null, errorCode: number | null = null) => {
    setWalletState((prev) => ({ ...prev, error: message, errorCode }));
  };

  const authenticateWallet = useCallback(
    async (address: string, chainIdNumber: number) => {
      const provider = getProvider();
      if (!provider) {
        throw new Error('Ethereum provider not available');
      }

      const challenge = await ApiService.createSiweChallenge(address, chainIdNumber);
      const message = challenge.message;

      let signature: string;
      try {
        signature = await requestWithGuards<string>(provider, {
          method: 'personal_sign',
          params: [message, address],
        });
      } catch (signError: unknown) {
        const normalizedError = normalizeWalletError(
          signError,
          4001,
          'Signature request was rejected.',
        );

        if (normalizedError.code === 4001) {
          throw createWalletError(4001, 'Signature request was rejected.', normalizedError.data);
        }

        throw normalizedError;
      }

      const verification = await ApiService.verifySiweSignature(message, signature);
      const expectedCaip10 = formatCaip10(chainIdNumber, address);
      if (verification?.primaryWalletCaip10 && verification.primaryWalletCaip10 !== expectedCaip10) {
        throw new Error('Wallet mismatch between SIWE verification and connected account');
      }

      ApiService.markSessionActive(true);
      await registerPendingReferral();
      return verification;
    },
    [getProvider, registerPendingReferral, requestWithGuards],
  );

  const resetToDisconnected = useCallback((errorMessage?: string, errorCode: number | null = null) => {
    clearPersistedWallet();
    ApiService.markSessionActive(false);
    isConnectingRef.current = false;
    isAuthenticatingRef.current = false;
    hasRequestedAccountsRef.current = false;
    setWalletState((prev) => ({
      isConnected: false,
      address: null,
      caip10Address: null,
      chainId: null,
      chainType: null,
      isConnecting: false,
      isAuthenticating: false,
      needsAuth: false,
      error: errorMessage ?? null,
      errorCode,
      isFrameBlocked: prev.isFrameBlocked,
      walletType: null,
    }));
  }, []);

  const connectWallet = useCallback(async () => {
    if (walletState.isFrameBlocked) {
      setError('Wallet connections are disabled inside embedded frames.');
      return;
    }

    if (walletState.isConnecting || isConnectingRef.current) {
      return;
    }

    const provider = getProvider();
    const detectedType = provider ? deriveWalletType(provider) : detectWalletType();
    const normalizedType = detectedType === 'unknown' ? null : detectedType;

    if (!provider) {
      if (detectedType === 'unknown') {
        setError('No compatible wallet detected. Please install MetaMask or SafePal to continue.');
      } else {
        const name = detectedType === 'safepal' ? 'SafePal' : 'MetaMask';
        setError(`${name} is not available. Please reopen or reinstall the extension.`);
      }
      return;
    }

    isConnectingRef.current = true;
    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null, walletType: normalizedType }));

    try {
      const accounts = await requestWithGuards<string[]>(provider, { method: 'eth_requestAccounts' });
      const chainIdHex = await requestWithGuards<string>(provider, { method: 'eth_chainId' });
      const chainIdNumber = Number.parseInt(chainIdHex, 16);

      persistWallet(chainIdNumber, accounts[0], normalizedType ?? undefined, true);

      const requiresChainSwitch = chainIdNumber !== 56;
      const connectionErrorMessage = requiresChainSwitch
        ? 'Unsupported chain detected. Please switch to BNB Smart Chain (0x38).'
        : null;
      const connectionErrorCode = requiresChainSwitch ? 4901 : null;

      setWalletState((prev) => ({
        isConnected: true,
        address: accounts[0],
        caip10Address: formatCaip10(chainIdNumber, accounts[0]),
        chainId: chainIdNumber,
        chainType: getChainType(chainIdNumber),
        isConnecting: false,
        isAuthenticating: false,
        needsAuth: true,
        error: connectionErrorMessage,
        errorCode: connectionErrorCode,
        isFrameBlocked: prev.isFrameBlocked,
        walletType: normalizedType,
      }));
      hasRequestedAccountsRef.current = true;
      const label = normalizedType ? normalizedType.toUpperCase() : 'WALLET';
      console.log(`✅ ${label} connected: ${formatCaip10(chainIdNumber, accounts[0])}`);
    } catch (error: unknown) {
      const normalizedError = normalizeWalletError(
        error,
        4001,
        'Wallet connection request failed.',
      );
      console.error('Error connecting wallet:', normalizedError);
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: normalizedError.message,
        errorCode: normalizedError.code,
        walletType: prev.walletType ?? normalizedType,
      }));
    } finally {
      isConnectingRef.current = false;
    }
  }, [deriveWalletType, detectWalletType, getProvider, requestWithGuards, walletState.isConnecting, walletState.isFrameBlocked]);

  const signInWallet = useCallback(async () => {
    if (walletState.isFrameBlocked) {
      setError('Wallet connections are disabled inside embedded frames.');
      return;
    }
    if (!walletState.isConnected || !walletState.address || !walletState.chainId) {
      setError('Connect your wallet before signing in.');
      return;
    }
    if (walletState.isAuthenticating || isAuthenticatingRef.current) {
      return;
    }

    isAuthenticatingRef.current = true;
    setWalletState((prev) => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      await authenticateWallet(walletState.address, walletState.chainId);
      persistWallet(walletState.chainId, walletState.address, walletState.walletType ?? undefined, false);
      setWalletState((prev) => ({
        ...prev,
        isAuthenticating: false,
        needsAuth: false,
        error: null,
        errorCode: null,
        walletType: prev.walletType,
      }));
    } catch (error: unknown) {
      const normalizedError = normalizeWalletError(
        error,
        4001,
        'Wallet authentication failed.',
      );
      console.error('❌ Wallet authentication failed:', normalizedError);
      if (walletState.chainId && walletState.address) {
        persistWallet(
          walletState.chainId,
          walletState.address,
          walletState.walletType ?? undefined,
          true,
        );
      }
      setWalletState((prev) => ({
        ...prev,
        isAuthenticating: false,
        needsAuth: true,
        error: normalizedError.message,
        errorCode: normalizedError.code,
        walletType: prev.walletType,
      }));
    } finally {
      isAuthenticatingRef.current = false;
    }
  }, [authenticateWallet, walletState.address, walletState.chainId, walletState.isAuthenticating, walletState.isConnected, walletState.isFrameBlocked]);

  const disconnectWallet = useCallback(() => {
    if (ApiService.isAuthenticated()) {
      ApiService.logout().catch(() => {});
    }
    resetToDisconnected();
  }, [resetToDisconnected]);

  const switchToNetwork = useCallback(async (targetChainId: number) => {
    const provider = getProvider();
    if (!provider) {
      throw new Error('Wallet provider not available');
    }

    try {
      await requestWithGuards(provider, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: unknown) {
      const normalizedError = normalizeWalletError(
        error,
        4901,
        'Unable to switch to the requested chain.',
      );

      if (normalizedError.code === 4902) {
        try {
          await requestWithGuards(provider, {
            method: 'wallet_addEthereumChain',
            params: [BSC_NETWORK],
          });

          await requestWithGuards(provider, {
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${targetChainId.toString(16)}` }],
          });
          return;
        } catch (addChainError: unknown) {
          const normalizedAddError = normalizeWalletError(
            addChainError,
            4901,
            'Unable to add the requested chain to the wallet.',
          );

          throw normalizedAddError;
        }
      }

      throw normalizedError;
    }
  }, [getProvider, requestWithGuards]);

  useEffect(() => {
    const provider = getProvider();
    if (!provider) {
      return;
    }

    const handleAccountsChanged = async (accounts: string[]) => {
      if (!hasRequestedAccountsRef.current) {
        return;
      }

      if (!accounts.length) {
        disconnectWallet();
        return;
      }

      let chainIdNumber = walletState.chainId ?? 56;
      try {
        const chainIdHex = await requestWithGuards<string>(provider, { method: 'eth_chainId' });
        if (chainIdHex) {
          chainIdNumber = Number.parseInt(chainIdHex, 16);
        }
      } catch {
        // ignore provider errors and fall back to previous chainId if available
      }

      const nextType = deriveWalletType(provider);
      const normalizedType = nextType === 'unknown' ? null : nextType;

      persistWallet(chainIdNumber, accounts[0], normalizedType ?? undefined, true);
      setWalletState((prev) => ({
        ...prev,
        address: accounts[0],
        caip10Address: formatCaip10(chainIdNumber, accounts[0]),
        chainId: chainIdNumber,
        chainType: getChainType(chainIdNumber),
        needsAuth: true,
        error: 'Account changed. Please sign in again.',
        errorCode: null,
        walletType: normalizedType ?? prev.walletType,
      }));
      ApiService.markSessionActive(false);
    };

    const handleChainChanged = (chainIdHex: string) => {
      if (!hasRequestedAccountsRef.current) {
        return;
      }

      const chainIdNumber = Number.parseInt(chainIdHex, 16);
      const requiresChainSwitch = chainIdNumber !== 56;
      setWalletState((prev) => ({
        ...prev,
        chainId: chainIdNumber,
        chainType: getChainType(chainIdNumber),
        needsAuth: prev.isConnected ? true : prev.needsAuth,
        walletType: prev.walletType,
        error: requiresChainSwitch
          ? 'Unsupported chain detected. Please switch to BNB Smart Chain (0x38).'
          : prev.errorCode === 4901
            ? null
            : prev.error,
        errorCode: requiresChainSwitch ? 4901 : prev.errorCode === 4901 ? null : prev.errorCode,
      }));
    };

    const handleDisconnect = (event: Eip1193DisconnectEvent) => {
      const normalized = normalizeWalletError(
        event ?? { code: 4900, message: 'Provider disconnected.' },
        4900,
        'Wallet disconnected.',
      );

      console.warn('Wallet provider disconnected:', normalized);
      clearPreferredProvider();
      providerRef.current = null;
      resetToDisconnected(normalized.message, normalized.code);
    };

    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);
    provider.on?.('disconnect', handleDisconnect as (event: unknown) => void);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
      provider.removeListener?.('disconnect', handleDisconnect as (event: unknown) => void);
    };
  }, [deriveWalletType, disconnectWallet, getProvider, requestWithGuards, resetToDisconnected, walletState.chainId, walletState.isConnected]);

  useEffect(() => {
    const handleProviderAnnouncement = (event: Eip6963AnnounceProviderEvent) => {
      const detail = event?.detail;
      if (!detail?.provider) {
        return;
      }

      const { provider, info } = detail;
      const currentPreferred = getPreferredProvider();
      const currentInfo = getPreferredProviderInfo();
      const candidateIsMetaMask = isMetaMaskProvider(provider, info);
      const currentIsMetaMask = isMetaMaskProvider(currentPreferred ?? undefined, currentInfo);

      const shouldPromoteCandidate =
        !currentPreferred || currentPreferred === provider || (candidateIsMetaMask && !currentIsMetaMask);

      if (shouldPromoteCandidate) {
        setPreferredProvider(provider, info);
        providerRef.current = provider;
      }

      const type = deriveWalletType(provider);
      if (!walletStateRef.current?.walletType && type !== 'unknown') {
        setWalletState((prev) => ({ ...prev, walletType: type }));
      }
    };

    window.addEventListener('eip6963:announceProvider', handleProviderAnnouncement as EventListener);
    window.dispatchEvent(new CustomEvent('eip6963:requestProvider'));

    const initialProvider = resolveWindowProvider();
    if (initialProvider && !providerRef.current) {
      providerRef.current = initialProvider;
      if (!getPreferredProvider()) {
        setPreferredProvider(initialProvider);
      }
      const type = deriveWalletType(initialProvider);
      if (!walletStateRef.current?.walletType && type !== 'unknown') {
        setWalletState((prev) => ({ ...prev, walletType: type }));
      }
    }

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleProviderAnnouncement as EventListener);
    };
  }, [deriveWalletType, resolveWindowProvider]);

  useEffect(() => {
    let framed = false;
    if (typeof window !== 'undefined') {
      try {
        framed = window.self !== window.top;
      } catch {
        framed = true;
      }
    }

    if (framed) {
      setWalletState((prev) => ({
        ...prev,
        isFrameBlocked: true,
        isConnecting: false,
        isAuthenticating: false,
        error: 'Wallet connections are disabled inside embedded frames.',
        errorCode: null,
      }));
    }
  }, []);

  return {
    ...walletState,
    connectWallet,
    signInWallet,
    disconnectWallet,
    switchToNetwork,
    detectWalletType,
  };
};
