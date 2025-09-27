/** @jest-environment jsdom */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import PaymentModal from '../PaymentModal';
import { ChainType } from '../../../types';

jest.mock('../../../hooks/useWallet', () => ({
  useWallet: jest.fn(),
}));

jest.mock('../../../hooks/usePayment', () => ({
  usePayment: jest.fn(),
}));

const { useWallet } = jest.requireMock('../../../hooks/useWallet') as {
  useWallet: jest.Mock;
};

const { usePayment } = jest.requireMock('../../../hooks/usePayment') as {
  usePayment: jest.Mock;
};

const baseOrder = {
  id: 'order-123',
  totalPriceUSDT: '25.00',
  receivingWallet: '0x0000000000000000000000000000000000000001',
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
};

const createWalletState = (overrides: Partial<Record<string, unknown>> = {}) => ({
  isConnected: true,
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  caip10Address: 'caip10:eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  chainId: 1,
  chainType: ChainType.ETHEREUM,
  isConnecting: false,
  isAuthenticating: false,
  needsAuth: false,
  error: null,
  isFrameBlocked: false,
  connectWallet: jest.fn(),
  signInWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  switchToNetwork: jest.fn(),
  ...overrides,
});

const createPaymentState = (overrides: Partial<Record<string, unknown>> = {}) => ({
  initiatePayment: jest.fn().mockResolvedValue(undefined),
  checkUSDTBalance: jest.fn().mockResolvedValue({ balance: '100', formatted: '100.00' }),
  estimateGasCosts: jest
    .fn()
    .mockResolvedValue({ gasLimit: '65000', gasPrice: '5', gasCostBNB: '0.01', gasCostUSD: '0.30' }),
  verifyTransaction: jest.fn(),
  resetPaymentState: jest.fn(),
  fetchPaymentStatus: jest.fn(),
  isProcessing: false,
  error: null,
  transactionHash: null,
  approvalTransactionHash: null,
  needsApproval: false,
  status: 'idle',
  confirmations: 0,
  requiredConfirmations: 12,
  orderId: null,
  ...overrides,
});

describe('PaymentModal network gating', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('prompts the user to switch networks when connected wallet is not on BSC', async () => {
    const walletState = createWalletState();
    const paymentState = createPaymentState();
    useWallet.mockReturnValue(walletState);
    usePayment.mockReturnValue(paymentState);

    render(<PaymentModal isOpen order={baseOrder} onClose={jest.fn()} />);

    expect(await screen.findByText(/BNB Smart Chain Required/i)).toBeTruthy();
    expect(await screen.findByRole('button', { name: /Switch to BNB Smart Chain/i })).toBeTruthy();
    expect((walletState.switchToNetwork as jest.Mock)).not.toHaveBeenCalled();
  });

  it('invokes switchToNetwork only after the user clicks the switch button', async () => {
    const switchToNetwork = jest.fn().mockResolvedValue(undefined);
    const walletState = createWalletState({ switchToNetwork });
    const paymentState = createPaymentState();

    useWallet.mockReturnValue(walletState);
    usePayment.mockReturnValue(paymentState);

    const { rerender } = render(<PaymentModal isOpen order={baseOrder} onClose={jest.fn()} />);

    const switchButton = await screen.findByRole('button', { name: /Switch to BNB Smart Chain/i });

    await act(async () => {
      fireEvent.click(switchButton);
    });

    expect(switchToNetwork).toHaveBeenCalledTimes(1);
    expect(switchToNetwork).toHaveBeenCalledWith(56);

    const updatedWalletState = createWalletState({
      chainId: 56,
      chainType: ChainType.BSC,
      switchToNetwork,
    });
    useWallet.mockReturnValue(updatedWalletState);

    rerender(<PaymentModal isOpen order={baseOrder} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText(/BNB Smart Chain Required/i)).toBeNull();
    });
    expect(await screen.findByRole('button', { name: /Pay 25.00 USDT/i })).toBeTruthy();
  });
});
