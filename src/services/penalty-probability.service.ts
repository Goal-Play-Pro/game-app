import { Injectable } from '@nestjs/common';
import { PlayerStats } from '../types';

/**
 * Penalty Probability Service - Implementación robusta de la fórmula canónica
 * Calcula probabilidades de penalty basadas en stats de jugador y división
 */
@Injectable()
export class PenaltyProbabilityService {
  
  /**
   * Configuración de divisiones
   */
  private readonly DIVISION_CONFIG = {
    primera: { startingStats: 95, maxStats: 171, startingPercentage: 50, maxPercentage: 90 },
    segunda: { startingStats: 76, maxStats: 152, startingPercentage: 40, maxPercentage: 80 },
    tercera: { startingStats: 57, maxStats: 133, startingPercentage: 30, maxPercentage: 70 }
  };

  /**
   * Fórmula canónica para calcular probabilidad de penalty
   */
  computeChance(character: PlayerStats, division: string): number {
    const config = this.getDivisionConfig(division);
    
    // 1. Suma de substats (sin overall)
    const sumSubstats = character.speed + character.shooting + character.passing + 
                       character.defending + character.goalkeeping;
    
    // 2. Ratio con clamp [0, 1]
    const ratio = this.clamp(sumSubstats / config.maxStats, 0, 1);
    
    // 3. Interpolación entre startingPercentage y maxPercentage
    const interpolatedChance = config.startingPercentage + 
                              (config.maxPercentage - config.startingPercentage) * ratio;
    
    // 4. Clamp [5, 95] y floor
    const finalChance = Math.floor(this.clamp(interpolatedChance, 5, 95));
    
    return finalChance;
  }

  /**
   * Decisión de penalty basada en RNG
   */
  decidePenalty(character: PlayerStats, division: string, rng?: number): boolean {
    const chance = this.computeChance(character, division);
    const randomValue = rng !== undefined ? rng : Math.random();
    const roll = Math.floor(randomValue * 100) + 1; // [1..100]
    return roll <= chance;
  }

  /**
   * Validar que las stats sumen exactamente startingStats
   */
  validateCharacterStatsSum(character: PlayerStats, division: string): boolean {
    const config = this.getDivisionConfig(division);
    const sumSubstats = character.speed + character.shooting + character.passing + 
                       character.defending + character.goalkeeping;
    return sumSubstats === config.startingStats;
  }

  /**
   * Validar que las stats no excedan maxStats
   */
  validateProgressionLimits(character: PlayerStats, division: string): boolean {
    const config = this.getDivisionConfig(division);
    const sumSubstats = character.speed + character.shooting + character.passing + 
                       character.defending + character.goalkeeping;
    return sumSubstats <= config.maxStats;
  }

  /**
   * Obtener detalles completos del cálculo para debugging
   */
  getCalculationDetails(character: PlayerStats, division: string): any {
    const config = this.getDivisionConfig(division);
    const sumSubstats = character.speed + character.shooting + character.passing + 
                       character.defending + character.goalkeeping;
    const ratio = this.clamp(sumSubstats / config.maxStats, 0, 1);
    const interpolatedChance = config.startingPercentage + 
                              (config.maxPercentage - config.startingPercentage) * ratio;
    const finalChance = Math.floor(this.clamp(interpolatedChance, 5, 95));

    return {
      sumSubstats,
      ratio,
      startingPercentage: config.startingPercentage,
      maxPercentage: config.maxPercentage,
      maxStats: config.maxStats,
      interpolatedChance,
      finalChance,
      isValidSum: this.validateCharacterStatsSum(character, division),
      isWithinLimits: this.validateProgressionLimits(character, division)
    };
  }

  /**
   * Utilidades privadas
   */
  private getDivisionConfig(division: string) {
    const normalizedDivision = division.toLowerCase();
    return this.DIVISION_CONFIG[normalizedDivision as keyof typeof this.DIVISION_CONFIG] || 
           this.DIVISION_CONFIG.tercera;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}