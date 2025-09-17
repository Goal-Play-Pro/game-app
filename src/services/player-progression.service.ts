/**
 * Servicio de progresión de jugadores
 * Maneja el farming, leveling y mejora de estadísticas
 */

import { REAL_PLAYERS_DATA, RealPlayersService, PlayerData, PlayerStatsData } from '../data/players.data';

export interface PlayerProgressionData {
  ownedPlayerId: string;
  playerName: string;
  division: string;
  currentLevel: number;
  experience: number;
  farmingProgress: {
    isComplete: boolean;
    percentage: number;
    canPlay: boolean;
  };
  stats: {
    base: PlayerStatsData;
    bonuses: PlayerStatsData;
    current: PlayerStatsData;
    maxPossible: PlayerStatsData;
  };
  nextLevelRequirements: {
    experienceNeeded: number;
    experienceToNext: number;
    nextLevelBonuses: PlayerStatsData;
  };
}

export class PlayerProgressionService {
  /**
   * Obtiene la progresión completa de un jugador
   */
  static getPlayerProgression(
    ownedPlayerId: string,
    playerName: string,
    division: string,
    currentLevel: number,
    experience: number
  ): PlayerProgressionData | null {
    // Obtener datos base del jugador
    const playerData = RealPlayersService.getPlayerByName(playerName);
    if (!playerData) {
      console.error(`Player not found: ${playerName}`);
      return null;
    }

    // Obtener stats base para la división
    const baseStats = RealPlayersService.getPlayerBaseStats(playerName, division);
    if (!baseStats) {
      console.error(`Stats not found for ${playerName} in division ${division}`);
      return null;
    }

    // Calcular bonificaciones actuales
    const bonuses = this.calculateCurrentBonuses(currentLevel, experience);
    
    // Calcular stats actuales
    const currentStats = this.addStatsBonus(baseStats, bonuses);
    
    // Calcular stats máximas posibles (nivel 100, experiencia máxima)
    const maxBonuses = this.calculateCurrentBonuses(100, 50000);
    const maxPossibleStats = this.addStatsBonus(baseStats, maxBonuses);
    
    // Calcular progreso de farming
    const farmingProgress = RealPlayersService.getFarmingProgress(currentLevel, experience);
    
    // Calcular requerimientos para siguiente nivel
    const nextLevelRequirements = this.getNextLevelRequirements(currentLevel, experience);

    return {
      ownedPlayerId,
      playerName,
      division,
      currentLevel,
      experience,
      farmingProgress: {
        isComplete: farmingProgress.farmingComplete,
        percentage: farmingProgress.progressPercentage,
        canPlay: farmingProgress.farmingComplete
      },
      stats: {
        base: baseStats,
        bonuses,
        current: currentStats,
        maxPossible: maxPossibleStats
      },
      nextLevelRequirements
    };
  }

  /**
  static validateStatsSum(stats: PlayerStatsData, division: string): boolean {
    const total = stats.speed + stats.shooting + stats.passing + stats.defense + stats.goalkeeping;
    const divisionNumber = Division.fromString(division);
    const expectedTotal = new Division(divisionNumber).getStartingStats();
    
    return total === expectedTotal;
  }

  /**
   * Calcula bonificaciones actuales por nivel y experiencia
   */
  private static calculateCurrentBonuses(level: number, experience: number): PlayerStatsData {
    // Sistema de bonificaciones:
    // - Cada 5 niveles = +1 a todas las stats
    // - Cada 1000 XP = +1 adicional a todas las stats
    // - Bonificación máxima = +20 por stat (nivel 100 + 50k XP)

    const levelBonus = Math.floor(level / 5);
    const experienceBonus = Math.floor(experience / 1000);
    const totalBonus = Math.min(20, levelBonus + experienceBonus);

    return {
      speed: totalBonus,
      shooting: totalBonus,
      passing: totalBonus,
      defense: totalBonus,
      goalkeeping: totalBonus
    };
  }

  /**
   * Suma bonificaciones a stats base
   */
  private static addStatsBonus(baseStats: PlayerStatsData, bonuses: PlayerStatsData): PlayerStatsData {
    return {
      speed: baseStats.speed + bonuses.speed,
      shooting: baseStats.shooting + bonuses.shooting,
      passing: baseStats.passing + bonuses.passing,
      defense: baseStats.defense + bonuses.defense,
      goalkeeping: baseStats.goalkeeping + bonuses.goalkeeping
    };
  }

  /**
   * Calcula requerimientos para el siguiente nivel
   */
  private static getNextLevelRequirements(currentLevel: number, currentExperience: number) {
    const nextLevel = currentLevel + 1;
    const experienceForNextLevel = this.calculateRequiredExperience(nextLevel);
    const experienceToNext = experienceForNextLevel - currentExperience;
    
    const nextLevelBonuses = this.calculateCurrentBonuses(nextLevel, currentExperience);

    return {
      experienceNeeded: experienceForNextLevel,
      experienceToNext: Math.max(0, experienceToNext),
      nextLevelBonuses
    };
  }

  /**
   * Calcula experiencia requerida para un nivel específico
   */
  private static calculateRequiredExperience(level: number): number {
    // Fórmula progresiva: level * 100 + level^2 * 10
    return level * 100 + Math.pow(level, 2) * 10;
  }

  /**
   * Añade experiencia a un jugador y maneja level ups
   */
  static addExperience(
    playerName: string,
    division: string,
    currentLevel: number,
    currentExperience: number,
    experienceToAdd: number
  ): {
    newLevel: number;
    newExperience: number;
    leveledUp: boolean;
    levelsGained: number;
  } {
    let newExperience = currentExperience + experienceToAdd;
    let newLevel = currentLevel;
    let levelsGained = 0;

    // Verificar level ups
    while (newLevel < 100) {
      const requiredForNext = this.calculateRequiredExperience(newLevel + 1);
      
      if (newExperience >= requiredForNext) {
        newLevel++;
        levelsGained++;
        console.log(`🎉 ${playerName} leveled up to ${newLevel}!`);
      } else {
        break;
      }
    }

    return {
      newLevel,
      newExperience,
      leveledUp: levelsGained > 0,
      levelsGained
    };
  }

  /**
   * Verifica si un jugador puede participar en partidas
   */
  static canPlayerPlay(currentLevel: number, experience: number): {
    canPlay: boolean;
    reason?: string;
    requirements: {
      level: { current: number; required: number; met: boolean };
      experience: { current: number; required: number; met: boolean };
    };
  } {
    const REQUIRED_LEVEL = 5;
    const REQUIRED_XP = 500;

    const levelMet = currentLevel >= REQUIRED_LEVEL;
    const experienceMet = experience >= REQUIRED_XP;
    const canPlay = levelMet && experienceMet;

    let reason: string | undefined;
    if (!canPlay) {
      if (!levelMet && !experienceMet) {
        reason = `Player needs level ${REQUIRED_LEVEL} and ${REQUIRED_XP} XP to play`;
      } else if (!levelMet) {
        reason = `Player needs to reach level ${REQUIRED_LEVEL} to play`;
      } else {
        reason = `Player needs ${REQUIRED_XP} XP to play`;
      }
    }

    return {
      canPlay,
      reason,
      requirements: {
        level: { current: currentLevel, required: REQUIRED_LEVEL, met: levelMet },
        experience: { current: experience, required: REQUIRED_XP, met: experienceMet }
      }
    };
  }

  /**
   * Obtiene recompensas de XP por actividad
   */
  static getExperienceRewards() {
    return {
      penalty_goal: 10,
      penalty_miss: 2,
      game_win: 50,
      game_loss: 15,
      perfect_game: 100,
      first_win_daily: 25,
      level_up_bonus: 50,
      farming_session: 25,
      daily_training: 15
    };
  }

  /**
   * Procesa una sesión de farming/entrenamiento
   */
  static processFarmingSession(
    playerName: string,
    division: string,
    currentLevel: number,
    currentExperience: number,
    farmingType: 'speed' | 'shooting' | 'passing' | 'defense' | 'goalkeeping' | 'general'
  ): {
    experienceGained: number;
    newLevel: number;
    newExperience: number;
    leveledUp: boolean;
    message: string;
  } {
    const rewards = this.getExperienceRewards();
    const baseXP = rewards.farming_session;
    
    // Bonificación por tipo de entrenamiento específico
    const typeBonus = farmingType === 'general' ? 1.0 : 1.2;
    const experienceGained = Math.floor(baseXP * typeBonus);

    const result = this.addExperience(playerName, division, currentLevel, currentExperience, experienceGained);

    const message = result.leveledUp 
      ? `🎉 ${playerName} gained ${experienceGained} XP and leveled up to ${result.newLevel}!`
      : `📈 ${playerName} gained ${experienceGained} XP from ${farmingType} training`;

    return {
      experienceGained,
      ...result,
      message
    };
  }

  /**
   * Obtiene el costo de farming por sesión
   */
  static getFarmingCosts() {
    return {
      general_training: { cost: "5.00", currency: "USDT", duration: "1 hour" },
      specific_training: { cost: "8.00", currency: "USDT", duration: "1 hour" },
      intensive_training: { cost: "15.00", currency: "USDT", duration: "30 minutes" },
      premium_training: { cost: "25.00", currency: "USDT", duration: "15 minutes" }
    };
  }
}

export default PlayerProgressionService;