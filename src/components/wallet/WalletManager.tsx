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
  AlertCircle,
  Shield,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { ChainType } from '../../types';
import { useAuthStatus } from '../../hooks/useAuthStatus';
import { logWalletRequirement } from '../../utils/wallet.utils';
import { getStoredWallet } from '../../utils/walletStorage';
import { useWallet } from '../../hooks/useWallet';

const WalletManager = () => {
  const [isLinking, setIsLinking] = useState(false);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStatus();
  const storedWallet = getStoredWallet();
  const walletConnected = storedWallet.isConnected;
  const walletAddress = storedWallet.address;
  const storedWalletType = storedWallet.walletType;
  const {
    connectWallet,
    walletType,
    detectWalletType,
    isConnecting,
    isFrameBlocked,
  } = useWallet();

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

  const normalizeWalletType = (type: string | null | undefined) => {
    if (type === 'metamask' || type === 'safepal') {
      return type;
    }
    return null;
  };

  const activeWalletType = normalizeWalletType(walletType) ?? normalizeWalletType(storedWalletType);

  const getWalletName = (type: string | null) => {
    if (type === 'safepal') {
      return 'SafePal';
    }
    if (type === 'metamask') {
      return 'MetaMask';
    }
    return 'Wallet';
  };

  const renderWalletBadge = (type: string | null) => {
    if (type === 'safepal') {
      return (
        <div className="flex items-center space-x-1 bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs">
          <Shield className="w-3 h-3" />
          <span>SafePal</span>
        </div>
      );
    }
    if (type === 'metamask') {
      return (
        <div className="flex items-center space-x-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">
          <Wallet className="w-3 h-3" />
          <span>MetaMask</span>
        </div>
      );
    }
    return null;
  };

  const getAvailableWallets = () => {
    if (typeof window === 'undefined') {
      return [] as Array<{ type: string; name: string }>;
    }
    const win = window as any;
    const wallets: Array<{ type: string; name: string }> = [];
    if (win.ethereum?.isMetaMask) {
      wallets.push({ type: 'metamask', name: 'MetaMask' });
    }
    if (win.safePal?.isSafePal) {
      wallets.push({ type: 'safepal', name: 'SafePal' });
    }
    if (wallets.length === 0 && (win.ethereum || win.safePal)) {
      wallets.push({ type: 'metamask', name: 'MetaMask' });
    }
    return wallets;
  };

  const availableWallets = getAvailableWallets();
  const detectedWallet = detectWalletType ? detectWalletType() : 'unknown';
  const normalizedDetectedWallet = detectedWallet !== 'unknown' ? detectedWallet : null;
  const linkButtonLabel = isConnecting
    ? 'Connecting...'
    : normalizedDetectedWallet
    ? `Connect ${getWalletName(normalizedDetectedWallet)}`
    : 'Connect Wallet';

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
                    {walletAddress &&
                      wallet.address.toLowerCase() === walletAddress.toLowerCase() &&
                      renderWalletBadge(activeWalletType)}
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
          <p className="text-gray-400 mb-6">
            Connect your first wallet (MetaMask, SafePal, or compatible) to start playing
          </p>
          <button
            onClick={() => {
              if (!isFrameBlocked) {
                connectWallet();
              }
            }}
            className="btn-primary"
            disabled={isConnecting || isFrameBlocked}
          >
            {linkButtonLabel}
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
            Connect additional wallets (MetaMask, SafePal) to your account for multi-chain access
          </p>

          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Available Wallets:</div>
            <div className="flex flex-wrap gap-2">
              {availableWallets.length > 0 ? (
                availableWallets.map((wallet) => (
                  <div
                    key={wallet.type}
                    className={`flex items-center space-x-1 text-xs ${
                      wallet.type === 'safepal'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-blue-500/20 text-blue-300'
                    } px-2 py-1 rounded-full`}
                  >
                    {wallet.type === 'safepal' ? (
                      <Shield className="w-3 h-3" />
                    ) : (
                      <Wallet className="w-3 h-3" />
                    )}
                    <span>{wallet.name}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">No compatible wallets detected</div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={async () => {
                if (isFrameBlocked) {
                  return;
                }
                setIsLinking(false);
                await connectWallet();
              }}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isConnecting || isFrameBlocked}
            >
              {linkButtonLabel}
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
