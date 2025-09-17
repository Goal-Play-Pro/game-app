/**
 * División Configuration - Lógica de estadísticas por división
 * Basado en la clase PHP Division proporcionada
 */

export enum DivisionType {
  FIRST_DIVISION = 1,
  SECOND_DIVISION = 2,
  THIRD_DIVISION = 3,
}

export class Division {
  public static readonly FIRST_DIVISION = 1;
  public static readonly SECOND_DIVISION = 2;
  public static readonly THIRD_DIVISION = 3;

  constructor(public division: number) {}

  /**
   * Obtiene el porcentaje máximo para la división
   */
  public getMaxPercentage(): number {
    switch (this.division) {
      case Division.FIRST_DIVISION:
        return 90;
      case Division.SECOND_DIVISION:
        return 80;
      case Division.THIRD_DIVISION:
        return 70;
      default:
        throw new Error(`División inválida: ${this.division}`);
    }
  }

  /**
   * Obtiene las estadísticas máximas totales para la división
   */
  public getMaxStats(): number {
    switch (this.division) {
      case Division.FIRST_DIVISION:
        return 171;
      case Division.SECOND_DIVISION:
        return 152;
      case Division.THIRD_DIVISION:
        return 133;
      default:
        throw new Error(`División inválida: ${this.division}`);
    }
  }

  /**
   * Obtiene el porcentaje inicial para la división
   */
  public getStartingPercentage(): number {
    switch (this.division) {
      case Division.FIRST_DIVISION:
        return 50;
      case Division.SECOND_DIVISION:
        return 40;
      case Division.THIRD_DIVISION:
        return 30;
      default:
        throw new Error(`División inválida: ${this.division}`);
    }
  }

  /**
   * Obtiene las estadísticas iniciales totales para la división
   */
  public getStartingStats(): number {
    switch (this.division) {
      case Division.FIRST_DIVISION:
        return 95;
      case Division.SECOND_DIVISION:
        return 76;
      case Division.THIRD_DIVISION:
        return 57;
      default:
        throw new Error(`División inválida: ${this.division}`);
    }
  }

  /**
   * Convierte string de división a número
   */
  public static fromString(divisionString: string): number {
    switch (divisionString.toLowerCase()) {
      case 'primera':
        return Division.FIRST_DIVISION;
      case 'segunda':
        return Division.SECOND_DIVISION;
      case 'tercera':
        return Division.THIRD_DIVISION;
      default:
        throw new Error(`División string inválida: ${divisionString}`);
    }
  }

  /**
   * Convierte número de división a string
   */
  public static toString(divisionNumber: number): string {
    switch (divisionNumber) {
      case Division.FIRST_DIVISION:
        return 'primera';
      case Division.SECOND_DIVISION:
        return 'segunda';
      case Division.THIRD_DIVISION:
        return 'tercera';
      default:
        throw new Error(`Número de división inválido: ${divisionNumber}`);
    }
  }
}

/**
 * Nombres de las estadísticas del jugador
 */
export const PLAYER_STAT_NAMES = [
  'speed',
  'shooting', 
  'passing',
  'defending',
  'goalkeeping'
] as const;

export type PlayerStatName = typeof PLAYER_STAT_NAMES[number];

/**
 * Interfaz para las estadísticas del jugador
 */
export interface PlayerStats {
  speed: number;
  shooting: number;
  passing: number;
  defending: number;
  goalkeeping: number;
  overall: number; // Calculado automáticamente
}

/**
 * Generador de estadísticas por división
 */
export class StatsGenerator {
  /**
   * Genera estadísticas aleatorias para un jugador según su división
   */
  public static generateRandomStats(divisionString: string): PlayerStats {
    const divisionNumber = Division.fromString(divisionString);
    const division = new Division(divisionNumber);
    
    const startingTotal = division.getStartingStats();
    const maxTotal = division.getMaxStats();
    
    // Generar total aleatorio entre starting y max
    const totalStats = Math.floor(
      Math.random() * (maxTotal - startingTotal + 1) + startingTotal
    );
    
    return this.distributeStats(totalStats);
  }

  /**
   * Genera estadísticas específicas para un jugador según su división y rareza
   */
  public static generateStatsForPlayer(
    divisionString: string, 
    rarity: string, 
    position: string
  ): PlayerStats {
    const divisionNumber = Division.fromString(divisionString);
    const division = new Division(divisionNumber);
    
    const startingTotal = division.getStartingStats();
    const maxTotal = division.getMaxStats();
    
    // Calcular total basado en rareza
    const rarityMultiplier = this.getRarityMultiplier(rarity);
    const totalStats = Math.floor(
      startingTotal + (maxTotal - startingTotal) * rarityMultiplier
    );
    
    return this.distributeStatsByPosition(totalStats, position);
  }

  /**
   * Distribuye las estadísticas totales entre las 5 categorías
   */
  private static distributeStats(totalStats: number): PlayerStats {
    // Distribución base (cada stat recibe una parte)
    const basePerStat = Math.floor(totalStats / 5);
    const remainder = totalStats % 5;
    
    const stats: PlayerStats = {
      speed: basePerStat,
      shooting: basePerStat,
      passing: basePerStat,
      defending: basePerStat,
      goalkeeping: basePerStat,
      overall: 0
    };
    
    // Distribuir el resto aleatoriamente
    const statNames = [...PLAYER_STAT_NAMES];
    for (let i = 0; i < remainder; i++) {
      const randomIndex = Math.floor(Math.random() * statNames.length);
      const statName = statNames[randomIndex];
      stats[statName]++;
    }
    
    // Calcular overall
    stats.overall = Math.floor(
      (stats.speed + stats.shooting + stats.passing + stats.defending + stats.goalkeeping) / 5
    );
    
    return stats;
  }

  /**
   * Distribuye estadísticas según la posición del jugador
   */
  private static distributeStatsByPosition(totalStats: number, position: string): PlayerStats {
    const stats: PlayerStats = {
      speed: 0,
      shooting: 0,
      passing: 0,
      defending: 0,
      goalkeeping: 0,
      overall: 0
    };
    
    // Distribución por posición
    switch (position.toLowerCase()) {
      case 'goalkeeper':
        stats.goalkeeping = Math.floor(totalStats * 0.4); // 40%
        stats.defending = Math.floor(totalStats * 0.25);   // 25%
        stats.passing = Math.floor(totalStats * 0.15);     // 15%
        stats.speed = Math.floor(totalStats * 0.1);        // 10%
        stats.shooting = Math.floor(totalStats * 0.1);     // 10%
        break;
        
      case 'defender':
        stats.defending = Math.floor(totalStats * 0.35);   // 35%
        stats.passing = Math.floor(totalStats * 0.25);     // 25%
        stats.speed = Math.floor(totalStats * 0.2);        // 20%
        stats.goalkeeping = Math.floor(totalStats * 0.1);  // 10%
        stats.shooting = Math.floor(totalStats * 0.1);     // 10%
        break;
        
      case 'midfielder':
        stats.passing = Math.floor(totalStats * 0.35);     // 35%
        stats.speed = Math.floor(totalStats * 0.25);       // 25%
        stats.shooting = Math.floor(totalStats * 0.2);     // 20%
        stats.defending = Math.floor(totalStats * 0.15);   // 15%
        stats.goalkeeping = Math.floor(totalStats * 0.05); // 5%
        break;
        
      case 'forward':
        stats.shooting = Math.floor(totalStats * 0.4);     // 40%
        stats.speed = Math.floor(totalStats * 0.3);        // 30%
        stats.passing = Math.floor(totalStats * 0.15);     // 15%
        stats.defending = Math.floor(totalStats * 0.1);    // 10%
        stats.goalkeeping = Math.floor(totalStats * 0.05); // 5%
        break;
        
      default:
        // Distribución equilibrada para posición desconocida
        return this.distributeStats(totalStats);
    }
    
    // Ajustar para que la suma sea exacta
    const currentTotal = stats.speed + stats.shooting + stats.passing + stats.defending + stats.goalkeeping;
    const difference = totalStats - currentTotal;
    
    if (difference !== 0) {
      // Añadir/quitar la diferencia a la stat principal de la posición
      const mainStat = this.getMainStatForPosition(position);
      stats[mainStat] += difference;
    }
    
    // Calcular overall
    stats.overall = Math.floor(
      (stats.speed + stats.shooting + stats.passing + stats.defending + stats.goalkeeping) / 5
    );
    
    return stats;
  }

  /**
   * Obtiene el multiplicador de rareza
   */
  private static getRarityMultiplier(rarity: string): number {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return 0.9;  // 90% del rango máximo
      case 'epic':
        return 0.75; // 75% del rango máximo
      case 'rare':
        return 0.6;  // 60% del rango máximo
      case 'uncommon':
        return 0.4;  // 40% del rango máximo
      case 'common':
        return 0.2;  // 20% del rango máximo
      default:
        return 0.5;  // 50% por defecto
    }
  }

  /**
   * Obtiene la estadística principal para una posición
   */
  private static getMainStatForPosition(position: string): PlayerStatName {
    switch (position.toLowerCase()) {
      case 'goalkeeper':
        return 'goalkeeping';
      case 'defender':
        return 'defending';
      case 'midfielder':
        return 'passing';
      case 'forward':
        return 'shooting';
      default:
        return 'speed';
    }
  }
}

/**
 * Utilidades para trabajar con divisiones
 */
export class DivisionUtils {
  /**
   * Valida si un conjunto de estadísticas es válido para una división
   */
  public static validateStatsForDivision(stats: PlayerStats, divisionString: string): boolean {
    const divisionNumber = Division.fromString(divisionString);
    const division = new Division(divisionNumber);
    
    const totalStats = stats.speed + stats.shooting + stats.passing + stats.defending + stats.goalkeeping;
    const startingStats = division.getStartingStats();
    const maxStats = division.getMaxStats();
    
    return totalStats >= startingStats && totalStats <= maxStats;
  }

  /**
   * Valida que las stats base sumen exactamente el valor de starting stats
   */
  public static validateBaseStatsSum(stats: PlayerStats, divisionString: string): boolean {
    const divisionNumber = Division.fromString(divisionString);
    const division = new Division(divisionNumber);
    
    const totalStats = stats.speed + stats.shooting + stats.passing + stats.defending + stats.goalkeeping;
    const expectedTotal = division.getStartingStats();
    
    return totalStats === expectedTotal;
  }

  /**
   * Obtiene el rango de estadísticas para una división
   */
  public static getStatsRange(divisionString: string): { min: number; max: number } {
    const divisionNumber = Division.fromString(divisionString);
    const division = new Division(divisionNumber);
    
    return {
      min: division.getStartingStats(),
      max: division.getMaxStats()
    };
  }

  /**
   * Obtiene el rango de porcentajes para una división
   */
  public static getPercentageRange(divisionString: string): { min: number; max: number } {
    const divisionNumber = Division.fromString(divisionString);
    const division = new Division(divisionNumber);
    
    return {
      min: division.getStartingPercentage(),
      max: division.getMaxPercentage()
    };
  }

  /**
   * Convierte estadísticas a porcentajes según la división
   */
  public static statsToPercentages(stats: PlayerStats, divisionString: string): PlayerStats {
    const range = this.getStatsRange(divisionString);
    const percentageRange = this.getPercentageRange(divisionString);
    
    const convertStat = (statValue: number): number => {
      // Normalizar stat al rango de la división
      const normalized = (statValue - range.min) / (range.max - range.min);
      // Convertir a porcentaje de la división
      const percentage = percentageRange.min + (normalized * (percentageRange.max - percentageRange.min));
      return Math.round(Math.max(percentageRange.min, Math.min(percentageRange.max, percentage)));
    };

    return {
      speed: convertStat(stats.speed),
      shooting: convertStat(stats.shooting),
      passing: convertStat(stats.passing),
      defending: convertStat(stats.defending),
      goalkeeping: convertStat(stats.goalkeeping),
      overall: convertStat(stats.overall)
    };
  }

  /**
   * Convierte porcentajes a estadísticas según la división
   */
  public static percentagesToStats(percentages: PlayerStats, divisionString: string): PlayerStats {
    const range = this.getStatsRange(divisionString);
    const percentageRange = this.getPercentageRange(divisionString);
    
    const convertPercentage = (percentage: number): number => {
      // Normalizar porcentaje al rango 0-1
      const normalized = (percentage - percentageRange.min) / (percentageRange.max - percentageRange.min);
      // Convertir a stat de la división
      const statValue = range.min + (normalized * (range.max - range.min));
      return Math.round(Math.max(range.min, Math.min(range.max, statValue)));
    };

    return {
      speed: convertPercentage(percentages.speed),
      shooting: convertPercentage(percentages.shooting),
      passing: convertPercentage(percentages.passing),
      defending: convertPercentage(percentages.defending),
      goalkeeping: convertPercentage(percentages.goalkeeping),
      overall: convertPercentage(percentages.overall)
    };
  }
}

/**
 * Configuración de estadísticas por división
 */
export const DIVISION_CONFIG = {
  [Division.FIRST_DIVISION]: {
    name: 'primera',
    maxPercentage: 90,
    maxStats: 171,
    startingPercentage: 50,
    startingStats: 95,
    description: 'División de élite con los mejores jugadores'
  },
  [Division.SECOND_DIVISION]: {
    name: 'segunda',
    maxPercentage: 80,
    maxStats: 152,
    startingPercentage: 40,
    startingStats: 76,
    description: 'División intermedia con jugadores competitivos'
  },
  [Division.THIRD_DIVISION]: {
    name: 'tercera',
    maxPercentage: 70,
    maxStats: 133,
    startingPercentage: 30,
    startingStats: 57,
    description: 'División inicial para nuevos jugadores'
  }
} as const;

/**
 * Funciones de utilidad para trabajar con divisiones
 */
export const DivisionHelpers = {
  /**
   * Obtiene la configuración completa de una división
   */
  getDivisionConfig(divisionString: string) {
    const divisionNumber = Division.fromString(divisionString);
    return DIVISION_CONFIG[divisionNumber];
  },

  /**
   * Genera estadísticas balanceadas para una división específica
   */
  generateBalancedStats(divisionString: string, rarity: string, position: string): PlayerStats {
    return StatsGenerator.generateStatsForPlayer(divisionString, rarity, position);
  },

  /**
   * Valida si las estadísticas están dentro del rango permitido
   */
  validateStats(stats: PlayerStats, divisionString: string): boolean {
    return DivisionUtils.validateStatsForDivision(stats, divisionString);
  },

  /**
   * Obtiene el rango de stats para mostrar en UI
   */
  getDisplayRange(divisionString: string) {
    const config = this.getDivisionConfig(divisionString);
    return {
      stats: { min: config.startingStats, max: config.maxStats },
      percentage: { min: config.startingPercentage, max: config.maxPercentage }
    };
  },

  /**
   * Calcula la probabilidad de anotar gol basada en stats y división
   */
  calculateGoalProbability(playerStats: PlayerStats, divisionString: string): number {
    const divisionNumber = Division.fromString(divisionString);
    const division = new Division(divisionNumber);
    
    // Obtener probabilidad inicial de la división
    const initialProbability = division.getStartingPercentage() / 100; // 50%, 40%, 30%
    const maxProbability = division.getMaxPercentage() / 100; // 90%, 80%, 70%
    
    // Calcular stats totales del jugador (sin overall)
    const totalPlayerStats = playerStats.speed + playerStats.shooting + 
                            playerStats.passing + playerStats.defending + 
                            playerStats.goalkeeping;
    
    // Obtener rangos de la división
    const minStats = division.getStartingStats(); // 95, 76, 57
    const maxStats = division.getMaxStats(); // 171, 152, 133
    
    // Normalizar stats del jugador al rango 0-1
    const normalizedStats = (totalPlayerStats - minStats) / (maxStats - minStats);
    
    // Calcular probabilidad actual
    const currentProbability = initialProbability + (normalizedStats * (maxProbability - initialProbability));
    
    // Asegurar que esté dentro de los límites
    return Math.max(initialProbability, Math.min(maxProbability, currentProbability));
  },

  /**
   * Obtiene la probabilidad inicial de una división
   */
  getInitialGoalProbability(divisionString: string): number {
    const divisionNumber = Division.fromString(divisionString);
    const division = new Division(divisionNumber);
    return division.getStartingPercentage() / 100;
  },

  /**
   * Obtiene la probabilidad máxima de una división
   */
  getMaxGoalProbability(divisionString: string): number {
    const divisionNumber = Division.fromString(divisionString);
    const division = new Division(divisionNumber);
    return division.getMaxPercentage() / 100;
  }
};