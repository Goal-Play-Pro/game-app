import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SiweMessageDto,
  SiweVerifyDto,
  SolanaMessageDto,
  SolanaVerifyDto,
  AuthResponseDto,
  ChallengeResponseDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('siwe/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate SIWE challenge for Ethereum wallet' })
  @ApiResponse({ status: 200, description: 'Challenge created', type: ChallengeResponseDto })
  async createSiweChallenge(@Body() dto: SiweMessageDto): Promise<ChallengeResponseDto> {
    return this.authService.createSiweChallenge(dto);
  }

  @Post('siwe/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify SIWE signature and authenticate' })
  @ApiResponse({ status: 200, description: 'Authentication successful', type: AuthResponseDto })
  async verifySiweSignature(@Body() dto: SiweVerifyDto): Promise<AuthResponseDto> {
    return this.authService.verifySiweSignature(dto);
  }

  @Post('solana/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate challenge for Solana wallet' })
  @ApiResponse({ status: 200, description: 'Challenge created', type: ChallengeResponseDto })
  async createSolanaChallenge(@Body() dto: SolanaMessageDto): Promise<ChallengeResponseDto> {
    return this.authService.createSolanaChallenge(dto);
  }

  @Post('solana/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Solana signature and authenticate' })
  @ApiResponse({ status: 200, description: 'Authentication successful', type: AuthResponseDto })
  async verifySolanaSignature(@Body() dto: SolanaVerifyDto): Promise<AuthResponseDto> {
    return this.authService.verifySolanaSignature(dto);
  }
}