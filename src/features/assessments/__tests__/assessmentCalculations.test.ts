import { describe, it, expect } from 'vitest';
import {
  PROTOCOL_SPECIFICATIONS,
  validateMeasurement,
  calculateBestScore,
  estimatePercentileRank,
} from '../assessmentCalculations';

describe('Assessment Engine — Protocols & Calculation Rules', () => {
  describe('Protocol Specifications Integrity', () => {
    it('defines exactly 6 standard physical protocols modeled on SAI guidelines', () => {
      const protocols = Object.values(PROTOCOL_SPECIFICATIONS);
      expect(protocols).toHaveLength(6);
    });

    it('configures 30m Sprint with lowerIsBetter = true and max 3 attempts', () => {
      const sprint = PROTOCOL_SPECIFICATIONS.TEST_30M_SPRINT;
      expect(sprint).toBeDefined();
      expect(sprint.lowerIsBetter).toBe(true);
      expect(sprint.unit).toBe('sec');
      expect(sprint.maxAttempts).toBe(3);
      expect(sprint.validRange.min).toBe(3.0);
      expect(sprint.validRange.max).toBe(12.0);
    });

    it('configures Vertical Jump with lowerIsBetter = false and max 3 attempts', () => {
      const jump = PROTOCOL_SPECIFICATIONS.TEST_VERT_JUMP;
      expect(jump).toBeDefined();
      expect(jump.lowerIsBetter).toBe(false);
      expect(jump.unit).toBe('cm');
      expect(jump.maxAttempts).toBe(3);
      expect(jump.validRange.min).toBe(10.0);
      expect(jump.validRange.max).toBe(120.0);
    });

    it('configures Beep Test with lowerIsBetter = false and max 1 attempt', () => {
      const beep = PROTOCOL_SPECIFICATIONS.TEST_BEEP_RUN;
      expect(beep).toBeDefined();
      expect(beep.lowerIsBetter).toBe(false);
      expect(beep.unit).toBe('shuttles');
      expect(beep.maxAttempts).toBe(1);
      expect(beep.validRange.min).toBe(1);
      expect(beep.validRange.max).toBe(200);
    });

    it('configures Sit and Reach with lowerIsBetter = false and max 3 attempts', () => {
      const reach = PROTOCOL_SPECIFICATIONS.TEST_SIT_REACH;
      expect(reach).toBeDefined();
      expect(reach.lowerIsBetter).toBe(false);
      expect(reach.unit).toBe('cm');
      expect(reach.maxAttempts).toBe(3);
      expect(reach.validRange.min).toBe(0.0);
      expect(reach.validRange.max).toBe(60.0);
    });

    it('configures Illinois Agility with lowerIsBetter = true and max 3 attempts', () => {
      const agility = PROTOCOL_SPECIFICATIONS.TEST_ILLINOIS;
      expect(agility).toBeDefined();
      expect(agility.lowerIsBetter).toBe(true);
      expect(agility.unit).toBe('sec');
      expect(agility.maxAttempts).toBe(3);
      expect(agility.validRange.min).toBe(12.0);
      expect(agility.validRange.max).toBe(35.0);
    });

    it('configures Anthropometric with lowerIsBetter = false', () => {
      const anthro = PROTOCOL_SPECIFICATIONS.TEST_ANTHRO;
      expect(anthro).toBeDefined();
      expect(anthro.category).toBe('anthropometric');
      expect(anthro.unit).toBe('cm');
      expect(anthro.validRange.min).toBe(100.0);
      expect(anthro.validRange.max).toBe(240.0);
    });
  });

  describe('Measurement Validation (validateMeasurement)', () => {
    it('accepts null or undefined values as non-failing optional attempts', () => {
      expect(validateMeasurement('TEST_30M_SPRINT', null).isValid).toBe(true);
      expect(validateMeasurement('TEST_30M_SPRINT', undefined).isValid).toBe(true);
    });

    it('rejects negative numbers strictly matching PostgreSQL schema check constraints', () => {
      const res = validateMeasurement('TEST_30M_SPRINT', -4.2);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/cannot be negative/i);
    });

    it('rejects non-numeric NaN values', () => {
      const res = validateMeasurement('TEST_30M_SPRINT', NaN);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/valid number/i);
    });

    it('validates 30m sprint in the acceptable range 3.0s to 12.0s', () => {
      expect(validateMeasurement('TEST_30M_SPRINT', 4.35).isValid).toBe(true);
      expect(validateMeasurement('TEST_30M_SPRINT', 2.1).isValid).toBe(false); // World record impossibility
      expect(validateMeasurement('TEST_30M_SPRINT', 14.5).isValid).toBe(false); // Out of bounds
    });

    it('validates vertical jump in the acceptable range 10.0cm to 120.0cm', () => {
      expect(validateMeasurement('TEST_VERT_JUMP', 45.0).isValid).toBe(true);
      expect(validateMeasurement('TEST_VERT_JUMP', 5.0).isValid).toBe(false);
      expect(validateMeasurement('TEST_VERT_JUMP', 135.0).isValid).toBe(false);
    });

    it('validates beep test shuttles in the range 1 to 200', () => {
      expect(validateMeasurement('TEST_BEEP_RUN', 65).isValid).toBe(true);
      expect(validateMeasurement('TEST_BEEP_RUN', 0).isValid).toBe(false);
      expect(validateMeasurement('TEST_BEEP_RUN', 250).isValid).toBe(false);
    });
  });

  describe('Multi-Trial Best Score Calculations (calculateBestScore)', () => {
    it('selects the lowest score when lowerIsBetter is true (30m Sprint)', () => {
      // 3 attempts: 4.52s, 4.38s, 4.45s -> Best is 4.38s
      const result = calculateBestScore('TEST_30M_SPRINT', [4.52, 4.38, 4.45]);
      expect(result.validCount).toBe(3);
      expect(result.bestScore).toBe(4.38);
      expect(result.error).toBeUndefined();
    });

    it('selects the highest score when lowerIsBetter is false (Vertical Jump)', () => {
      // 3 attempts: 42.5cm, 45.0cm, 43.8cm -> Best is 45.0cm
      const result = calculateBestScore('TEST_VERT_JUMP', [42.5, 45.0, 43.8]);
      expect(result.validCount).toBe(3);
      expect(result.bestScore).toBe(45.0);
      expect(result.error).toBeUndefined();
    });

    it('handles single valid attempt when subsequent attempts are null', () => {
      const result = calculateBestScore('TEST_30M_SPRINT', [4.65, null, null]);
      expect(result.validCount).toBe(1);
      expect(result.bestScore).toBe(4.65);
    });

    it('handles two valid attempts correctly with lowerIsBetter', () => {
      const result = calculateBestScore('TEST_ILLINOIS', [17.8, 16.9, null]);
      expect(result.validCount).toBe(2);
      expect(result.bestScore).toBe(16.9);
    });

    it('returns bestScore: null when no valid attempts are provided', () => {
      const result = calculateBestScore('TEST_VERT_JUMP', [null, null, null]);
      expect(result.validCount).toBe(0);
      expect(result.bestScore).toBeNull();
    });

    it('returns an error if any provided attempt violates valid ranges', () => {
      const result = calculateBestScore('TEST_30M_SPRINT', [4.5, 1.2, 4.3]);
      expect(result.bestScore).toBeNull();
      expect(result.error).toMatch(/Trial 2.*below the realistic minimum/i);
    });

    it('rounds score to exactly two decimal places matching NUMERIC(8, 2)', () => {
      const result = calculateBestScore('TEST_30M_SPRINT', [4.33333, null, null]);
      expect(result.bestScore).toBe(4.33);
    });
  });

  describe('Normative Percentile Benchmarking (estimatePercentileRank)', () => {
    it('returns null to avoid speculative estimations without authoritative normative data', () => {
      // In accordance with Phase 3D.5 accuracy audit:
      // Without empirical age/gender-stratified reference datasets, heuristic percentiles are disabled.
      expect(estimatePercentileRank('TEST_30M_SPRINT', 3.8)).toBeNull();
      expect(estimatePercentileRank('TEST_30M_SPRINT', 4.6)).toBeNull();
      expect(estimatePercentileRank('TEST_VERT_JUMP', 62)).toBeNull();
      expect(estimatePercentileRank('TEST_ANTHRO', 175)).toBeNull();
    });

    it('returns null for negative or zero measurements', () => {
      expect(estimatePercentileRank('TEST_30M_SPRINT', 0)).toBeNull();
      expect(estimatePercentileRank('TEST_30M_SPRINT', -5)).toBeNull();
    });
  });
});
