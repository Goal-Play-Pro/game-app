import { Controller, Get, Post, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { LedgerService } from './ledger.service';
import { LedgerEntryDto, CreateTransactionDto } from './dto/ledger.dto';

@ApiTags('ledger')
@Controller('ledger')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiQuery({ name: 'account', required: false, description: 'Filter by account' })
  @ApiQuery({ name: 'referenceType', required: false, description: 'Filter by reference type' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved', type: [LedgerEntryDto] })
  async getTransactions(
    @Request() req: any,
    @Query('account') account?: string,
    @Query('referenceType') referenceType?: string,
  ): Promise<LedgerEntryDto[]> {
    return this.ledgerService.getUserTransactions(req.user.userId, account, referenceType);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get account balances' })
  @ApiQuery({ name: 'account', required: true, description: 'Account name' })
  @ApiQuery({ name: 'currency', required: true, description: 'Currency code' })
  @ApiResponse({ status: 200, description: 'Balance retrieved' })
  async getBalance(
    @Request() req: any,
    @Query('account') account: string,
    @Query('currency') currency: string,
  ): Promise<{ balance: string; currency: string; account: string }> {
    const balance = await this.ledgerService.getAccountBalance(req.user.userId, account, currency);
    return {
      balance: balance.toString(),
      currency,
      account,
    };
  }
}