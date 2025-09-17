import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { GachaService } from './gacha.service';
import { REAL_PLAYERS_DATA, RealPlayersService } from '../../data/players.data';
import { GachaPoolDto, GachaPlayerDto, DrawResultDto, ExecuteDrawDto } from './dto/gacha.dto';

@ApiTags('gacha')
@Controller('gacha')
export class GachaController {
  constructor(private readonly gachaService: GachaService) {}

  @Get('pools/:id')
  @ApiOperation({ summary: 'Get gacha pool details' })
  @ApiResponse({ status: 200, description: 'Pool retrieved', type: GachaPoolDto })
  async getPool(@Param('id') id: string): Promise<GachaPoolDto> {
    return this.gachaService.findPoolById(id);
  }

  @Get('players/:id')
  @ApiOperation({ summary: 'Get player details' })
  @ApiResponse({ status: 200, description: 'Player retrieved', type: GachaPlayerDto })
  async getPlayer(@Param('id') id: string): Promise<GachaPlayerDto> {
    return this.gachaService.findPlayerById(id);
  }

  @Post('draw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute gacha draw (Internal use)' })
  @ApiResponse({ status: 200, description: 'Draw executed', type: DrawResultDto })
  async executeDraw(@Request() req: any, @Body() dto: ExecuteDrawDto): Promise<DrawResultDto> {
    // This would be called internally by order fulfillment
    // For now, mock a pool ID
    const mockPoolId = 'pool_rookie';
    return this.gachaService.executeDraw(req.user.userId, dto.orderId, mockPoolId, dto.drawCount);
  }

  @Get('real-players')
  @ApiOperation({ summary: 'Get all real players data' })
  @ApiResponse({ status: 200, description: 'Real players data retrieved' })
  async getRealPlayersData() {
    return REAL_PLAYERS_DATA;
  }

  @Get('players-by-division/:division')
  @ApiOperation({ summary: 'Get players available for specific division' })
  @ApiResponse({ status: 200, description: 'Division players retrieved' })
  async getPlayersByDivision(@Param('division') division: string) {
    return RealPlayersService.getPlayersForDivision(division);
  }

  @Get('collection-stats')
  @ApiOperation({ summary: 'Get collection statistics' })
  @ApiResponse({ status: 200, description: 'Collection stats retrieved' })
  async getCollectionStats() {
    return RealPlayersService.getCollectionStats();
  }
}