import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ReferralService } from './referral.service';
import { 
  ReferralCodeDto, 
  ReferralStatsDto, 
  CreateReferralCodeDto, 
  RegisterReferralDto,
  ReferralCommissionDto,
  ReferralRegistrationDto
} from './dto/referral.dto';

@ApiTags('referral')
@Controller('referral')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('my-code')
  @ApiOperation({ summary: 'Get user referral code' })
  @ApiResponse({ status: 200, description: 'Referral code retrieved', type: ReferralCodeDto })
  async getMyReferralCode(@Request() req: any): Promise<ReferralCodeDto | null> {
    return this.referralService.getUserReferralCode(req.user.userId);
  }

  @Post('create-code')
  @ApiOperation({ summary: 'Create referral code for user' })
  @ApiResponse({ status: 201, description: 'Referral code created', type: ReferralCodeDto })
  async createReferralCode(@Request() req: any, @Body() dto: CreateReferralCodeDto): Promise<ReferralCodeDto> {
    console.log('🔍 Creating referral code for user:', req.user);
    
    // Get user info from request
    const userId = req.user?.userId || req.user?.sub || 'mock-user-id';
    const wallet = req.user?.wallet || '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000';
    
    console.log(`📝 User ID: ${userId}, Wallet: ${wallet}`);
    
    return this.referralService.createReferralCode(userId, wallet, dto.customCode);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register user with referral code' })
  @ApiResponse({ status: 201, description: 'Referral registered' })
  async registerReferral(@Request() req: any, @Body() dto: RegisterReferralDto): Promise<{ success: boolean; message: string }> {
    const registration = await this.referralService.registerReferral(
      req.user.userId,
      req.user.wallet,
      dto.referralCode
    );

    if (registration) {
      return { success: true, message: 'Referral registered successfully' };
    } else {
      return { success: false, message: 'Invalid referral code or already registered' };
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user referral statistics' })
  @ApiResponse({ status: 200, description: 'Referral stats retrieved', type: ReferralStatsDto })
  async getReferralStats(@Request() req: any): Promise<ReferralStatsDto> {
    return this.referralService.getUserReferralStats(req.user.userId);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Get user referral commissions' })
  @ApiResponse({ status: 200, description: 'Commissions retrieved', type: [ReferralCommissionDto] })
  async getCommissions(@Request() req: any): Promise<ReferralCommissionDto[]> {
    return this.referralService.getAllReferralCommissions(req.user.userId);
  }

  @Get('my-referrals')
  @ApiOperation({ summary: 'Get users referred by current user' })
  @ApiResponse({ status: 200, description: 'Referrals retrieved', type: [ReferralRegistrationDto] })
  async getMyReferrals(@Request() req: any): Promise<ReferralRegistrationDto[]> {
    return this.referralService.getAllUserReferrals(req.user.userId);
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate referral code' })
  @ApiResponse({ status: 200, description: 'Code validation result' })
  async validateReferralCode(@Param('code') code: string): Promise<{ valid: boolean; referrerWallet?: string }> {
    const referralCode = await this.referralService.getReferralByCode(code);
    
    if (referralCode) {
      return { 
        valid: true, 
        referrerWallet: referralCode.walletAddress 
      };
    } else {
      return { valid: false };
    }
  }
}