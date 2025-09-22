import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { Account } from '../../database/entities/account.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    @InjectRepository(LedgerEntry)
    private ledgerRepository: Repository<LedgerEntry>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async recordTransaction(
    userId: string,
    referenceType: string,
    referenceId: string,
    amount: number,
    currency: string,
    type: 'debit' | 'credit',
    description: string,
    account: string = 'user_wallet'
  ) {
    const transactionId = uuidv4();

    try {
      // Get or create account
      let userAccount = await this.accountRepository.findOne({
        where: { userId, name: account, currency }
      });

      if (!userAccount) {
        userAccount = await this.accountRepository.save({
          userId,
          name: account,
          type: 'asset',
          currency,
          balance: '0',
          isActive: true,
        });
      }

      // Calculate new balance
      const currentBalance = parseFloat(userAccount.balance);
      const newBalance = type === 'credit' 
        ? currentBalance + amount 
        : currentBalance - amount;

      // Create ledger entry
      const ledgerEntry = await this.ledgerRepository.save({
        userId,
        transactionId,
        account,
        type: type,
        amount: amount.toString(),
        currency,
        description,
        referenceType,
        referenceId,
        balanceAfter: newBalance.toString(),
      });

      // Update account balance
      await this.accountRepository.update(userAccount.id, {
        balance: newBalance.toString(),
      });

      this.logger.log(`💰 Transaction recorded: ${type} ${amount} ${currency} for user ${userId}`);
      return ledgerEntry;

    } catch (error) {
      this.logger.error(`❌ Error recording transaction:`, error);
      throw error;
    }
  }

  async getUserBalance(userId: string, currency: string = 'USDT', account: string = 'user_wallet') {
    const userAccount = await this.accountRepository.findOne({
      where: { userId, name: account, currency }
    });

    return {
      balance: userAccount?.balance || '0',
      currency,
      account,
    };
  }

  async getUserTransactions(userId: string, limit: number = 50, account?: string, currency?: string) {
    const where: any = { userId };
    if (account) where.account = account;
    if (currency) where.currency = currency;

    return this.ledgerRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}