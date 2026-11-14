/**
 * PratibhaScan Web — Landmark Coordinate Transformation & Canvas Rendering
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Provides normalized-to-pixel coordinate projection, aspect-ratio scaling (cover/contain),
 * front-camera horizontal mirroring, confidence/visibility filtering, and canvas drawing.
 */

import {
  DEFAULT_POSE_CONNECTIONS,
  LandmarkConnection,
  NormalizedLandmark,
  PoseOverlayDisplaySettings,
} from '../types/pose.types';

export interface ViewportTransformConfig {
  canvasWidth: number;
  canvasHeight: number;
  videoWidth: number;
  videoHeight: number;
  isMirrored?: boolean;
  fitMode?: 'cover' | 'contain';
  dpr?: number;
}

export interface PixelPoint {
  x: number;
  y: number;
  visibility: number;
  presence: number;
}

/**
 * Projects a normalized landmark (0.0 to 1.0) into canvas pixel space.
 * Correctly accounts for aspect ratio differences between video stream and display canvas,
 * as well as horizontal mirroring for front-facing selfie cameras.
 */
export function projectNormalizedToPixel(
  landmark: NormalizedLandmark,
  config: ViewportTransformConfig
): PixelPoint {
  const {
    canvasWidth,
    canvasHeight,
    videoWidth,
    videoHeight,
    isMirrored = false,
    fitMode = 'cover',
  } = config;

  if (videoWidth <= 0 || videoHeight <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
    return {
      x: landmark.x * canvasWidth,
      y: landmark.y * canvasHeight,
      visibility: landmark.visibility ?? 1.0,
      presence: landmark.presence ?? 1.0,
    };
  }

  const videoAspect = videoWidth / videoHeight;
  const canvasAspect = canvasWidth / canvasHeight;

  let renderWidth = canvasWidth;
  let renderHeight = canvasHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (fitMode === 'cover') {
    if (canvasAspect > videoAspect) {
      // Canvas is wider than video: width fits, height overflows (cropped top/bottom)
      renderWidth = canvasWidth;
      renderHeight = canvasWidth / videoAspect;
      offsetY = (canvasHeight - renderHeight) / 2;
    } else {
      // Canvas is taller than video: height fits, width overflows (cropped left/right)
      renderHeight = canvasHeight;
      renderWidth = canvasHeight * videoAspect;
      offsetX = (canvasWidth - renderWidth) / 2;
    }
  } else {
    // 'contain' mode (letterbox)
    if (canvasAspect > videoAspect) {
      renderHeight = canvasHeight;
      renderWidth = canvasHeight * videoAspect;
      offsetX = (canvasWidth - renderWidth) / 2;
    } else {
      renderWidth = canvasWidth;
      renderHeight = canvasWidth / videoAspect;
      offsetY = (canvasHeight - renderHeight) / 2;
    }
  }

  // Calculate raw point position inside rendered video rect
  let px = offsetX + landmark.x * renderWidth;
  const py = offsetY + landmark.y * renderHeight;

  // Apply horizontal flip for front-facing mirror effect
  if (isMirrored) {
    px = canvasWidth - px;
  }

  return {
    x: px,
    y: py,
    visibility: landmark.visibility ?? 1.0,
    presence: landmark.presence ?? 1.0,
  };
}

/**
 * Default visual styling tokens adhering to PratibhaScan brand guidelines:
 * - Teal (#0d9488) and Emerald (#10b981) for high-confidence joints
 * - Electric Blue (#2563eb) for anatomical skeleton connections
 * - Coral / Amber for lower confidence or head markers
 */
export const DEFAULT_OVERLAY_SETTINGS: PoseOverlayDisplaySettings = {
  showSkeleton: true,
  showLandmarks: true,
  minVisibilityThreshold: 0.5,
  skeletonColor: 'rgba(37, 99, 235, 0.85)', // Royal Blue / PratibhaScan brand accent
  landmarkColor: '#0d9488', // Teal-600
  lineWidth: 3,
  landmarkRadius: 4.5,
};

/**
 * Renders the full 33-point pose landmark skeleton onto a 2D canvas context.
 * Filters out landmarks whose confidence/visibility is below the specified threshold.
 */
export function renderPoseOnCanvas(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  config: ViewportTransformConfig,
  settings: Partial<PoseOverlayDisplaySettings> = {},
  connections: LandmarkConnection[] = DEFAULT_POSE_CONNECTIONS
): void {
  const finalSettings: PoseOverlayDisplaySettings = {
    ...DEFAULT_OVERLAY_SETTINGS,
    ...settings,
  };

  const {
    showSkeleton,
    showLandmarks,
    minVisibilityThreshold,
    skeletonColor,
    landmarkColor,
    lineWidth,
    landmarkRadius,
  } = finalSettings;

  const dpr = config.dpr ?? 1;
  const scaledLineWidth = lineWidth * dpr;
  const scaledRadius = landmarkRadius * dpr;

  // Transform all landmarks to pixel coordinates
  const pixelPoints: PixelPoint[] = landmarks.map((lm) =>
    projectNormalizedToPixel(lm, config)
  );

  // 1. Draw Skeleton Connection Lines
  if (showSkeleton) {
    ctx.save();
    ctx.lineWidth = scaledLineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const conn of connections) {
      const p1 = pixelPoints[conn.start];
      const p2 = pixelPoints[conn.end];

      if (!p1 || !p2) continue;

      // Visibility Gate: Skip connection if either joint is below confidence threshold
      if (
        p1.visibility < minVisibilityThreshold ||
        p2.visibility < minVisibilityThreshold ||
        p1.presence < minVisibilityThreshold ||
        p2.presence < minVisibilityThreshold
      ) {
        continue;
      }

      // Dynamic color: Head/neck connections vs body limbs
      if (conn.start <= 10 || conn.end <= 10) {
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.75)'; // Cyan for facial reference
      } else if (conn.start >= 23 || conn.end >= 23) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)'; // Emerald for lower body kinetic chain
      } else {
        ctx.strokeStyle = skeletonColor; // Brand Blue for torso and arms
      }

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 2. Draw Anatomical Joint Landmarks
  if (showLandmarks) {
    ctx.save();

    for (let i = 0; i < pixelPoints.length; i++) {
      const point = pixelPoints[i];

      // Visibility Gate
      if (
        point.visibility < minVisibilityThreshold ||
        point.presence < minVisibilityThreshold
      ) {
        continue;
      }

      // Outer Glow / Ring
      ctx.beginPath();
      ctx.arc(point.x, point.y, scaledRadius + 1.5 * dpr, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();

      // Inner Core Point
      ctx.beginPath();
      ctx.arc(point.x, point.y, scaledRadius, 0, 2 * Math.PI);

      // Color coding key joints: Shoulders/Hips (navy), Knees/Ankles (teal), Hands/Feet (cyan)
      if (i === 11 || i === 12 || i === 23 || i === 24) {
        ctx.fillStyle = '#1e3a8a'; // Dark Navy for core stability joints
      } else if (i === 25 || i === 26 || i === 27 || i === 28) {
        ctx.fillStyle = '#0d9488'; // Teal for leg kinetic chain
      } else {
        ctx.fillStyle = landmarkColor;
      }

      ctx.fill();
    }

    ctx.restore();
  }
}

// ============================================================================
// Visual Fixtures for Controlled Pose Accuracy Evaluation (Part 3)
// ============================================================================

/** Helper generator creating a base 33-point landmark array */
function createBaseLandmarks(
  modifier: (index: number) => Partial<NormalizedLandmark>
): NormalizedLandmark[] {
  return Array.from({ length: 33 }, (_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0.0,
    visibility: 0.95,
    presence: 0.95,
    ...modifier(i),
  }));
}

/** 1. Person centered in frame with high confidence */
export const FIXTURE_CENTERED_PERSON: NormalizedLandmark[] = createBaseLandmarks((i) => {
  // Shoulders: 11, 12; Hips: 23, 24; Knees: 25, 26; Ankles: 27, 28
  if (i === 0) return { x: 0.5, y: 0.2 }; // Nose
  if (i === 11) return { x: 0.45, y: 0.35 }; // Left shoulder
  if (i === 12) return { x: 0.55, y: 0.35 }; // Right shoulder
  if (i === 23) return { x: 0.46, y: 0.55 }; // Left hip
  if (i === 24) return { x: 0.54, y: 0.55 }; // Right hip
  if (i === 27) return { x: 0.46, y: 0.85 }; // Left ankle
  if (i === 28) return { x: 0.54, y: 0.85 }; // Right ankle
  return { x: 0.5, y: 0.5 };
});

/** 2. Person positioned near screen edge (e.g. right edge x ≈ 0.95) */
export const FIXTURE_EDGE_PERSON: NormalizedLandmark[] = createBaseLandmarks((i) => {
  if (i === 0) return { x: 0.92, y: 0.2 };
  if (i === 11) return { x: 0.88, y: 0.35 };
  if (i === 12) return { x: 0.96, y: 0.35 };
  if (i === 23) return { x: 0.89, y: 0.55 };
  if (i === 24) return { x: 0.95, y: 0.55 };
  return { x: 0.92, y: 0.5 };
});

/** 3. Person partially outside frame (landmarks x < 0 or x > 1) */
export const FIXTURE_PARTIALLY_OUTSIDE: NormalizedLandmark[] = createBaseLandmarks((i) => {
  if (i === 12 || i === 14 || i === 16) {
    // Right arm extends beyond right edge
    return { x: 1.15, y: 0.4, visibility: 0.3, presence: 0.3 };
  }
  if (i === 28 || i === 30 || i === 32) {
    // Right foot extends below bottom edge
    return { x: 0.6, y: 1.08, visibility: 0.4, presence: 0.4 };
  }
  return { x: 0.5, y: 0.4 };
});

/** 4. Person turning sideways (profile view: one side occluded) */
export const FIXTURE_TURNING_SIDEWAYS: NormalizedLandmark[] = createBaseLandmarks((i) => {
  // Odd indices (left side) visible; even indices (right side) occluded
  const isRightSide = i % 2 === 0 && i > 0;
  return {
    x: 0.5 + (isRightSide ? 0.05 : -0.05),
    y: 0.4,
    visibility: isRightSide ? 0.2 : 0.95,
    presence: isRightSide ? 0.25 : 0.95,
  };
});

/** 5. Person with arms raised overhead */
export const FIXTURE_ARMS_RAISED: NormalizedLandmark[] = createBaseLandmarks((i) => {
  if (i === 15) return { x: 0.4, y: 0.1 }; // Left wrist above head
  if (i === 16) return { x: 0.6, y: 0.1 }; // Right wrist above head
  if (i === 13) return { x: 0.42, y: 0.2 }; // Left elbow
  if (i === 14) return { x: 0.58, y: 0.2 }; // Right elbow
  return { x: 0.5, y: 0.5 };
});

/** 6. Person squatting (hips lowered, knees flexed) */
export const FIXTURE_SQUATTING: NormalizedLandmark[] = createBaseLandmarks((i) => {
  if (i === 23) return { x: 0.44, y: 0.65 }; // Hips lowered
  if (i === 24) return { x: 0.56, y: 0.65 };
  if (i === 25) return { x: 0.38, y: 0.66 }; // Knees bent outwards
  if (i === 26) return { x: 0.62, y: 0.66 };
  if (i === 27) return { x: 0.42, y: 0.85 }; // Ankles on floor
  if (i === 28) return { x: 0.58, y: 0.85 };
  return { x: 0.5, y: 0.5 };
});

/** 7. Person walking (staggered gait, alternating limbs) */
export const FIXTURE_WALKING: NormalizedLandmark[] = createBaseLandmarks((i) => {
  if (i === 27) return { x: 0.4, y: 0.8 }; // Forward foot
  if (i === 28) return { x: 0.6, y: 0.9 }; // Trailing foot
  if (i === 15) return { x: 0.6, y: 0.5 }; // Counter-balancing arms
  if (i === 16) return { x: 0.4, y: 0.45 };
  return { x: 0.5, y: 0.5 };
});

/** 8. No person visible (empty frame: empty array) */
export const FIXTURE_NO_PERSON: NormalizedLandmark[] = [];

/** 9. Poor lighting / low confidence (all landmarks below 0.5 threshold) */
export const FIXTURE_POOR_LIGHTING: NormalizedLandmark[] = createBaseLandmarks(() => ({
  x: 0.5,
  y: 0.5,
  visibility: 0.22,
  presence: 0.28,
}));
