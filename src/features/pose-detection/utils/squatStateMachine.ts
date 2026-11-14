/**
 * PratibhaScan Web — Squat Movement State Machine
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Implements deterministic finite state machine (FSM) tracking bodyweight squat repetitions.
 * Enforces hysteresis, temporal exponential smoothing, minimum duration gates,
 * partial-rep detection, cooldown debouncing, and landmark confidence gating.
 */

import { NormalizedLandmark } from '../types/pose.types';
import {
  DEFAULT_SQUAT_CONFIG,
  RepetitionRecord,
  SquatConfig,
  SquatSessionMetrics,
  SquatState,
  TrackedSide,
} from '../types/squat.types';
import { calculateSquatAngles } from './biomechanics';

export class SquatStateMachine {
  private config: SquatConfig;
  private currentState: SquatState = 'idle';
  private repetitionCount = 0;
  private partialRepCount = 0;
  private repHistory: RepetitionRecord[] = [];

  // Temporal Tracking
  private descendStartTime: number | null = null;
  private bottomStartTime: number | null = null;
  private lastRepCompletionTime: number | null = null;
  private minKneeAngleInCurrentRep: number | null = null;
  private maxHipFlexionInCurrentRep: number | null = null;

  // EMA Filter Smoothing Buffers
  private smoothedKneeAngle: number | null = null;
  private smoothedHipAngle: number | null = null;
  private smoothedTrunkAngle: number | null = null;

  // Consecutive Low-Confidence Counter
  private consecutiveLostFrames = 0;

  // Session Stopwatch
  private sessionStartTime: number | null = null;
  private sessionPausedTime: number | null = null;
  private totalPausedDurationMs = 0;
  private isSessionActive = false;
  private primarySide: TrackedSide = 'unknown';

  constructor(config: Partial<SquatConfig> = {}) {
    this.config = {
      ...DEFAULT_SQUAT_CONFIG,
      ...config,
    };
  }

  /**
   * Starts or resumes a squat exercise tracking session.
   */
  public startSession(now = performance.now()): void {
    if (!this.sessionStartTime) {
      this.sessionStartTime = now;
    } else if (this.sessionPausedTime) {
      this.totalPausedDurationMs += now - this.sessionPausedTime;
      this.sessionPausedTime = null;
    }
    this.isSessionActive = true;
    if (this.currentState === 'idle') {
      this.currentState = 'standing';
    }
  }

  /**
   * Pauses the active workout session without losing rep counts.
   */
  public pauseSession(now = performance.now()): void {
    if (this.isSessionActive && !this.sessionPausedTime) {
      this.sessionPausedTime = now;
      this.isSessionActive = false;
    }
  }

  /**
   * Fully resets the state machine, counts, and history.
   */
  public reset(): void {
    this.currentState = 'idle';
    this.repetitionCount = 0;
    this.partialRepCount = 0;
    this.repHistory = [];
    this.descendStartTime = null;
    this.bottomStartTime = null;
    this.lastRepCompletionTime = null;
    this.minKneeAngleInCurrentRep = null;
    this.maxHipFlexionInCurrentRep = null;
    this.smoothedKneeAngle = null;
    this.smoothedHipAngle = null;
    this.smoothedTrunkAngle = null;
    this.consecutiveLostFrames = 0;
    this.sessionStartTime = null;
    this.sessionPausedTime = null;
    this.totalPausedDurationMs = 0;
    this.isSessionActive = false;
    this.primarySide = 'unknown';
  }

  /**
   * Processes a video frame with extracted 33 MediaPipe pose landmarks.
   *
   * @param landmarks Normalized 33 landmarks from MediaPipe
   * @param timestamp Frame timestamp in milliseconds (performance.now())
   * @returns Updated SquatSessionMetrics for UI telemetry
   */
  public processFrame(
    landmarks: NormalizedLandmark[],
    timestamp = performance.now()
  ): SquatSessionMetrics {
    // Compute current active session duration
    let sessionDurationSec = 0;
    if (this.sessionStartTime) {
      const activeMs = (this.sessionPausedTime ?? timestamp) - this.sessionStartTime - this.totalPausedDurationMs;
      sessionDurationSec = Math.max(0, Math.floor(activeMs / 1000));
    }

    if (!this.isSessionActive) {
      return this.buildMetricsSnapshot(sessionDurationSec);
    }

    // Step 1: Calculate pure geometric joint angles
    const angles = calculateSquatAngles(landmarks, this.config.minConfidenceThreshold);
    this.primarySide = angles.side;

    // Handle tracking loss / confidence failure
    if (
      angles.kneeAngle === null ||
      angles.confidence < this.config.minConfidenceThreshold ||
      angles.side === 'unknown'
    ) {
      this.consecutiveLostFrames++;
      if (this.consecutiveLostFrames >= 3) {
        this.currentState = 'tracking_lost';
        // If athlete was mid-rep and tracking was lost for > 1500ms, abort rep
        if (this.descendStartTime && timestamp - this.descendStartTime > 1500) {
          this.abortCurrentRep();
        }
      }
      return this.buildMetricsSnapshot(sessionDurationSec);
    }

    // Tracking is valid: reset lost frame counter
    this.consecutiveLostFrames = 0;

    // Step 2: Apply Exponential Moving Average (EMA) Smoothing
    const alpha = this.config.smoothingFactor;
    this.smoothedKneeAngle =
      this.smoothedKneeAngle === null
        ? angles.kneeAngle
        : Math.round((alpha * angles.kneeAngle + (1 - alpha) * this.smoothedKneeAngle) * 10) / 10;

    if (angles.hipAngle !== null) {
      this.smoothedHipAngle =
        this.smoothedHipAngle === null
          ? angles.hipAngle
          : Math.round((alpha * angles.hipAngle + (1 - alpha) * this.smoothedHipAngle) * 10) / 10;
    }

    if (angles.trunkAngle !== null) {
      this.smoothedTrunkAngle =
        this.smoothedTrunkAngle === null
          ? angles.trunkAngle
          : Math.round((alpha * angles.trunkAngle + (1 - alpha) * this.smoothedTrunkAngle) * 10) / 10;
    }

    const currentKnee = this.smoothedKneeAngle;

    // Step 3: Execute Movement State Machine Transitions
    switch (this.currentState) {
      case 'idle':
      case 'tracking_lost':
      case 'completed': {
        // Return to standing if athlete is upright
        if (currentKnee >= this.config.standingKneeAngle) {
          this.currentState = 'standing';
        }
        break;
      }

      case 'standing': {
        // Respect cooldown period after a completed rep
        if (
          this.lastRepCompletionTime &&
          timestamp - this.lastRepCompletionTime < this.config.cooldownDurationMs
        ) {
          break;
        }

        // Detect initiation of squat descent (e.g. knee flexes below 140°)
        if (currentKnee < this.config.descendKneeAngle) {
          this.currentState = 'descending';
          this.descendStartTime = timestamp;
          this.minKneeAngleInCurrentRep = currentKnee;
          this.maxHipFlexionInCurrentRep = this.smoothedHipAngle;
        }
        break;
      }

      case 'descending': {
        // Track lowest knee angle reached
        if (this.minKneeAngleInCurrentRep === null || currentKnee < this.minKneeAngleInCurrentRep) {
          this.minKneeAngleInCurrentRep = currentKnee;
        }
        if (this.smoothedHipAngle !== null) {
          if (this.maxHipFlexionInCurrentRep === null || this.smoothedHipAngle < this.maxHipFlexionInCurrentRep) {
            this.maxHipFlexionInCurrentRep = this.smoothedHipAngle;
          }
        }

        // Repetition Timeout Check (e.g. > 8 seconds without completion)
        if (this.descendStartTime && timestamp - this.descendStartTime > this.config.maxRepDurationMs) {
          this.abortCurrentRep();
          this.currentState = 'standing';
          break;
        }

        // Aborted / Partial Repetition Detection:
        // If athlete rises back above descend threshold without reaching bottom (≤ 100°)
        if (currentKnee > this.config.descendKneeAngle + 5) {
          this.partialRepCount++;
          this.abortCurrentRep();
          this.currentState = 'standing';
          break;
        }

        // Check if full squat depth is attained (e.g. knee ≤ 100°)
        if (currentKnee <= this.config.bottomKneeAngle) {
          this.currentState = 'bottom';
          this.bottomStartTime = timestamp;
        }
        break;
      }

      case 'bottom': {
        // Track lowest knee angle reached
        if (this.minKneeAngleInCurrentRep === null || currentKnee < this.minKneeAngleInCurrentRep) {
          this.minKneeAngleInCurrentRep = currentKnee;
        }

        // Check hold duration and ascent initiation
        const holdDuration = this.bottomStartTime ? timestamp - this.bottomStartTime : 0;
        if (holdDuration >= this.config.minBottomDurationMs) {
          // Athlete begins extending knees upward (hysteresis: ascend threshold > 115°)
          if (currentKnee > this.config.ascendKneeAngle) {
            this.currentState = 'ascending';
          }
        }
        break;
      }

      case 'ascending': {
        // Return to standing: rep completion check
        if (currentKnee >= this.config.standingKneeAngle) {
          const totalDuration = this.descendStartTime ? timestamp - this.descendStartTime : 0;

          // Enforce minimum repetition duration (e.g. ≥ 600ms to reject rapid sensor spikes)
          if (totalDuration >= this.config.minRepDurationMs) {
            this.repetitionCount++;
            const record: RepetitionRecord = {
              repNumber: this.repetitionCount,
              durationMs: Math.round(totalDuration),
              minKneeAngle: this.minKneeAngleInCurrentRep ?? this.config.bottomKneeAngle,
              maxHipFlexionAngle: this.maxHipFlexionInCurrentRep ?? 90,
              completedAt: timestamp,
              side: this.primarySide,
            };
            this.repHistory.push(record);
            this.lastRepCompletionTime = timestamp;
            this.currentState = 'completed';
          } else {
            // Repetition was too fast (< 600ms) to be an authentic athletic squat: discard
            this.currentState = 'standing';
          }

          this.abortCurrentRep();
        }
        break;
      }
    }

    return this.buildMetricsSnapshot(sessionDurationSec);
  }

  /**
   * Resets intermediate tracking variables for an in-flight rep.
   */
  private abortCurrentRep(): void {
    this.descendStartTime = null;
    this.bottomStartTime = null;
    this.minKneeAngleInCurrentRep = null;
    this.maxHipFlexionInCurrentRep = null;
  }

  /**
   * Compiles the public session metrics object.
   */
  private buildMetricsSnapshot(sessionDurationSec: number): SquatSessionMetrics {
    let trackingQuality: 'optimal' | 'moderate' | 'poor' | 'lost' = 'optimal';
    if (this.currentState === 'tracking_lost') {
      trackingQuality = 'lost';
    } else if (this.primarySide === 'unknown') {
      trackingQuality = 'poor';
    } else if (this.primarySide === 'bilateral') {
      trackingQuality = 'optimal';
    } else {
      trackingQuality = 'moderate';
    }

    const lastRep = this.repHistory[this.repHistory.length - 1];

    return {
      repetitionCount: this.repetitionCount,
      partialRepCount: this.partialRepCount,
      currentState: this.currentState,
      kneeAngle: this.smoothedKneeAngle,
      hipAngle: this.smoothedHipAngle,
      trunkAngle: this.smoothedTrunkAngle,
      minKneeAngleInCurrentRep: this.minKneeAngleInCurrentRep,
      lastRepDurationMs: lastRep ? lastRep.durationMs : null,
      primarySide: this.primarySide,
      trackingQuality,
      sessionDurationSec,
      isSessionActive: this.isSessionActive,
      repHistory: [...this.repHistory],
    };
  }

  public getMetrics(now = performance.now()): SquatSessionMetrics {
    let sessionDurationSec = 0;
    if (this.sessionStartTime) {
      const activeMs =
        (this.sessionPausedTime ?? now) - this.sessionStartTime - this.totalPausedDurationMs;
      sessionDurationSec = Math.max(0, Math.floor(activeMs / 1000));
    }
    return this.buildMetricsSnapshot(sessionDurationSec);
  }

  public getConfig(): SquatConfig {
    return { ...this.config };
  }

  public setConfig(newConfig: Partial<SquatConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
