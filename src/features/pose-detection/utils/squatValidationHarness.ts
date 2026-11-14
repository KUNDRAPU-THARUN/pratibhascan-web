/**
 * PratibhaScan Web — Squat Recognition Validation Harness
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Dataset-independent validation runner for algorithmic accuracy benchmarking.
 * Generates synthetic kinematics representing clean reps, partial reps, tracking loss,
 * rapid twitches, and resting poses, and verifies state machine count fidelity.
 */

import { NormalizedLandmark } from '../types/pose.types';
import { SquatStateMachine } from './squatStateMachine';

export interface MotionFrame {
  kneeAngle: number;
  hipAngle: number;
  confidence: number;
  timestampMs: number;
}

export interface SyntheticSequence {
  name: string;
  expectedReps: number;
  expectedPartials: number;
  frames: MotionFrame[];
}

export interface ValidationResult {
  suiteName: string;
  totalSequences: number;
  totalExpectedReps: number;
  totalDetectedReps: number;
  falsePositives: number;
  missedReps: number;
  detectedPartials: number;
  expectedPartials: number;
  pass: boolean;
  sequenceBreakdown: {
    name: string;
    expected: number;
    detected: number;
    partialsDetected: number;
    passed: boolean;
  }[];
}

/**
 * Converts a knee and hip angle into a valid 33-point synthetic landmark array
 * using exact planar trigonometry.
 */
export function generateLandmarksFromAngles(
  kneeAngleDeg: number,
  hipAngleDeg = 150,
  confidence = 0.95
): NormalizedLandmark[] {
  const ankle = { x: 0.5, y: 0.9 };
  const L_shin = 0.22;
  const L_thigh = 0.22;
  const L_torso = 0.25;

  // Knee is above ankle
  const knee = { x: 0.5, y: ankle.y - L_shin };

  // Angle of vector (ankle - knee) in screen space is 90° (pointing straight down in Y)
  // To produce exact internal angle between (hip - knee) and (ankle - knee)
  const kneeRad = (kneeAngleDeg * Math.PI) / 180;
  const hip = {
    x: knee.x + L_thigh * Math.sin(Math.PI - kneeRad),
    y: knee.y - L_thigh * Math.cos(Math.PI - kneeRad),
  };

  // Vector from hip to knee
  const v_hk_x = knee.x - hip.x;
  const v_hk_y = knee.y - hip.y;
  const baseHipAngle = Math.atan2(v_hk_y, v_hk_x);
  const hipRad = (hipAngleDeg * Math.PI) / 180;

  const shoulder = {
    x: hip.x + L_torso * Math.cos(baseHipAngle - hipRad),
    y: hip.y + L_torso * Math.sin(baseHipAngle - hipRad),
  };

  return Array.from({ length: 33 }, (_, i) => {
    let x = 0.5;
    let y = 0.5;

    if (i === 11 || i === 12) {
      x = shoulder.x;
      y = shoulder.y;
    } else if (i === 23 || i === 24) {
      x = hip.x;
      y = hip.y;
    } else if (i === 25 || i === 26) {
      x = knee.x;
      y = knee.y;
    } else if (i === 27 || i === 28) {
      x = ankle.x;
      y = ankle.y;
    }

    return {
      x,
      y,
      z: 0.0,
      visibility: confidence,
      presence: confidence,
    };
  });
}

/**
 * Creates synthetic test sequences representing common real-world athletic scenarios.
 */
export function createSyntheticTestSequences(): SyntheticSequence[] {
  const fps = 30;
  const frameIntervalMs = 1000 / fps; // ~33.3ms per frame

  // 1. Clean Repetition Generator (standing 175° -> bottom 90° -> standing 175°) over 2.0 seconds
  const createCleanRepFrames = (startMs: number, repCount: number): MotionFrame[] => {
    const frames: MotionFrame[] = [];
    let curTime = startMs;

    for (let r = 0; r < repCount; r++) {
      // Standing hold: 300ms (10 frames)
      for (let f = 0; f < 10; f++) {
        frames.push({ kneeAngle: 175, hipAngle: 170, confidence: 0.95, timestampMs: curTime });
        curTime += frameIntervalMs;
      }
      // Descent: 800ms (24 frames) from 175° down to 88°
      for (let f = 0; f < 24; f++) {
        const prog = (f + 1) / 24;
        const knee = 175 - prog * (175 - 88);
        const hip = 170 - prog * (170 - 75);
        frames.push({ kneeAngle: knee, hipAngle: hip, confidence: 0.95, timestampMs: curTime });
        curTime += frameIntervalMs;
      }
      // Bottom hold: 100ms (3 frames) at 88°
      for (let f = 0; f < 3; f++) {
        frames.push({ kneeAngle: 88, hipAngle: 75, confidence: 0.95, timestampMs: curTime });
        curTime += frameIntervalMs;
      }
      // Ascent: 800ms (24 frames) from 88° up to 175°
      for (let f = 0; f < 24; f++) {
        const prog = (f + 1) / 24;
        const knee = 88 + prog * (175 - 88);
        const hip = 75 + prog * (170 - 75);
        frames.push({ kneeAngle: knee, hipAngle: hip, confidence: 0.95, timestampMs: curTime });
        curTime += frameIntervalMs;
      }
      // Cooldown standing hold: 400ms (12 frames)
      for (let f = 0; f < 12; f++) {
        frames.push({ kneeAngle: 175, hipAngle: 170, confidence: 0.95, timestampMs: curTime });
        curTime += frameIntervalMs;
      }
    }
    return frames;
  };

  // 2. Partial Repetition: athlete descends only to 125° (quarter squat) and ascends back
  const createPartialRepFrames = (startMs: number): MotionFrame[] => {
    const frames: MotionFrame[] = [];
    let curTime = startMs;
    // Standing
    for (let f = 0; f < 10; f++) {
      frames.push({ kneeAngle: 172, hipAngle: 168, confidence: 0.95, timestampMs: curTime });
      curTime += frameIntervalMs;
    }
    // Partial descent to 125° (target is ≤ 100°)
    for (let f = 0; f < 15; f++) {
      const knee = 172 - ((f + 1) / 15) * (172 - 125);
      frames.push({ kneeAngle: knee, hipAngle: 130, confidence: 0.95, timestampMs: curTime });
      curTime += frameIntervalMs;
    }
    // Aborted ascent back to standing
    for (let f = 0; f < 15; f++) {
      const knee = 125 + ((f + 1) / 15) * (172 - 125);
      frames.push({ kneeAngle: knee, hipAngle: 168, confidence: 0.95, timestampMs: curTime });
      curTime += frameIntervalMs;
    }
    return frames;
  };

  // 3. Standing Still with Sensor Noise / Jitter
  const createStandingJitterFrames = (startMs: number, count = 60): MotionFrame[] => {
    const frames: MotionFrame[] = [];
    let curTime = startMs;
    for (let f = 0; f < count; f++) {
      const jitter = Math.sin(f * 0.5) * 4; // ± 4° noise around 170°
      frames.push({ kneeAngle: 170 + jitter, hipAngle: 165, confidence: 0.95, timestampMs: curTime });
      curTime += frameIntervalMs;
    }
    return frames;
  };

  // 4. Ultra-Fast False Twitch (e.g. 200ms spike to 80° - should be rejected by min duration gate)
  const createRapidTwitchFrames = (startMs: number): MotionFrame[] => {
    const frames: MotionFrame[] = [];
    let curTime = startMs;
    // 3 frames standing
    for (let f = 0; f < 3; f++) {
      frames.push({ kneeAngle: 175, hipAngle: 170, confidence: 0.95, timestampMs: curTime });
      curTime += frameIntervalMs;
    }
    // 2 frames spike down to 80°
    frames.push({ kneeAngle: 80, hipAngle: 80, confidence: 0.95, timestampMs: curTime });
    curTime += frameIntervalMs;
    frames.push({ kneeAngle: 80, hipAngle: 80, confidence: 0.95, timestampMs: curTime });
    curTime += frameIntervalMs;
    // 3 frames back to 175°
    for (let f = 0; f < 3; f++) {
      frames.push({ kneeAngle: 175, hipAngle: 170, confidence: 0.95, timestampMs: curTime });
      curTime += frameIntervalMs;
    }
    return frames;
  };

  // 5. Tracking Loss Sequence: good rep, then complete loss of confidence for 30 frames, then recovered rep
  const createTrackingLossFrames = (startMs: number): MotionFrame[] => {
    const frames: MotionFrame[] = [];
    let curTime = startMs;
    // Rep 1
    frames.push(...createCleanRepFrames(curTime, 1));
    curTime = frames[frames.length - 1].timestampMs + frameIntervalMs;

    // 30 frames of tracking loss (confidence = 0.1)
    for (let f = 0; f < 30; f++) {
      frames.push({ kneeAngle: 175, hipAngle: 170, confidence: 0.1, timestampMs: curTime });
      curTime += frameIntervalMs;
    }

    // Rep 2 after recovery
    frames.push(...createCleanRepFrames(curTime, 1));
    return frames;
  };

  return [
    {
      name: 'Sequence A: 3 Consecutive Clean Squats',
      expectedReps: 3,
      expectedPartials: 0,
      frames: createCleanRepFrames(1000, 3),
    },
    {
      name: 'Sequence B: Standing Still with Sensor Noise',
      expectedReps: 0,
      expectedPartials: 0,
      frames: createStandingJitterFrames(1000, 90),
    },
    {
      name: 'Sequence C: 2 Incomplete Partial Squats (Quarter Squats)',
      expectedReps: 0,
      expectedPartials: 2,
      frames: [
        ...createPartialRepFrames(1000),
        ...createStandingJitterFrames(2500, 15),
        ...createPartialRepFrames(3000),
      ],
    },
    {
      name: 'Sequence D: Rapid 200ms Sensor Twitch (False Positive Rejection)',
      expectedReps: 0,
      expectedPartials: 0,
      frames: createRapidTwitchFrames(1000),
    },
    {
      name: 'Sequence E: 2 Clean Squats Interrupted by Tracking Loss',
      expectedReps: 2,
      expectedPartials: 0,
      frames: createTrackingLossFrames(1000),
    },
  ];
}

/**
 * Executes validation on all test sequences and compiles accuracy statistics.
 */
export function runSquatValidationHarness(
  sequences: SyntheticSequence[] = createSyntheticTestSequences()
): ValidationResult {
  let totalExpectedReps = 0;
  let totalDetectedReps = 0;
  let falsePositives = 0;
  let missedReps = 0;
  let detectedPartials = 0;
  let expectedPartials = 0;

  const sequenceBreakdown: ValidationResult['sequenceBreakdown'] = [];

  for (const seq of sequences) {
    const fsm = new SquatStateMachine();
    fsm.startSession(seq.frames[0]?.timestampMs ?? 0);

    for (const frame of seq.frames) {
      const landmarks = generateLandmarksFromAngles(
        frame.kneeAngle,
        frame.hipAngle,
        frame.confidence
      );
      fsm.processFrame(landmarks, frame.timestampMs);
    }

    const metrics = fsm.getMetrics(seq.frames[seq.frames.length - 1]?.timestampMs ?? 0);

    totalExpectedReps += seq.expectedReps;
    totalDetectedReps += metrics.repetitionCount;
    expectedPartials += seq.expectedPartials;
    detectedPartials += metrics.partialRepCount;

    if (metrics.repetitionCount > seq.expectedReps) {
      falsePositives += metrics.repetitionCount - seq.expectedReps;
    } else if (metrics.repetitionCount < seq.expectedReps) {
      missedReps += seq.expectedReps - metrics.repetitionCount;
    }

    const seqPassed =
      metrics.repetitionCount === seq.expectedReps &&
      metrics.partialRepCount === seq.expectedPartials;

    sequenceBreakdown.push({
      name: seq.name,
      expected: seq.expectedReps,
      detected: metrics.repetitionCount,
      partialsDetected: metrics.partialRepCount,
      passed: seqPassed,
    });
  }

  const pass = falsePositives === 0 && missedReps === 0 && detectedPartials === expectedPartials;

  return {
    suiteName: 'KAARYAN Synthetic Squat Kinematics Suite v1.0',
    totalSequences: sequences.length,
    totalExpectedReps,
    totalDetectedReps,
    falsePositives,
    missedReps,
    detectedPartials,
    expectedPartials,
    pass,
    sequenceBreakdown,
  };
}
