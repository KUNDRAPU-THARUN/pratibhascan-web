/**
 * PratibhaScan Web — AI Pose Detection Types
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Types for browser camera stream management, MediaPipe Tasks Vision Pose Landmarker,
 * coordinate transformation, and real-time performance telemetry.
 */

export type CameraStatus =
  | 'idle'
  | 'requesting_permission'
  | 'permission_denied'
  | 'initializing'
  | 'active'
  | 'error'
  | 'stopped';

export type ModelStatus = 'unloaded' | 'loading' | 'ready' | 'error';

export type TrackingStatus = 'idle' | 'tracking' | 'paused' | 'no_person_detected';

export type CameraFacingMode = 'user' | 'environment';

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  facingMode?: CameraFacingMode;
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

export interface LandmarkConnection {
  start: number;
  end: number;
}

export interface PoseDetectionOptions {
  modelVariant: 'lite' | 'full';
  delegate: 'GPU' | 'CPU';
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  minPresenceConfidence: number;
  numPoses: number;
}

export interface PerformanceMetrics {
  fps: number;
  inferenceTimeMs: number;
  renderTimeMs: number;
  droppedFrames: number;
  timestamp: number;
}

export interface CameraErrorDetails {
  type:
    | 'permission_denied'
    | 'not_found'
    | 'in_use'
    | 'insecure_context'
    | 'unsupported'
    | 'unknown';
  message: string;
  originalError?: unknown;
}

export interface PoseOverlayDisplaySettings {
  showSkeleton: boolean;
  showLandmarks: boolean;
  minVisibilityThreshold: number;
  skeletonColor: string;
  landmarkColor: string;
  lineWidth: number;
  landmarkRadius: number;
}

/**
 * Standard 33 MediaPipe Pose Landmark Indices
 */
export const POSE_LANDMARK_INDEX = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

/**
 * Official MediaPipe Pose Landmark Connections
 * Standard 35 anatomical connecting edges between the 33 landmarks
 */
export const DEFAULT_POSE_CONNECTIONS: LandmarkConnection[] = [
  // Face
  { start: 0, end: 1 },
  { start: 1, end: 2 },
  { start: 2, end: 3 },
  { start: 3, end: 7 },
  { start: 0, end: 4 },
  { start: 4, end: 5 },
  { start: 5, end: 6 },
  { start: 6, end: 8 },
  { start: 9, end: 10 },

  // Torso
  { start: 11, end: 12 }, // Shoulders
  { start: 11, end: 23 }, // Left Shoulder to Left Hip
  { start: 12, end: 24 }, // Right Shoulder to Right Hip
  { start: 23, end: 24 }, // Hips

  // Left Arm
  { start: 11, end: 13 }, // Left Shoulder to Left Elbow
  { start: 13, end: 15 }, // Left Elbow to Left Wrist
  { start: 15, end: 17 }, // Left Wrist to Left Pinky
  { start: 15, end: 19 }, // Left Wrist to Left Index
  { start: 15, end: 21 }, // Left Wrist to Left Thumb
  { start: 17, end: 19 }, // Left Pinky to Left Index

  // Right Arm
  { start: 12, end: 14 }, // Right Shoulder to Right Elbow
  { start: 14, end: 16 }, // Right Elbow to Right Wrist
  { start: 16, end: 18 }, // Right Wrist to Right Pinky
  { start: 16, end: 20 }, // Right Wrist to Right Index
  { start: 16, end: 22 }, // Right Wrist to Right Thumb
  { start: 18, end: 20 }, // Right Pinky to Right Index

  // Left Leg
  { start: 23, end: 25 }, // Left Hip to Left Knee
  { start: 25, end: 27 }, // Left Knee to Left Ankle
  { start: 27, end: 29 }, // Left Ankle to Left Heel
  { start: 27, end: 31 }, // Left Ankle to Left Foot Index
  { start: 29, end: 31 }, // Left Heel to Left Foot Index

  // Right Leg
  { start: 24, end: 26 }, // Right Hip to Right Knee
  { start: 26, end: 28 }, // Right Knee to Right Ankle
  { start: 28, end: 30 }, // Right Ankle to Right Heel
  { start: 28, end: 32 }, // Right Ankle to Right Foot Index
  { start: 30, end: 32 }, // Right Heel to Right Foot Index
];
