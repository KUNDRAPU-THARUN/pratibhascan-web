/**
 * PratibhaScan Web — Squat Recognition Validation Harness
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Dataset-independent validation runner for algorithmic accuracy benchmarking.
 * Generates synthetic kinematics across 16 reference scenarios including clean reps,
 * partial reps, fast/slow cadences, occlusions, jitter, coordinate invalidation,
 * and user pauses.
 */

import { NormalizedLandmark } from '../types/pose.types';
import { SquatStateMachine } from './squatStateMachine';

export interface MotionFrame {
  kneeAngle: number;
  hipAngle: number;
  confidence: number;
  timestampMs: number;
  customLandmarks?: NormalizedLandmark[];
  pauseAction?: 'pause' | 'resume';
}

export interface SyntheticSequence {
  id: number;
  name: string;
  expectedReps: number;
  expectedPartials: number;
  groundTruthMinAngle?: number;
  groundTruthDurationMs?: number;
  frames: MotionFrame[];
}

export interface SequenceEvaluation {
  id: number;
  name: string;
  expectedReps: number;
  detectedReps: number;
  expectedPartials: number;
  detectedPartials: number;
  repCountError: number;
  angleErrorDeg: number | null;
  timingErrorMs: number | null;
  trackingCoveragePercent: number;
  passed: boolean;
}

export interface ValidationResult {
  suiteName: string;
  totalSequences: number;
  passedSequences: number;
  totalExpectedReps: number;
  totalDetectedReps: number;
  falsePositives: number;
  missedReps: number;
  expectedPartials: number;
  detectedPartials: number;
  maxAngleErrorDeg: number;
  pass: boolean;
  sequenceBreakdown: SequenceEvaluation[];
}

/**
 * Converts a knee and hip angle into a valid 33-point synthetic landmark array
 * using exact planar trigonometry.
 */
export function generateLandmarksFromAngles(
  kneeAngleDeg: number,
  hipAngleDeg = 150,
  confidence = 0.95,
  sideOverride?: 'left' | 'right'
): NormalizedLandmark[] {
  const ankle = { x: 0.5, y: 0.88 };
  const L_shin = 0.22;
  const L_thigh = 0.22;
  const L_torso = 0.25;

  // Knee is above ankle
  const knee = { x: 0.5, y: ankle.y - L_shin };

  // Angle of vector (ankle - knee) in screen space is pointing straight down in Y
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

    let vis = confidence;
    if (sideOverride === 'right' && (i === 11 || i === 23 || i === 25 || i === 27)) {
      vis = 0.1; // Dim left side for unilateral right profile
    } else if (sideOverride === 'left' && (i === 12 || i === 24 || i === 26 || i === 28)) {
      vis = 0.1; // Dim right side for unilateral left profile
    }

    return {
      x,
      y,
      z: 0.0,
      visibility: vis,
      presence: vis,
    };
  });
}

/**
 * Creates 16 synthetic test sequences representing common real-world athletic scenarios.
 */
export function createSyntheticTestSequences(): SyntheticSequence[] {
  const fps = 30;
  const frameIntervalMs = 1000 / fps; // ~33.3ms per frame

  // Helper: Generates smooth trajectory frames for a single rep
  const generateRepTrajectory = (
    startMs: number,
    standingKnee = 175,
    bottomKnee = 90,
    descentFrames = 24,
    bottomFrames = 4,
    ascentFrames = 24,
    standingHoldFrames = 10,
    confidence = 0.95
  ): MotionFrame[] => {
    const frames: MotionFrame[] = [];
    let curTime = startMs;

    // Standing hold
    for (let f = 0; f < standingHoldFrames; f++) {
      frames.push({ kneeAngle: standingKnee, hipAngle: 170, confidence, timestampMs: curTime });
      curTime += frameIntervalMs;
    }
    // Descent
    for (let f = 0; f < descentFrames; f++) {
      const prog = (f + 1) / descentFrames;
      const knee = standingKnee - prog * (standingKnee - bottomKnee);
      const hip = 170 - prog * (170 - 75);
      frames.push({ kneeAngle: knee, hipAngle: hip, confidence, timestampMs: curTime });
      curTime += frameIntervalMs;
    }
    // Bottom hold
    for (let f = 0; f < bottomFrames; f++) {
      frames.push({ kneeAngle: bottomKnee, hipAngle: 75, confidence, timestampMs: curTime });
      curTime += frameIntervalMs;
    }
    // Ascent
    for (let f = 0; f < ascentFrames; f++) {
      const prog = (f + 1) / ascentFrames;
      const knee = bottomKnee + prog * (standingKnee - bottomKnee);
      const hip = 75 + prog * (170 - 75);
      frames.push({ kneeAngle: knee, hipAngle: hip, confidence, timestampMs: curTime });
      curTime += frameIntervalMs;
    }
    // Cooldown hold
    for (let f = 0; f < 10; f++) {
      frames.push({ kneeAngle: standingKnee, hipAngle: 170, confidence, timestampMs: curTime });
      curTime += frameIntervalMs;
    }
    return frames;
  };

  const sequences: SyntheticSequence[] = [];

  // Scenario 1: Correct synthetic full repetition (standard 2.0s tempo)
  sequences.push({
    id: 1,
    name: '1. Correct Synthetic Full Repetition',
    expectedReps: 1,
    expectedPartials: 0,
    groundTruthMinAngle: 90,
    groundTruthDurationMs: Math.round((24 + 4 + 24) * frameIntervalMs),
    frames: generateRepTrajectory(1000, 175, 90, 24, 4, 24, 10),
  });

  // Scenario 2: Partial squat (reversal at 125° before depth)
  const partialFrames: MotionFrame[] = [];
  let t = 1000;
  for (let f = 0; f < 10; f++) {
    partialFrames.push({ kneeAngle: 172, hipAngle: 168, confidence: 0.95, timestampMs: t });
    t += frameIntervalMs;
  }
  for (let f = 0; f < 15; f++) {
    const knee = 172 - ((f + 1) / 15) * (172 - 125);
    partialFrames.push({ kneeAngle: knee, hipAngle: 130, confidence: 0.95, timestampMs: t });
    t += frameIntervalMs;
  }
  for (let f = 0; f < 15; f++) {
    const knee = 125 + ((f + 1) / 15) * (172 - 125);
    partialFrames.push({ kneeAngle: knee, hipAngle: 168, confidence: 0.95, timestampMs: t });
    t += frameIntervalMs;
  }
  sequences.push({
    id: 2,
    name: '2. Partial Shallow Squat (Quarter Squat)',
    expectedReps: 0,
    expectedPartials: 1,
    groundTruthMinAngle: 125,
    frames: partialFrames,
  });

  // Scenario 3: Slow repetition (extended 4.5s cadence)
  sequences.push({
    id: 3,
    name: '3. Slow Controlled Repetition (4.5s tempo)',
    expectedReps: 1,
    expectedPartials: 0,
    groundTruthMinAngle: 88,
    frames: generateRepTrajectory(1000, 175, 88, 55, 12, 55, 15),
  });

  // Scenario 4: Fast repetition (800ms cadence, above 600ms gate)
  sequences.push({
    id: 4,
    name: '4. Fast Athletic Repetition (800ms cadence)',
    expectedReps: 1,
    expectedPartials: 0,
    groundTruthMinAngle: 92,
    frames: generateRepTrajectory(1000, 175, 92, 12, 4, 12, 10),
  });

  // Scenario 5: Standing still (static upright stance)
  const standingStillFrames: MotionFrame[] = [];
  t = 1000;
  for (let f = 0; f < 90; f++) {
    standingStillFrames.push({ kneeAngle: 175, hipAngle: 172, confidence: 0.95, timestampMs: t });
    t += frameIntervalMs;
  }
  sequences.push({
    id: 5,
    name: '5. Standing Still (Upright Rest Stance)',
    expectedReps: 0,
    expectedPartials: 0,
    frames: standingStillFrames,
  });

  // Scenario 6: Shaking or jittering landmarks (micro-noise ±4°)
  const jitterFrames: MotionFrame[] = [];
  t = 1000;
  for (let f = 0; f < 90; f++) {
    const noise = Math.sin(f * 0.7) * 4;
    jitterFrames.push({ kneeAngle: 172 + noise, hipAngle: 168, confidence: 0.95, timestampMs: t });
    t += frameIntervalMs;
  }
  sequences.push({
    id: 6,
    name: '6. Shaking / Jittering Landmarks (Noise Immunity)',
    expectedReps: 0,
    expectedPartials: 0,
    frames: jitterFrames,
  });

  // Scenario 7: Occluded knee (knee landmark drops confidence to 0.1 during descent)
  const occludedKneeFrames: MotionFrame[] = [];
  t = 1000;
  for (let f = 0; f < 10; f++) {
    occludedKneeFrames.push({ kneeAngle: 175, hipAngle: 170, confidence: 0.95, timestampMs: t });
    t += frameIntervalMs;
  }
  for (let f = 0; f < 10; f++) {
    occludedKneeFrames.push({ kneeAngle: 150 - f * 2, hipAngle: 140, confidence: 0.95, timestampMs: t });
    t += frameIntervalMs;
  }
  // Knee occluded for 15 frames
  for (let f = 0; f < 15; f++) {
    const lm = generateLandmarksFromAngles(110, 100, 0.95);
    lm[25].visibility = 0.1;
    lm[26].visibility = 0.1;
    occludedKneeFrames.push({
      kneeAngle: 110,
      hipAngle: 100,
      confidence: 0.1,
      timestampMs: t,
      customLandmarks: lm,
    });
    t += frameIntervalMs;
  }
  sequences.push({
    id: 7,
    name: '7. Occluded Knee During Descent',
    expectedReps: 0,
    expectedPartials: 0,
    frames: occludedKneeFrames,
  });

  // Scenario 8: Occluded ankle (ankle landmark drops confidence to 0.1)
  const occludedAnkleFrames: MotionFrame[] = [];
  t = 1000;
  for (let f = 0; f < 15; f++) {
    const lm = generateLandmarksFromAngles(175, 170, 0.95);
    lm[27].visibility = 0.1;
    lm[28].visibility = 0.1;
    occludedAnkleFrames.push({
      kneeAngle: 175,
      hipAngle: 170,
      confidence: 0.2,
      timestampMs: t,
      customLandmarks: lm,
    });
    t += frameIntervalMs;
  }
  sequences.push({
    id: 8,
    name: '8. Occluded Feet & Ankles (Camera Low Tilt)',
    expectedReps: 0,
    expectedPartials: 0,
    frames: occludedAnkleFrames,
  });

  // Scenario 9: Camera movement / sudden coordinate shift
  const cameraShiftFrames: MotionFrame[] = [];
  t = 1000;
  for (let f = 0; f < 20; f++) {
    const lm = generateLandmarksFromAngles(175, 170, 0.95);
    if (f >= 10) {
      lm.forEach((p) => {
        p.x += 0.2;
        p.y -= 0.15;
      });
    }
    cameraShiftFrames.push({
      kneeAngle: 175,
      hipAngle: 170,
      confidence: 0.95,
      timestampMs: t,
      customLandmarks: lm,
    });
    t += frameIntervalMs;
  }
  sequences.push({
    id: 9,
    name: '9. Camera Displacement & Framing Shift',
    expectedReps: 0,
    expectedPartials: 0,
    frames: cameraShiftFrames,
  });

  // Scenario 10: Side-profile squat (unilateral dominant confidence)
  const sideProfileFrames: MotionFrame[] = [];
  t = 1000;
  const rep10 = generateRepTrajectory(t, 175, 92, 24, 4, 24, 10);
  rep10.forEach((fr) => {
    fr.customLandmarks = generateLandmarksFromAngles(fr.kneeAngle, fr.hipAngle, 0.95, 'right');
    sideProfileFrames.push(fr);
  });
  sequences.push({
    id: 10,
    name: '10. Side Profile Squat (Right Sagittal Dominance)',
    expectedReps: 1,
    expectedPartials: 0,
    frames: sideProfileFrames,
  });

  // Scenario 11: Front-facing squat (bilateral equal confidence)
  sequences.push({
    id: 11,
    name: '11. Front-Facing Squat (Bilateral Symmetric Tracking)',
    expectedReps: 1,
    expectedPartials: 0,
    frames: generateRepTrajectory(1000, 175, 94, 24, 4, 24, 10),
  });

  // Scenario 12: Tracking loss mid-repetition with safe upright recovery
  const trackingLossFrames: MotionFrame[] = [];
  t = 1000;
  for (let f = 0; f < 15; f++) {
    trackingLossFrames.push({ kneeAngle: 175 - f * 3, hipAngle: 160, confidence: 0.95, timestampMs: t });
    t += frameIntervalMs;
  }
  // 50 frames tracking lost (> 1500ms abort threshold)
  for (let f = 0; f < 50; f++) {
    trackingLossFrames.push({ kneeAngle: 130, hipAngle: 120, confidence: 0.1, timestampMs: t });
    t += frameIntervalMs;
  }
  // Resumption at full standing
  for (let f = 0; f < 20; f++) {
    trackingLossFrames.push({ kneeAngle: 175, hipAngle: 170, confidence: 0.95, timestampMs: t });
    t += frameIntervalMs;
  }
  sequences.push({
    id: 12,
    name: '12. Tracking Loss Mid-Repetition & Upright Recovery',
    expectedReps: 0,
    expectedPartials: 0,
    frames: trackingLossFrames,
  });

  // Scenario 13: Pause and resume workflow
  const pauseResumeFrames: MotionFrame[] = [];
  t = 1000;
  for (let f = 0; f < 10; f++) {
    pauseResumeFrames.push({ kneeAngle: 175, hipAngle: 170, confidence: 0.95, timestampMs: t });
    t += frameIntervalMs;
  }
  // Pause session
  pauseResumeFrames.push({
    kneeAngle: 175,
    hipAngle: 170,
    confidence: 0.95,
    timestampMs: t,
    pauseAction: 'pause',
  });
  t += 1000;
  // Resume session
  pauseResumeFrames.push({
    kneeAngle: 175,
    hipAngle: 170,
    confidence: 0.95,
    timestampMs: t,
    pauseAction: 'resume',
  });
  t += 100;
  // Execute clean rep
  pauseResumeFrames.push(...generateRepTrajectory(t, 175, 90, 24, 4, 24, 10));
  sequences.push({
    id: 13,
    name: '13. Workout Pause & Resume Workflow',
    expectedReps: 1,
    expectedPartials: 0,
    frames: pauseResumeFrames,
  });

  // Scenario 14: Multiple consecutive repetitions (5 clean squats)
  const multiRepFrames: MotionFrame[] = [];
  t = 1000;
  for (let r = 0; r < 5; r++) {
    const rep = generateRepTrajectory(t, 175, 90, 24, 4, 24, 8);
    multiRepFrames.push(...rep);
    t = multiRepFrames[multiRepFrames.length - 1].timestampMs + frameIntervalMs;
  }
  sequences.push({
    id: 14,
    name: '14. Five Consecutive Clean Squats',
    expectedReps: 5,
    expectedPartials: 0,
    frames: multiRepFrames,
  });

  // Scenario 15: Invalid coordinates protection (NaN/null values)
  const invalidCoordFrames: MotionFrame[] = [];
  t = 1000;
  for (let f = 0; f < 20; f++) {
    const lm = generateLandmarksFromAngles(175, 170, 0.95);
    if (f % 4 === 0) {
      lm[25].x = NaN;
      lm[25].y = Infinity;
    }
    invalidCoordFrames.push({
      kneeAngle: 175,
      hipAngle: 170,
      confidence: 0.95,
      timestampMs: t,
      customLandmarks: lm,
    });
    t += frameIntervalMs;
  }
  sequences.push({
    id: 15,
    name: '15. Invalid / Non-Finite Coordinate Protection',
    expectedReps: 0,
    expectedPartials: 0,
    frames: invalidCoordFrames,
  });

  // Scenario 16: Sudden subject movement outside frame
  const outsideFrameFrames: MotionFrame[] = [];
  t = 1000;
  for (let f = 0; f < 10; f++) {
    outsideFrameFrames.push({ kneeAngle: 175, hipAngle: 170, confidence: 0.95, timestampMs: t });
    t += frameIntervalMs;
  }
  for (let f = 0; f < 20; f++) {
    const lm = generateLandmarksFromAngles(175, 170, 0.95);
    lm.forEach((p) => {
      p.x = 2.5; // Offscreen
      p.y = 2.5;
      p.visibility = 0.05;
    });
    outsideFrameFrames.push({
      kneeAngle: 175,
      hipAngle: 170,
      confidence: 0.05,
      timestampMs: t,
      customLandmarks: lm,
    });
    t += frameIntervalMs;
  }
  sequences.push({
    id: 16,
    name: '16. Sudden Subject Movement Outside Frame',
    expectedReps: 0,
    expectedPartials: 0,
    frames: outsideFrameFrames,
  });

  return sequences;
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
  let maxAngleErrorDeg = 0;
  let passedSequences = 0;

  const sequenceBreakdown: SequenceEvaluation[] = [];

  for (const seq of sequences) {
    const fsm = new SquatStateMachine();
    fsm.startSession(seq.frames[0]?.timestampMs ?? 0);

    for (const frame of seq.frames) {
      if (frame.pauseAction === 'pause') {
        fsm.pauseSession(frame.timestampMs);
        continue;
      } else if (frame.pauseAction === 'resume') {
        fsm.startSession(frame.timestampMs);
        continue;
      }

      const landmarks =
        frame.customLandmarks ??
        generateLandmarksFromAngles(frame.kneeAngle, frame.hipAngle, frame.confidence);

      fsm.processFrame(landmarks, frame.timestampMs);
    }

    const metrics = fsm.getMetrics(seq.frames[seq.frames.length - 1]?.timestampMs ?? 0);

    totalExpectedReps += seq.expectedReps;
    totalDetectedReps += metrics.repetitionCount;
    expectedPartials += seq.expectedPartials;
    detectedPartials += metrics.partialRepCount;

    const repCountError = Math.abs(metrics.repetitionCount - seq.expectedReps);
    if (metrics.repetitionCount > seq.expectedReps) {
      falsePositives += metrics.repetitionCount - seq.expectedReps;
    } else if (metrics.repetitionCount < seq.expectedReps) {
      missedReps += seq.expectedReps - metrics.repetitionCount;
    }

    // Angle error evaluation if ground truth exists
    let angleErrorDeg: number | null = null;
    if (seq.groundTruthMinAngle !== undefined && metrics.repHistory.length > 0) {
      const detectedMinAngle = metrics.repHistory[0].minKneeAngle;
      angleErrorDeg = Math.round(Math.abs(detectedMinAngle - seq.groundTruthMinAngle) * 10) / 10;
      if (angleErrorDeg > maxAngleErrorDeg) {
        maxAngleErrorDeg = angleErrorDeg;
      }
    }

    // Timing error evaluation if ground truth duration exists
    let timingErrorMs: number | null = null;
    if (seq.groundTruthDurationMs !== undefined && metrics.repHistory.length > 0) {
      const detectedDuration = metrics.repHistory[0].durationMs;
      timingErrorMs = Math.abs(detectedDuration - seq.groundTruthDurationMs);
    }

    const seqPassed =
      metrics.repetitionCount === seq.expectedReps &&
      metrics.partialRepCount === seq.expectedPartials;

    if (seqPassed) {
      passedSequences++;
    }

    sequenceBreakdown.push({
      id: seq.id,
      name: seq.name,
      expectedReps: seq.expectedReps,
      detectedReps: metrics.repetitionCount,
      expectedPartials: seq.expectedPartials,
      detectedPartials: metrics.partialRepCount,
      repCountError,
      angleErrorDeg,
      timingErrorMs,
      trackingCoveragePercent: metrics.trackingCoveragePercent ?? 100,
      passed: seqPassed,
    });
  }

  const pass =
    falsePositives === 0 && missedReps === 0 && detectedPartials === expectedPartials;

  return {
    suiteName: 'PratibhaScan Synthetic Squat Kinematics 16-Scenario Suite v2.0',
    totalSequences: sequences.length,
    passedSequences,
    totalExpectedReps,
    totalDetectedReps,
    falsePositives,
    missedReps,
    expectedPartials,
    detectedPartials,
    maxAngleErrorDeg,
    pass,
    sequenceBreakdown,
  };
}
