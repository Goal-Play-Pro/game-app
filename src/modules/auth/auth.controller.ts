import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateSiweChallenge, VerifySiweSignature, CreateSolanaChallenge, VerifySolanaSignature } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('siwe/challenge')
  @ApiOperation({ summary: 'Create SIWE challenge for Ethereum authentication' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Challenge created successfully' })
  async createSiweChallenge(@Body() dto: CreateSiweChallenge) {
    return this.authService.createSiweChallenge(dto.address, dto.chainId, dto.statement);
  }

  @Post('siwe/verify')
  @ApiOperation({ summary: 'Verify SIWE signature and authenticate user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Authentication successful' })
  async verifySiweSignature(@Body() dto: VerifySiweSignature) {
    return this.authService.verifySiweSignature(dto.message, dto.signature);
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
  async verifySolanaSignature(@Body() dto: VerifySolanaSignature) {
    return this.authService.verifySolanaSignature(dto.message, dto.signature, dto.publicKey);
  }
}