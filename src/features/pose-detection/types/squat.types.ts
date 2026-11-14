/**
 * PratibhaScan Web — Squat Biomechanics & State Machine Types
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Types for joint angle computation, squat movement state machine,
 * repetition tracking telemetry, and exercise configuration.
 */

export type SquatState =
  | 'idle'
  | 'standing'
  | 'descending'
  | 'bottom'
  | 'ascending'
  | 'completed'
  | 'tracking_lost';

export type TrackedSide = 'left' | 'right' | 'bilateral' | 'unknown';

export interface JointAngles {
  kneeAngle: number | null; // Internal knee angle (deg): ~180° standing, ≤ 100° deep squat
  hipAngle: number | null; // Hip angle (deg): ~180° standing, ≤ 95° squat
  trunkAngle: number | null; // Trunk inclination from vertical (deg): 0° upright, ~30-50° squat
  side: TrackedSide;
  confidence: number; // 0.0 - 1.0 confidence across critical landmarks
}

export interface SquatConfig {
  standingKneeAngle: number; // Threshold to consider standing upright (default: 160°)
  descendKneeAngle: number; // Threshold where descent begins (default: 140°)
  bottomKneeAngle: number; // Target depth threshold for valid rep (default: 100°)
  ascendKneeAngle: number; // Threshold where ascent is established (default: 115°)
  minRepDurationMs: number; // Minimum valid repetition duration to avoid twitches (default: 600ms)
  maxRepDurationMs: number; // Maximum repetition duration before timeout/abort (default: 8000ms)
  minBottomDurationMs: number; // Minimum hold duration at bottom (default: 50ms)
  cooldownDurationMs: number; // Cooldown after completed rep before next rep starts (default: 300ms)
  smoothingFactor: number; // EMA alpha smoothing factor (default: 0.65)
  minConfidenceThreshold: number; // Minimum landmark confidence required (default: 0.5)
}

export const DEFAULT_SQUAT_CONFIG: SquatConfig = {
  standingKneeAngle: 155,
  descendKneeAngle: 140,
  bottomKneeAngle: 100,
  ascendKneeAngle: 115,
  minRepDurationMs: 600,
  maxRepDurationMs: 8000,
  minBottomDurationMs: 50,
  cooldownDurationMs: 300,
  smoothingFactor: 0.65,
  minConfidenceThreshold: 0.5,
};

export interface RepetitionRecord {
  repNumber: number;
  durationMs: number;
  minKneeAngle: number;
  maxHipFlexionAngle: number;
  completedAt: number;
  side: TrackedSide;
}

export interface SquatSessionMetrics {
  repetitionCount: number;
  partialRepCount: number;
  currentState: SquatState;
  kneeAngle: number | null;
  hipAngle: number | null;
  trunkAngle: number | null;
  minKneeAngleInCurrentRep: number | null;
  lastRepDurationMs: number | null;
  primarySide: TrackedSide;
  trackingQuality: 'optimal' | 'moderate' | 'poor' | 'lost';
  sessionDurationSec: number;
  isSessionActive: boolean;
  repHistory: RepetitionRecord[];
}
