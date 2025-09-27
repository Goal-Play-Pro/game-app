import { useState, useEffect, useCallback, useRef } from 'react';
import { ChainType } from '../types';
import { useReferral } from './useReferral';
import ApiService from '../services/api';
import { persistWallet, clearPersistedWallet, getStoredWallet } from '../utils/walletStorage';
import { formatCaip10 } from '../utils/caip10';

type WalletType = 'metamask' | 'safepal' | 'unknown';

interface Eip1193Provider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  isMetaMask?: boolean;
  isSafePal?: boolean;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
  __goalplayGuarded?: boolean;
}

interface WalletWindow extends Window {
  ethereum?: Eip1193Provider;
  safePal?: Eip1193Provider;
}

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

export const useWallet = () => {
  const { registerPendingReferral } = useReferral();
  const providerRef = useRef<any>(null);
  const walletStateRef = useRef<WalletState | null>(null);
  const isConnectingRef = useRef(false);
  const isAuthenticatingRef = useRef(false);
  const [walletState, setWalletState] = useState<WalletState>(() => {
    const stored = getStoredWallet();
    return {
      isConnected: stored.isConnected,
      address: stored.address,
      caip10Address: stored.caip10,
      chainId: stored.chainId,
      chainType: stored.chainId ? getChainType(stored.chainId) : null,
      isConnecting: false,
      isAuthenticating: false,
      needsAuth: stored.isConnected,
      error: null,
      isFrameBlocked: false,
      walletType: normalizeWalletType(stored.walletType),
    };
  });

  walletStateRef.current = walletState;

  const resolveWindowProvider = useCallback((): Eip1193Provider | null => {
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

  const deriveWalletType = useCallback(
    (provider?: Eip1193Provider | null): WalletType => {
      const candidate = provider ?? providerRef.current ?? resolveWindowProvider();
      const win = typeof window !== 'undefined' ? (window as WalletWindow) : undefined;

      if (candidate?.isSafePal || win?.safePal?.isSafePal) {
        return 'safepal';
      }

      if (candidate?.isMetaMask || win?.ethereum?.isMetaMask) {
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

  const guardProvider = useCallback((provider: any) => {
    if (walletStateRef.current?.isFrameBlocked) {
      return null;
    }

    if (!provider || provider.__goalplayGuarded) {
      return provider;
    }

    const originalRequest = typeof provider.request === 'function' ? provider.request.bind(provider) : null;
    if (!originalRequest) {
      return provider;
    }

    const disallowedMethod = 'eth_sign';
    const typedDataMethods = new Set([
      'eth_signtypeddata',
      'eth_signtypeddata_v1',
      'eth_signtypeddata_v3',
      'eth_signtypeddata_v4',
    ]);

    provider.request = async (...args: any[]) => {
      const request = args[0];
      const method = typeof request === 'string' ? request : request?.method;
      const normalizedMethod = typeof method === 'string' ? method.toLowerCase() : '';

      if (normalizedMethod === disallowedMethod) {
        throw new Error('Direct eth_sign requests are blocked for security reasons.');
      }

      if (typedDataMethods.has(normalizedMethod)) {
        const state = walletStateRef.current;
        if (!state?.isConnected || state.needsAuth) {
          throw new Error('Typed data signatures are only allowed after wallet authentication.');
        }
      }

      return originalRequest(...args);
    };

    Object.defineProperty(provider, '__goalplayGuarded', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: true,
    });

    return provider;
  }, []);

  const getProvider = useCallback(() => {
    const rawProvider = providerRef.current ?? resolveWindowProvider();
    if (!rawProvider) {
      return null;
    }

    const guarded = guardProvider(rawProvider);
    providerRef.current = guarded;
    return guarded;
  }, [guardProvider, resolveWindowProvider]);

  const setError = (message: string | null) => {
    setWalletState((prev) => ({ ...prev, error: message }));
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
        signature = await provider.request({
          method: 'personal_sign',
          params: [message, address],
        });
      } catch (signError: any) {
        if (signError?.code === 4001) {
          throw new Error('Signature request was rejected');
        }
        throw signError;
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
    [getProvider, registerPendingReferral],
  );

  const resetToDisconnected = useCallback((errorMessage?: string) => {
    clearPersistedWallet();
    ApiService.markSessionActive(false);
    isConnectingRef.current = false;
    isAuthenticatingRef.current = false;
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
      const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
      const chainIdHex: string = await provider.request({ method: 'eth_chainId' });
      const chainIdNumber = Number.parseInt(chainIdHex, 16);

      persistWallet(chainIdNumber, accounts[0], normalizedType ?? undefined);
      setWalletState((prev) => ({
        isConnected: true,
        address: accounts[0],
        caip10Address: formatCaip10(chainIdNumber, accounts[0]),
        chainId: chainIdNumber,
        chainType: getChainType(chainIdNumber),
        isConnecting: false,
        isAuthenticating: false,
        needsAuth: true,
        error: null,
        isFrameBlocked: prev.isFrameBlocked,
        walletType: normalizedType,
      }));
      const label = normalizedType ? normalizedType.toUpperCase() : 'WALLET';
      console.log(`✅ ${label} connected: ${formatCaip10(chainIdNumber, accounts[0])}`);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error?.message ?? 'Failed to connect wallet',
        walletType: prev.walletType ?? normalizedType,
      }));
    } finally {
      isConnectingRef.current = false;
    }
  }, [deriveWalletType, detectWalletType, getProvider, walletState.isConnecting, walletState.isFrameBlocked]);

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
      persistWallet(walletState.chainId, walletState.address, walletState.walletType ?? undefined);
      setWalletState((prev) => ({
        ...prev,
        isAuthenticating: false,
        needsAuth: false,
        error: null,
        walletType: prev.walletType,
      }));
    } catch (error: any) {
      console.error('❌ Wallet authentication failed:', error);
      setWalletState((prev) => ({
        ...prev,
        isAuthenticating: false,
        needsAuth: true,
        error: error?.message ?? 'Wallet authentication failed',
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
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error?.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [BSC_NETWORK],
        });
      } else {
        throw error;
      }
    }
  }, [getProvider]);

  useEffect(() => {
    const provider = getProvider();
    if (!provider) {
      return;
    }

    const handleAccountsChanged = async (accounts: string[]) => {
      if (!accounts.length) {
        disconnectWallet();
        return;
      }

      let chainIdNumber = walletState.chainId ?? 56;
      try {
        const chainIdHex: string = await provider.request?.({ method: 'eth_chainId' });
        if (chainIdHex) {
          chainIdNumber = Number.parseInt(chainIdHex, 16);
        }
      } catch {
        // ignore provider errors and fall back to previous chainId if available
      }

      const nextType = deriveWalletType(provider);
      const normalizedType = nextType === 'unknown' ? null : nextType;

      persistWallet(chainIdNumber, accounts[0], normalizedType ?? undefined);
      setWalletState((prev) => ({
        ...prev,
        address: accounts[0],
        caip10Address: formatCaip10(chainIdNumber, accounts[0]),
        chainId: chainIdNumber,
        chainType: getChainType(chainIdNumber),
        needsAuth: true,
        error: 'Account changed. Please sign in again.',
        walletType: normalizedType ?? prev.walletType,
      }));
      ApiService.markSessionActive(false);
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainIdNumber = Number.parseInt(chainIdHex, 16);
      setWalletState((prev) => ({
        ...prev,
        chainId: chainIdNumber,
        chainType: getChainType(chainIdNumber),
        needsAuth: prev.isConnected ? true : prev.needsAuth,
        walletType: prev.walletType,
      }));
    };

    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [deriveWalletType, disconnectWallet, getProvider, walletState.chainId, walletState.isConnected]);

  useEffect(() => {
    const handleProviderAnnouncement = (event: any) => {
      if (event?.detail?.provider) {
        const guarded = guardProvider(event.detail.provider);
        providerRef.current = guarded;
        const type = deriveWalletType(guarded);
        if (!walletStateRef.current?.walletType && type !== 'unknown') {
          setWalletState((prev) => ({ ...prev, walletType: type }));
        }
      }
    };

    window.addEventListener('eip6963:announceProvider', handleProviderAnnouncement as EventListener);
    window.dispatchEvent(new CustomEvent('eip6963:requestProvider'));

    const initialProvider = resolveWindowProvider();
    if (initialProvider && !providerRef.current) {
      providerRef.current = guardProvider(initialProvider);
      const type = deriveWalletType(initialProvider);
      if (!walletStateRef.current?.walletType && type !== 'unknown') {
        setWalletState((prev) => ({ ...prev, walletType: type }));
      }
    }

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleProviderAnnouncement as EventListener);
    };
  }, [deriveWalletType, guardProvider, resolveWindowProvider]);

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
