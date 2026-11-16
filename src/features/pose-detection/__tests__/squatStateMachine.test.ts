import { describe, it, expect, beforeEach } from 'vitest';
import { SquatStateMachine } from '../utils/squatStateMachine';
import { generateLandmarksFromAngles } from '../utils/squatValidationHarness';

describe('Squat Movement State Machine Suite', () => {
  let fsm: SquatStateMachine;

  beforeEach(() => {
    fsm = new SquatStateMachine({ smoothingFactor: 0.95 });
    fsm.startSession(1000);
  });

  it('initializes in idle or standing when upright posture is presented', () => {
    const standingLm = generateLandmarksFromAngles(175, 170);
    const metrics = fsm.processFrame(standingLm, 1050);

    expect(metrics.currentState).toBe('standing');
    expect(metrics.repetitionCount).toBe(0);
    expect(metrics.kneeAngle).toBeCloseTo(175, 0);
  });

  it('completes a full, authentic repetition through all 5 sequential phases', () => {
    let t = 1000;

    // 1. Standing upright (175°)
    fsm.processFrame(generateLandmarksFromAngles(175), t);
    t += 300;

    // 2. Descent initiation: knee angle drops below 140°
    const descMetrics = fsm.processFrame(generateLandmarksFromAngles(135), t);
    expect(descMetrics.currentState).toBe('descending');
    t += 400;

    // Further descent to 108°
    fsm.processFrame(generateLandmarksFromAngles(108), t);
    t += 300;

    // 3. Bottom threshold attained (≤ 100°)
    const bottomMetrics = fsm.processFrame(generateLandmarksFromAngles(88), t);
    expect(bottomMetrics.currentState).toBe('bottom');
    t += 80; // Hold bottom for > 50ms

    fsm.processFrame(generateLandmarksFromAngles(88), t);
    t += 50;

    // 4. Ascent: knee angle rises above 115°
    const ascendMetrics = fsm.processFrame(generateLandmarksFromAngles(125), t);
    expect(ascendMetrics.currentState).toBe('ascending');
    t += 400;

    // 5. Completion: returns to full standing extension (≥ 155°)
    const completeMetrics = fsm.processFrame(generateLandmarksFromAngles(175), t);

    expect(completeMetrics.repetitionCount).toBe(1);
    expect(completeMetrics.partialRepCount).toBe(0);
    expect(completeMetrics.lastRepDurationMs).toBeGreaterThanOrEqual(600);
    expect(completeMetrics.repHistory).toHaveLength(1);
    expect(completeMetrics.repHistory[0].minKneeAngle).toBeLessThanOrEqual(90);
  });

  it('rejects partial/incomplete squats that do not reach target depth (≤ 100°)', () => {
    let t = 1000;
    fsm.processFrame(generateLandmarksFromAngles(175), t);
    t += 300;

    // Descends only to 125° (quarter squat)
    const desc = fsm.processFrame(generateLandmarksFromAngles(132), t);
    expect(desc.currentState).toBe('descending');
    t += 400;

    fsm.processFrame(generateLandmarksFromAngles(125), t);
    t += 300;

    // Aborts squat and stands back up (rises above 145°)
    const aborted = fsm.processFrame(generateLandmarksFromAngles(170), t);

    expect(aborted.repetitionCount).toBe(0); // Zero valid reps
    expect(aborted.partialRepCount).toBe(1); // Tracked as partial
    expect(aborted.currentState).toBe('standing');
  });

  it('rejects rapid false-positive twitches (< 600ms duration gate)', () => {
    let t = 1000;
    fsm.processFrame(generateLandmarksFromAngles(175), t);
    t += 300;

    // Instant downward spike (descends and hits 85° within 100ms)
    fsm.processFrame(generateLandmarksFromAngles(130), t);
    t += 50;
    fsm.processFrame(generateLandmarksFromAngles(85), t);
    t += 60; // bottom hold
    fsm.processFrame(generateLandmarksFromAngles(120), t);
    t += 50;
    // Returns to standing after only ~260ms total duration
    const result = fsm.processFrame(generateLandmarksFromAngles(175), t);

    expect(result.repetitionCount).toBe(0); // Discarded as twitch
  });

  it('ignores stationary standing jitter without false count initiation', () => {
    let t = 1000;
    for (let f = 0; f < 30; f++) {
      const jitter = Math.sin(f) * 4; // ±4° noise around 170°
      const res = fsm.processFrame(generateLandmarksFromAngles(170 + jitter), t);
      expect(res.currentState).toBe('standing');
      expect(res.repetitionCount).toBe(0);
      t += 33;
    }
  });

  it('handles tracking loss mid-movement and aborts safely if lost for > 1500ms', () => {
    let t = 1000;
    fsm.processFrame(generateLandmarksFromAngles(175), t);
    t += 300;

    // Descend
    fsm.processFrame(generateLandmarksFromAngles(130), t);
    t += 200;

    // Low confidence frame 1, 2, 3 (loss)
    fsm.processFrame(generateLandmarksFromAngles(130, 150, 0.1), t);
    t += 33;
    fsm.processFrame(generateLandmarksFromAngles(130, 150, 0.1), t);
    t += 33;
    const lostMetrics = fsm.processFrame(generateLandmarksFromAngles(130, 150, 0.1), t);
    expect(lostMetrics.currentState).toBe('tracking_lost');

    // 1600ms pass while lost
    t += 1600;
    fsm.processFrame(generateLandmarksFromAngles(130, 150, 0.1), t);

    // Subject returns standing
    t += 100;
    const restored = fsm.processFrame(generateLandmarksFromAngles(175, 170, 0.95), t);
    expect(restored.currentState).toBe('standing');
    expect(restored.repetitionCount).toBe(0); // Aborted cleanly
  });

  it('resets repetition count, partials, and duration on reset()', () => {
    fsm.processFrame(generateLandmarksFromAngles(175), 1000);
    fsm.reset();

    const metrics = fsm.processFrame([], 2000);
    expect(metrics.repetitionCount).toBe(0);
    expect(metrics.partialRepCount).toBe(0);
    expect(metrics.currentState).toBe('idle');
    expect(metrics.sessionDurationSec).toBe(0);
  });

  it('records granular timing breakdown (descent, bottom, ascent) on completed repetition', () => {
    let t = 1000;
    fsm.processFrame(generateLandmarksFromAngles(175), t);
    t += 300;

    // Descent starts at t=1300
    fsm.processFrame(generateLandmarksFromAngles(135), t);
    t += 500;

    // Bottom reached at t=1800
    fsm.processFrame(generateLandmarksFromAngles(88), t);
    t += 200;

    // Ascent starts at t=2000
    fsm.processFrame(generateLandmarksFromAngles(125), t);
    t += 500;

    // Completed at t=2500
    const metrics = fsm.processFrame(generateLandmarksFromAngles(175), t);

    expect(metrics.repetitionCount).toBe(1);
    const rep = metrics.repHistory[0];
    expect(rep.isCompleted).toBe(true);
    expect(rep.descentDurationMs).toBeGreaterThan(0);
    expect(rep.bottomDurationMs).toBeGreaterThan(0);
    expect(rep.ascentDurationMs).toBeGreaterThan(0);
    expect(rep.depthClassification).toBe('below_parallel');
    expect(rep.qualityFeedback).toContain('Valid');
  });

  it('preserves rep metrics and measures pause durations accurately', () => {
    const t = 1000;
    fsm.processFrame(generateLandmarksFromAngles(175), t);

    // Pause at t=2000
    fsm.pauseSession(2000);
    expect(fsm.getMetrics(2500).isSessionActive).toBe(false);

    // Resume at t=4000 (2s paused)
    fsm.startSession(4000);
    expect(fsm.getMetrics(4000).isSessionActive).toBe(true);

    // At t=5000, active elapsed time should be (5000 - 1000) - 2000 = 2 seconds
    const m = fsm.getMetrics(5000);
    expect(m.sessionDurationSec).toBe(2);
  });

  it('calculates valid tracking coverage percentage and tracks interruptions', () => {
    let t = 1000;
    // 8 valid frames
    for (let i = 0; i < 8; i++) {
      fsm.processFrame(generateLandmarksFromAngles(175), t);
      t += 33;
    }
    // 2 invalid frames
    fsm.processFrame(generateLandmarksFromAngles(175, 170, 0.1), t);
    t += 33;
    fsm.processFrame(generateLandmarksFromAngles(175, 170, 0.1), t);

    const metrics = fsm.getMetrics(t);
    expect(metrics.trackingCoveragePercent).toBe(80); // 8 / 10 = 80%
  });
});
