import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataAdapterService } from '../../common/services/data-adapter.service';
import { LedgerService } from '../ledger/ledger.service';
import { ReferralCode, ReferralRegistration, ReferralCommission } from './entities/referral.entity';
import { CreateReferralCodeDto, RegisterReferralDto, ReferralStatsDto } from './dto/referral.dto';

@Injectable()
export class ReferralService {
  private readonly COMMISSION_PERCENTAGE = 5; // 5% commission
  private readonly baseUrl: string;

  constructor(
    private dataAdapter: DataAdapterService,
    private ledgerService: LedgerService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('APP_URI') || 'http://localhost:5173';
  }

  async createReferralCode(userId: string, walletAddress: string, customCode?: string): Promise<ReferralCode> {
    // Check if user already has a referral code
    try {
      const existingCode = await this.dataAdapter.findOne('referral-codes', 
        (code: ReferralCode) => code.userId === userId && code.isActive
      );

      if (existingCode) {
        console.log(`Existing referral code found for user ${userId}: ${existingCode.code}`);
        return existingCode;
      }

      // Generate unique code
      let code = customCode || this.generateReferralCode(walletAddress);
      
      // Ensure code is unique
      const codeExists = await this.dataAdapter.findOne('referral-codes', 
        (rc: ReferralCode) => rc.code === code && rc.isActive
      );

      if (codeExists) {
        if (customCode) {
          throw new BadRequestException('Custom referral code already exists');
        }
        code = this.generateReferralCode(walletAddress, true);
      }

      console.log(`Creating referral code: ${code} for user ${userId} with wallet ${walletAddress}`);

      const referralCode = await this.dataAdapter.create('referral-codes', {
        userId,
        walletAddress: walletAddress.toLowerCase(),
        code,
        isActive: true,
        totalReferrals: 0,
        totalCommissions: '0.00',
      });

      console.log(`✅ Referral code created successfully: ${code} for user ${userId}`);
      return referralCode;
      
    } catch (error) {
      console.error(`❌ Error creating referral code for user ${userId}:`, error);
      throw error;
    }
  }

  async registerReferral(referredUserId: string, referredWallet: string, referralCode: string): Promise<ReferralRegistration | null> {
    // Find referral code
    const referralCodeData = await this.dataAdapter.findOne('referral-codes', 
      (code: ReferralCode) => code.code === referralCode && code.isActive
    );

    if (!referralCodeData) {
      console.log(`Invalid referral code: ${referralCode}`);
      return null;
    }

    // Check if user is trying to refer themselves
    if (referralCodeData.userId === referredUserId) {
      console.log(`User trying to refer themselves: ${referredUserId}`);
      return null;
    }

    // Check if user is already referred by someone
    const existingReferral = await this.dataAdapter.findOne('referral-registrations', 
      (reg: ReferralRegistration) => reg.referredUserId === referredUserId && reg.isActive
    );

    if (existingReferral) {
      console.log(`User already referred: ${referredUserId}`);
      return existingReferral;
    }

    // Create referral registration
    const registration = await this.dataAdapter.create('referral-registrations', {
      referrerUserId: referralCodeData.userId,
      referrerWallet: referralCodeData.walletAddress,
      referredUserId,
      referredWallet: referredWallet.toLowerCase(),
      referralCode,
      registeredAt: new Date().toISOString(),
      isActive: true,
    });

    // Update referral code stats
    await this.dataAdapter.update('referral-codes', referralCodeData.id, {
      totalReferrals: referralCodeData.totalReferrals + 1,
    });

    console.log(`Referral registered: ${referredUserId} referred by ${referralCodeData.userId}`);

    return registration;
  }

  async processReferralCommission(orderId: string, referredUserId: string, orderAmount: string): Promise<ReferralCommission | null> {
    // Check if user was referred
    const referralRegistration = await this.dataAdapter.findOne('referral-registrations', 
      (reg: ReferralRegistration) => reg.referredUserId === referredUserId && reg.isActive
    );

    if (!referralRegistration) {
      return null;
    }

    // Calculate commission
    const orderAmountDecimal = parseFloat(orderAmount);
    const commissionAmount = (orderAmountDecimal * this.COMMISSION_PERCENTAGE / 100).toFixed(2);

    // Create commission record
    const commission = await this.dataAdapter.create('referral-commissions', {
      referrerUserId: referralRegistration.referrerUserId,
      referrerWallet: referralRegistration.referrerWallet,
      referredUserId,
      referredWallet: referralRegistration.referredWallet,
      orderId,
      orderAmount,
      commissionAmount,
      commissionPercentage: this.COMMISSION_PERCENTAGE,
      status: 'pending',
    });

    // Record commission in ledger
    try {
      await this.ledgerService.createDoubleEntry(
        referralRegistration.referrerUserId,
        'platform_revenue',
        'user_wallet',
        commissionAmount,
        'USDT',
        `Referral commission from order ${orderId}`,
        'referral' as any,
        commission.id,
      );

      // Update commission status
      await this.dataAdapter.update('referral-commissions', commission.id, {
        status: 'paid',
        paidAt: new Date().toISOString(),
      });

      // Update referral code total commissions
      const referralCode = await this.dataAdapter.findOne('referral-codes', 
        (code: ReferralCode) => code.userId === referralRegistration.referrerUserId && code.isActive
      );

      if (referralCode) {
        const newTotal = (parseFloat(referralCode.totalCommissions) + parseFloat(commissionAmount)).toFixed(2);
        await this.dataAdapter.update('referral-codes', referralCode.id, {
          totalCommissions: newTotal,
        });
      }

      console.log(`Referral commission processed: ${commissionAmount} USDT for user ${referralRegistration.referrerUserId}`);

    } catch (error) {
      console.error('Error processing referral commission:', error);
      await this.dataAdapter.update('referral-commissions', commission.id, {
        status: 'failed',
      });
    }

    return commission;
  }

  async getUserReferralStats(userId: string): Promise<ReferralStatsDto> {
    // Get user's referral code
    const referralCode = await this.dataAdapter.findOne('referral-codes', 
      (code: ReferralCode) => code.userId === userId && code.isActive
    );

    if (!referralCode) {
      throw new NotFoundException('Referral code not found. Create one first.');
    }

    // Get referral registrations
    const referrals = await this.dataAdapter.findWhere('referral-registrations',
      (reg: ReferralRegistration) => reg.referrerUserId === userId && reg.isActive
    );

    // Get commissions
    const commissions = await this.dataAdapter.findWhere('referral-commissions',
      (comm: ReferralCommission) => comm.referrerUserId === userId
    );

    // Calculate stats
    const totalCommissions = commissions.reduce((sum, comm) => sum + parseFloat(comm.commissionAmount), 0);
    const pendingCommissions = commissions
      .filter(comm => comm.status === 'pending')
      .reduce((sum, comm) => sum + parseFloat(comm.commissionAmount), 0);
    const paidCommissions = commissions
      .filter(comm => comm.status === 'paid')
      .reduce((sum, comm) => sum + parseFloat(comm.commissionAmount), 0);

    // This month commissions
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthCommissions = commissions
      .filter(comm => new Date(comm.createdAt) >= thisMonth && comm.status === 'paid')
      .reduce((sum, comm) => sum + parseFloat(comm.commissionAmount), 0);

    return {
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(ref => ref.isActive).length,
      totalCommissions: totalCommissions.toFixed(2),
      pendingCommissions: pendingCommissions.toFixed(2),
      paidCommissions: paidCommissions.toFixed(2),
      thisMonthCommissions: thisMonthCommissions.toFixed(2),
      referralLink: `${this.baseUrl}?ref=${referralCode.code}`,
      recentReferrals: referrals.slice(0, 10),
      recentCommissions: commissions.slice(0, 10),
    };
  }

  async getReferralByCode(code: string): Promise<ReferralCode | null> {
    return this.dataAdapter.findOne('referral-codes', 
      (referralCode: ReferralCode) => referralCode.code === code && referralCode.isActive
    );
  }

  private generateReferralCode(walletAddress: string, addSuffix = false): string {
    const base = walletAddress.slice(2, 8).toUpperCase(); // Take 6 chars after 0x
    const suffix = addSuffix ? Math.random().toString(36).substr(2, 3).toUpperCase() : '';
    return `${base}${suffix}`;
  }

  async getUserReferralCode(userId: string): Promise<ReferralCode | null> {
    return this.dataAdapter.findOne('referral-codes', 
      (code: ReferralCode) => code.userId === userId && code.isActive
    );
  }

  async getAllReferralCommissions(userId: string): Promise<ReferralCommission[]> {
    return this.dataAdapter.findWhere('referral-commissions',
      (comm: ReferralCommission) => comm.referrerUserId === userId
    );
  }

  async getAllUserReferrals(userId: string): Promise<ReferralRegistration[]> {
    return this.dataAdapter.findWhere('referral-registrations',
      (reg: ReferralRegistration) => reg.referrerUserId === userId && reg.isActive
    );
  }
}