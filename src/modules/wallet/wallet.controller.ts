import { Controller, Post, Delete, Put, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { LinkWalletDto, WalletResponseDto, SetPrimaryWalletDto } from './dto/wallet.dto';

@ApiTags('wallet')
@Controller('wallets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get user wallets' })
  @ApiResponse({ status: 200, description: 'Wallets retrieved', type: [WalletResponseDto] })
  async getUserWallets(@Request() req: any): Promise<WalletResponseDto[]> {
    return this.walletService.getUserWallets(req.user.userId);
  }

  @Post('link')
  @ApiOperation({ summary: 'Link a new wallet to user account' })
  @ApiResponse({ status: 201, description: 'Wallet linked', type: WalletResponseDto })
  async linkWallet(@Request() req: any, @Body() dto: LinkWalletDto): Promise<WalletResponseDto> {
    return this.walletService.linkWallet(req.user.userId, dto.address, dto);
  }

  @Delete(':address')
  @ApiOperation({ summary: 'Unlink wallet from user account' })
  @ApiResponse({ status: 200, description: 'Wallet unlinked' })
  async unlinkWallet(@Request() req: any, @Param('address') address: string): Promise<{ message: string }> {
    await this.walletService.unlinkWallet(req.user.userId, address);
    return { message: 'Wallet unlinked successfully' };
  }

  @Put(':address/primary')
  @ApiOperation({ summary: 'Set wallet as primary' })
  @ApiResponse({ status: 200, description: 'Primary wallet updated', type: WalletResponseDto })
  async setPrimaryWallet(@Request() req: any, @Param('address') address: string): Promise<WalletResponseDto> {
    return this.walletService.setPrimaryWallet(req.user.userId, address);
  }
}