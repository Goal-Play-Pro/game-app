import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PenaltyController } from './penalty.controller';
import { PenaltyService } from './penalty.service';
import { PenaltySession } from '../../database/entities/penalty-session.entity';
import { PenaltyAttempt } from '../../database/entities/penalty-attempt.entity';
import { OwnedPlayer } from '../../database/entities/owned-player.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PenaltySession, PenaltyAttempt, OwnedPlayer]),
  ],
  controllers: [PenaltyController],
  providers: [PenaltyService],
  exports: [PenaltyService],
})
export class PenaltyModule {}