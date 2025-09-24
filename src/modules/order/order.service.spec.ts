import { BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';

type MockRepository<T = any> = {
  findOne: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
  count: jest.Mock;
  find: jest.Mock;
};

const createMockRepository = (): MockRepository => ({
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  find: jest.fn(),
});

const mockGachaService = {
  executeGachaDraw: jest.fn(),
  addPlayerToInventory: jest.fn(),
};

const mockReferralService = {
  processReferralCommission: jest.fn(),
};

const mockBlockchainService = {
  verifyUSDTTransaction: jest.fn(),
  getUSDTTransactionsForAddress: jest.fn(),
};

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: MockRepository;
  let productVariantRepository: MockRepository;
  let userRepository: MockRepository;

  beforeEach(() => {
    orderRepository = createMockRepository();
    productVariantRepository = createMockRepository();
    userRepository = createMockRepository();

    service = new OrderService(
      orderRepository as any,
      productVariantRepository as any,
      userRepository as any,
      mockGachaService as any,
      mockReferralService as any,
      mockBlockchainService as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('createOrder', () => {
    it('creates a pending order and schedules payment check', async () => {
      const user = { id: 'user-1' };
      const variant = {
        id: 'variant-1',
        priceUSDT: '10.00',
        maxPurchasesPerUser: null,
        isActive: true,
        product: { id: 'product-1' },
      };

      userRepository.findOne.mockResolvedValueOnce(user);
      productVariantRepository.findOne.mockResolvedValueOnce(variant);
      orderRepository.count.mockResolvedValueOnce(0);
      orderRepository.save.mockImplementation(async payload => ({ id: 'order-1', ...payload }));

      const scheduleSpy = jest
        .spyOn<any, any>(service, 'schedulePaymentCheck')
        .mockImplementation(() => {});

      const result = await service.createOrder('user-1', {
        productVariantId: variant.id,
        quantity: 2,
        chainType: 'bsc',
        paymentWallet: '0xwallet',
      } as any);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          productVariantId: variant.id,
          quantity: 2,
          unitPriceUSDT: '10.00',
          totalPriceUSDT: '20.00',
          status: 'pending',
          paymentWallet: '0xwallet',
          chainType: 'bsc',
        }),
      );

      const savedOrder = orderRepository.save.mock.calls[0][0];
      expect(savedOrder.expiresAt).toBeInstanceOf(Date);
      expect(scheduleSpy).toHaveBeenCalledWith('order-1', 60000);
      expect(result).toEqual(expect.objectContaining({ id: 'order-1', status: 'pending' }));
    });

    it('throws if user exceeds max purchases', async () => {
      const user = { id: 'user-1' };
      const variant = {
        id: 'variant-1',
        priceUSDT: '10.00',
        maxPurchasesPerUser: 1,
        isActive: true,
        product: { id: 'product-1' },
      };

      userRepository.findOne.mockResolvedValueOnce(user);
      productVariantRepository.findOne.mockResolvedValueOnce(variant);
      orderRepository.count.mockResolvedValueOnce(1);

      await expect(
        service.createOrder('user-1', {
          productVariantId: variant.id,
          quantity: 1,
          chainType: 'bsc',
          paymentWallet: '0xwallet',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('processPaymentNotification', () => {
    const baseOrder = {
      id: 'order-1',
      userId: 'user-1',
      paymentWallet: '0xfrom',
      receivingWallet: '0xto',
      totalPriceUSDT: '10',
      status: 'pending',
      paidAt: null,
    };

    beforeEach(() => {
      jest
        .spyOn(service, 'getOrderById')
        .mockResolvedValue(baseOrder as any);
    });

    it('marks order as paid and fulfills when confirmations satisfied', async () => {
      mockBlockchainService.verifyUSDTTransaction.mockResolvedValueOnce({
        isValid: true,
        transaction: { blockNumber: 100 },
      });

      jest
        .spyOn<any, any>(service, 'getConfirmations')
        .mockResolvedValueOnce(12);

      const fulfillSpy = jest
        .spyOn(service, 'fulfillOrder')
        .mockResolvedValue(undefined);

      const result = await service.processPaymentNotification('order-1', '0xhash', 'user-1');

      expect(orderRepository.update).toHaveBeenCalledWith('order-1', expect.objectContaining({
        status: 'paid',
        transactionHash: '0xhash',
        blockNumber: 100,
        confirmations: 12,
      }));

      expect(fulfillSpy).toHaveBeenCalledWith('order-1');
      expect(result).toEqual({
        success: true,
        status: 'fulfilled',
        confirmations: 12,
        requiredConfirmations: 12,
        transactionHash: '0xhash',
      });
    });

    it('sets order to pending confirmations when confirmations insufficient', async () => {
      mockBlockchainService.verifyUSDTTransaction.mockResolvedValueOnce({
        isValid: true,
        transaction: { blockNumber: 100 },
      });

      jest
        .spyOn<any, any>(service, 'getConfirmations')
        .mockResolvedValueOnce(3);

      const fulfillSpy = jest
        .spyOn(service, 'fulfillOrder')
        .mockResolvedValue(undefined);

      const scheduleSpy = jest
        .spyOn<any, any>(service, 'schedulePaymentCheck')
        .mockImplementation(() => {});

      const result = await service.processPaymentNotification('order-1', '0xhash', 'user-1');

      expect(orderRepository.update).toHaveBeenCalledWith('order-1', expect.objectContaining({
        status: 'pending_confirmations',
        confirmations: 3,
      }));

      expect(scheduleSpy).toHaveBeenCalledWith('order-1', 60000);
      expect(fulfillSpy).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        status: 'pending_confirmations',
        confirmations: 3,
        requiredConfirmations: 12,
        transactionHash: '0xhash',
      });
    });

    it('throws when order status is not pending', async () => {
      (service.getOrderById as jest.Mock).mockResolvedValueOnce({ ...baseOrder, status: 'fulfilled' });

      await expect(service.processPaymentNotification('order-1', '0xhash', 'user-1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getPaymentStatus', () => {
    it('returns confirmation snapshot', async () => {
      jest.spyOn(service, 'getOrderById').mockResolvedValueOnce({
        id: 'order-1',
        userId: 'user-1',
        status: 'pending_confirmations',
        transactionHash: '0xhash',
        confirmations: 4,
      } as any);

      const status = await service.getPaymentStatus('order-1', 'user-1');

      expect(status).toEqual({
        status: 'pending_confirmations',
        transactionHash: '0xhash',
        confirmations: 4,
        requiredConfirmations: 12,
        estimatedConfirmationTime: '5-10 minutes',
      });
    });
  });
});
