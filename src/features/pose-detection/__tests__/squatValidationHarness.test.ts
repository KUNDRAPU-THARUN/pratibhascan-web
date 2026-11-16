import { describe, it, expect } from 'vitest';
import { runSquatValidationHarness } from '../utils/squatValidationHarness';

describe('Squat Kinematics Validation Harness Suite (Phase 4C 16-Scenario Matrix)', () => {
  it('passes complete 16-scenario synthetic kinematic validation with zero false positives and zero missed repetitions', () => {
    const results = runSquatValidationHarness();

    expect(results.totalSequences).toBe(16);
    expect(results.passedSequences).toBe(16);
    expect(results.totalExpectedReps).toBe(11);
    expect(results.totalDetectedReps).toBe(11);
    expect(results.falsePositives).toBe(0);
    expect(results.missedReps).toBe(0);
    expect(results.expectedPartials).toBe(1);
    expect(results.detectedPartials).toBe(1);
    expect(results.maxAngleErrorDeg).toBeLessThanOrEqual(2.0);
    expect(results.pass).toBe(true);

    // Verify all 16 sequence breakdowns individual pass status
    for (const seq of results.sequenceBreakdown) {
      expect(seq.passed).toBe(true);
      expect(seq.detectedReps).toBe(seq.expectedReps);
      expect(seq.detectedPartials).toBe(seq.expectedPartials);
    }
  });
});
