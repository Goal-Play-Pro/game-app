import { Injectable, NotFoundException } from '@nestjs/common';
import { DataAdapterService } from '../../common/services/data-adapter.service';
import { Division } from '../../config/division.config';
import { RealPlayersService, PlayerProgressionService } from '../../data/players.data';
import PlayerProgressionService from '../../services/player-progression.service';
import { OwnedPlayer, PlayerKit, PlayerProgression } from './entities/inventory.entity';
import { UpdatePlayerKitDto } from './dto/inventory.dto';
import { PlayerStats } from '../gacha/entities/gacha.entity';

@Injectable()
export class InventoryService {
  constructor(private dataAdapter: DataAdapterService) {}

  async addPlayerToInventory(
    userId: string,
    playerName: string,
    division: string,
    sourceOrderId?: string,
    sourceDrawId?: string,
  ): Promise<OwnedPlayer> {
    const ownedPlayer = await this.dataAdapter.create('owned-players', {
      userId,
      playerName,
      division,
      sourceOrderId,
      sourceDrawId,
      acquiredAt: new Date().toISOString(),
      currentLevel: 1,
      experience: 0,
      isActive: true,
    });

    // Create default kit
    await this.dataAdapter.create('player-kits', {
      ownedPlayerId: ownedPlayer.id,
      version: 1,
      name: `${playerName} Default Kit`,
      primaryColor: '#FF0000',
      secondaryColor: '#FFFFFF',
      isActive: true,
      equippedAt: new Date().toISOString(),
    });

    console.log(`Player acquired: ${playerName} (${division}) by user ${userId}`);

    return ownedPlayer;
  }

  async getUserPlayers(userId: string): Promise<OwnedPlayer[]> {
    return this.dataAdapter.findWhere('owned-players', (p: OwnedPlayer) => p.userId === userId && p.isActive);
  }

  async getPlayerKit(ownedPlayerId: string, userId: string): Promise<PlayerKit> {
    // Verify ownership
    const ownedPlayer = await this.dataAdapter.findById('owned-players', ownedPlayerId);
    if (!ownedPlayer || ownedPlayer.userId !== userId) {
      throw new NotFoundException('Player not found');
    }

    const kit = await this.dataAdapter.findOne('player-kits',
      (k: PlayerKit) => k.ownedPlayerId === ownedPlayerId && k.isActive && !!k.equippedAt
    );

    if (!kit) {
      throw new NotFoundException('Player kit not found');
    }

    return kit;
  }

  async updatePlayerKit(
    ownedPlayerId: string,
    userId: string,
    dto: UpdatePlayerKitDto,
  ): Promise<PlayerKit> {
    // Verify ownership
    const ownedPlayer = await this.dataAdapter.findById('owned-players', ownedPlayerId);
    if (!ownedPlayer || ownedPlayer.userId !== userId) {
      throw new NotFoundException('Player not found');
    }

    // Get current kit
    const currentKit = await this.dataAdapter.findOne('player-kits',
      (k: PlayerKit) => k.ownedPlayerId === ownedPlayerId && k.isActive && !!k.equippedAt
    );

    if (!currentKit) {
      throw new NotFoundException('Current kit not found');
    }

    // Unequip current kit
    await this.dataAdapter.update('player-kits', currentKit.id, {
      isActive: false,
      unequippedAt: new Date().toISOString(),
    });

    // Create new kit version
    const newKit = await this.dataAdapter.create('player-kits', {
      ownedPlayerId,
      version: currentKit.version + 1,
      name: dto.name,
      primaryColor: dto.primaryColor,
      secondaryColor: dto.secondaryColor,
      logoUrl: dto.logoUrl,
      isActive: true,
      equippedAt: new Date().toISOString(),
    });

    console.log(`Player kit updated: ${ownedPlayerId} by user ${userId}`);

    return newKit;
  }

  async getPlayerProgression(ownedPlayerId: string, userId: string): Promise<PlayerProgression> {
    // Verify ownership
    const ownedPlayer = await this.dataAdapter.findById('owned-players', ownedPlayerId);
    if (!ownedPlayer || ownedPlayer.userId !== userId) {
      throw new NotFoundException('Player not found');
    }

    // Usar el servicio de progresión con datos reales
    const progressionData = PlayerProgressionService.getPlayerProgression(
      ownedPlayerId,
      ownedPlayer.playerName || 'Unknown Player',
      ownedPlayer.division || 'tercera',
      ownedPlayer.currentLevel,
      ownedPlayer.experience
    );

    if (!progressionData) {
      throw new NotFoundException('Player progression data not found');
    }

    // Convertir a formato esperado por la API
    const baseStats: PlayerStats = {
      ...progressionData.stats.base,
      defending: progressionData.stats.base.defense, // Mapear defense -> defending
      overall: Math.floor((
        progressionData.stats.base.speed +
        progressionData.stats.base.shooting +
        progressionData.stats.base.passing +
        progressionData.stats.base.defense +
        progressionData.stats.base.goalkeeping
      ) / 5)
    };

    const bonuses: PlayerStats = {
      ...progressionData.stats.bonuses,
      defending: progressionData.stats.bonuses.defense,
      overall: Math.floor((
        progressionData.stats.bonuses.speed +
        progressionData.stats.bonuses.shooting +
        progressionData.stats.bonuses.passing +
        progressionData.stats.bonuses.defense +
        progressionData.stats.bonuses.goalkeeping
      ) / 5)
    };

    const totalStats: PlayerStats = {
      ...progressionData.stats.current,
      defending: progressionData.stats.current.defense,
      overall: Math.floor((
        progressionData.stats.current.speed +
        progressionData.stats.current.shooting +
        progressionData.stats.current.passing +
        progressionData.stats.current.defense +
        progressionData.stats.current.goalkeeping
      ) / 5)
    };

    return {
      ownedPlayerId,
      level: progressionData.currentLevel,
      experience: progressionData.experience,
      requiredExperience: progressionData.nextLevelRequirements.experienceNeeded,
      stats: baseStats,
      bonuses,
      totalStats,
    };
  }

  async addExperience(ownedPlayerId: string, amount: number): Promise<OwnedPlayer> {
    const ownedPlayer = await this.dataAdapter.findById('owned-players', ownedPlayerId);
    if (!ownedPlayer) {
      throw new NotFoundException('Player not found');
    }

    // Usar el servicio de progresión para manejar level ups
    const result = PlayerProgressionService.addExperience(
      ownedPlayer.playerName || 'Unknown Player',
      ownedPlayer.division || 'tercera',
      ownedPlayer.currentLevel,
      ownedPlayer.experience,
      amount
    );

    return this.dataAdapter.update('owned-players', ownedPlayerId, {
      currentLevel: result.newLevel,
      experience: result.newExperience,
    });
  }

  /**
   * Procesa una sesión de farming para un jugador
   */
  async processFarmingSession(
    ownedPlayerId: string, 
    userId: string,
    farmingType: 'speed' | 'shooting' | 'passing' | 'defense' | 'goalkeeping' | 'general' = 'general'
  ): Promise<{
    success: boolean;
    message: string;
    experienceGained: number;
    leveledUp: boolean;
    newLevel: number;
    canPlayNow: boolean;
  }> {
    // Verify ownership
    const ownedPlayer = await this.dataAdapter.findById('owned-players', ownedPlayerId);
    if (!ownedPlayer || ownedPlayer.userId !== userId) {
      throw new NotFoundException('Player not found');
    }

    // Procesar sesión de farming
    const farmingResult = PlayerProgressionService.processFarmingSession(
      ownedPlayer.playerName || 'Unknown Player',
      ownedPlayer.division || 'tercera',
      ownedPlayer.currentLevel,
      ownedPlayer.experience,
      farmingType
    );

    // Actualizar jugador en base de datos
    await this.dataAdapter.update('owned-players', ownedPlayerId, {
      currentLevel: farmingResult.newLevel,
      experience: farmingResult.newExperience,
    });

    // Verificar si ahora puede jugar
    const playabilityCheck = PlayerProgressionService.canPlayerPlay(
      farmingResult.newLevel,
      farmingResult.newExperience
    );

    console.log(`Farming session completed for ${ownedPlayer.playerName}: +${farmingResult.experienceGained} XP`);

    return {
      success: true,
      message: farmingResult.message,
      experienceGained: farmingResult.experienceGained,
      leveledUp: farmingResult.leveledUp,
      newLevel: farmingResult.newLevel,
      canPlayNow: playabilityCheck.canPlay
    };
  }
}