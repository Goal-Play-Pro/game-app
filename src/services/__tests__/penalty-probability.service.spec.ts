import { PenaltyProbabilityService } from '../penalty-probability.service';

const service = new PenaltyProbabilityService();

const terceraBase = {
  speed: 12,
  shooting: 12,
  passing: 11,
  defending: 11,
  goalkeeping: 11,
} as any;

const segundaBase = {
  speed: 16,
  shooting: 16,
  passing: 15,
  defending: 15,
  goalkeeping: 14,
} as any;

describe('PenaltyProbabilityService', () => {
  describe('computeChance', () => {
    it('clamps results within 5-95 range', () => {
      const lowStats = { speed: 5, shooting: 5, passing: 5, defending: 5, goalkeeping: 5 } as any;
      const highStats = { speed: 40, shooting: 40, passing: 40, defending: 40, goalkeeping: 40 } as any;

      expect(service.computeChance(lowStats, 'tercera')).toBeGreaterThanOrEqual(5);
      expect(service.computeChance(highStats, 'primera')).toBeLessThanOrEqual(95);
    });

    it('increases chance with better divisions and stats', () => {
      const terceraChance = service.computeChance(terceraBase, 'tercera');
      const primeraChance = service.computeChance({ ...terceraBase, speed: terceraBase.speed + 30 }, 'primera');

      expect(primeraChance).toBeGreaterThan(terceraChance);
    });
  });

  describe('decidePenalty', () => {
    it('uses deterministic rng when provided', () => {
      const chance = service.computeChance(segundaBase, 'segunda');
      const alwaysHit = service.decidePenalty(segundaBase, 'segunda', (chance - 1) / 100);
      const alwaysMiss = service.decidePenalty(segundaBase, 'segunda', chance / 100);

      expect(alwaysHit).toBe(true);
      expect(alwaysMiss).toBe(false);
    });
  });

  describe('validation helpers', () => {
    it('validates starting sums per division', () => {
      expect(service.validateCharacterStatsSum(terceraBase, 'tercera')).toBe(true);
      expect(service.validateCharacterStatsSum({ ...terceraBase, speed: terceraBase.speed + 1 }, 'tercera')).toBe(false);
    });

    it('checks progression limits', () => {
      expect(service.validateProgressionLimits(segundaBase, 'segunda')).toBe(true);
      expect(service.validateProgressionLimits({ ...segundaBase, speed: segundaBase.speed + 200 }, 'segunda')).toBe(false);
    });
  });

  describe('getCalculationDetails', () => {
    it('returns rich debug payload', () => {
      const details = service.getCalculationDetails(terceraBase, 'primera');

      expect(details).toEqual(
        expect.objectContaining({
          sumSubstats: expect.any(Number),
          ratio: expect.any(Number),
          finalChance: expect.any(Number),
          isValidSum: expect.any(Boolean),
          isWithinLimits: expect.any(Boolean),
        }),
      );
    });
  });
});
