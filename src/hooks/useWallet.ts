import { useState, useEffect, useCallback, useRef } from 'react';
import { ChainType } from '../types';
import { useReferral } from './useReferral';
import ApiService from '../services/api';
import { persistWallet, clearPersistedWallet, getStoredWallet } from '../utils/walletStorage';
import { formatCaip10 } from '../utils/caip10';

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
    };
  });

  walletStateRef.current = walletState;

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
    const rawProvider = providerRef.current ?? (typeof window !== 'undefined' ? (window as any).ethereum : null);
    if (!rawProvider) {
      return null;
    }

    const guarded = guardProvider(rawProvider);
    providerRef.current = guarded;
    return guarded;
  }, [guardProvider]);

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
    if (!provider) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    isConnectingRef.current = true;
    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
      const chainIdHex: string = await provider.request({ method: 'eth_chainId' });
      const chainIdNumber = Number.parseInt(chainIdHex, 16);

      persistWallet(chainIdNumber, accounts[0]);
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
      }));
      console.log(`✅ Wallet connected: ${formatCaip10(chainIdNumber, accounts[0])}`);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error?.message ?? 'Failed to connect wallet',
      }));
    } finally {
      isConnectingRef.current = false;
    }
  }, [getProvider, walletState.isConnecting, walletState.isFrameBlocked]);

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
      persistWallet(walletState.chainId, walletState.address);
      setWalletState((prev) => ({
        ...prev,
        isAuthenticating: false,
        needsAuth: false,
        error: null,
      }));
    } catch (error: any) {
      console.error('❌ Wallet authentication failed:', error);
      setWalletState((prev) => ({
        ...prev,
        isAuthenticating: false,
        needsAuth: true,
        error: error?.message ?? 'Wallet authentication failed',
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
      throw new Error('Ethereum provider not available');
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

      persistWallet(chainIdNumber, accounts[0]);
      setWalletState((prev) => ({
        ...prev,
        address: accounts[0],
        caip10Address: formatCaip10(chainIdNumber, accounts[0]),
        chainId: chainIdNumber,
        chainType: getChainType(chainIdNumber),
        needsAuth: true,
        error: 'Account changed. Please sign in again.',
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
      }));
    };

    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [disconnectWallet, getProvider, walletState.chainId, walletState.isConnected]);

  useEffect(() => {
    const handleProviderAnnouncement = (event: any) => {
      if (event?.detail?.provider && !providerRef.current) {
        providerRef.current = guardProvider(event.detail.provider);
      }
    };

    window.addEventListener('eip6963:announceProvider', handleProviderAnnouncement as EventListener);
    window.dispatchEvent(new CustomEvent('eip6963:requestProvider'));

    if ((window as any).ethereum && !providerRef.current) {
      providerRef.current = guardProvider((window as any).ethereum);
    }

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleProviderAnnouncement as EventListener);
    };
  }, [guardProvider]);

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
  };
};
