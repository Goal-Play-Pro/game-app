import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('statistics')
@Controller()
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('statistics/global')
  @ApiOperation({ summary: 'Get global platform statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Global statistics retrieved successfully' })
  async getGlobalStatistics() {
    return this.statisticsService.getGlobalStatistics();
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboard retrieved successfully' })
  async getLeaderboard() {
    return this.statisticsService.getLeaderboard();
  }
}