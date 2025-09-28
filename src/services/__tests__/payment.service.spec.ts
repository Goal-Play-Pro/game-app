import { PaymentService } from '../payment.service';
import { ethers } from 'ethers';
import { PAYMENT_CONFIG } from '../../config/payment.config';
import { clearPreferredProvider } from '../../utils/providerRegistry';

type EthereumLike = {
  request: jest.Mock;
};

declare global {
  interface Window {
    ethereum?: EthereumLike;
  }
}

describe('PaymentService (frontend helpers)', () => {
  const originalWindow = global.window;
  let ethereum: EthereumLike;
  let mockContract: any;
  let browserProviderSpy: jest.SpyInstance;
  let contractSpy: jest.SpyInstance;

  const originalGateway = PAYMENT_CONFIG.PAYMENT_GATEWAY_CONTRACT;

  beforeEach(() => {
    clearPreferredProvider();
    ethereum = {
      request: jest.fn(),
    };
    global.window = { ethereum } as unknown as Window;

    mockContract = {
      balanceOf: jest.fn(),
      decimals: jest.fn(),
    };

    browserProviderSpy = jest
      .spyOn(ethers as any, 'BrowserProvider')
      .mockImplementation(() => ({ getSigner: jest.fn().mockResolvedValue({}) }));
    contractSpy = jest
      .spyOn(ethers as any, 'Contract')
      .mockImplementation(() => mockContract);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    global.window = originalWindow;
    (PAYMENT_CONFIG as any).PAYMENT_GATEWAY_CONTRACT = originalGateway;
    clearPreferredProvider();
  });

  describe('isMetaMaskInstalled', () => {
    it('returns true when ethereum provider exists', () => {
      expect(PaymentService.isMetaMaskInstalled()).toBe(true);
    });

    it('returns false when window is missing', () => {
      global.window = undefined as unknown as Window;
      expect(PaymentService.isMetaMaskInstalled()).toBe(false);
    });
  });

  describe('ensureBscNetwork', () => {
    it('returns success when already on BSC', async () => {
      const switchSpy = jest.spyOn(PaymentService, 'switchToBSC');
      ethereum.request.mockResolvedValueOnce('0x38');

      const result = await PaymentService.ensureBscNetwork();

      expect(ethereum.request).toHaveBeenCalledWith({ method: 'eth_chainId', params: [] });
      expect(switchSpy).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, chainId: 56 });

      switchSpy.mockRestore();
    });

    it('switches network when not already on BSC', async () => {
      const switchSpy = jest.spyOn(PaymentService, 'switchToBSC').mockResolvedValue();
      ethereum.request.mockResolvedValueOnce('0x1');

      const result = await PaymentService.ensureBscNetwork();

      expect(ethereum.request).toHaveBeenCalledWith({ method: 'eth_chainId', params: [] });
      expect(switchSpy).toHaveBeenCalled();
      expect(result).toEqual({ success: true, chainId: 56 });

      switchSpy.mockRestore();
    });

    it('returns error when provider missing', async () => {
      global.window = {} as Window;

      const result = await PaymentService.ensureBscNetwork();
      expect(result).toEqual({ success: false, error: 'Wallet provider not detected', errorCode: 4900 });

      global.window = { ethereum } as unknown as Window;
    });

    it('propagates switch errors', async () => {
      const switchSpy = jest
        .spyOn(PaymentService, 'switchToBSC')
        .mockRejectedValue(new Error('switch failed'));
      ethereum.request.mockResolvedValueOnce('0x1');

      const result = await PaymentService.ensureBscNetwork();

      expect(switchSpy).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('switch failed');
      expect(result.errorCode).toBe(4901);

      switchSpy.mockRestore();
    });
  });

  describe('processOrderPayment', () => {
    const paymentGateway = '0x0000000000000000000000000000000000000001';

    beforeEach(() => {
      (PaymentService as any).PAYMENT_GATEWAY_CONTRACT = paymentGateway;
    });

    it('switches to BSC only when processing a payment', async () => {
      const requests: string[] = [];

      ethereum.request.mockImplementation(async ({ method }: { method: string }) => {
        requests.push(method);
        if (method === 'eth_accounts') {
          return ['0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266'];
        }
        if (method === 'eth_chainId') {
          return '0x1';
        }
        return null;
      });

      const switchSpy = jest
        .spyOn(PaymentService as any, 'switchToBSC')
        .mockImplementation(async () => {
          requests.push('wallet_switchEthereumChain');
        });

      const signerMock = {};
      browserProviderSpy.mockImplementation(() => ({
        getSigner: jest.fn().mockResolvedValue(signerMock),
      }));

      const usdtContract = {
        balanceOf: jest.fn().mockResolvedValue(ethers.parseUnits('10', 18)),
        allowance: jest.fn().mockResolvedValue(ethers.parseUnits('10', 18)),
      };

      const gatewayContract = {
        payOrder: jest.fn().mockResolvedValue({
          hash: '0xhash',
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
      };

      const usdtAddress = (PaymentService as any).USDT_CONTRACT.toLowerCase();

      contractSpy.mockImplementation((address: string) => {
        if (address.toLowerCase() === usdtAddress) {
          return usdtContract;
        }
        return gatewayContract;
      });

      expect(requests).toHaveLength(0);

      const result = await PaymentService.processOrderPayment('order-1', paymentGateway, '1');

      expect(result.success).toBe(true);
      expect(switchSpy).toHaveBeenCalledTimes(1);
      expect(requests.filter((method) => method === 'eth_accounts')).toHaveLength(1);
      expect(requests).toContain('wallet_switchEthereumChain');
    });
  });

  describe('getUSDTBalance', () => {
    it('formats balance using contract calls', async () => {
      mockContract.balanceOf.mockResolvedValueOnce(BigInt('1230000000000000000'));
      mockContract.decimals.mockResolvedValueOnce(18);
      jest.spyOn(ethers, 'formatUnits').mockReturnValueOnce('1.23');

      const result = await PaymentService.getUSDTBalance('0xuser');

      expect(browserProviderSpy).toHaveBeenCalledWith(ethereum);
      expect(contractSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.any(Object));
      expect(result).toEqual({ balance: '1230000000000000000', formatted: '1.23' });
    });

    it('gracefully handles provider errors', async () => {
      contractSpy.mockImplementationOnce(() => {
        throw new Error('provider error');
      });

      const result = await PaymentService.getUSDTBalance('0xuser');
      expect(result).toEqual({ balance: '0', formatted: '0.00', error: 'provider error' });
    });
  });

});
