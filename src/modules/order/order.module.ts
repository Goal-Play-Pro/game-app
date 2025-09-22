import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from '../../database/entities/order.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { User } from '../../database/entities/user.entity';
import { GachaModule } from '../gacha/gacha.module';
import { ReferralModule } from '../referral/referral.module';
import { BlockchainService } from '../../services/blockchain.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, ProductVariant, User]),
    GachaModule,
    ReferralModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, BlockchainService],
  exports: [OrderService],
})
export class OrderModule {}