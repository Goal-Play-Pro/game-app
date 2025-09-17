/**
 * Configuración general del juego
 * Integra la lógica de división con otras mecánicas
 */

import { Division, DivisionHelpers, DIVISION_CONFIG } from './division.config';
import { PlayerStats } from '../types';

/**
 * Configuración de experiencia y niveles
 */
export class ExperienceConfig {
  /**
   * Calcula la experiencia requerida para un nivel específico
   */
  public static calculateRequiredXP(level: number): number {
    return level * 100 + Math.pow(level, 2) * 10;
  }

  /**
   * Calcula el nivel basado en la experiencia total
   */
  public static calculateLevelFromXP(totalXP: number): number {
    let level = 1;
    let requiredXP = this.calculateRequiredXP(level);
    
    while (totalXP >= requiredXP && level < 100) {
      level++;
      requiredXP = this.calculateRequiredXP(level);
    }
    
    return level - 1;
  }

  /**
   * Obtiene las recompensas de XP por actividad
   */
  public static getXPRewards() {
    return {
      penalty_goal: 10,
      penalty_miss: 2,
      game_win: 50,
      game_loss: 15,
      perfect_game: 100,
      first_win_daily: 25,
      achievement_unlock: 50,
      level_up: 25
    };
  }
}

/**
 * Configuración de recompensas por división
 */
export class RewardConfig {
  /**
   * Obtiene las recompensas base por división
   */
  public static getBaseRewards(divisionString: string) {
    const divisionNumber = Division.fromString(divisionString);
    
    const baseRewards = {
      [Division.FIRST_DIVISION]: {
        game_win: "25.00",
        perfect_game: "50.00",
        tournament_win: "500.00"
      },
      [Division.SECOND_DIVISION]: {
        game_win: "10.00",
        perfect_game: "20.00",
        tournament_win: "200.00"
      },
      [Division.THIRD_DIVISION]: {
        game_win: "5.00",
        perfect_game: "10.00",
        tournament_win: "50.00"
      }
    };
    
    return baseRewards[divisionNumber];
  }

  /**
   * Calcula recompensas basadas en performance y división
   */
  public static calculateGameRewards(
    divisionString: string,
    gameResult: {
      won: boolean;
      score: { own: number; opponent: number };
      perfectShots: number;
      gameType: 'single_player' | 'multiplayer';
    }
  ) {
    const baseRewards = this.getBaseRewards(divisionString);
    let tokenReward = 0;
    let xpReward = 0;

    if (gameResult.won) {
      tokenReward += parseFloat(baseRewards.game_win);
      xpReward += ExperienceConfig.getXPRewards().game_win;
      
      // Bonus por perfect game
      if (gameResult.perfectShots >= 5) {
        tokenReward += parseFloat(baseRewards.perfect_game);
        xpReward += ExperienceConfig.getXPRewards().perfect_game;
      }
      
      // Bonus por multiplayer
      if (gameResult.gameType === 'multiplayer') {
        tokenReward *= 1.5;
        xpReward *= 1.5;
      }
    } else {
      // Recompensa de consolación
      tokenReward += parseFloat(baseRewards.game_win) * 0.2;
      xpReward += ExperienceConfig.getXPRewards().game_loss;
    }

    return {
      tokens: tokenReward.toFixed(2),
      experience: Math.floor(xpReward)
    };
  }
}

/**
 * Configuración de dificultad por división
 */
export class DifficultyConfig {
  /**
   * Obtiene la configuración de dificultad para AI según división
   */
  public static getAIDifficulty(divisionString: string) {
    const divisionNumber = Division.fromString(divisionString);
    
    const aiDifficulty = {
      [Division.FIRST_DIVISION]: {
        goalkeeping: 85,
        reflexes: 90,
        positioning: 88,
        prediction_accuracy: 0.4
      },
      [Division.SECOND_DIVISION]: {
        goalkeeping: 75,
        reflexes: 80,
        positioning: 78,
        prediction_accuracy: 0.3
      },
      [Division.THIRD_DIVISION]: {
        goalkeeping: 65,
        reflexes: 70,
        positioning: 68,
        prediction_accuracy: 0.2
      }
    };
    
    return aiDifficulty[divisionNumber];
  }

  /**
   * Calcula la dificultad adaptativa basada en el rendimiento del usuario
   */
  public static calculateAdaptiveDifficulty(userStats: {
    winRate: number;
    averageGoals: number;
    gamesPlayed: number;
  }) {
    let difficultyMultiplier = 1.0;
    
    // Aumentar dificultad si el usuario es muy bueno
    if (userStats.winRate > 80 && userStats.gamesPlayed > 20) {
      difficultyMultiplier += 0.3;
    } else if (userStats.winRate > 60) {
      difficultyMultiplier += 0.15;
    }
    
    // Reducir dificultad si el usuario está luchando
    if (userStats.winRate < 30 && userStats.gamesPlayed > 10) {
      difficultyMultiplier -= 0.2;
    }
    
    return Math.max(0.5, Math.min(1.5, difficultyMultiplier));
  }
}

/**
 * Configuración de validación del juego
 */
export class GameValidation {
  /**
   * Valida si un jugador puede participar en una división específica
   */
  public static canPlayerCompeteInDivision(
    playerStats: PlayerStats, 
    targetDivision: string
  ): boolean {
    return DivisionHelpers.validateStats(playerStats, targetDivision);
  }

  /**
   * Obtiene la división recomendada para un jugador
   */
  public static getRecommendedDivision(playerStats: PlayerStats): string {
    const totalStats = playerStats.speed + playerStats.shooting + 
                      playerStats.passing + playerStats.defending + 
                      playerStats.goalkeeping;
    
    // Verificar en orden descendente
    for (const divisionNumber of [Division.FIRST_DIVISION, Division.SECOND_DIVISION, Division.THIRD_DIVISION]) {
      const division = new Division(divisionNumber);
      if (totalStats >= division.getStartingStats()) {
        return Division.toString(divisionNumber);
      }
    }
    
    return 'tercera'; // Fallback
  }

  /**
   * Valida los parámetros de un penalty attempt
   */
  public static validatePenaltyAttempt(attempt: {
    direction: string;
    power: number;
  }): boolean {
    const validDirections = ['left', 'center', 'right'];
    return validDirections.includes(attempt.direction) && 
           attempt.power >= 0 && 
           attempt.power <= 100;
  }
}

/**
 * Exportar configuraciones para uso en otros módulos
 */
export {
  Division,
  DivisionHelpers,
  DIVISION_CONFIG
};