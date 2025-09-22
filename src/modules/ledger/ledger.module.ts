import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { Account } from '../../database/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LedgerEntry, Account]),
  ],
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}