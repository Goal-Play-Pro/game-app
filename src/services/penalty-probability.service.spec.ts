import { Test, TestingModule } from '@nestjs/testing';
import { PenaltyProbabilityService } from './penalty-probability.service';
import { PlayerStats } from '../types';

describe('PenaltyProbabilityService', () => {
  let service: PenaltyProbabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PenaltyProbabilityService],
    }).compile();

    service = module.get<PenaltyProbabilityService>(PenaltyProbabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeChance', () => {
    it('should return starting percentage for starting stats', () => {
      // Primera División - Stats que suman exactamente 95
      const primeraStats: PlayerStats = {
        speed: 19,
        shooting: 19,
        passing: 19,
        defending: 19,
        goalkeeping: 19,
        overall: 19
      };

      const chance = service.computeChance(primeraStats, 'primera');
      expect(chance).toBe(50); // startingPercentage de Primera División
    });

    it('should return max percentage for max stats', () => {
      // Primera División - Stats que suman exactamente 171 (maxStats)
      const maxStats: PlayerStats = {
        speed: 34,
        shooting: 34,
        passing: 34,
        defending: 34,
        goalkeeping: 35,
        overall: 34
      };

      const chance = service.computeChance(maxStats, 'primera');
      expect(chance).toBe(90); // maxPercentage de Primera División
    });

    it('should interpolate correctly for intermediate stats', () => {
      // Segunda División - Stats intermedias (114 de 152 max)
      const intermediateStats: PlayerStats = {
        speed: 23,
        shooting: 23,
        passing: 23,
        defending: 23,
        goalkeeping: 22,
        overall: 23
      };

      const chance = service.computeChance(intermediateStats, 'segunda');
      // ratio = (114 - 76) / (152 - 76) = 38/76 = 0.5
      // chance = 40 + (80 - 40) * 0.5 = 40 + 20 = 60
      expect(chance).toBe(60);
    });

    it('should apply clamp [5, 95] correctly', () => {
      // Stats extremadamente bajas
      const lowStats: PlayerStats = {
        speed: 1,
        shooting: 1,
        passing: 1,
        defending: 1,
        goalkeeping: 1,
        overall: 1
      };

      const chance = service.computeChance(lowStats, 'tercera');
      expect(chance).toBeGreaterThanOrEqual(5);

      // Stats extremadamente altas (imposibles pero para test)
      const highStats: PlayerStats = {
        speed: 100,
        shooting: 100,
        passing: 100,
        defending: 100,
        goalkeeping: 100,
        overall: 100
      };

      const chanceHigh = service.computeChance(highStats, 'primera');
      expect(chanceHigh).toBeLessThanOrEqual(95);
    });

    it('should handle all divisions correctly', () => {
      const testStats: PlayerStats = {
        speed: 20,
        shooting: 20,
        passing: 20,
        defending: 20,
        goalkeeping: 20,
        overall: 20
      };

      const primeraChance = service.computeChance(testStats, 'primera');
      const segundaChance = service.computeChance(testStats, 'segunda');
      const terceraChance = service.computeChance(testStats, 'tercera');

      // Primera debe tener menor chance (stats bajas para esa división)
      // Tercera debe tener mayor chance (stats altas para esa división)
      expect(terceraChance).toBeGreaterThan(segundaChance);
      expect(segundaChance).toBeGreaterThan(primeraChance);
    });
  });

  describe('decidePenalty', () => {
    it('should return true when roll <= chance', () => {
      const stats: PlayerStats = {
        speed: 19, shooting: 19, passing: 19, defending: 19, goalkeeping: 19, overall: 19
      };

      // Forzar roll = 1 (siempre menor que cualquier chance válida)
      const result = service.decidePenalty(stats, 'primera', 0.001); // roll = 1
      expect(result).toBe(true);
    });

    it('should return false when roll > chance', () => {
      const stats: PlayerStats = {
        speed: 19, shooting: 19, passing: 19, defending: 19, goalkeeping: 19, overall: 19
      };

      // Forzar roll = 100 (siempre mayor que cualquier chance válida)
      const result = service.decidePenalty(stats, 'primera', 0.999); // roll = 100
      expect(result).toBe(false);
    });

    it('should be deterministic with same rng input', () => {
      const stats: PlayerStats = {
        speed: 19, shooting: 19, passing: 19, defending: 19, goalkeeping: 19, overall: 19
      };

      const result1 = service.decidePenalty(stats, 'primera', 0.5);
      const result2 = service.decidePenalty(stats, 'primera', 0.5);
      
      expect(result1).toBe(result2);
    });
  });

  describe('validateCharacterStatsSum', () => {
    it('should validate correct stats sum for Primera División', () => {
      // Stats que suman exactamente 95
      const validStats: PlayerStats = {
        speed: 19, shooting: 19, passing: 19, defending: 19, goalkeeping: 19, overall: 19
      };

      const isValid = service.validateCharacterStatsSum(validStats, 'primera');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect stats sum', () => {
      // Stats que suman 100 (incorrecto para Primera División)
      const invalidStats: PlayerStats = {
        speed: 20, shooting: 20, passing: 20, defending: 20, goalkeeping: 20, overall: 20
      };

      const isValid = service.validateCharacterStatsSum(invalidStats, 'primera');
      expect(isValid).toBe(false);
    });

    it('should validate all divisions correctly', () => {
      // Primera División: debe sumar 95
      const primeraStats: PlayerStats = {
        speed: 19, shooting: 19, passing: 19, defending: 19, goalkeeping: 19, overall: 19
      };
      expect(service.validateCharacterStatsSum(primeraStats, 'primera')).toBe(true);

      // Segunda División: debe sumar 76
      const segundaStats: PlayerStats = {
        speed: 15, shooting: 15, passing: 15, defending: 15, goalkeeping: 16, overall: 15
      };
      expect(service.validateCharacterStatsSum(segundaStats, 'segunda')).toBe(true);

      // Tercera División: debe sumar 57
      const terceraStats: PlayerStats = {
        speed: 11, shooting: 11, passing: 11, defending: 12, goalkeeping: 12, overall: 11
      };
      expect(service.validateCharacterStatsSum(terceraStats, 'tercera')).toBe(true);
    });
  });

  describe('validateProgressionLimits', () => {
    it('should allow stats within maxStats limit', () => {
      // Stats que suman 150 (dentro del límite de 171 para Primera)
      const validProgressedStats: PlayerStats = {
        speed: 30, shooting: 30, passing: 30, defending: 30, goalkeeping: 30, overall: 30
      };

      const isValid = service.validateProgressionLimits(validProgressedStats, 'primera');
      expect(isValid).toBe(true);
    });

    it('should reject stats exceeding maxStats limit', () => {
      // Stats que suman 200 (excede el límite de 171 para Primera)
      const invalidProgressedStats: PlayerStats = {
        speed: 40, shooting: 40, passing: 40, defending: 40, goalkeeping: 40, overall: 40
      };

      const isValid = service.validateProgressionLimits(invalidProgressedStats, 'primera');
      expect(isValid).toBe(false);
    });
  });

  describe('getCalculationDetails', () => {
    it('should provide complete calculation breakdown', () => {
      const stats: PlayerStats = {
        speed: 19, shooting: 19, passing: 19, defending: 19, goalkeeping: 19, overall: 19
      };

      const details = service.getCalculationDetails(stats, 'primera');

      expect(details).toHaveProperty('sumSubstats', 95);
      expect(details).toHaveProperty('ratio');
      expect(details).toHaveProperty('startingPercentage', 50);
      expect(details).toHaveProperty('maxPercentage', 90);
      expect(details).toHaveProperty('maxStats', 171);
      expect(details).toHaveProperty('interpolatedChance');
      expect(details).toHaveProperty('finalChance');
      expect(details).toHaveProperty('isValidSum', true);
      expect(details).toHaveProperty('isWithinLimits', true);
    });
  });

  describe('Real Players Data Integration', () => {
    it('should validate Emili Mar stats sum correctly', () => {
      // Emili Mar Primera División: 10+5+15+22+43 = 95
      const emiliStats: PlayerStats = {
        speed: 10,
        shooting: 5,
        passing: 15,
        defending: 22,
        goalkeeping: 43,
        overall: 19
      };

      const isValid = service.validateCharacterStatsSum(emiliStats, 'primera');
      expect(isValid).toBe(true);

      const chance = service.computeChance(emiliStats, 'primera');
      expect(chance).toBe(50); // Debe ser exactamente startingPercentage
    });

    it('should validate Vini stats sum correctly', () => {
      // Vini Segunda División: 23+27+14+8+4 = 76
      const viniStats: PlayerStats = {
        speed: 23,
        shooting: 27,
        passing: 14,
        defending: 8,
        goalkeeping: 4,
        overall: 15
      };

      const isValid = service.validateCharacterStatsSum(viniStats, 'segunda');
      expect(isValid).toBe(true);

      const chance = service.computeChance(viniStats, 'segunda');
      expect(chance).toBe(40); // Debe ser exactamente startingPercentage
    });

    it('should validate Achrif Kini stats sum correctly', () => {
      // Achrif Kini Tercera División: 10+6+14+24+3 = 57
      const achrifStats: PlayerStats = {
        speed: 10,
        shooting: 6,
        passing: 14,
        defending: 24,
        goalkeeping: 3,
        overall: 11
      };

      const isValid = service.validateCharacterStatsSum(achrifStats, 'tercera');
      expect(isValid).toBe(true);

      const chance = service.computeChance(achrifStats, 'tercera');
      expect(chance).toBe(30); // Debe ser exactamente startingPercentage
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid division gracefully', () => {
      const stats: PlayerStats = {
        speed: 19, shooting: 19, passing: 19, defending: 19, goalkeeping: 19, overall: 19
      };

      const chance = service.computeChance(stats, 'invalid');
      expect(chance).toBe(50); // Fallback seguro
    });

    it('should handle negative stats gracefully', () => {
      const negativeStats: PlayerStats = {
        speed: -5, shooting: -5, passing: -5, defending: -5, goalkeeping: -5, overall: -5
      };

      const chance = service.computeChance(negativeStats, 'primera');
      expect(chance).toBeGreaterThanOrEqual(5); // Clamp mínimo
    });

    it('should handle zero stats gracefully', () => {
      const zeroStats: PlayerStats = {
        speed: 0, shooting: 0, passing: 0, defending: 0, goalkeeping: 0, overall: 0
      };

      const chance = service.computeChance(zeroStats, 'tercera');
      expect(chance).toBe(5); // Clamp mínimo aplicado
    });
  });
});