import { Controller, Get, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GachaService } from './gacha.service';

@ApiTags('gacha')
@Controller('gacha')
export class GachaController {
  constructor(private readonly gachaService: GachaService) {}

  @Get('pools/:id')
  @ApiOperation({ summary: 'Get gacha pool details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Gacha pool retrieved successfully' })
  async getGachaPool(@Param('id') id: string) {
    return this.gachaService.getGachaPool(id);
  }

  @Get('players/:id')
  @ApiOperation({ summary: 'Get gacha player details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Gacha player retrieved successfully' })
  async getGachaPlayer(@Param('id') id: string) {
    return this.gachaService.getGachaPlayer(id);
  }

  @Get('real-players')
  @ApiOperation({ summary: 'Get real players data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Real players data retrieved successfully' })
  async getRealPlayersData() {
    return this.gachaService.getRealPlayersData();
  }
}