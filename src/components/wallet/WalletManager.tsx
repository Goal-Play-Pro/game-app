import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Star, 
  ExternalLink, 
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { ChainType } from '../../types';
import { useAuthStatus } from '../../hooks/useAuthStatus';
import { logWalletRequirement } from '../../utils/wallet.utils';

const getWalletPersistence = () => {
  if (typeof window === 'undefined') {
    return {
      connected: false,
      address: null as string | null,
    };
  }

  try {
    return {
      connected: localStorage.getItem('walletConnected') === 'true',
      address: localStorage.getItem('walletAddress'),
    };
  } catch {
    return {
      connected: false,
      address: null,
    };
  }
};

const WalletManager = () => {
  const [isLinking, setIsLinking] = useState(false);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStatus();
  const { connected: walletConnected, address: walletAddress } = getWalletPersistence();

  // Fetch user wallets
  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['user-wallets'],
    queryFn: ApiService.getAllUserWallets,
    enabled: isAuthenticated && walletConnected,
    retry: isAuthenticated && walletConnected ? 1 : false,
  });

  // Set primary wallet mutation
  const setPrimaryMutation = useMutation({
    mutationFn: (address: string) => ApiService.setPrimaryWallet(address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallets'] });
    },
  });

  // Unlink wallet mutation
  const unlinkMutation = useMutation({
    mutationFn: (address: string) => ApiService.unlinkWallet(address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallets'] });
    },
  });

  const getChainColor = (chainType: string) => {
    switch (chainType.toLowerCase()) {
      case 'ethereum': return 'text-blue-400';
      case 'bsc': return 'text-yellow-400';
      case 'polygon': return 'text-purple-400';
      case 'arbitrum': return 'text-cyan-400';
      case 'solana': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getChainIcon = (chainType: string) => {
    switch (chainType.toLowerCase()) {
      case 'ethereum': return '🔷';
      case 'bsc': return '🟡';
      case 'polygon': return '🟣';
      case 'arbitrum': return '🔵';
      case 'solana': return '🟢';
      default: return '⚪';
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const openInExplorer = (address: string, chainType: string) => {
    const explorers = {
      ethereum: 'https://etherscan.io',
      bsc: 'https://bscscan.com',
      polygon: 'https://polygonscan.com',
      arbitrum: 'https://arbiscan.io',
      solana: 'https://solscan.io',
    };
    
    const explorer = explorers[chainType.toLowerCase() as keyof typeof explorers];
    if (explorer) {
      window.open(`${explorer}/address/${address}`, '_blank');
    }
  };

  if (!isAuthenticated || !walletConnected || !walletAddress) {
    logWalletRequirement('Wallet manager');
    return (
      <div className="glass-dark rounded-xl p-6">
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Wallet className="w-12 h-12 text-gray-500" />
          <p className="text-gray-400 text-center">
            Connect and authenticate your wallet to manage linked addresses.
          </p>
        </div>
      </div>
    );
  }

  if (walletsLoading) {
    return (
      <div className="glass-dark rounded-xl p-6">
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner text="Loading wallets..." />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-dark rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Connected Wallets</h3>
        <button
          onClick={() => setIsLinking(!isLinking)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Link Wallet</span>
        </button>
      </div>

      {/* Wallets List */}
      {wallets && wallets.length > 0 ? (
        <div className="space-y-4">
          {wallets.map((wallet) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 glass rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center">
                  <span className="text-2xl">{getChainIcon(wallet.chainType)}</span>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </span>
                    {wallet.isPrimary && (
                      <div className="flex items-center space-x-1 bg-football-green/20 text-football-green px-2 py-1 rounded-full text-xs">
                        <Star className="w-3 h-3" />
                        <span>Primary</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className={getChainColor(wallet.chainType)}>
                      {wallet.chainType.toUpperCase()}
                    </span>
                    <span>
                      Linked: {new Date(wallet.linkedAt).toLocaleDateString()}
                    </span>
                    {wallet.lastUsedAt && (
                      <span>
                        Last used: {new Date(wallet.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyAddress(wallet.address)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => openInExplorer(wallet.address, wallet.chainType)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="View in explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                
                {!wallet.isPrimary && (
                  <button
                    onClick={() => setPrimaryMutation.mutate(wallet.address)}
                    disabled={setPrimaryMutation.isPending}
                    className="p-2 text-gray-400 hover:text-football-green transition-colors disabled:opacity-50"
                    title="Set as primary"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                
                {wallets.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to unlink this wallet?')) {
                        unlinkMutation.mutate(wallet.address);
                      }
                    }}
                    disabled={unlinkMutation.isPending}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Unlink wallet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">No Wallets Connected</h4>
          <p className="text-gray-400 mb-6">Connect your first wallet to start playing</p>
          <button
            onClick={() => setIsLinking(true)}
            className="btn-primary"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Link New Wallet Interface */}
      {isLinking && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 border border-football-green/30 rounded-lg"
        >
          <h4 className="text-lg font-semibold text-white mb-4">Link New Wallet</h4>
          <p className="text-gray-400 text-sm mb-4">
            Connect additional wallets to your account for multi-chain access
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={() => {
                // Trigger wallet connection flow
                setIsLinking(false);
              }}
              className="btn-primary flex-1"
            >
              Connect MetaMask
            </button>
            
            <button
              onClick={() => setIsLinking(false)}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WalletManager;
