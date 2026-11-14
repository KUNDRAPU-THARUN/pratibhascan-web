/**
 * PratibhaScan Web — Biomechanical Angles & Joint Geometry
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Pure, robust mathematical functions for 2D joint angle estimation,
 * trunk inclination, and anatomical side arbitration from MediaPipe landmarks.
 *
 * Coordinate System:
 * - MediaPipe Normalized Coordinates (0.0 to 1.0)
 * - Origin (0,0) is at top-left; X extends right, Y extends downwards.
 *
 * Biomechanical Definitions:
 * - Knee Angle (∠H-K-A): 180° = full extension (standing straight); ~90° = thigh parallel to floor.
 * - Hip Angle (∠S-H-K): ~180° = standing upright; ~60°-90° = hip flexion during squat.
 * - Trunk Angle: Angle of torso line (Hip -> Shoulder) from true vertical (0° = vertical).
 *
 * Limitations:
 * Monocular 2D angles are planar projections. Out-of-plane rotation (e.g. subject angled > 45°
 * from camera plane) may produce slight foreshortening variance.
 */

import { NormalizedLandmark } from '../types/pose.types';
import { JointAngles, TrackedSide } from '../types/squat.types';

// Key BlazePose Landmark Indices
export const POSE_LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

export interface Point2D {
  x: number;
  y: number;
  visibility?: number;
  presence?: number;
}

/**
 * Calculates internal angle ∠A-B-C at apex vertex B in degrees.
 * Implements strict numerical safeguards against NaN, division-by-zero, and floating-point errors.
 *
 * @param a First endpoint point
 * @param b Vertex apex point (joint center)
 * @param c Second endpoint point
 * @returns Angle in degrees [0.0°, 180.0°] or null if points are invalid/degenerate
 */
export function calculateJointAngle(
  a: Point2D | null | undefined,
  b: Point2D | null | undefined,
  c: Point2D | null | undefined
): number | null {
  if (!a || !b || !c) return null;

  // Validate finite numeric values
  if (
    !Number.isFinite(a.x) ||
    !Number.isFinite(a.y) ||
    !Number.isFinite(b.x) ||
    !Number.isFinite(b.y) ||
    !Number.isFinite(c.x) ||
    !Number.isFinite(c.y)
  ) {
    return null;
  }

  // Vectors from vertex b to endpoints a and c
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;

  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

  // Safeguard: Check for coincident or near-zero points (epsilon = 1e-6)
  if (mag1 < 1e-6 || mag2 < 1e-6) {
    return null;
  }

  // Dot product
  const dot = v1x * v2x + v1y * v2y;

  // Cosine with strict clamping to [-1.0, 1.0] to prevent NaN from precision limits
  const cosTheta = Math.max(-1.0, Math.min(1.0, dot / (mag1 * mag2)));

  // Angle in degrees
  const angleRad = Math.acos(cosTheta);
  const angleDeg = (angleRad * 180.0) / Math.PI;

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Calculates trunk inclination angle in degrees relative to vertical (0° = upright, 90° = horizontal).
 *
 * @param shoulder Point representing shoulder
 * @param hip Point representing hip
 * @returns Angle in degrees [0°, 90°] or null if invalid
 */
export function calculateTrunkInclination(
  shoulder: Point2D | null | undefined,
  hip: Point2D | null | undefined
): number | null {
  if (!shoulder || !hip) return null;

  if (
    !Number.isFinite(shoulder.x) ||
    !Number.isFinite(shoulder.y) ||
    !Number.isFinite(hip.x) ||
    !Number.isFinite(hip.y)
  ) {
    return null;
  }

  // Torso vector from hip up to shoulder
  // In screen coordinates where y points down, "up" is negative Y
  const tx = shoulder.x - hip.x;
  const ty = shoulder.y - hip.y;

  const mag = Math.sqrt(tx * tx + ty * ty);
  if (mag < 1e-6) return null;

  // Dot product with vertical-up vector (0, -1)
  const dot = tx * 0 + ty * -1; // -ty
  const cosTheta = Math.max(-1.0, Math.min(1.0, dot / mag));

  const angleDeg = (Math.acos(cosTheta) * 180.0) / Math.PI;
  return Math.round(angleDeg * 10) / 10;
}

/**
 * Evaluates visibility and confidence for Left vs. Right kinetic chain landmarks.
 */
export function evaluateSideVisibility(
  landmarks: NormalizedLandmark[],
  minConfidence = 0.5
): {
  leftConfidence: number;
  rightConfidence: number;
  primarySide: TrackedSide;
} {
  if (!landmarks || landmarks.length < 29) {
    return { leftConfidence: 0, rightConfidence: 0, primarySide: 'unknown' };
  }

  const leftIndices = [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
  ];

  const rightIndices = [
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.RIGHT_ANKLE,
  ];

  const getMeanConfidence = (indices: number[]) => {
    let sum = 0;
    for (const idx of indices) {
      const lm = landmarks[idx];
      const vis = lm?.visibility ?? 1.0;
      const pres = lm?.presence ?? 1.0;
      sum += Math.min(vis, pres);
    }
    return sum / indices.length;
  };

  const leftConfidence = getMeanConfidence(leftIndices);
  const rightConfidence = getMeanConfidence(rightIndices);

  const isLeftValid = leftConfidence >= minConfidence;
  const isRightValid = rightConfidence >= minConfidence;

  let primarySide: TrackedSide = 'unknown';
  if (isLeftValid && isRightValid) {
    primarySide = 'bilateral';
  } else if (isLeftValid) {
    primarySide = 'left';
  } else if (isRightValid) {
    primarySide = 'right';
  }

  return {
    leftConfidence: Math.round(leftConfidence * 100) / 100,
    rightConfidence: Math.round(rightConfidence * 100) / 100,
    primarySide,
  };
}

/**
 * Computes complete joint angles for squat analysis from 33 MediaPipe pose landmarks.
 * Performs automatic side selection (profile view or bilateral front view).
 */
export function calculateSquatAngles(
  landmarks: NormalizedLandmark[],
  minConfidence = 0.5
): JointAngles {
  const { leftConfidence, rightConfidence, primarySide } = evaluateSideVisibility(
    landmarks,
    minConfidence
  );

  if (primarySide === 'unknown') {
    return {
      kneeAngle: null,
      hipAngle: null,
      trunkAngle: null,
      side: 'unknown',
      confidence: Math.max(leftConfidence, rightConfidence),
    };
  }

  // Left side angles
  const leftKneeAngle = calculateJointAngle(
    landmarks[POSE_LANDMARKS.LEFT_HIP],
    landmarks[POSE_LANDMARKS.LEFT_KNEE],
    landmarks[POSE_LANDMARKS.LEFT_ANKLE]
  );
  const leftHipAngle = calculateJointAngle(
    landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
    landmarks[POSE_LANDMARKS.LEFT_HIP],
    landmarks[POSE_LANDMARKS.LEFT_KNEE]
  );
  const leftTrunkAngle = calculateTrunkInclination(
    landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
    landmarks[POSE_LANDMARKS.LEFT_HIP]
  );

  // Right side angles
  const rightKneeAngle = calculateJointAngle(
    landmarks[POSE_LANDMARKS.RIGHT_HIP],
    landmarks[POSE_LANDMARKS.RIGHT_KNEE],
    landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
  );
  const rightHipAngle = calculateJointAngle(
    landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
    landmarks[POSE_LANDMARKS.RIGHT_HIP],
    landmarks[POSE_LANDMARKS.RIGHT_KNEE]
  );
  const rightTrunkAngle = calculateTrunkInclination(
    landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
    landmarks[POSE_LANDMARKS.RIGHT_HIP]
  );

  let finalKneeAngle: number | null = null;
  let finalHipAngle: number | null = null;
  let finalTrunkAngle: number | null = null;

  if (primarySide === 'bilateral') {
    // Both sides visible: average valid angles
    if (leftKneeAngle !== null && rightKneeAngle !== null) {
      finalKneeAngle = Math.round(((leftKneeAngle + rightKneeAngle) / 2) * 10) / 10;
    } else {
      finalKneeAngle = leftKneeAngle ?? rightKneeAngle;
    }

    if (leftHipAngle !== null && rightHipAngle !== null) {
      finalHipAngle = Math.round(((leftHipAngle + rightHipAngle) / 2) * 10) / 10;
    } else {
      finalHipAngle = leftHipAngle ?? rightHipAngle;
    }

    if (leftTrunkAngle !== null && rightTrunkAngle !== null) {
      finalTrunkAngle = Math.round(((leftTrunkAngle + rightTrunkAngle) / 2) * 10) / 10;
    } else {
      finalTrunkAngle = leftTrunkAngle ?? rightTrunkAngle;
    }
  } else if (primarySide === 'left') {
    finalKneeAngle = leftKneeAngle;
    finalHipAngle = leftHipAngle;
    finalTrunkAngle = leftTrunkAngle;
  } else {
    // Right side
    finalKneeAngle = rightKneeAngle;
    finalHipAngle = rightHipAngle;
    finalTrunkAngle = rightTrunkAngle;
  }

  return {
    kneeAngle: finalKneeAngle,
    hipAngle: finalHipAngle,
    trunkAngle: finalTrunkAngle,
    side: primarySide,
    confidence: primarySide === 'bilateral'
      ? Math.round(((leftConfidence + rightConfidence) / 2) * 100) / 100
      : primarySide === 'left'
      ? leftConfidence
      : rightConfidence,
  };
}
