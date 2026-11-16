/**
 * PratibhaScan Web — Camera Calibration & Framing Engine
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Deterministic validation engine checking subject camera distance, full-body
 * landmark visibility, standing stability, and recommended profile orientation.
 */

import { NormalizedLandmark } from '../types/pose.types';
import {
  BodyOrientation,
  CalibrationFeedback,
  CalibrationState,
  FramingDistance,
  LandmarkVisibilityCheck,
} from '../types/calibration.types';
import { POSE_LANDMARKS } from './biomechanics';

export class CalibrationEngine {
  private state: CalibrationState;
  private stableFramesCount = 0;
  private readonly requiredStableFrames = 30; // ~1.0 second at 30 FPS
  private lastKeypointPositions: { hipY: number; shoulderY: number } | null = null;
  private lastAthleteHeight: number | null = null;

  constructor() {
    this.state = {
      status: 'uncalibrated',
      feedback: this.getInitialFeedback(),
      calibratedAt: null,
      recalibrationReason: null,
    };
  }

  private getInitialFeedback(): CalibrationFeedback {
    return {
      fullBodyVisible: false,
      visibilityCheck: {
        head: false,
        leftShoulder: false,
        rightShoulder: false,
        leftHip: false,
        rightHip: false,
        leftKnee: false,
        rightKnee: false,
        leftAnkle: false,
        rightAnkle: false,
      },
      isStable: false,
      stableFramesCount: 0,
      requiredStableFrames: this.requiredStableFrames,
      framingDistance: 'unknown',
      bodyOrientation: 'unknown',
      estimatedAthleteHeightFraction: 0,
      guidanceMessage: 'Position your device and stand in view of the camera.',
      canProceedToWorkout: false,
    };
  }

  /**
   * Resets calibration state or forces recalibration.
   */
  public reset(reason: string | null = null): void {
    this.stableFramesCount = 0;
    this.lastKeypointPositions = null;
    this.lastAthleteHeight = null;
    this.state = {
      status: reason ? 'recalibration_needed' : 'uncalibrated',
      feedback: this.getInitialFeedback(),
      calibratedAt: null,
      recalibrationReason: reason,
    };
  }

  /**
   * Evaluates a frame of 33 MediaPipe pose landmarks during calibration or workout.
   */
  public processFrame(
    landmarks: NormalizedLandmark[],
    now = performance.now()
  ): CalibrationState {
    if (!landmarks || landmarks.length < 29) {
      this.stableFramesCount = 0;
      this.state.feedback = {
        ...this.getInitialFeedback(),
        guidanceMessage: 'No subject detected. Step into camera view.',
      };
      if (this.state.status === 'calibrated') {
        this.state.status = 'recalibration_needed';
        this.state.recalibrationReason = 'Subject left camera frame.';
      }
      return { ...this.state };
    }

    const minConf = 0.5;
    const isVisible = (idx: number) => {
      const lm = landmarks[idx];
      if (!lm) return false;
      const vis = lm.visibility ?? 1.0;
      const pres = lm.presence ?? 1.0;
      return Math.min(vis, pres) >= minConf && Number.isFinite(lm.x) && Number.isFinite(lm.y);
    };

    const visibilityCheck: LandmarkVisibilityCheck = {
      head: isVisible(0), // Nose
      leftShoulder: isVisible(POSE_LANDMARKS.LEFT_SHOULDER),
      rightShoulder: isVisible(POSE_LANDMARKS.RIGHT_SHOULDER),
      leftHip: isVisible(POSE_LANDMARKS.LEFT_HIP),
      rightHip: isVisible(POSE_LANDMARKS.RIGHT_HIP),
      leftKnee: isVisible(POSE_LANDMARKS.LEFT_KNEE),
      rightKnee: isVisible(POSE_LANDMARKS.RIGHT_KNEE),
      leftAnkle: isVisible(POSE_LANDMARKS.LEFT_ANKLE),
      rightAnkle: isVisible(POSE_LANDMARKS.RIGHT_ANKLE),
    };

    // Full body requires at least one full side (shoulder + hip + knee + ankle)
    // plus head and opposite hip/knee for minimum stability
    const hasLeftSide =
      visibilityCheck.leftShoulder &&
      visibilityCheck.leftHip &&
      visibilityCheck.leftKnee &&
      visibilityCheck.leftAnkle;
    const hasRightSide =
      visibilityCheck.rightShoulder &&
      visibilityCheck.rightHip &&
      visibilityCheck.rightKnee &&
      visibilityCheck.rightAnkle;

    const fullBodyVisible =
      visibilityCheck.head &&
      (hasLeftSide || hasRightSide) &&
      (visibilityCheck.leftHip || visibilityCheck.rightHip);

    // Calculate bounding box height of visible body landmarks
    let minY = 1.0;
    let maxY = 0.0;
    const keyIndices = [0, 11, 12, 23, 24, 25, 26, 27, 28];
    for (const idx of keyIndices) {
      if (isVisible(idx)) {
        minY = Math.min(minY, landmarks[idx].y);
        maxY = Math.max(maxY, landmarks[idx].y);
      }
    }
    const athleteHeightFraction = Math.max(0, maxY - minY);

    // Evaluate Distance / Framing
    let framingDistance: FramingDistance = 'optimal';
    if (athleteHeightFraction < 0.38) {
      framingDistance = 'too_far';
    } else if (athleteHeightFraction > 0.88 || maxY > 0.98 || minY < 0.02) {
      framingDistance = 'too_close';
    }

    // Evaluate Body Orientation
    let bodyOrientation: BodyOrientation = 'unknown';
    const leftConf = (landmarks[11]?.visibility ?? 0) + (landmarks[23]?.visibility ?? 0);
    const rightConf = (landmarks[12]?.visibility ?? 0) + (landmarks[24]?.visibility ?? 0);
    const confDiff = Math.abs(leftConf - rightConf);

    if (confDiff > 0.4) {
      bodyOrientation = 'sagittal_profile';
    } else if (hasLeftSide && hasRightSide) {
      const shoulderWidth = Math.abs(landmarks[11].x - landmarks[12].x);
      bodyOrientation = shoulderWidth < 0.12 ? 'oblique_45' : 'frontal';
    }

    // Stability Check
    let isStable = false;
    const currentHipY = (landmarks[23]?.y ?? 0) || (landmarks[24]?.y ?? 0);
    const currentShoulderY = (landmarks[11]?.y ?? 0) || (landmarks[12]?.y ?? 0);

    if (this.lastKeypointPositions) {
      const hipDelta = Math.abs(currentHipY - this.lastKeypointPositions.hipY);
      const shoulderDelta = Math.abs(currentShoulderY - this.lastKeypointPositions.shoulderY);

      if (hipDelta < 0.012 && shoulderDelta < 0.012 && fullBodyVisible) {
        this.stableFramesCount++;
      } else {
        // Reset count if subject moves abruptly
        this.stableFramesCount = Math.max(0, this.stableFramesCount - 2);
      }
    }
    this.lastKeypointPositions = { hipY: currentHipY, shoulderY: currentShoulderY };

    if (this.stableFramesCount >= this.requiredStableFrames) {
      isStable = true;
    }

    // Determine Guidance Message
    let guidanceMessage = 'Hold steady in full view...';
    let canProceed = false;

    if (!fullBodyVisible) {
      if (!visibilityCheck.leftAnkle && !visibilityCheck.rightAnkle) {
        guidanceMessage = 'Tilt camera down or step back: feet and ankles are clipped.';
      } else if (!visibilityCheck.head) {
        guidanceMessage = 'Tilt camera up: head is clipped at the top of the frame.';
      } else {
        guidanceMessage = 'Ensure hips, knees, and feet are fully visible in frame.';
      }
    } else if (framingDistance === 'too_close') {
      guidanceMessage = 'Step back 2–3 feet so your entire body remains visible during squats.';
    } else if (framingDistance === 'too_far') {
      guidanceMessage = 'Step closer to the camera to ensure accurate joint tracking.';
    } else if (!isStable) {
      guidanceMessage = `Stand tall and steady (${Math.round((this.stableFramesCount / this.requiredStableFrames) * 100)}%)...`;
    } else {
      guidanceMessage = 'Calibration locked. Ready for squat session!';
      canProceed = true;
    }

    // Check for severe recalibration condition if already calibrated
    if (this.state.status === 'calibrated' && this.lastAthleteHeight !== null) {
      const heightDelta = Math.abs(athleteHeightFraction - this.lastAthleteHeight);
      if (heightDelta > 0.35) {
        this.state.status = 'recalibration_needed';
        this.state.recalibrationReason = 'Significant change in camera framing distance.';
      }
    }

    // Auto-advance status if stable and calibrated
    if (canProceed && (this.state.status === 'uncalibrated' || this.state.status === 'calibrating')) {
      this.state.status = 'calibrated';
      this.state.calibratedAt = now;
      this.lastAthleteHeight = athleteHeightFraction;
      this.state.recalibrationReason = null;
    } else if (!canProceed && this.state.status === 'uncalibrated' && fullBodyVisible) {
      this.state.status = 'calibrating';
    }

    this.state.feedback = {
      fullBodyVisible,
      visibilityCheck,
      isStable,
      stableFramesCount: this.stableFramesCount,
      requiredStableFrames: this.requiredStableFrames,
      framingDistance,
      bodyOrientation,
      estimatedAthleteHeightFraction: Math.round(athleteHeightFraction * 100) / 100,
      guidanceMessage,
      canProceedToWorkout: canProceed || this.state.status === 'calibrated',
    };

    return { ...this.state };
  }

  public getState(): CalibrationState {
    return { ...this.state };
  }
}
