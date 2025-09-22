import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { OwnedPlayer } from '../../database/entities/owned-player.entity';
import { PlayerKit } from '../../database/entities/player-kit.entity';
import { GachaPlayer } from '../../database/entities/gacha-player.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OwnedPlayer, PlayerKit, GachaPlayer]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}