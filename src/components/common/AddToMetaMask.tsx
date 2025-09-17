import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface AddToMetaMaskProps {
  className?: string;
  showTitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const AddToMetaMask = ({ className = '', showTitle = true, size = 'md' }: AddToMetaMaskProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [addStatus, setAddStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Token information from BSC contract
  const tokenInfo = {
    address: '0x1e2ceb5d2b4ed8077456277ba5309f950aef2ce4',
    symbol: 'GOAL',
    decimals: 7,
    image: 'https://photos.pinksale.finance/file/pinksale-logo-upload/1757174953372-9634c48090be099c9daecc972d29f028.png'
  };

  const addTokenToMetaMask = async () => {
    if (!window.ethereum) {
      setAddStatus('error');
      return;
    }

    setIsAdding(true);
    setAddStatus('idle');

    try {
      // Check if we're on BSC network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== '0x38') { // BSC Mainnet chain ID
        // Switch to BSC network first
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }],
          });
        } catch (switchError: any) {
          // If BSC is not added to MetaMask, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x38',
                chainName: 'BNB Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-dataseed1.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Add token to MetaMask
      const result = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: [{
          type: 'ERC20',
          options: {
            address: tokenInfo.address,
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.decimals,
            image: tokenInfo.image
          },
        }],
      });

      if (result) {
        setAddStatus('success');
        console.log('✅ GOAL token added to MetaMask successfully!');
      } else {
        setAddStatus('error');
        console.log('❌ User rejected adding GOAL token');
      }
    } catch (error) {
      console.error('❌ Error adding token to MetaMask:', error);
      setAddStatus('error');
      
      // Try without image if image causes issues
      if (error.message?.includes('image') || error.code === -32602) {
        try {
          console.log('🔄 Retrying without image...');
          const result = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: [{
              type: 'ERC20',
              options: {
                address: tokenInfo.address,
                symbol: tokenInfo.symbol,
                decimals: tokenInfo.decimals,
              },
            }],
          });
          
          if (result) {
            setAddStatus('success');
            console.log('✅ GOAL token added to MetaMask successfully (without image)!');
          }
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
          setAddStatus('error');
        }
      }
    } finally {
      setIsAdding(false);
    }
  };

  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-base px-4 py-3',
    lg: 'text-lg px-6 py-4'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={className}>
      {showTitle && (
        <div className="text-center mb-6">
          <h3 className="text-xl md:text-2xl font-display font-bold gradient-text mb-2">
            Añadir Token GOAL a MetaMask
          </h3>
          <p className="text-gray-400">
            Añade el token GOAL a tu wallet MetaMask con un solo clic
          </p>
        </div>
      )}

      <div className="glass-dark rounded-xl p-6">
        {/* Token Info */}
        <div className="flex items-center space-x-4 mb-6">
          <img
            src={tokenInfo.image}
            alt="GOAL Token"
            className="w-12 h-12 rounded-full border-2 border-white/20 bg-white/10"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.fallback-logo') as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="fallback-logo hidden w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-full border-2 border-white/20 items-center justify-center">
            <span className="text-white font-bold text-xl">G</span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white text-lg">Token GOAL</div>
            <div className="text-sm text-gray-400 font-mono">
              {tokenInfo.address.slice(0, 6)}...{tokenInfo.address.slice(-4)}
            </div>
            <div className="text-sm text-football-green">BNB Smart Chain</div>
          </div>
        </div>

        {/* Contract Details */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Símbolo:</span>
            <span className="text-white font-semibold">{tokenInfo.symbol}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Decimales:</span>
            <span className="text-white font-semibold">{tokenInfo.decimals}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Red:</span>
            <span className="text-white font-semibold">BNB Smart Chain</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Contrato:</span>
            <div className="flex items-center space-x-2">
              <span className="text-white font-mono text-sm">
                {tokenInfo.address.slice(0, 10)}...{tokenInfo.address.slice(-8)}
              </span>
              <a
                href={`https://bscscan.com/token/${tokenInfo.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-football-green hover:text-football-blue transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Add to MetaMask Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={addTokenToMetaMask}
          disabled={isAdding}
          className={`w-full btn-primary flex items-center justify-center space-x-2 ${sizeClasses[size]} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isAdding ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              <span>Adding to MetaMask...</span>
            </>
          ) : addStatus === 'success' ? (
            <>
              <CheckCircle className={iconSizes[size]} />
              <span>Added Successfully!</span>
            </>
          ) : addStatus === 'error' ? (
            <>
              <AlertCircle className={iconSizes[size]} />
              <span>Try Again</span>
            </>
          ) : (
            <>
              <Plus className={iconSizes[size]} />
              <span>Añadir GOAL a MetaMask</span>
            </>
          )}
        </motion.button>

        {/* Status Messages */}
        {addStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-center"
          >
            <p className="text-green-400 text-sm">
              ✅ ¡El token GOAL se ha añadido a tu wallet MetaMask!
            </p>
          </motion.div>
        )}

        {addStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-center"
          >
            <p className="text-red-400 text-sm">
              ❌ Error al añadir el token. {!window.ethereum ? 'Instala MetaMask primero.' : 'Inténtalo de nuevo.'}
            </p>
            {!window.ethereum && (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-red-300 hover:text-red-200 transition-colors text-sm mt-2"
              >
                <span>Descargar MetaMask</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </motion.div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            Esto añadirá el token GOAL (7 decimales) a tu wallet MetaMask en BNB Smart Chain
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddToMetaMask;