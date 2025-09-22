import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ShopModule } from './modules/shop/shop.module';
import { OrderModule } from './modules/order/order.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PenaltyModule } from './modules/penalty/penalty.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { ReferralModule } from './modules/referral/referral.module';
import { GachaModule } from './modules/gacha/gacha.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { BlockchainController } from './controllers/blockchain.controller';
import { PaymentMonitorService } from './services/payment-monitor.service';
import { ScheduleModule } from '@nestjs/schedule';
import { BlockchainModule } from './services/blockchain.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: process.env.NODE_ENV === 'production' ? 100 : 1000,
      },
    ]),
    ScheduleModule.forRoot(),
    CommonModule,
    DatabaseModule,
    AuthModule,
    ShopModule,
    OrderModule,
    GachaModule,
    InventoryModule,
    PenaltyModule,
    LedgerModule,
    StatisticsModule,
    ReferralModule,
    BlockchainModule,
  ],
  controllers: [AppController, BlockchainController],
  providers: [
    AppService,
    PaymentMonitorService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
