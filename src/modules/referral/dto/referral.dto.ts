import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { BaseDto } from '@common/types/base.types';

export class ReferralCodeDto extends BaseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  walletAddress!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  totalReferrals!: number;

  @ApiProperty()
  totalCommissions!: string;
}

export class ReferralRegistrationDto extends BaseDto {
  @ApiProperty()
  referrerUserId!: string;

  @ApiProperty()
  referrerWallet!: string;

  @ApiProperty()
  referredUserId!: string;

  @ApiProperty()
  referredWallet!: string;

  @ApiProperty()
  referralCode!: string;

  @ApiProperty()
  registeredAt!: string;

  @ApiProperty()
  isActive!: boolean;
}

export class ReferralCommissionDto extends BaseDto {
  @ApiProperty()
  referrerUserId!: string;

  @ApiProperty()
  referrerWallet!: string;

  @ApiProperty()
  referredUserId!: string;

  @ApiProperty()
  referredWallet!: string;

  @ApiProperty()
  orderId!: string;

  @ApiProperty()
  orderAmount!: string;

  @ApiProperty()
  commissionAmount!: string;

  @ApiProperty()
  commissionPercentage!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty({ required: false })
  paidAt?: string;
}

export class CreateReferralCodeDto {
  @ApiProperty({ description: 'Custom referral code (optional)' })
  @IsOptional()
  @IsString()
  customCode?: string;
}

export class RegisterReferralDto {
  @ApiProperty({ description: 'Referral code from the link' })
  @IsString()
  referralCode!: string;
}

export class ReferralStatsDto {
  @ApiProperty()
  totalReferrals!: number;

  @ApiProperty()
  activeReferrals!: number;

  @ApiProperty()
  totalCommissions!: string;

  @ApiProperty()
  pendingCommissions!: string;

  @ApiProperty()
  paidCommissions!: string;

  @ApiProperty()
  thisMonthCommissions!: string;

  @ApiProperty()
  referralLink!: string;

  @ApiProperty({ type: [ReferralRegistrationDto] })
  recentReferrals!: ReferralRegistrationDto[];

  @ApiProperty({ type: [ReferralCommissionDto] })
  recentCommissions!: ReferralCommissionDto[];
}