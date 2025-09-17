import { Controller, Get, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { 
  OwnedPlayerDto, 
  PlayerKitDto, 
  UpdatePlayerKitDto, 
  PlayerProgressionDto,
  FarmingSessionDto,
  FarmingResultDto
} from './dto/inventory.dto';

@ApiTags('inventory')
@Controller('owned-players')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get user owned players' })
  @ApiResponse({ status: 200, description: 'Players retrieved', type: [OwnedPlayerDto] })
  async getOwnedPlayers(@Request() req: any): Promise<OwnedPlayerDto[]> {
    return this.inventoryService.getUserPlayers(req.user.userId);
  }

  @Get(':id/kit')
  @ApiOperation({ summary: 'Get player kit' })
  @ApiResponse({ status: 200, description: 'Kit retrieved', type: PlayerKitDto })
  async getPlayerKit(@Request() req: any, @Param('id') id: string): Promise<PlayerKitDto> {
    return this.inventoryService.getPlayerKit(id, req.user.userId);
  }

  @Put(':id/kit')
  @ApiOperation({ summary: 'Update player kit' })
  @ApiResponse({ status: 200, description: 'Kit updated', type: PlayerKitDto })
  async updatePlayerKit(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePlayerKitDto,
  ): Promise<PlayerKitDto> {
    return this.inventoryService.updatePlayerKit(id, req.user.userId, dto);
  }

  @Get(':id/progression')
  @ApiOperation({ summary: 'Get player progression and stats' })
  @ApiResponse({ status: 200, description: 'Progression retrieved', type: PlayerProgressionDto })
  async getPlayerProgression(@Request() req: any, @Param('id') id: string): Promise<PlayerProgressionDto> {
    return this.inventoryService.getPlayerProgression(id, req.user.userId);
  }

  @Post(':id/farming')
  @ApiOperation({ summary: 'Process farming session for player' })
  @ApiResponse({ status: 200, description: 'Farming session completed', type: FarmingResultDto })
  async processFarmingSession(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: FarmingSessionDto,
  ): Promise<FarmingResultDto> {
    return this.inventoryService.processFarmingSession(id, req.user.userId, dto.farmingType);
  }

  @Get(':id/farming-status')
  @ApiOperation({ summary: 'Check if player can participate in games' })
  @ApiResponse({ status: 200, description: 'Farming status retrieved' })
  async getFarmingStatus(@Request() req: any, @Param('id') id: string): Promise<{
    canPlay: boolean;
    reason?: string;
    requirements: any;
    farmingProgress: number;
  }> {
    const ownedPlayer = await this.inventoryService.getOwnedPlayerById(id, req.user.userId);
    
    const playabilityCheck = PlayerProgressionService.canPlayerPlay(
      ownedPlayer.currentLevel,
      ownedPlayer.experience
    );

    const farmingProgress = RealPlayersService.getFarmingProgress(
      ownedPlayer.currentLevel,
      ownedPlayer.experience
    );
    return {
      canPlay: playabilityCheck.canPlay,
      reason: playabilityCheck.reason,
      requirements: playabilityCheck.requirements,
      farmingProgress: farmingProgress.progressPercentage
    };
  }
}