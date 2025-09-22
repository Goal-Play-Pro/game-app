import { Controller, Get, Put, Post, Param, Body, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('inventory')
@Controller('owned-players')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get user owned players' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Owned players retrieved successfully' })
  async getOwnedPlayers(@Request() req: any) {
    return this.inventoryService.getOwnedPlayers(req.user.sub);
  }

  @Get(':id/kit')
  @ApiOperation({ summary: 'Get player kit' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player kit retrieved successfully' })
  async getPlayerKit(@Param('id') id: string, @Request() req: any) {
    return this.inventoryService.getPlayerKit(id, req.user.sub);
  }

  @Put(':id/kit')
  @ApiOperation({ summary: 'Update player kit' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player kit updated successfully' })
  async updatePlayerKit(@Param('id') id: string, @Body() kitData: any, @Request() req: any) {
    return this.inventoryService.updatePlayerKit(id, kitData, req.user.sub);
  }

  @Get(':id/progression')
  @ApiOperation({ summary: 'Get player progression and stats' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player progression retrieved successfully' })
  async getPlayerProgression(@Param('id') id: string, @Request() req: any) {
    return this.inventoryService.getPlayerProgression(id, req.user.sub);
  }

  @Get(':id/farming-status')
  @ApiOperation({ summary: 'Get player farming status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Farming status retrieved successfully' })
  async getFarmingStatus(@Param('id') id: string, @Request() req: any) {
    return this.inventoryService.getFarmingStatus(id, req.user.sub);
  }

  @Post(':id/farming')
  @ApiOperation({ summary: 'Process farming session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Farming session processed successfully' })
  async processFarmingSession(@Param('id') id: string, @Body() farmingData: any, @Request() req: any) {
    return this.inventoryService.processFarmingSession(id, farmingData.farmingType, req.user.sub);
  }
}