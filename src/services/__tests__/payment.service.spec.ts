import { PaymentService } from '../payment.service';
import { ethers } from 'ethers';

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

  beforeEach(() => {
    ethereum = {
      request: jest.fn(),
    };
    global.window = { ethereum } as unknown as Window;

    mockContract = {
      balanceOf: jest.fn(),
      decimals: jest.fn(),
      transfer: jest.fn(),
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

  describe('connectAndSwitchToBSC', () => {
    it('requests accounts and switches network when needed', async () => {
      ethereum.request
        .mockResolvedValueOnce(['0xabc'])
        .mockResolvedValueOnce('0x1');

      const switchSpy = jest.spyOn(PaymentService, 'switchToBSC').mockResolvedValue();

      const result = await PaymentService.connectAndSwitchToBSC();

      expect(ethereum.request).toHaveBeenNthCalledWith(1, { method: 'eth_requestAccounts' });
      expect(ethereum.request).toHaveBeenNthCalledWith(2, { method: 'eth_chainId' });
      expect(switchSpy).toHaveBeenCalled();
      expect(result).toEqual({ success: true, address: '0xabc' });
    });

    it('returns error when provider missing', async () => {
      global.window = {} as Window;

      const result = await PaymentService.connectAndSwitchToBSC();
      expect(result).toEqual({ success: false, error: 'MetaMask not installed' });
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

  describe('executeUSDTPayment', () => {
    beforeEach(() => {
      jest.spyOn(ethers, 'parseUnits').mockReturnValue(BigInt('1000000000000000000'));
    });

    it('returns failure when user has insufficient balance', async () => {
      mockContract.balanceOf.mockResolvedValueOnce(BigInt('500000000000000000'));

      const result = await PaymentService.executeUSDTPayment('0xto', '1', '0xuser');
      expect(result.success).toBe(false);
      expect(result?.error).toContain('Insufficient USDT balance');
    });

    it('executes transfer and waits for confirmation', async () => {
      mockContract.balanceOf.mockResolvedValueOnce(BigInt('2000000000000000000'));
      const waitMock = jest.fn().mockResolvedValue({ status: 1 });
      mockContract.transfer.mockResolvedValueOnce({ hash: '0xhash', wait: waitMock });

      const result = await PaymentService.executeUSDTPayment('0xto', '1', '0xuser');

      expect(mockContract.transfer).toHaveBeenCalled();
      expect(waitMock).toHaveBeenCalled();
      expect(result).toEqual({ success: true, transactionHash: '0xhash' });
    });

    it('maps user rejection errors to friendly message', async () => {
      mockContract.balanceOf.mockResolvedValueOnce(BigInt('2000000000000000000'));
      const rejection = Object.assign(new Error('Rejected'), { code: 'ACTION_REJECTED' });
      mockContract.transfer.mockRejectedValueOnce(rejection);

      const result = await PaymentService.executeUSDTPayment('0xto', '1', '0xuser');
      expect(result).toEqual({ success: false, error: 'Payment cancelled by user' });
    });
  });
});
