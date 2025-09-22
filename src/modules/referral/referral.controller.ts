import { Controller, Get, Post, Param, Body, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('referral')
@Controller('referral')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('my-code')
  @ApiOperation({ summary: 'Get user referral code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Referral code retrieved successfully' })
  async getMyReferralCode(@Request() req: any) {
    return this.referralService.getMyReferralCode(req.user.sub);
  }

  @Post('create-code')
  @ApiOperation({ summary: 'Create referral code' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Referral code created successfully' })
  async createReferralCode(@Body() codeData: any, @Request() req: any) {
    return this.referralService.createReferralCode(req.user.sub, codeData.customCode);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register with referral code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Referral registered successfully' })
  async registerReferral(@Body() registerData: any, @Request() req: any) {
    return this.referralService.registerReferral(req.user.sub, registerData.referralCode);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get referral statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Referral stats retrieved successfully' })
  async getReferralStats(@Request() req: any) {
    return this.referralService.getReferralStats(req.user.sub);
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate referral code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Referral code validated successfully' })
  async validateReferralCode(@Param('code') code: string) {
    return this.referralService.validateReferralCode(code);
  }
}