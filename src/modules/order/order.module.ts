import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ShopModule } from '../shop/shop.module';
import { LedgerModule } from '../ledger/ledger.module';
import { GachaModule } from '../gacha/gacha.module';

@Module({
  imports: [ShopModule, LedgerModule, GachaModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}