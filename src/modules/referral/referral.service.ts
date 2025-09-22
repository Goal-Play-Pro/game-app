import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralCode } from '../../database/entities/referral-code.entity';
import { ReferralRegistration } from '../../database/entities/referral-registration.entity';
import { ReferralCommission } from '../../database/entities/referral-commission.entity';
import { User } from '../../database/entities/user.entity';
import { Order } from '../../database/entities/order.entity';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);
  private readonly COMMISSION_PERCENTAGE = 5; // 5% commission

  constructor(
    @InjectRepository(ReferralCode)
    private referralCodeRepository: Repository<ReferralCode>,
    @InjectRepository(ReferralRegistration)
    private referralRegistrationRepository: Repository<ReferralRegistration>,
    @InjectRepository(ReferralCommission)
    private referralCommissionRepository: Repository<ReferralCommission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private ledgerService: LedgerService,
  ) {}

  async getMyReferralCode(userId: string) {
    return this.referralCodeRepository.findOne({
      where: { userId }
    });
  }

  async createReferralCode(userId: string, customCode?: string) {
    // Check if user already has a code
    const existingCode = await this.referralCodeRepository.findOne({
      where: { userId }
    });

    if (existingCode) {
      throw new ConflictException('User already has a referral code');
    }

    // Get user info
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate code
    const code = customCode || this.generateReferralCode(user.walletAddress);

    // Check if code is already taken
    const codeExists = await this.referralCodeRepository.findOne({
      where: { code }
    });

    if (codeExists) {
      throw new ConflictException('Referral code already exists');
    }

    // Create referral code
    const referralCode = await this.referralCodeRepository.save({
      userId,
      walletAddress: user.walletAddress,
      code,
      isActive: true,
      totalReferrals: 0,
      totalCommissions: '0',
    });

    this.logger.log(`🔗 Referral code created: ${code} for user ${userId}`);
    return referralCode;
  }

  async registerReferral(userId: string, referralCode: string) {
    // Find referral code
    const referralCodeRecord = await this.referralCodeRepository.findOne({
      where: { code: referralCode, isActive: true }
    });

    if (!referralCodeRecord) {
      throw new NotFoundException('Invalid referral code');
    }

    // Check if user is trying to refer themselves
    if (referralCodeRecord.userId === userId) {
      throw new ConflictException('Cannot refer yourself');
    }

    // Check if user is already referred
    const existingRegistration = await this.referralRegistrationRepository.findOne({
      where: { referredUserId: userId }
    });

    if (existingRegistration) {
      throw new ConflictException('User already registered with a referral code');
    }

    // Get user info
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create registration
    const registration = await this.referralRegistrationRepository.save({
      referrerUserId: referralCodeRecord.userId,
      referrerWallet: referralCodeRecord.walletAddress,
      referredUserId: userId,
      referredWallet: user.walletAddress,
      referralCode,
      registeredAt: new Date(),
      isActive: true,
    });

    // Update referral code stats
    await this.referralCodeRepository.update(referralCodeRecord.id, {
      totalReferrals: referralCodeRecord.totalReferrals + 1,
    });

    this.logger.log(`👥 Referral registered: ${user.walletAddress} referred by ${referralCodeRecord.walletAddress}`);

    return {
      success: true,
      message: 'Referral registered successfully',
    };
  }

  async processReferralCommission(orderId: string) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId }
      });
      
      if (!order) return;

      // Check if user was referred
      const referralRegistration = await this.referralRegistrationRepository.findOne({
        where: { referredUserId: order.userId, isActive: true }
      });

      if (!referralRegistration) {
        this.logger.debug(`No referral found for user ${order.userId}`);
        return;
      }

      // Calculate commission
      const orderAmount = parseFloat(order.totalPriceUSDT);
      const commissionAmount = (orderAmount * this.COMMISSION_PERCENTAGE) / 100;

      // Create commission record
      const commission = await this.referralCommissionRepository.save({
        referrerUserId: referralRegistration.referrerUserId,
        referrerWallet: referralRegistration.referrerWallet,
        referredUserId: order.userId,
        referredWallet: referralRegistration.referredWallet,
        orderId: orderId,
        orderAmount: orderAmount.toString(),
        commissionAmount: commissionAmount.toString(),
        commissionPercentage: this.COMMISSION_PERCENTAGE,
        status: 'pending',
      });

      // Process commission payment immediately
      await this.payCommission(commission.id);

      this.logger.log(`💰 Referral commission processed: $${commissionAmount.toFixed(2)} for ${referralRegistration.referrerWallet}`);

    } catch (error) {
      this.logger.error(`❌ Error processing referral commission for order ${orderId}:`, error);
    }
  }

  private async payCommission(commissionId: string) {
    try {
      const commission = await this.referralCommissionRepository.findOne({
        where: { id: commissionId }
      });
      
      if (!commission) return;

      // Record commission payment in ledger
      await this.ledgerService.recordTransaction(
        commission.referrerUserId,
        'referral_commission',
        commissionId,
        parseFloat(commission.commissionAmount),
        'USDT',
        'credit',
        `Referral commission from ${commission.referredWallet}`,
        'user_wallet'
      );

      // Update commission status
      await this.referralCommissionRepository.update(commissionId, {
        status: 'paid',
        paidAt: new Date(),
      });

      // Update referral code total commissions
      const referralCode = await this.referralCodeRepository.findOne({
        where: { userId: commission.referrerUserId }
      });

      if (referralCode) {
        const newTotal = parseFloat(referralCode.totalCommissions) + parseFloat(commission.commissionAmount);
        await this.referralCodeRepository.update(referralCode.id, {
          totalCommissions: newTotal.toString(),
        });
      }

      this.logger.log(`✅ Commission paid: $${commission.commissionAmount} to ${commission.referrerWallet}`);

    } catch (error) {
      this.logger.error(`❌ Error paying commission ${commissionId}:`, error);
      
      // Mark commission as failed
      await this.referralCommissionRepository.update(commissionId, {
        status: 'failed',
      });
    }
  }

  async getReferralStats(userId: string) {
    try {
      const referralCode = await this.getMyReferralCode(userId);
      if (!referralCode) {
        return {
          totalReferrals: 0,
          activeReferrals: 0,
          totalCommissions: '0.00',
          pendingCommissions: '0.00',
          paidCommissions: '0.00',
          thisMonthCommissions: '0.00',
          referralLink: '',
          recentReferrals: [],
          recentCommissions: [],
        };
      }

      const [registrations, commissions] = await Promise.all([
        this.referralRegistrationRepository.find({
          where: { referrerUserId: userId },
          order: { createdAt: 'DESC' },
          take: 10
        }),
        this.referralCommissionRepository.find({
          where: { referrerUserId: userId },
          order: { createdAt: 'DESC' },
          take: 10
        }),
      ]);

      const totalCommissions = commissions.reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
      const paidCommissions = commissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
      const pendingCommissions = commissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthCommissions = commissions
        .filter(c => new Date(c.createdAt) >= thisMonth)
        .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

      return {
        totalReferrals: registrations.length,
        activeReferrals: registrations.filter(r => r.isActive).length,
        totalCommissions: totalCommissions.toFixed(2),
        pendingCommissions: pendingCommissions.toFixed(2),
        paidCommissions: paidCommissions.toFixed(2),
        thisMonthCommissions: thisMonthCommissions.toFixed(2),
        referralLink: `${process.env.FRONTEND_URL || 'https://goalplay.pro'}?ref=${referralCode.code}`,
        recentReferrals: registrations,
        recentCommissions: commissions,
      };
    } catch (error) {
      this.logger.error('Error getting referral stats:', error);
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        totalCommissions: '0.00',
        pendingCommissions: '0.00',
        paidCommissions: '0.00',
        thisMonthCommissions: '0.00',
        referralLink: '',
        recentReferrals: [],
        recentCommissions: [],
      };
    }
  }

  async validateReferralCode(code: string) {
    const referralCode = await this.referralCodeRepository.findOne({
      where: { code, isActive: true }
    });

    return {
      valid: !!referralCode,
      referrerWallet: referralCode?.walletAddress || null,
    };
  }

  private generateReferralCode(walletAddress: string): string {
    const prefix = walletAddress.slice(2, 8).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${suffix}`;
  }
}