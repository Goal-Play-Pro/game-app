import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Wallet, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Copy,
  Zap
} from 'lucide-react';
import { usePayment } from '../../hooks/usePayment';
import { useWallet } from '../../hooks/useWallet';
import LoadingSpinner from '../common/LoadingSpinner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    totalPriceUSDT: string;
    receivingWallet: string;
    expiresAt: string;
  };
}

const PaymentModal = ({ isOpen, onClose, order }: PaymentModalProps) => {
  const [step, setStep] = useState<'connect' | 'balance' | 'confirm' | 'processing' | 'success' | 'error'>('connect');
  const [usdtBalance, setUsdtBalance] = useState<string>('0.00');
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const { address, isConnected, connectWallet } = useWallet();
  const { 
    initiatePayment, 
    checkUSDTBalance, 
    estimateGasCosts,
    isProcessing, 
    error, 
    transactionHash,
    resetPaymentState 
  } = usePayment();

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const updateTimer = () => {
      const expirationTime = new Date(order.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, expirationTime - now);
      setTimeLeft(Math.floor(remaining / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, order.expiresAt]);

  // Check wallet connection and balance
  useEffect(() => {
    if (isOpen && isConnected && address) {
      setStep('balance');
      loadBalanceAndGas();
    } else if (isOpen && !isConnected) {
      setStep('connect');
    }
  }, [isOpen, isConnected, address]);

  // Monitor payment state
  useEffect(() => {
    if (isProcessing) {
      setStep('processing');
    } else if (transactionHash) {
      setStep('success');
    } else if (error) {
      setStep('error');
    }
  }, [isProcessing, transactionHash, error]);

  const loadBalanceAndGas = async () => {
    if (!address) return;

    try {
      // Cargar balance USDT
      const balance = await checkUSDTBalance(address);
      setUsdtBalance(balance.formatted);

      // Estimar gas
      const gas = await estimateGasCosts(order.receivingWallet, order.totalPriceUSDT, address);
      setGasEstimate(gas);

      // Verificar si tiene suficiente balance
      if (parseFloat(balance.formatted) >= parseFloat(order.totalPriceUSDT)) {
        setStep('confirm');
      } else {
        setStep('balance');
      }
    } catch (error) {
      console.error('Error loading balance and gas:', error);
      setStep('error');
    }
  };

  const handlePayment = async () => {
    if (!address) return;
    
    await initiatePayment(order.id, order.receivingWallet, order.totalPriceUSDT);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
  };

  const openInExplorer = (txHash: string) => {
    window.open(`https://bscscan.com/tx/${txHash}`, '_blank');
  };

  const handleClose = () => {
    resetPaymentState();
    setStep('connect');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-dark-400 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h3 className="text-xl font-semibold text-white">Complete Payment</h3>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Timer */}
            <div className="text-center mb-6">
              <div className="text-sm text-gray-400 mb-2">Order expires in</div>
              <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-football-green'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Order Summary */}
            <div className="glass rounded-lg p-4 mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Order Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order ID:</span>
                  <span className="text-white font-mono text-sm">#{order.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-semibold">{order.totalPriceUSDT} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-yellow-400">BNB Smart Chain</span>
                </div>
              </div>
            </div>

            {/* Payment Steps */}
            <div className="space-y-6">
              {step === 'connect' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h4>
                  <p className="text-gray-400 mb-6">Connect MetaMask to proceed with payment</p>
                  <button
                    onClick={connectWallet}
                    className="btn-primary w-full"
                  >
                    Connect MetaMask
                  </button>
                </motion.div>
              )}

              {step === 'balance' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Insufficient USDT Balance</h4>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Required:</span>
                      <span className="text-white font-semibold">{order.totalPriceUSDT} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Available:</span>
                      <span className="text-red-400 font-semibold">{usdtBalance} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Needed:</span>
                      <span className="text-yellow-400 font-semibold">
                        {(parseFloat(order.totalPriceUSDT) - parseFloat(usdtBalance)).toFixed(2)} USDT
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <a
                      href="https://pancakeswap.finance/swap?outputCurrency=0x55d398326f99059fF775485246999027B3197955"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buy USDT on PancakeSwap</span>
                    </a>
                    
                    <button
                      onClick={loadBalanceAndGas}
                      className="btn-outline w-full"
                    >
                      Refresh Balance
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'confirm' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Confirm Payment</h4>
                    <p className="text-gray-400">Review payment details before proceeding</p>
                  </div>

                  {/* Payment Details */}
                  <div className="glass rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Your Balance:</span>
                        <span className="text-green-400 font-semibold">{usdtBalance} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payment Amount:</span>
                        <span className="text-white font-semibold">{order.totalPriceUSDT} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Gas Fee:</span>
                        <span className="text-yellow-400 font-semibold">
                          ~${gasEstimate?.gasCostUSD || '0.30'} USD
                        </span>
                      </div>
                      <div className="border-t border-white/10 pt-3 flex justify-between">
                        <span className="text-gray-400">Remaining Balance:</span>
                        <span className="text-white font-semibold">
                          {(parseFloat(usdtBalance) - parseFloat(order.totalPriceUSDT)).toFixed(2)} USDT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Receiving Wallet */}
                  <div className="glass rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-2">Sending to:</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-mono text-sm">
                        {order.receivingWallet.slice(0, 10)}...{order.receivingWallet.slice(-8)}
                      </span>
                      <button
                        onClick={() => copyAddress(order.receivingWallet)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`https://bscscan.com/address/${order.receivingWallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Zap className="w-5 h-5" />
                    <span>Pay {order.totalPriceUSDT} USDT</span>
                  </button>
                </motion.div>
              )}

              {step === 'processing' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center mx-auto mb-4">
                    <LoadingSpinner size="sm" color="white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Processing Payment</h4>
                  <p className="text-gray-400 mb-6">
                    Please confirm the transaction in MetaMask and wait for blockchain confirmation
                  </p>
                  
                  <div className="glass rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        <span className="text-gray-400">Waiting for MetaMask confirmation...</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="text-gray-400">Waiting for blockchain confirmation...</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="text-gray-400">Processing gacha draw...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'success' && transactionHash && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Payment Successful!</h4>
                  <p className="text-gray-400 mb-6">
                    Your payment has been confirmed. Your players will be added to your inventory shortly.
                  </p>
                  
                  <div className="glass rounded-lg p-4 mb-6">
                    <div className="text-sm text-gray-400 mb-2">Transaction Hash:</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-mono text-sm">
                        {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                      </span>
                      <button
                        onClick={() => copyAddress(transactionHash)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openInExplorer(transactionHash)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleClose}
                      className="btn-primary w-full"
                    >
                      Continue Playing
                    </button>
                    
                    <a
                      href="/inventory"
                      className="btn-outline w-full block text-center"
                    >
                      View My Players
                    </a>
                  </div>
                </motion.div>
              )}

              {step === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Payment Failed</h4>
                  <p className="text-gray-400 mb-6">{error}</p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        resetPaymentState();
                        setStep('confirm');
                      }}
                      className="btn-primary w-full"
                    >
                      Try Again
                    </button>
                    
                    <button
                      onClick={handleClose}
                      className="btn-outline w-full"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;