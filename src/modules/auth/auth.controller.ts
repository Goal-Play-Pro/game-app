import { Controller, Post, Body, HttpStatus, Get, Put, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateSiweChallenge, VerifySiweSignature, CreateSolanaChallenge, VerifySolanaSignature } from './dto/auth.dto';
import { Response } from 'express';
import { AUTH_COOKIE_NAME } from './auth.constants';
import { LoggerService } from '../../common/services/logger.service';
import { SecurityMetricsService } from '../../common/services/security-metrics.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
    private readonly metrics: SecurityMetricsService,
  ) {}

  @Post('siwe/challenge')
  @ApiOperation({ summary: 'Create SIWE challenge for Ethereum authentication' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Challenge created successfully' })
  async createSiweChallenge(@Body() dto: CreateSiweChallenge, @Request() req: any) {
    const coerceHeader = (value: string | string[] | undefined): string | undefined => {
      if (!value) {
        return undefined;
      }
      return Array.isArray(value) ? value[0] : value;
    };

    const sanitizeHeader = (value?: string) => (value ? value.split(',')[0].trim() : undefined);
    const sanitizeBodyValue = (value?: string) => {
      const trimmed = value?.trim();
      return trimmed && trimmed.length > 0 ? trimmed : undefined;
    };

    const forwardedHost = sanitizeHeader(coerceHeader(req?.headers?.['x-forwarded-host']));
    const hostHeader = sanitizeHeader(coerceHeader(req?.headers?.host));
    const originHeader = sanitizeHeader(coerceHeader(req?.headers?.origin));
    const refererHeader = sanitizeHeader(coerceHeader(req?.headers?.referer));

    const bodyDomain = sanitizeBodyValue(dto.domain);
    const bodyOrigin = sanitizeBodyValue(dto.origin);

    const effectiveDomain = bodyDomain || forwardedHost || hostHeader;
    const effectiveOrigin = bodyOrigin || originHeader || refererHeader;

    return this.authService.createSiweChallenge(
      dto.address,
      dto.chainId,
      dto.statement,
      effectiveDomain,
      effectiveOrigin,
    );
  }

  @Post('siwe/verify')
  @ApiOperation({ summary: 'Verify SIWE signature and authenticate user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Authentication successful' })
  async verifySiweSignature(@Body() dto: VerifySiweSignature, @Request() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifySiweSignature(dto.message, dto.signature, { ip: req.ip });
    this.setAuthCookie(res, result.token, result.expiresInMs);
    return {
      userId: result.userId,
      primaryWallet: result.primaryWallet,
      primaryWalletCaip10: result.primaryWalletCaip10,
      expiresInMs: result.expiresInMs,
    };
  }

  @Post('solana/challenge')
  @ApiOperation({ summary: 'Create Solana challenge for authentication' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Challenge created successfully' })
  async createSolanaChallenge(@Body() dto: CreateSolanaChallenge) {
    return this.authService.createSolanaChallenge(dto.publicKey, dto.statement);
  }

  @Post('solana/verify')
  @ApiOperation({ summary: 'Verify Solana signature and authenticate user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Authentication successful' })
  async verifySolanaSignature(@Body() dto: VerifySolanaSignature, @Request() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifySolanaSignature(dto.message, dto.signature, dto.publicKey, { ip: req.ip });
    this.setAuthCookie(res, result.token, result.expiresInMs);
    return {
      userId: result.userId,
      primaryWallet: result.primaryWallet,
      primaryWalletCaip10: result.primaryWalletCaip10,
      expiresInMs: result.expiresInMs,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear authentication session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Session terminated' })
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    this.clearAuthCookie(res);
    await this.logger.auditLog('auth.logout', req.user?.sub ?? 'anonymous', {
      wallet: req.user?.wallet,
      chainType: req.user?.chainType,
      ip: req.ip,
    });
    this.metrics.recordLogout({
      method: req.user?.chainType === 'solana' ? 'solana' : 'siwe',
      wallet: req.user?.wallet,
      chainType: req.user?.chainType,
      ip: req.ip,
    });
    return { success: true };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile retrieved successfully' })
  async getUserProfile(@Request() req: any) {
    return this.authService.getUserProfile(req.user.sub);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile updated successfully' })
  async updateUserProfile(@Request() req: any, @Body() profileData: any) {
    return this.authService.updateUserProfile(req.user.sub, profileData);
  }

  private setAuthCookie(res: Response, token: string, maxAge: number) {
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
    });
  }

  private clearAuthCookie(res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }
}
