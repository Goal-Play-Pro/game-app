import { useState, useEffect, useCallback } from 'react';
import { ChainType } from '../types';
import { useReferral } from './useReferral';

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

  const checkConnection = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (accounts.length > 0) {
        setWalletState({
          isConnected: true,
          address: accounts[0],
          chainId: parseInt(chainId, 16),
          chainType: getChainType(parseInt(chainId, 16)),
          isConnecting: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setWalletState(prev => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask to continue.',
      }));
      return;
    }

    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdNumber = parseInt(chainId, 16);

      // Switch to BSC if not already on it
      if (chainIdNumber !== 56) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_NETWORK.chainId }],
          });
        } catch (switchError: any) {
          // If BSC is not added to MetaMask, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [BSC_NETWORK],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Get updated chain info after potential switch
      const finalChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const finalChainIdNumber = parseInt(finalChainId, 16);

      setWalletState({
        isConnected: true,
        address: accounts[0],
        chainId: finalChainIdNumber,
        chainType: getChainType(finalChainIdNumber),
        isConnecting: false,
        error: null,
      });

      // Store connection in localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', accounts[0]);

      // Register pending referral if exists
      setTimeout(() => {
        registerPendingReferral();
      }, 1000);

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      chainType: null,
      isConnecting: false,
      error: null,
    });

    // Clear localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
  };

  const switchToNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, add BSC as default
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BSC_NETWORK],
        });
      }
      throw error;
    }
  };

  // Listen for account and network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setWalletState(prev => ({
          ...prev,
          address: accounts[0],
        }));
        localStorage.setItem('walletAddress', accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      const chainIdNumber = parseInt(chainId, 16);
      setWalletState(prev => ({
        ...prev,
        chainId: chainIdNumber,
        chainType: getChainType(chainIdNumber),
      }));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check if previously connected
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'true') {
      checkConnection();
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [checkConnection]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchToNetwork,
    checkConnection,
  };
};