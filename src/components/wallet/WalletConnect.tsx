import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ChevronDown, ExternalLink, Copy, LogOut, AlertCircle } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';

interface WalletConnectProps {
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
  className?: string;
}

const WalletConnect = ({ size = 'md', showDropdown = true, className = '' }: WalletConnectProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const {
    isConnected,
    address,
    caip10Address,
    chainId,
    chainType,
    isConnecting,
    isAuthenticating,
    needsAuth,
    error,
    isFrameBlocked,
    connectWallet,
    signInWallet,
    disconnectWallet,
    switchToNetwork,
  } = useWallet();

  const sizeClasses = {
    sm: 'text-xs px-3 py-2',
    md: 'text-sm px-4 py-3',
    lg: 'text-base px-6 py-4'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 56: return 'BSC';
      case 137: return 'Polygon';
      case 42161: return 'Arbitrum';
      default: return 'Unknown';
    }
  };

  const getNetworkColor = (chainId: number) => {
    switch (chainId) {
      case 1: return 'text-blue-400';
      case 56: return 'text-yellow-400';
      case 137: return 'text-purple-400';
      case 42161: return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const copyAddress = () => {
    if (caip10Address) {
      navigator.clipboard.writeText(caip10Address);
      // You could add a toast notification here
    }
  };

  const openInExplorer = () => {
    if (address && chainId) {
      const explorers = {
        1: 'https://etherscan.io',
        56: 'https://bscscan.com',
        137: 'https://polygonscan.com',
        42161: 'https://arbiscan.io',
      };
      const explorer = explorers[chainId as keyof typeof explorers];
      if (explorer) {
        window.open(`${explorer}/address/${address}`, '_blank');
      }
    }
  };

  const handleSwitchToBSC = async () => {
    try {
      await switchToNetwork(56);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error switching to BSC:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className={className}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={connectWallet}
          disabled={isConnecting || isFrameBlocked}
          className={`btn-primary flex items-center space-x-2 ${sizeClasses[size]} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className={iconSizes[size]} />
              <span>Connect Wallet</span>
            </>
          )}
        </motion.button>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-center"
          >
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <span>Conectar Wallet</span>
          </motion.div>
        )}
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className={`space-y-2 ${className}`}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={signInWallet}
          disabled={isAuthenticating || isFrameBlocked}
          className={`btn-primary flex items-center justify-center space-x-2 ${sizeClasses[size]} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isAuthenticating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <Wallet className={iconSizes[size]} />
              <span>Sign In</span>
            </>
          )}
        </motion.button>

        <button
          onClick={disconnectWallet}
          className={`btn-outline ${sizeClasses[size]} flex items-center justify-center space-x-2`}
        >
          <LogOut className={iconSizes[size]} />
          <span>Disconnect</span>
        </button>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-center"
          >
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => showDropdown && setIsDropdownOpen(!isDropdownOpen)}
        className={`btn-secondary flex items-center space-x-2 ${sizeClasses[size]} ${
          showDropdown ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        <div className="w-2 h-2 bg-green-400 rounded-full" />
        <span className="font-mono">{formatAddress(address!)}</span>
        {showDropdown && <ChevronDown className={`${iconSizes[size]} transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />}
      </motion.button>

      {/* Dropdown Menu */}
      {showDropdown && isDropdownOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute top-full right-0 mt-2 w-80 glass-dark rounded-xl border border-white/20 shadow-xl z-50"
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <div className="p-4">
            {/* Wallet Info */}
            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-white/10">
              <div className="w-10 h-10 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">Connected Wallet</div>
                <div className="text-xs text-gray-400 font-mono break-all leading-tight">
                  {caip10Address}
                </div>
              </div>
            </div>

            {/* Network Info */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Network</span>
                <span className={`text-sm font-semibold ${getNetworkColor(chainId!)}`}>
                  {getNetworkName(chainId!)}
                </span>
              </div>
              
              {chainId !== 56 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSwitchToBSC}
                  className="w-full btn-primary text-sm py-2 flex items-center justify-center space-x-2"
                >
                  <span>Switch to BSC</span>
                </motion.button>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={copyAddress}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Address</span>
              </button>
              
              <button
                onClick={openInExplorer}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View on Explorer</span>
              </button>
              
              <button
                onClick={() => {
                  disconnectWallet();
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WalletConnect;
