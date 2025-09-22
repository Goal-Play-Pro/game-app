import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { User } from '../../database/entities/user.entity';
import { PenaltySession } from '../../database/entities/penalty-session.entity';
import { Order } from '../../database/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PenaltySession, Order]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}