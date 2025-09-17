import { Injectable } from '@nestjs/common';
import { Division } from '../config/division.config';
import { PlayerStats } from '../types';

/**
 * Servicio de Probabilidad de Penalty - Implementación Robusta
 * Implementa la fórmula canónica exacta solicitada
 */
@Injectable()
export class PenaltyProbabilityService {
  
  /**
   * Calcula la probabilidad de anotar gol usando la fórmula canónica
   * 
   * Fórmula:
   * sumSubstats = speed + shooting + passing + defense + goalkeeping
   * ratio = clamp(sumSubstats / maxStats, 0, 1)
   * chance = floor(clamp(startingPercentage + (maxPercentage - startingPercentage) * ratio, 5, 95))
   * 
   * @param character - Stats del personaje
   * @param division - División del personaje ('primera', 'segunda', 'tercera')
   * @returns Probabilidad de gol como entero [5-95]
   */
  computeChance(character: PlayerStats, division: string): number {
    try {
      // 1. Obtener configuración de la división
      const divisionNumber = Division.fromString(division);
      const divisionObj = new Division(divisionNumber);
      
      const startingPercentage = divisionObj.getStartingPercentage();
      const maxPercentage = divisionObj.getMaxPercentage();
      const maxStats = divisionObj.getMaxStats();
      
      // 2. Calcular suma de substats (sin incluir overall)
      const sumSubstats = character.speed + character.shooting + character.passing + 
                         character.defending + character.goalkeeping;
      
      // 3. Calcular ratio con clamp [0, 1]
      const ratio = this.clamp(sumSubstats / maxStats, 0, 1);
      
      // 4. Interpolar entre startingPercentage y maxPercentage
      const interpolatedChance = startingPercentage + (maxPercentage - startingPercentage) * ratio;
      
      // 5. Aplicar clamp [5, 95] y floor
      const finalChance = Math.floor(this.clamp(interpolatedChance, 5, 95));
      
      return finalChance;
      
    } catch (error) {
      console.error('Error calculating penalty chance:', error);
      // Fallback seguro
      return 50;
    }
  }
  
  /**
   * Decide si un penalty es gol usando roll [1..100]
   * 
   * @param character - Stats del personaje
   * @param division - División del personaje
   * @param rng - Número aleatorio opcional [0-1], si no se proporciona usa Math.random()
   * @returns true si es gol, false si es fallo
   */
  decidePenalty(character: PlayerStats, division: string, rng?: number): boolean {
    try {
      // 1. Calcular probabilidad usando fórmula canónica
      const chance = this.computeChance(character, division);
      
      // 2. Generar roll en [1..100]
      const randomValue = rng !== undefined ? rng : Math.random();
      const roll = Math.floor(randomValue * 100) + 1; // [1..100]
      
      // 3. Decisión: roll ≤ chance = gol
      const isGoal = roll <= chance;
      
      // Log para debugging
      console.log(`Penalty Decision: chance=${chance}%, roll=${roll}, result=${isGoal ? 'GOAL' : 'MISS'}`);
      
      return isGoal;
      
    } catch (error) {
      console.error('Error deciding penalty outcome:', error);
      // Fallback seguro - 50% chance
      return Math.random() < 0.5;
    }
  }
  
  /**
   * Función de clamp para limitar valores entre min y max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Valida que las stats de un personaje sumen exactamente startingStats de su división
   */
  validateCharacterStatsSum(character: PlayerStats, division: string): boolean {
    try {
      const divisionNumber = Division.fromString(division);
      const divisionObj = new Division(divisionNumber);
      const expectedSum = divisionObj.getStartingStats();
      
      const actualSum = character.speed + character.shooting + character.passing + 
                       character.defending + character.goalkeeping;
      
      return actualSum === expectedSum;
      
    } catch (error) {
      console.error('Error validating character stats sum:', error);
      return false;
    }
  }
  
  /**
   * Valida que las stats progresadas no excedan maxStats de la división
   */
  validateProgressionLimits(character: PlayerStats, division: string): boolean {
    try {
      const divisionNumber = Division.fromString(division);
      const divisionObj = new Division(divisionNumber);
      const maxStats = divisionObj.getMaxStats();
      
      const totalStats = character.speed + character.shooting + character.passing + 
                        character.defending + character.goalkeeping;
      
      return totalStats <= maxStats;
      
    } catch (error) {
      console.error('Error validating progression limits:', error);
      return false;
    }
  }
  
  /**
   * Obtiene información detallada del cálculo para debugging
   */
  getCalculationDetails(character: PlayerStats, division: string): {
    sumSubstats: number;
    ratio: number;
    startingPercentage: number;
    maxPercentage: number;
    maxStats: number;
    interpolatedChance: number;
    finalChance: number;
    isValidSum: boolean;
    isWithinLimits: boolean;
  } {
    const divisionNumber = Division.fromString(division);
    const divisionObj = new Division(divisionNumber);
    
    const startingPercentage = divisionObj.getStartingPercentage();
    const maxPercentage = divisionObj.getMaxPercentage();
    const maxStats = divisionObj.getMaxStats();
    
    const sumSubstats = character.speed + character.shooting + character.passing + 
                       character.defending + character.goalkeeping;
    
    const ratio = this.clamp(sumSubstats / maxStats, 0, 1);
    const interpolatedChance = startingPercentage + (maxPercentage - startingPercentage) * ratio;
    const finalChance = Math.floor(this.clamp(interpolatedChance, 5, 95));
    
    return {
      sumSubstats,
      ratio,
      startingPercentage,
      maxPercentage,
      maxStats,
      interpolatedChance,
      finalChance,
      isValidSum: this.validateCharacterStatsSum(character, division),
      isWithinLimits: this.validateProgressionLimits(character, division)
    };
  }
}