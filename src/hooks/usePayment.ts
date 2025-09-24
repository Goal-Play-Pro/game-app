import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentService } from '../services/payment.service';
import ApiService from '../services/api';

type PaymentProgressStatus = 'idle' | 'processing' | 'confirming' | 'completed';

interface PaymentState {
  isProcessing: boolean;
  error: string | null;
  transactionHash: string | null;
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
      userWallet
    }: {
      orderId: string;
      receivingWallet: string;
      amount: string;
      userWallet: string;
    }) => {
      console.log(`💳 Procesando pago real para orden ${orderId}`);
      
      // 1. Verificar conexión a MetaMask y BSC
      const connection = await PaymentService.connectAndSwitchToBSC();
      if (!connection.success) {
        throw new Error(connection.error || 'Failed to connect to MetaMask');
      }

      // 2. Verificar balance USDT
      const balance = await PaymentService.getUSDTBalance(userWallet);
      if (parseFloat(balance.formatted) < parseFloat(amount)) {
        throw new Error(`Insufficient USDT balance. Required: ${amount} USDT, Available: ${balance.formatted} USDT`);
      }

      // 3. Estimar gas
      const gasEstimate = await PaymentService.estimateUSDTGas(receivingWallet, amount, userWallet);
      console.log(`⛽ Gas estimado: ${gasEstimate.gasCostUSD} USD`);

      // 4. Ejecutar pago real
      const paymentResult = await PaymentService.executeUSDTPayment(
        receivingWallet,
        amount,
        userWallet
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      console.log(`✅ Pago exitoso: ${paymentResult.transactionHash}`);

      // 5. Notificar al backend sobre el pago
      const notificationResult = await ApiService.notifyPaymentCompleted(
        orderId,
        paymentResult.transactionHash!
      );

      return {
        ...notificationResult,
        transactionHash: paymentResult.transactionHash!,
        orderId,
      };
    },
    onMutate: ({ orderId }) => {
      setPaymentState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        transactionHash: null,
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
        needsApproval: false,
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
    onError: (error: any) => {
      console.error('❌ Error en pago:', error);
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message,
        transactionHash: null,
        needsApproval: false,
        status: 'idle',
      }));
    },
  });

  // Función para iniciar pago
  const initiatePayment = async (orderId: string, receivingWallet: string, amount: string) => {
    try {
      // Obtener wallet del usuario
      const userWallet = localStorage.getItem('walletAddress');
      if (!userWallet) {
        throw new Error('Please connect your wallet first');
      }

      // Verificar que MetaMask esté instalado
      if (!PaymentService.isMetaMaskInstalled()) {
        throw new Error('MetaMask is required for payments');
      }

      // Procesar pago
      const result = await processPaymentMutation.mutateAsync({
        orderId,
        receivingWallet,
        amount,
        userWallet,
      });

      return result;
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      setPaymentState(prev => ({
        ...prev,
        error: error.message,
      }));
      throw error;
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
