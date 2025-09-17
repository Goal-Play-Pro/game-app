import { Module } from '@nestjs/common';
import { GachaController } from './gacha.controller';
import { GachaService } from './gacha.service';
import { PenaltyProbabilityService } from '../../services/penalty-probability.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [GachaController],
  providers: [GachaService, PenaltyProbabilityService],
  exports: [GachaService],
})
export class GachaModule {}