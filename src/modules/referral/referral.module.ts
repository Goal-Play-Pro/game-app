import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { ReferralCode } from '../../database/entities/referral-code.entity';
import { ReferralRegistration } from '../../database/entities/referral-registration.entity';
import { ReferralCommission } from '../../database/entities/referral-commission.entity';
import { User } from '../../database/entities/user.entity';
import { Order } from '../../database/entities/order.entity';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReferralCode,
      ReferralRegistration,
      ReferralCommission,
      User,
      Order,
    ]),
    LedgerModule,
  ],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}