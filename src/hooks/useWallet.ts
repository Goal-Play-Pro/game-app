import { useState, useEffect, useCallback } from 'react';
import { ChainType } from '../types';
import { useReferral } from './useReferral';
import ApiService from '../services/api';
import { API_CONFIG } from '../config/api.config';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  chainType: ChainType | null;
  isConnecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const { registerPendingReferral } = useReferral();
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    chainType: null,
    isConnecting: false,
    error: null,
  });

  // BSC Network Configuration
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
      case 1: return ChainType.ETHEREUM;
      case 137: return ChainType.POLYGON;
      case 56: return ChainType.BSC;
      case 42161: return ChainType.ARBITRUM;
      default: return ChainType.BSC; // Default to BSC
    }
  };
  
  const getNetworkName = (chainId: number): string => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 56: return 'BSC';
      case 42161: return 'Arbitrum';
      default: return 'Unknown';
    }
  };

  const persistWalletConnection = (address: string, chainIdNumber: number) => {
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('walletChainId', chainIdNumber.toString());
  };

  const clearWalletPersistence = () => {
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletChainId');
  };

  const authenticateWallet = useCallback(async (address: string, chainIdNumber: number) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error('Ethereum provider not available');
    }

    try {
      const challenge = await ApiService.createSiweChallenge(address, chainIdNumber);
      const message = challenge.message;

      let signature: string;
      try {
        signature = await ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        });
      } catch (signError: any) {
        if (signError?.code === 4001) {
          throw new Error('Signature request was rejected');
        }
        throw signError;
      }

      const authResponse = await ApiService.verifySiweSignature(message, signature);
      ApiService.markSessionActive(true);
      console.log('✅ Wallet authenticated via SIWE');

      await registerPendingReferral();
      return authResponse;
    } catch (error) {
      ApiService.markSessionActive(false);
      throw error;
    }
  }, [registerPendingReferral]);

  const checkConnection = useCallback(async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    try {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        clearWalletPersistence();
        if (ApiService.isAuthenticated()) {
          ApiService.logout().catch(() => {});
        }
        ApiService.markSessionActive(false);
        setWalletState({
          isConnected: false,
          address: null,
          chainId: null,
          chainType: null,
          isConnecting: false,
          error: null,
        });
        return;
      }

      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const chainIdNumber = parseInt(chainId, 16);
      const hasSession = await ApiService.ensureSession();

      if (hasSession) {
        persistWalletConnection(accounts[0], chainIdNumber);
        setWalletState({
          isConnected: true,
          address: accounts[0],
          chainId: chainIdNumber,
          chainType: getChainType(chainIdNumber),
          isConnecting: false,
          error: null,
        });
        return;
      }

      clearWalletPersistence();
      ApiService.markSessionActive(false);
      setWalletState({
        isConnected: false,
        address: null,
        chainId: null,
        chainType: null,
        isConnecting: false,
        error: 'Session expired. Click connect to authenticate again.',
      });
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  }, []);

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setWalletState(prev => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask to continue.',
      }));
      return;
    }

    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const chainIdNumber = parseInt(chainId, 16);

      try {
        await authenticateWallet(accounts[0], chainIdNumber);
        persistWalletConnection(accounts[0], chainIdNumber);

        setWalletState({
          isConnected: true,
          address: accounts[0],
          chainId: chainIdNumber,
          chainType: getChainType(chainIdNumber),
          isConnecting: false,
          error: null,
        });

        console.log(`✅ Wallet connected: ${accounts[0]} on ${getNetworkName(chainIdNumber)}`);
      } catch (authError: any) {
        console.error('❌ Wallet authentication failed:', authError);
        clearWalletPersistence();
        if (ApiService.isAuthenticated()) {
          ApiService.logout().catch(() => {});
        }
        ApiService.markSessionActive(false);
        setWalletState({
          isConnected: false,
          address: null,
          chainId: null,
          chainType: null,
          isConnecting: false,
          error: authError?.message || 'Wallet authentication failed',
        });
      }

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  };

  const disconnectWallet = useCallback(() => {
    if (ApiService.isAuthenticated()) {
      ApiService.logout().catch(() => {});
    }
    ApiService.markSessionActive(false);
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      chainType: null,
      isConnecting: false,
      error: null,
    });

    clearWalletPersistence();
    
    console.log('🔌 Wallet disconnected');
  }, []);

  const switchToNetwork = async (targetChainId: number) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, add BSC as default
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BSC_NETWORK],
        });
      }
      throw error;
    }
  };

  // Listen for account and network changes
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
        return;
      }

      clearWalletPersistence();
      ApiService.markSessionActive(false);
      setWalletState(prev => ({
        ...prev,
        isConnected: false,
        address: null,
        chainId: null,
        chainType: null,
        isConnecting: false,
        error: 'Account changed. Please reconnect your wallet.',
      }));
    };

    const handleChainChanged = (chainId: string) => {
      const chainIdNumber = parseInt(chainId, 16);
      setWalletState(prev => ({
        ...prev,
        chainId: chainIdNumber,
        chainType: getChainType(chainIdNumber),
      }));
    };

    ethereum.on?.('accountsChanged', handleAccountsChanged);
    ethereum.on?.('chainChanged', handleChainChanged);

    return () => {
      if (ethereum) {
        ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
        ethereum.removeListener?.('chainChanged', handleChainChanged);
      }
    };
  }, [checkConnection, disconnectWallet]);

  return {
    ...walletState,
    address: walletState.address,
    chainId: walletState.chainId,
    chainType: walletState.chainType,
    isConnected: walletState.isConnected,
    isConnecting: walletState.isConnecting,
    error: walletState.error,
    connectWallet,
    disconnectWallet,
    switchToNetwork,
    checkConnection,
  };
};
