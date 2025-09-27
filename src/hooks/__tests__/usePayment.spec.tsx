/** @jest-environment jsdom */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePayment } from '../usePayment';
import { persistWallet as persistWalletState } from '../../utils/walletStorage';

jest.mock('../../services/api', () => {
  const notifyPaymentCompleted = jest.fn().mockResolvedValue({
    status: 'paid',
    confirmations: 12,
    requiredConfirmations: 12,
  });

  const getOrderPaymentStatus = jest.fn().mockResolvedValue({
    status: 'paid',
    confirmations: 12,
    requiredConfirmations: 12,
    transactionHash: '0xtx',
  });

  return {
    __esModule: true,
    default: {
      notifyPaymentCompleted,
      getOrderPaymentStatus,
    },
  };
});

type PaymentServiceType = typeof import('../../services/payment.service').PaymentService;

jest.mock('../../services/payment.service', () => {
  const actual = jest.requireActual('../../services/payment.service');
  const mocked: Partial<PaymentServiceType> = {
    isMetaMaskInstalled: jest.fn().mockReturnValue(true),
    processOrderPayment: jest.fn(),
    getUSDTBalance: jest.fn(),
    estimateUSDTGas: jest.fn(),
    verifyTransaction: jest.fn(),
  };
  return {
    __esModule: true,
    PaymentService: { ...actual.PaymentService, ...mocked },
  };
});

const { PaymentService } = jest.requireMock('../../services/payment.service') as {
  PaymentService: jest.Mocked<PaymentServiceType>;
};

const ApiService = jest.requireMock('../../services/api').default as {
  notifyPaymentCompleted: jest.Mock;
  getOrderPaymentStatus: jest.Mock;
};

const createWrapper = () => {
  const queryClient = new QueryClient();
  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient };
};

describe('usePayment', () => {

  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
    PaymentService.isMetaMaskInstalled.mockReturnValue(true);
    PaymentService.processOrderPayment.mockResolvedValue({ success: true, paymentHash: '0xhash' });
  });

  afterEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  const persistWallet = () => {
    persistWalletState(56, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'metamask');
  };

  it('does not trigger processOrderPayment until initiatePayment is called', () => {
    persistWallet();
    const { Wrapper } = createWrapper();
    renderHook(() => usePayment(), { wrapper: Wrapper });
    expect(PaymentService.processOrderPayment).not.toHaveBeenCalled();
  });

  it('surfaces switch-network error message when payment service requests user consent', async () => {
    persistWallet();
    PaymentService.processOrderPayment.mockResolvedValue({
      success: false,
      error: 'Failed to switch to BSC',
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePayment(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.initiatePayment('order-1', '0xmerchant', '1')).rejects.toThrow(
        'Failed to switch to BSC',
      );
    });

    expect(PaymentService.processOrderPayment).toHaveBeenCalledWith('order-1', '0xmerchant', '1');
    expect(result.current.error).toBe('Failed to switch to BSC');
  });

  it('requires wallet connection before initiating payment', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePayment(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.initiatePayment('order-1', '0xmerchant', '1')).rejects.toThrow(
        'Please connect your wallet first',
      );
    });

    expect(PaymentService.processOrderPayment).not.toHaveBeenCalled();
  });
});
