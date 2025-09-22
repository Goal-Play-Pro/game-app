import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GachaController } from './gacha.controller';
import { GachaService } from './gacha.service';
import { GachaPool } from '../../database/entities/gacha-pool.entity';
import { GachaPlayer } from '../../database/entities/gacha-player.entity';
import { GachaPoolEntry } from '../../database/entities/gacha-pool-entry.entity';
import { GachaDraw } from '../../database/entities/gacha-draw.entity';
import { OwnedPlayer } from '../../database/entities/owned-player.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GachaPool,
      GachaPlayer,
      GachaPoolEntry,
      GachaDraw,
      OwnedPlayer,
    ]),
  ],
  controllers: [GachaController],
  providers: [GachaService],
  exports: [GachaService],
})
export class GachaModule {}