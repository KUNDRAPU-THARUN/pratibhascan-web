import { describe, it, expect } from 'vitest';
import { runSquatValidationHarness } from '../utils/squatValidationHarness';

describe('Squat Kinematics Validation Harness Suite (Step 5)', () => {
  it('passes synthetic kinematic validation with zero false positives and zero missed repetitions', () => {
    const results = runSquatValidationHarness();

    expect(results.totalSequences).toBe(5);
    expect(results.totalExpectedReps).toBe(5); // 3 (Seq A) + 0 (Seq B) + 0 (Seq C) + 0 (Seq D) + 2 (Seq E)
    expect(results.totalDetectedReps).toBe(5);
    expect(results.falsePositives).toBe(0);
    expect(results.missedReps).toBe(0);
    expect(results.detectedPartials).toBe(2);
    expect(results.expectedPartials).toBe(2);
    expect(results.pass).toBe(true);

    // Verify all sequence breakdowns
    for (const seq of results.sequenceBreakdown) {
      expect(seq.passed).toBe(true);
      expect(seq.detected).toBe(seq.expected);
    }
  });
});
