import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { GachaPool } from '../entities/gacha-pool.entity';
import { GachaPlayer } from '../entities/gacha-player.entity';
import { GachaPoolEntry } from '../entities/gacha-pool-entry.entity';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      GachaPool,
      GachaPlayer,
      GachaPoolEntry,
      User,
      Wallet,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
