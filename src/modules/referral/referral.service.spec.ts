import { ConflictException } from '@nestjs/common';
import { ReferralService } from './referral.service';

type MockRepository<T = any> = {
  findOne: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
  find: jest.Mock;
};

const createMockRepository = (): MockRepository => ({
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
});

describe('ReferralService', () => {
  let service: ReferralService;
  let referralCodeRepository: MockRepository;
  let referralRegistrationRepository: MockRepository;
  let referralCommissionRepository: MockRepository;
  let userRepository: MockRepository;
  let orderRepository: MockRepository;
  let ledgerService: { recordTransaction: jest.Mock };

  beforeEach(() => {
    referralCodeRepository = createMockRepository();
    referralRegistrationRepository = createMockRepository();
    referralCommissionRepository = createMockRepository();
    userRepository = createMockRepository();
    orderRepository = createMockRepository();
    ledgerService = {
      recordTransaction: jest.fn(),
    };

    service = new ReferralService(
      referralCodeRepository as any,
      referralRegistrationRepository as any,
      referralCommissionRepository as any,
      userRepository as any,
      orderRepository as any,
      ledgerService as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReferralCode', () => {
    it('throws when user already has a referral code', async () => {
      referralCodeRepository.findOne.mockResolvedValueOnce({ id: 'existing' });

      await expect(service.createReferralCode('user-1', 'CODE1')).rejects.toBeInstanceOf(ConflictException);
      expect(referralCodeRepository.save).not.toHaveBeenCalled();
    });

    it('creates a referral code with provided custom code', async () => {
      const user = { id: 'user-1', walletAddress: '0xabc1234567890' };

      referralCodeRepository.findOne
        .mockResolvedValueOnce(null) // user existing code
        .mockResolvedValueOnce(null); // code availability

      userRepository.findOne.mockResolvedValueOnce(user);

      referralCodeRepository.save.mockImplementation(async (payload) => ({
        id: 'ref-code-1',
        ...payload,
      }));

      const result = await service.createReferralCode(user.id, 'GOAL123');

      expect(referralCodeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: user.id,
          walletAddress: user.walletAddress,
          code: 'GOAL123',
          isActive: true,
          totalReferrals: 0,
          totalCommissions: '0',
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: 'ref-code-1',
          code: 'GOAL123',
          userId: user.id,
        }),
      );
    });
  });

  describe('registerReferral', () => {
    it('registers a referral and bumps totals', async () => {
      const refCode = {
        id: 'code-1',
        userId: 'referrer-1',
        walletAddress: '0xreferrer',
        code: 'GOAL123',
        isActive: true,
        totalReferrals: 3,
      };

      referralCodeRepository.findOne.mockResolvedValueOnce(refCode);
      referralRegistrationRepository.findOne.mockResolvedValueOnce(null);
      userRepository.findOne.mockResolvedValueOnce({ id: 'user-2', walletAddress: '0xreferred' });

      referralRegistrationRepository.save.mockImplementation(async (payload) => ({
        id: 'registration-1',
        ...payload,
      }));

      const result = await service.registerReferral('user-2', 'GOAL123');

      expect(result).toEqual({ success: true, message: 'Referral registered successfully' });

      const savedRegistration = referralRegistrationRepository.save.mock.calls[0][0];
      expect(savedRegistration).toEqual(
        expect.objectContaining({
          referrerUserId: refCode.userId,
          referrerWallet: refCode.walletAddress,
          referredUserId: 'user-2',
          referredWallet: '0xreferred',
          referralCode: 'GOAL123',
          isActive: true,
        }),
      );
      expect(savedRegistration.registeredAt).toBeInstanceOf(Date);

      expect(referralCodeRepository.update).toHaveBeenCalledWith(refCode.id, {
        totalReferrals: refCode.totalReferrals + 1,
      });
    });

    it('prevents self referral', async () => {
      const refCode = {
        id: 'code-1',
        userId: 'user-2',
        walletAddress: '0xsame',
        code: 'GOAL123',
        isActive: true,
      };

      referralCodeRepository.findOne.mockResolvedValueOnce(refCode);

      await expect(service.registerReferral('user-2', 'GOAL123')).rejects.toBeInstanceOf(ConflictException);
      expect(referralRegistrationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('processReferralCommission', () => {
    it('records and pays commission when referral exists', async () => {
      const order = { id: 'order-1', userId: 'user-2', totalPriceUSDT: '10.00' };
      const registration = {
        referrerUserId: 'referrer-1',
        referrerWallet: '0xreferrer',
        referredUserId: 'user-2',
        referredWallet: '0xreferred',
        referralCode: 'GOAL123',
        isActive: true,
      };

      orderRepository.findOne.mockResolvedValueOnce(order);
      referralRegistrationRepository.findOne.mockResolvedValueOnce(registration);

      referralCommissionRepository.save.mockImplementation(async (payload) => ({
        id: 'commission-1',
        ...payload,
      }));

      referralCommissionRepository.findOne.mockResolvedValueOnce({
        id: 'commission-1',
        referrerUserId: registration.referrerUserId,
        referrerWallet: registration.referrerWallet,
        referredUserId: registration.referredUserId,
        referredWallet: registration.referredWallet,
        orderId: order.id,
        referralCode: registration.referralCode,
        orderAmount: '10',
        commissionAmount: '0.5',
        commissionPercentage: 5,
        status: 'pending',
      });

      referralCodeRepository.findOne.mockResolvedValueOnce({
        id: 'ref-code-1',
        totalCommissions: '1.00',
      });

      await service.processReferralCommission(order.id);

      expect(referralCommissionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          commissionAmount: '0.5',
          commissionPercentage: 5,
          referrerUserId: registration.referrerUserId,
          orderId: order.id,
        }),
      );

      expect(ledgerService.recordTransaction).toHaveBeenCalledWith(
        registration.referrerUserId,
        'referral_commission',
        'commission-1',
        0.5,
        'USDT',
        'credit',
        `Referral commission from ${registration.referredWallet}`,
        'user_wallet',
      );

      expect(referralCommissionRepository.update).toHaveBeenCalledWith('commission-1', {
        status: 'paid',
        paidAt: expect.any(Date),
      });

      expect(referralCodeRepository.update).toHaveBeenCalledWith('ref-code-1', {
        totalCommissions: '1.5',
      });
    });

    it('skips when order has no referral registration', async () => {
      orderRepository.findOne.mockResolvedValueOnce({ id: 'order-2', userId: 'user-3', totalPriceUSDT: '25.00' });
      referralRegistrationRepository.findOne.mockResolvedValueOnce(null);

      await service.processReferralCommission('order-2');

      expect(referralCommissionRepository.save).not.toHaveBeenCalled();
      expect(ledgerService.recordTransaction).not.toHaveBeenCalled();
    });
  });
});
