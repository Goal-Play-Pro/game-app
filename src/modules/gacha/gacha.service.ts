import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataAdapterService } from '../../common/services/data-adapter.service';
import { Division as DivisionConfig, DivisionHelpers } from '../../config/division.config';
import { PenaltyProbabilityService } from '../../services/penalty-probability.service';
import { REAL_PLAYERS_DATA, RealPlayersService } from '../../data/players.data';
import { 
  GachaPool, 
  GachaPlayer, 
  GachaPoolEntry, 
  GachaDraw,
  PlayerStats 
} from './entities/gacha.entity';
import { DrawResultDto } from './dto/gacha.dto';
import { Division as CommonDivision, Position, Rarity } from '../../common/types/base.types';

@Injectable()
export class GachaService {
  constructor(
    private dataAdapter: DataAdapterService,
    private penaltyProbabilityService: PenaltyProbabilityService,
  ) {}

  async executeDraw(userId: string, orderId: string, poolId: string, quantity: number): Promise<DrawResultDto> {
    const pool = await this.dataAdapter.findById('gacha-pools', poolId);
    if (!pool || !pool.isActive) {
      throw new NotFoundException('Gacha pool not found');
    }

    // Get user's owned players to avoid duplicates
    const ownedPlayers = await this.dataAdapter.findWhere('owned-players',
      (p: any) => p.userId === userId && p.isActive
    );
    const ownedPlayerNames = ownedPlayers.map(p => p.playerName || '');

    // Generate real players for draw using real data
    const drawnPlayers = this.generateRealPlayersForDraw(quantity, pool.division, ownedPlayerNames);
    
    // Record draw
    const draw = await this.dataAdapter.create('gacha-draws', {
      userId,
      orderId,
      poolId,
      playersDrawn: drawnPlayers.map(p => p.id),
      seed: `mock-seed-${Date.now()}`,
      drawDate: new Date().toISOString(),
    });

    console.log(`Gacha draw executed: ${draw.id} for user ${userId}`);

    return {
      players: drawnPlayers,
      drawId: draw.id,
      poolName: pool.name,
      drawDate: draw.drawDate,
    };
  }

  private generateRealPlayersForDraw(quantity: number, division: CommonDivision, excludeOwned: string[] = []): GachaPlayer[] {
    const players: GachaPlayer[] = [];
    const divisionString = division;

    for (let i = 0; i < quantity; i++) {
      // Seleccionar jugador real aleatorio para esta división
      const playerData = RealPlayersService.generateRandomPlayerForDraw(divisionString, excludeOwned);
      
      if (!playerData) {
        console.warn(`No available players for division ${divisionString}`);
        continue;
      }

      // Obtener stats base para la división
      const baseStats = RealPlayersService.getPlayerBaseStats(playerData.name, divisionString);
      if (!baseStats) {
        console.warn(`No stats found for ${playerData.name} in division ${divisionString}`);
        continue;
      }

      // Convertir stats a formato esperado (añadir overall)
      const stats = {
        ...baseStats,
        defending: baseStats.defense, // Mapear defense -> defending para compatibilidad
        overall: Math.floor((baseStats.speed + baseStats.shooting + baseStats.passing + baseStats.defense + baseStats.goalkeeping) / 5)
      };
      
      // VALIDACIÓN CRÍTICA: Verificar que stats sumen exactamente startingStats
      const playerStatsForValidation = {
        speed: stats.speed,
        shooting: stats.shooting,
        passing: stats.passing,
        defending: stats.defending,
        goalkeeping: stats.goalkeeping,
        overall: stats.overall
      };
      
      const isValidSum = this.penaltyProbabilityService.validateCharacterStatsSum(
        playerStatsForValidation, 
        division
      );
      
      if (!isValidSum) {
        console.error(`VALIDATION ERROR: Player ${playerData.name} stats don't sum to startingStats for division ${division}`);
        const details = this.penaltyProbabilityService.getCalculationDetails(playerStatsForValidation, division);
        console.error('Validation details:', details);
        // Continuar pero logear el error para debugging
      }

      players.push({
        id: `${playerData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i}`,
        name: playerData.name,
        position: playerData.position as Position,
        rarity: playerData.rarity as Rarity,
        division,
        baseStats: stats,
        imageUrl: playerData.imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Añadir a la lista de excluidos para evitar duplicados en este draw
      excludeOwned.push(playerData.name);
    }

    return players;
  }

  async findPoolById(id: string): Promise<GachaPool> {
    const pool = await this.dataAdapter.findById('gacha-pools', id);
    if (!pool) {
      throw new NotFoundException('Gacha pool not found');
    }
    return pool;
  }

  async findPlayerById(id: string): Promise<GachaPlayer> {
    const player = await this.dataAdapter.findById('gacha-players', id);
    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return player;
  }
}