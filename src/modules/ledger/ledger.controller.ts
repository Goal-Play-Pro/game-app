import { Controller, Get, Query, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('ledger')
@Controller('ledger')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transactions retrieved successfully' })
  async getTransactions(
    @Request() req: any,
    @Query('limit') limit: string = '50',
    @Query('account') account?: string,
    @Query('currency') currency?: string,
  ) {
    return this.ledgerService.getUserTransactions(
      req.user.sub, 
      parseInt(limit),
      account,
      currency
    );
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get user account balance' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Balance retrieved successfully' })
  async getBalance(
    @Request() req: any,
    @Query('account') account: string = 'user_wallet',
    @Query('currency') currency: string = 'USDT',
  ) {
    return this.ledgerService.getUserBalance(req.user.sub, currency, account);
  }
}