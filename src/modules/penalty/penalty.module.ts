import { Module } from '@nestjs/common';
import { PenaltyController } from './penalty.controller';
import { PenaltyService } from './penalty.service';
import { PenaltyProbabilityService } from '../../services/penalty-probability.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [PenaltyController],
  providers: [PenaltyService, PenaltyProbabilityService],
  exports: [PenaltyService],
})
export class PenaltyModule {}