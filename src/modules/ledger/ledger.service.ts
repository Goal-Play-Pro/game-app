import { Injectable, BadRequestException } from '@nestjs/common';
import { DataAdapterService } from '../../common/services/data-adapter.service';
import { LedgerEntry, Account, ReferenceType } from './entities/ledger.entity';
import { TransactionType } from '../../common/types/base.types';

@Injectable()
export class LedgerService {
  constructor(private dataAdapter: DataAdapterService) {}

  async createDoubleEntry(
    userId: string,
    debitAccount: string,
    creditAccount: string,
    amount: string,
    currency: string,
    description: string,
    referenceType: ReferenceType,
    referenceId: string,
    metadata?: Record<string, any>,
  ): Promise<{ debitEntry: LedgerEntry; creditEntry: LedgerEntry }> {
    const transactionId = Math.random().toString(36).substr(2, 9);
    const decimalAmount = parseFloat(amount);

    if (decimalAmount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Get current balances
    const debitAccountBalance = await this.getAccountBalance(userId, debitAccount, currency);
    const creditAccountBalance = await this.getAccountBalance(userId, creditAccount, currency);

    // Create debit entry
    const debitEntry = await this.dataAdapter.create('ledger', {
      userId,
      transactionId,
      account: debitAccount,
      type: TransactionType.DEBIT,
      amount: decimalAmount.toString(),
      currency,
      description,
      referenceType,
      referenceId,
      balanceAfter: (debitAccountBalance - decimalAmount).toString(),
      metadata,
    });

    // Create credit entry
    const creditEntry = await this.dataAdapter.create('ledger', {
      userId,
      transactionId,
      account: creditAccount,
      type: TransactionType.CREDIT,
      amount: decimalAmount.toString(),
      currency,
      description,
      referenceType,
      referenceId,
      balanceAfter: (creditAccountBalance + decimalAmount).toString(),
      metadata,
    });

    return { debitEntry, creditEntry };
  }

  async getAccountBalance(userId: string, account: string, currency: string): Promise<number> {
    const entries = await this.dataAdapter.findWhere('ledger',
      (e: LedgerEntry) => e.userId === userId && e.account === account && e.currency === currency
    );

    if (entries.length === 0) {
      return 0;
    }

    // Get the most recent entry for this account
    const latestEntry = entries.sort(
      (a: LedgerEntry, b: LedgerEntry) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return parseFloat(latestEntry.balanceAfter);
  }

  async getUserTransactions(
    userId: string,
    account?: string,
    referenceType?: string,
  ): Promise<LedgerEntry[]> {
    return this.dataAdapter.findWhere('ledger', (e: LedgerEntry) => {
      if (e.userId !== userId) return false;
      if (account && e.account !== account) return false;
      if (referenceType && e.referenceType !== referenceType) return false;
      return true;
    });
  }

  async recordPurchase(
    userId: string,
    orderId: string,
    amount: string,
    currency: string,
  ): Promise<void> {
    await this.createDoubleEntry(
      userId,
      'user_wallet',
      'platform_revenue',
      amount,
      currency,
      'Character pack purchase',
      'order',
      orderId,
    );
  }

  async recordRefund(
    userId: string,
    orderId: string,
    amount: string,
    currency: string,
    reason: string,
  ): Promise<void> {
    await this.createDoubleEntry(
      userId,
      'platform_revenue',
      'user_wallet',
      amount,
      currency,
      `Refund: ${reason}`,
      'refund',
      orderId,
    );
  }
}