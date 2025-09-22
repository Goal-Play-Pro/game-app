import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentService } from '../services/payment.service';
import ApiService from '../services/api';
import { ChainType } from '../types';

interface PaymentState {
  isProcessing: boolean;
  error: string | null;
  transactionHash: string | null;
  needsApproval: boolean;
}

export const usePayment = () => {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isProcessing: false,
    error: null,
    transactionHash: null,
    needsApproval: false,
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
      await ApiService.notifyPaymentCompleted(orderId, paymentResult.transactionHash!);

      return {
        transactionHash: paymentResult.transactionHash!,
        orderId,
      };
    },
    onMutate: () => {
      setPaymentState({
        isProcessing: true,
        error: null,
        transactionHash: null,
        needsApproval: false,
      });
    },
    onSuccess: (data) => {
      setPaymentState({
        isProcessing: false,
        error: null,
        transactionHash: data.transactionHash,
        needsApproval: false,
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['owned-players'] });
    },
    onError: (error: any) => {
      console.error('❌ Error en pago:', error);
      setPaymentState({
        isProcessing: false,
        error: error.message,
        transactionHash: null,
        needsApproval: false,
      });
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
      await processPaymentMutation.mutateAsync({
        orderId,
        receivingWallet,
        amount,
        userWallet,
      });
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      setPaymentState(prev => ({
        ...prev,
        error: error.message,
      }));
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
    });
  };

  return {
    ...paymentState,
    initiatePayment,
    checkUSDTBalance,
    estimateGasCosts,
    verifyTransaction,
    resetPaymentState,
    isProcessing: paymentState.isProcessing || processPaymentMutation.isPending,
  };
};