import { Controller, Get, Post, Body, Param, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlockchainService } from '../services/blockchain.service';

@ApiTags('blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('verify-transaction')
  @ApiOperation({ summary: 'Verify USDT transaction on BSC' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transaction verification result' })
  async verifyTransaction(@Body() verificationData: {
    txHash: string;
    fromAddress: string;
    toAddress: string;
    expectedAmount: string;
  }) {
    return this.blockchainService.verifyUSDTTransaction(
      verificationData.txHash,
      verificationData.fromAddress,
      verificationData.toAddress,
      verificationData.expectedAmount
    );
  }

  @Get('balance/:address')
  @ApiOperation({ summary: 'Get USDT balance for address' })
  @ApiResponse({ status: HttpStatus.OK, description: 'USDT balance retrieved' })
  async getUSDTBalance(@Param('address') address: string) {
    const balance = await this.blockchainService.getUSDTBalance(address);
    return { address, balance, currency: 'USDT' };
  }

  @Get('network-stats')
  @ApiOperation({ summary: 'Get BSC network statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Network stats retrieved' })
  async getNetworkStats() {
    return this.blockchainService.getBSCNetworkStats();
  }

  @Get('gas-info')
  @ApiOperation({ summary: 'Get current gas information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Gas info retrieved' })
  async getGasInfo() {
    return this.blockchainService.getGasInfo();
  }

  @Get('revenue-report')
  @ApiOperation({ summary: 'Generate revenue report for business' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Revenue report generated' })
  async getRevenueReport(
    @Query('days') days: string = '30',
    @Query('wallets') wallets?: string
  ) {
    const receivingWallets = wallets ? wallets.split(',') : [
      process.env.BSC_RECEIVING_WALLET_1 || '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000'
    ];
    
    return this.blockchainService.generateRevenueReport(
      receivingWallets, 
      parseInt(days)
    );
  }

  @Get('transaction-history/:address')
  @ApiOperation({ summary: 'Get transaction history for address' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transaction history retrieved' })
  async getTransactionHistory(
    @Param('address') address: string,
    @Query('days') days: string = '30'
  ) {
    return this.blockchainService.getTransactionHistory(address, parseInt(days));
  }

  @Get('suspicious-check/:address')
  @ApiOperation({ summary: 'Check for suspicious activity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Suspicious activity analysis' })
  async checkSuspiciousActivity(@Param('address') address: string) {
    return this.blockchainService.detectSuspiciousActivity(address);
  }

  @Get('confirmations/:txHash')
  @ApiOperation({ summary: 'Check transaction confirmations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Confirmation status retrieved' })
  async getConfirmations(@Param('txHash') txHash: string) {
    return this.blockchainService.isTransactionConfirmed(txHash);
  }
}