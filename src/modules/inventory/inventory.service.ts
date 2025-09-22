import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OwnedPlayer } from '../../database/entities/owned-player.entity';
import { PlayerKit } from '../../database/entities/player-kit.entity';
import { GachaPlayer } from '../../database/entities/gacha-player.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(OwnedPlayer)
    private ownedPlayerRepository: Repository<OwnedPlayer>,
    @InjectRepository(PlayerKit)
    private playerKitRepository: Repository<PlayerKit>,
    @InjectRepository(GachaPlayer)
    private gachaPlayerRepository: Repository<GachaPlayer>,
  ) {}

  async getOwnedPlayers(userId: string) {
    return this.ownedPlayerRepository.find({
      where: { userId, isActive: true },
      relations: ['player'],
      order: { createdAt: 'DESC' }
    });
  }

  async getPlayerKit(ownedPlayerId: string, userId: string) {
    // Verify ownership
    const ownedPlayer = await this.ownedPlayerRepository.findOne({
      where: { id: ownedPlayerId, userId }
    });
    
    if (!ownedPlayer) {
      throw new ForbiddenException('Player not owned by user');
    }

    let kit = await this.playerKitRepository.findOne({
      where: { ownedPlayerId, isActive: true }
    });

    if (!kit) {
      // Create default kit
      kit = await this.playerKitRepository.save({
        ownedPlayerId,
        version: 1,
        name: 'Default Kit',
        primaryColor: '#FF0000',
        secondaryColor: '#FFFFFF',
        isActive: true,
        equippedAt: new Date(),
      });
    }

    return kit;
  }

  async updatePlayerKit(ownedPlayerId: string, kitData: any, userId: string) {
    // Verify ownership
    const ownedPlayer = await this.ownedPlayerRepository.findOne({
      where: { id: ownedPlayerId, userId }
    });
    
    if (!ownedPlayer) {
      throw new ForbiddenException('Player not owned by user');
    }

    // Deactivate current kit
    const currentKit = await this.playerKitRepository.findOne({
      where: { ownedPlayerId, isActive: true }
    });

    if (currentKit) {
      await this.playerKitRepository.update(currentKit.id, {
        isActive: false,
        unequippedAt: new Date(),
      });
    }

    // Create new kit
    return this.playerKitRepository.save({
      ownedPlayerId,
      version: (currentKit?.version || 0) + 1,
      name: kitData.name || 'Custom Kit',
      primaryColor: kitData.primaryColor || '#FF0000',
      secondaryColor: kitData.secondaryColor || '#FFFFFF',
      logoUrl: kitData.logoUrl,
      isActive: true,
      equippedAt: new Date(),
    });
  }

  async getPlayerProgression(ownedPlayerId: string, userId: string) {
    // Verify ownership
    const ownedPlayer = await this.ownedPlayerRepository.findOne({
      where: { id: ownedPlayerId, userId },
      relations: ['player']
    });
    
    if (!ownedPlayer) {
      throw new ForbiddenException('Player not owned by user');
    }

    // Get base player data
    const basePlayer = ownedPlayer.player;
    if (!basePlayer) {
      throw new NotFoundException('Base player not found');
    }

    // Parse baseStats if it's a string (SQLite compatibility)
    const baseStats = typeof basePlayer.baseStats === 'string' 
      ? JSON.parse(basePlayer.baseStats) 
      : basePlayer.baseStats;

    // Calculate progression
    const level = ownedPlayer.currentLevel;
    const experience = ownedPlayer.experience;
    const requiredExperience = this.calculateRequiredXP(level + 1);

    // Calculate bonuses (simple formula: +1 per 5 levels)
    const levelBonus = Math.floor(level / 5);
    const bonuses = {
      speed: levelBonus,
      shooting: levelBonus,
      passing: levelBonus,
      defending: levelBonus,
      goalkeeping: levelBonus,
      overall: levelBonus,
    };

    // Calculate total stats
    const totalStats = {
      speed: baseStats.speed + bonuses.speed,
      shooting: baseStats.shooting + bonuses.shooting,
      passing: baseStats.passing + bonuses.passing,
      defending: baseStats.defending + bonuses.defending,
      goalkeeping: baseStats.goalkeeping + bonuses.goalkeeping,
      overall: Math.floor((baseStats.speed + baseStats.shooting + 
                          baseStats.passing + baseStats.defending + 
                          baseStats.goalkeeping + levelBonus * 5) / 5),
    };

    return {
      ownedPlayerId,
      level,
      experience,
      requiredExperience,
      stats: baseStats,
      bonuses,
      totalStats,
    };
  }

  async getFarmingStatus(ownedPlayerId: string, userId: string) {
    // Verify ownership
    const ownedPlayer = await this.ownedPlayerRepository.findOne({
      where: { id: ownedPlayerId, userId }
    });
    
    if (!ownedPlayer) {
      throw new ForbiddenException('Player not owned by user');
    }

    const requiredLevel = 5;
    const requiredExperience = 500;
    
    const canPlay = ownedPlayer.currentLevel >= requiredLevel && ownedPlayer.experience >= requiredExperience;
    const levelProgress = Math.min(ownedPlayer.currentLevel / requiredLevel, 1) * 50;
    const xpProgress = Math.min(ownedPlayer.experience / requiredExperience, 1) * 50;
    const farmingProgress = Math.floor(levelProgress + xpProgress);

    return {
      canPlay,
      farmingProgress,
      reason: canPlay ? 'Player is ready to play' : 
              ownedPlayer.currentLevel < requiredLevel ? `Need level ${requiredLevel} (current: ${ownedPlayer.currentLevel})` :
              `Need ${requiredExperience} XP (current: ${ownedPlayer.experience})`,
      requirements: {
        level: {
          current: ownedPlayer.currentLevel,
          required: requiredLevel,
          met: ownedPlayer.currentLevel >= requiredLevel,
        },
        experience: {
          current: ownedPlayer.experience,
          required: requiredExperience,
          met: ownedPlayer.experience >= requiredExperience,
        },
      },
    };
  }

  async processFarmingSession(ownedPlayerId: string, farmingType: string, userId: string) {
    // Verify ownership
    const ownedPlayer = await this.ownedPlayerRepository.findOne({
      where: { id: ownedPlayerId, userId }
    });
    
    if (!ownedPlayer) {
      throw new ForbiddenException('Player not owned by user');
    }

    // Calculate rewards based on farming type
    const rewards = {
      general: { xp: 25, cost: 5 },
      speed: { xp: 30, cost: 8 },
      shooting: { xp: 30, cost: 8 },
      passing: { xp: 30, cost: 8 },
      defense: { xp: 30, cost: 8 },
      goalkeeping: { xp: 30, cost: 8 },
    };

    const reward = rewards[farmingType] || rewards.general;
    const newExperience = ownedPlayer.experience + reward.xp;
    const newLevel = this.calculateLevelFromXP(newExperience);

    // Update player
    await this.ownedPlayerRepository.update(ownedPlayerId, {
      experience: newExperience,
      currentLevel: Math.max(ownedPlayer.currentLevel, newLevel),
    });

    return {
      success: true,
      xpGained: reward.xp,
      newExperience,
      newLevel: Math.max(ownedPlayer.currentLevel, newLevel),
      cost: reward.cost,
    };
  }

  private calculateRequiredXP(level: number): number {
    return level * 100 + Math.pow(level, 2) * 10;
  }

  private calculateLevelFromXP(totalXP: number): number {
    let level = 1;
    let requiredXP = this.calculateRequiredXP(level);
    
    while (totalXP >= requiredXP && level < 100) {
      level++;
      requiredXP = this.calculateRequiredXP(level);
    }
    
    return level - 1;
  }
}