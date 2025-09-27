/** @jest-environment jsdom */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductCard from '../../components/market/ProductCard';
import { ChainType, Division, ProductVariant } from '../../types';

jest.mock('../../hooks/useWallet', () => ({
  useWallet: jest.fn(),
}));

jest.mock('../../hooks/usePayment', () => ({
  usePayment: jest.fn(),
}));

const { useWallet } = jest.requireMock('../../hooks/useWallet') as {
  useWallet: jest.Mock;
};

const { usePayment } = jest.requireMock('../../hooks/usePayment') as {
  usePayment: jest.Mock;
};

const createQueryWrapper = () => {
  const queryClient = new QueryClient();
  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient };
};

describe('Shop UI – BSC switch gating', () => {
  const switchToNetwork = jest.fn();
  const initiatePayment = jest.fn();

  const baseWalletState = {
    isConnected: true,
    needsAuth: false,
    isConnecting: false,
    isAuthenticating: false,
    isFrameBlocked: false,
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    caip10Address: 'caip10:eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    chainId: 1,
    chainType: ChainType.ETHEREUM,
    error: null,
    connectWallet: jest.fn(),
    signInWallet: jest.fn(),
    disconnectWallet: jest.fn(),
    switchToNetwork,
  };

  const basePaymentState = {
    initiatePayment,
    checkUSDTBalance: jest.fn().mockResolvedValue({ balance: '50', formatted: '50.00' }),
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
  };

  const variant: ProductVariant = {
    id: 'variant-1',
    productId: 'product-1',
    name: 'Legendary Pack',
    description: 'A legendary selection of players.',
    division: Division.PRIMERA,
    level: 5,
    priceUSDT: '25.00',
    isActive: true,
    maxPurchasesPerUser: 2,
    gachaPoolId: 'pool-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const order = {
    id: 'order-123',
    totalPriceUSDT: '25.00',
    receivingWallet: '0x0000000000000000000000000000000000000001',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };

  const walletState = { ...baseWalletState };

  beforeAll(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
      share: undefined,
      canShare: undefined,
    });
    window.open = jest.fn();
  });

  beforeEach(() => {
    Object.assign(walletState, baseWalletState);
    jest.clearAllMocks();
    useWallet.mockImplementation(() => walletState);
    usePayment.mockImplementation(() => basePaymentState);
    switchToNetwork.mockImplementation(async (targetChainId: number) => {
      expect(targetChainId).toBe(56);
      walletState.chainId = 56;
      walletState.chainType = ChainType.BSC;
    });
    initiatePayment.mockResolvedValue(undefined);
  });

  it('prompts for an explicit network switch before allowing payment on non-BSC wallets', async () => {
    const { Wrapper } = createQueryWrapper();

    const { rerender } = render(
      <Wrapper>
        <ProductCard variant={variant} order={order} />
      </Wrapper>,
    );

    const openModalButton = screen.getByRole('button', { name: /complete payment/i });
    await act(async () => {
      fireEvent.click(openModalButton);
    });

    expect(await screen.findByText(/BNB Smart Chain Required/i)).toBeTruthy();
    expect(switchToNetwork).not.toHaveBeenCalled();

    const switchButton = await screen.findByRole('button', { name: /Switch to BNB Smart Chain/i });

    await act(async () => {
      fireEvent.click(switchButton);
      await Promise.resolve();
    });

    expect(switchToNetwork).toHaveBeenCalledTimes(1);
    expect(initiatePayment).not.toHaveBeenCalled();

    rerender(
      <Wrapper>
        <ProductCard variant={variant} order={order} />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.queryByText(/BNB Smart Chain Required/i)).toBeNull();
    });

    expect(await screen.findByRole('button', { name: /Pay 25.00 USDT/i })).toBeTruthy();
    expect(initiatePayment).not.toHaveBeenCalled();
  });
});

