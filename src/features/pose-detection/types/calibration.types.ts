/**
 * PratibhaScan Web — Camera Calibration & Framing Types
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Types for guided athlete camera calibration, framing validation,
 * distance evaluation, and body visibility feedback.
 */

export type CalibrationStatus =
  | 'uncalibrated'
  | 'calibrating'
  | 'calibrated'
  | 'recalibration_needed';

export type FramingDistance = 'too_close' | 'optimal' | 'too_far' | 'unknown';

export type BodyOrientation = 'sagittal_profile' | 'oblique_45' | 'frontal' | 'unknown';

export interface LandmarkVisibilityCheck {
  head: boolean; // Nose (0) / Head
  leftShoulder: boolean; // 11
  rightShoulder: boolean; // 12
  leftHip: boolean; // 23
  rightHip: boolean; // 24
  leftKnee: boolean; // 25
  rightKnee: boolean; // 26
  leftAnkle: boolean; // 27
  rightAnkle: boolean; // 28
}

export interface CalibrationFeedback {
  fullBodyVisible: boolean;
  visibilityCheck: LandmarkVisibilityCheck;
  isStable: boolean;
  stableFramesCount: number;
  requiredStableFrames: number;
  framingDistance: FramingDistance;
  bodyOrientation: BodyOrientation;
  estimatedAthleteHeightFraction: number; // Ratio of detected athlete height to viewport height
  guidanceMessage: string;
  canProceedToWorkout: boolean;
}

export interface CalibrationState {
  status: CalibrationStatus;
  feedback: CalibrationFeedback;
  calibratedAt: number | null;
  recalibrationReason: string | null;
}
