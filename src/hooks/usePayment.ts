import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentService } from '../services/payment.service';
import ApiService from '../services/api';
import { getStoredWalletAddress } from '../utils/walletStorage';
import { normalizeWalletError, formatWalletErrorMessage } from '../utils/walletErrors';

type PaymentProgressStatus = 'idle' | 'processing' | 'confirming' | 'completed';

interface PaymentState {
  isProcessing: boolean;
  error: string | null;
  transactionHash: string | null;
  approvalTransactionHash: string | null;
  needsApproval: boolean;
  status: PaymentProgressStatus;
  confirmations: number;
  requiredConfirmations: number;
  orderId: string | null;
}

export const usePayment = () => {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isProcessing: false,
    error: null,
    transactionHash: null,
    approvalTransactionHash: null,
    needsApproval: false,
    status: 'idle',
    confirmations: 0,
    requiredConfirmations: 12,
    orderId: null,
  });

  const queryClient = useQueryClient();

  // Mutation para procesar pago real
  const processPaymentMutation = useMutation({
    mutationFn: async ({
      orderId,
      receivingWallet,
      amount,
    }: {
      orderId: string;
      receivingWallet: string;
      amount: string;
    }) => {
      console.log(`💳 Processing payment via gateway for order ${orderId}`);

      const execution = await PaymentService.processOrderPayment(orderId, receivingWallet, amount);

      if (!execution.success || !execution.paymentHash) {
        throw new Error(execution.error || 'Payment failed');
      }

      const notificationResult = await ApiService.notifyPaymentCompleted(
        orderId,
        execution.paymentHash
      );

      return {
        ...notificationResult,
        transactionHash: execution.paymentHash,
        approvalHash: execution.approvalHash,
        orderId,
      };
    },
    onMutate: ({ orderId }) => {
      setPaymentState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        transactionHash: null,
        approvalTransactionHash: null,
        needsApproval: false,
        status: 'processing',
        confirmations: 0,
        orderId,
      }));
    },
    onSuccess: (data) => {
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        error: null,
        transactionHash: data.transactionHash || prev.transactionHash,
        approvalTransactionHash: data.approvalHash || prev.approvalTransactionHash,
        needsApproval: Boolean(data.approvalHash),
        status: data.status === 'pending_confirmations'
          ? 'confirming'
          : data.status === 'fulfilled' || data.status === 'paid'
            ? 'completed'
            : prev.status,
        confirmations: data.confirmations ?? prev.confirmations,
        requiredConfirmations: data.requiredConfirmations ?? prev.requiredConfirmations,
        orderId: prev.orderId,
      }));
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['owned-players'] });
      queryClient.invalidateQueries({ queryKey: ['market-data'] });
      queryClient.invalidateQueries({ queryKey: ['global-statistics'] });
    },
    onError: (error: unknown) => {
      const normalizedError = normalizeWalletError(
        error,
        -1,
        'Payment failed. Please approve the request in your wallet.',
      );
      console.error('❌ Error en pago:', normalizedError);
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        error: formatWalletErrorMessage(
          normalizedError,
          'Payment failed. Please approve the request in your wallet.',
        ),
        transactionHash: null,
        approvalTransactionHash: null,
        needsApproval: false,
        status: 'idle',
      }));
    },
  });

  // Función para iniciar pago
  const initiatePayment = async (orderId: string, receivingWallet: string, amount: string) => {
    try {
      // Obtener wallet del usuario
      const userWallet = getStoredWalletAddress();
      if (!userWallet) {
        throw new Error('Please connect your wallet first');
      }

      // Verificar que MetaMask esté instalado
      if (!PaymentService.isMetaMaskInstalled()) {
        throw new Error('A compatible wallet is required for payments');
      }

      // Procesar pago
      const result = await processPaymentMutation.mutateAsync({
        orderId,
        receivingWallet,
        amount,
      });

      return result;
    } catch (error: unknown) {
      const normalizedError = normalizeWalletError(
        error,
        -1,
        'Unable to complete the payment request.',
      );
      console.error('Error initiating payment:', normalizedError);
      setPaymentState(prev => ({
        ...prev,
        error: formatWalletErrorMessage(
          normalizedError,
          'Unable to complete the payment request.',
        ),
      }));
      throw normalizedError;
    }
  };

  // Función para verificar balance USDT
  const checkUSDTBalance = async (userAddress: string) => {
    try {
      return await PaymentService.getUSDTBalance(userAddress);
    } catch (error: any) {
      console.error('Error checking USDT balance:', error);
      return {
        balance: '0',
        formatted: '0.00',
        error: error.message,
      };
    }
  };

  // Función para estimar costos de gas
  const estimateGasCosts = async (toAddress: string, amount: string, userAddress: string) => {
    try {
      return await PaymentService.estimateUSDTGas(toAddress, amount, userAddress);
    } catch (error: any) {
      console.error('Error estimating gas:', error);
      return {
        gasLimit: '65000',
        gasPrice: '5000000000',
        gasCostBNB: '0.001',
        gasCostUSD: '0.30',
        error: error.message,
      };
    }
  };

  // Función para verificar transacción
  const verifyTransaction = async (txHash: string) => {
    try {
      return await PaymentService.verifyTransaction(txHash);
    } catch (error: any) {
      console.error('Error verifying transaction:', error);
      return {
        success: false,
        confirmations: 0,
        error: error.message,
      };
    }
  };

  // Reset payment state
  const resetPaymentState = () => {
    setPaymentState({
      isProcessing: false,
      error: null,
      transactionHash: null,
      approvalTransactionHash: null,
      needsApproval: false,
      status: 'idle',
      confirmations: 0,
      requiredConfirmations: 12,
      orderId: null,
    });
  };

  const fetchPaymentStatus = useCallback(async (orderId: string) => {
    try {
      const status = await ApiService.getOrderPaymentStatus(orderId);
      setPaymentState(prev => ({
        ...prev,
        orderId,
        transactionHash: status.transactionHash || prev.transactionHash,
        approvalTransactionHash: prev.approvalTransactionHash,
        confirmations: status.confirmations || 0,
        requiredConfirmations: status.requiredConfirmations || prev.requiredConfirmations,
        status: status.status === 'fulfilled' || status.status === 'paid' ? 'completed'
          : status.status === 'pending_confirmations' ? 'confirming'
          : prev.status,
      }));
      return status;
    } catch (error: any) {
      console.error('Error fetching payment status:', error);
      setPaymentState(prev => ({
        ...prev,
        error: error.message,
      }));
      throw error;
    }
  }, []);

  return {
    ...paymentState,
    initiatePayment,
    checkUSDTBalance,
    estimateGasCosts,
    verifyTransaction,
    resetPaymentState,
    fetchPaymentStatus,
    isProcessing: paymentState.isProcessing || processPaymentMutation.isPending,
  };
};
