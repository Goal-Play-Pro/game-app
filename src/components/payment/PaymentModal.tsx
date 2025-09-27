import { useState, useEffect, useCallback } from 'react';
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
import { PAYMENT_CONFIG } from '../../config/payment.config';
import { ChainType } from '../../types';

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
  const [step, setStep] = useState<
    | 'connect'
    | 'auth'
    | 'network'
    | 'balance'
    | 'confirm'
    | 'processing'
    | 'confirming'
    | 'success'
    | 'error'
  >('connect');
  const [usdtBalance, setUsdtBalance] = useState<string>('0.00');
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const gatewayContract = PAYMENT_CONFIG.PAYMENT_GATEWAY_CONTRACT;

  const {
    address,
    isConnected,
    needsAuth,
    isConnecting,
    isAuthenticating,
    connectWallet,
    signInWallet,
    chainId,
    chainType,
    switchToNetwork,
    walletType,
    detectWalletType,
  } = useWallet();
  const {
    initiatePayment,
    checkUSDTBalance,
    estimateGasCosts,
    isProcessing,
    error,
    transactionHash,
    approvalTransactionHash,
    resetPaymentState,
    status,
    confirmations,
    requiredConfirmations,
    fetchPaymentStatus,
  } = usePayment();

  const TARGET_CHAIN_ID = 56;

  const loadBalanceAndGas = useCallback(async () => {
    if (!address || needsAuth) return;

    try {
      const balance = await checkUSDTBalance(address);
      setUsdtBalance(balance.formatted);

      const gas = await estimateGasCosts(order.receivingWallet, order.totalPriceUSDT, address);
      setGasEstimate(gas);

      if (parseFloat(balance.formatted) >= parseFloat(order.totalPriceUSDT)) {
        setStep('confirm');
      } else {
        setStep('balance');
      }
    } catch (error) {
      console.error('Error loading balance and gas:', error);
      setStep('error');
    }
  }, [
    address,
    needsAuth,
    checkUSDTBalance,
    estimateGasCosts,
    order.receivingWallet,
    order.totalPriceUSDT,
  ]);

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

  // Check wallet connection, authentication, and network
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!isConnected || !address) {
      setStep('connect');
      return;
    }

    if (needsAuth) {
      setStep('auth');
      return;
    }

    if (chainId === null || chainId === undefined || chainId !== TARGET_CHAIN_ID) {
      setStep('network');
      return;
    }

    if (!['balance', 'confirm', 'processing', 'confirming', 'success'].includes(step)) {
      setStep('balance');
      loadBalanceAndGas();
    }
  }, [isOpen, isConnected, needsAuth, address, chainId, loadBalanceAndGas, step]);

  useEffect(() => {
    if (chainId === TARGET_CHAIN_ID) {
      setNetworkError(null);
      setIsSwitchingNetwork(false);
    }
  }, [chainId]);

  // Monitor payment state
  useEffect(() => {
    if (error) {
      setStep('error');
      return;
    }

    if (status === 'confirming') {
      setStep('confirming');
      return;
    }

    if (status === 'completed') {
      setStep('success');
      return;
    }

    if (isProcessing) {
      setStep('processing');
    } else if (step === 'processing') {
      setStep('confirm');
    }
  }, [isProcessing, status, error, step]);

  useEffect(() => {
    if (!isOpen || status !== 'confirming') return;

    let isMounted = true;

    const pollStatus = async () => {
      try {
        await fetchPaymentStatus(order.id);
      } catch (err) {
        if (isMounted) {
          console.error('Error polling payment status:', err);
        }
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, status, order.id, fetchPaymentStatus]);

  const handlePayment = async () => {
    if (!address || needsAuth) return;
    if (chainId !== TARGET_CHAIN_ID) {
      setStep('network');
      return;
    }
    
    await initiatePayment(order.id, order.receivingWallet, order.totalPriceUSDT);
  };

  const handleSwitchNetwork = async () => {
    if (!switchToNetwork) {
      return;
    }

    setNetworkError(null);
    setIsSwitchingNetwork(true);
    try {
      await switchToNetwork(TARGET_CHAIN_ID);
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      const message = error?.message || 'Failed to switch network. Please approve the request in your wallet.';
      setNetworkError(message);
    } finally {
      setIsSwitchingNetwork(false);
    }
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

  const handleShare = () => {
    // Función robusta de compartir desde modal de pago
    const shareData = {
      title: 'Goal Play Payment',
      text: 'Check out this Goal Play transaction',
      url: window.location.href
    };

    // Verificar disponibilidad del Web Share API
    const canUseWebShare = () => {
      try {
        return (
          navigator.share &&
          typeof navigator.share === 'function' &&
          navigator.canShare &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare(shareData) &&
          window.isSecureContext &&
          (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
        );
      } catch (error) {
        return false;
      }
    };

    if (canUseWebShare()) {
      navigator.share(shareData)
        .then(() => {
          console.log('✅ Payment info shared successfully');
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.log('❌ Share failed, using clipboard fallback');
            navigator.clipboard.writeText(window.location.href);
          }
        });
    } else {
      // Fallback a clipboard
      try {
        navigator.clipboard.writeText(window.location.href);
        console.log('📋 Payment link copied to clipboard');
      } catch (error) {
        console.log('❌ Clipboard not available');
      }
    }
  };

  const handleClose = () => {
    resetPaymentState();
    setStep('connect');
    setNetworkError(null);
    setIsSwitchingNetwork(false);
    onClose();
  };

  if (!isOpen) return null;

  const resolvedWalletType = walletType ?? (() => {
    const detected = detectWalletType?.();
    return detected && detected !== 'unknown' ? detected : null;
  })();

  const getWalletDisplayName = (type: string | null | undefined) => {
    if (type === 'safepal') {
      return 'SafePal';
    }
    if (type === 'metamask') {
      return 'MetaMask';
    }
    return 'Wallet';
  };

  const walletName = getWalletDisplayName(resolvedWalletType);
  const walletActionLabel = resolvedWalletType ? walletName : 'your wallet';
  const connectDescription = resolvedWalletType
    ? `Connect ${walletName} to proceed with payment`
    : 'Connect MetaMask, SafePal, or any compatible wallet to proceed with payment';
  const connectButtonLabel = resolvedWalletType ? `Connect ${walletName}` : 'Connect Wallet';

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
                {resolvedWalletType && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Wallet:</span>
                    <span className="text-blue-400">{walletName}</span>
                  </div>
                )}
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
                  <p className="text-gray-400 mb-6">{connectDescription}</p>
                  <button
                    onClick={connectWallet}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : connectButtonLabel}
                  </button>
                </motion.div>
              )}

              {step === 'auth' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Sign In Required</h4>
                  <p className="text-gray-400 mb-6">Approve the signature request to authenticate this session.</p>
                  <button
                    onClick={signInWallet}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? 'Waiting for Signature...' : 'Sign In'}
                  </button>
                </motion.div>
              )}

              {step === 'network' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">BNB Smart Chain Required</h4>
                  <p className="text-gray-400 mb-6">
                    You are connected to {chainType === ChainType.BSC ? 'BNB Smart Chain' : 'a different network'}. Switch to BNB Smart Chain before continuing.
                  </p>
                  <button
                    onClick={handleSwitchNetwork}
                    disabled={isSwitchingNetwork}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSwitchingNetwork ? 'Switching...' : 'Switch to BNB Smart Chain'}
                  </button>
                  {networkError && <p className="mt-4 text-sm text-red-400">{networkError}</p>}
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
                    {resolvedWalletType && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Wallet:</span>
                        <span className="text-blue-400 font-semibold">{walletName}</span>
                      </div>
                    )}
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
                    <p className="mt-3 text-xs text-gray-500 text-left">
                      {walletActionLabel.charAt(0).toUpperCase() + walletActionLabel.slice(1)} will request one or two confirmations: a token approval (if needed) followed by the payment transaction. Review each prompt carefully before accepting.
                    </p>
                  </div>

                  {gatewayContract && (
                    <div className="glass rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-2">Payment Gateway Contract</div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-mono text-sm">
                          {gatewayContract.slice(0, 10)}...{gatewayContract.slice(-8)}
                        </span>
                        <button
                          onClick={() => copyAddress(gatewayContract)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={`https://bscscan.com/address/${gatewayContract}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <p className="mt-3 text-xs text-gray-500 text-left">
                        Funds route through this gateway contract. Review it on BscScan before approving to ensure it matches the address announced by Goal Play.
                      </p>
                    </div>
                  )}

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
                  <h4 className="text-lg font-semibold text-white mb-2">Confirming in {resolvedWalletType ? walletName : 'Your Wallet'}</h4>
                  <p className="text-gray-400 mb-6">
                    Approve the prompts in {walletActionLabel} to authorize the payment gateway and send your USDT.
                  </p>
                  
                  <div className="glass rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        <span className="text-gray-400">Waiting for token approval and payment confirmations...</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="text-gray-400">Validating transaction with the payment gateway…</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="text-gray-400">Preparing to notify Goal Play backend…</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'confirming' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Waiting for Confirmations</h4>
                  <p className="text-gray-400 mb-6">
                    Transaction sent. Your order completes automatically once the blockchain reaches {requiredConfirmations} confirmations.
                  </p>

                  <div className="glass rounded-lg p-5 space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Confirmations</span>
                        <span>
                          {Math.min(confirmations, requiredConfirmations)} / {requiredConfirmations}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-football-green transition-all duration-300"
                          style={{ width: `${Math.min(confirmations / requiredConfirmations, 1) * 100}%` }}
                        />
                      </div>
                    </div>

                    {approvalTransactionHash && (
                      <div className="text-left text-sm">
                        <div className="text-gray-400 mb-1">Approval Transaction</div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-xs">
                            {approvalTransactionHash.slice(0, 10)}...{approvalTransactionHash.slice(-8)}
                          </span>
                          <button
                            onClick={() => copyAddress(approvalTransactionHash)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openInExplorer(approvalTransactionHash)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {transactionHash && (
                      <div className="text-left text-sm">
                        <div className="text-gray-400 mb-1">Transaction Hash</div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-xs">
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
                    )}

                    <div className="space-y-2">
                      <button
                        onClick={() => fetchPaymentStatus(order.id)}
                        className="btn-outline w-full"
                      >
                        Refresh Status
                      </button>
                      <div className="text-xs text-gray-500">
                        This may take a few minutes depending on network congestion.
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
                  
                  <div className="glass rounded-lg p-4 mb-6 space-y-3">
                    {approvalTransactionHash && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Approval Transaction</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-mono text-sm">
                            {approvalTransactionHash.slice(0, 10)}...{approvalTransactionHash.slice(-8)}
                          </span>
                          <button
                            onClick={() => copyAddress(approvalTransactionHash)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openInExplorer(approvalTransactionHash)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-sm text-gray-400 mb-1">Payment Transaction</div>
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
