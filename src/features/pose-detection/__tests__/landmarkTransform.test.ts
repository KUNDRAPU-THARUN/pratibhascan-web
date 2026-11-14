import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  projectNormalizedToPixel,
  renderPoseOnCanvas,
} from '../utils/landmarkTransform';
import { NormalizedLandmark } from '../types/pose.types';

describe('Landmark Transform & Canvas Projection Suite', () => {
  const dummyLandmark: NormalizedLandmark = {
    x: 0.5,
    y: 0.5,
    z: 0.0,
    visibility: 0.95,
    presence: 0.95,
  };

  describe('1. Coordinate Transformation & Aspect Ratio Scaling', () => {
    it('projects normalized center coordinates to exact canvas pixel center', () => {
      const config = {
        canvasWidth: 800,
        canvasHeight: 600,
        videoWidth: 800,
        videoHeight: 600,
        isMirrored: false,
        fitMode: 'cover' as const,
      };

      const point = projectNormalizedToPixel(dummyLandmark, config);
      expect(point.x).toBe(400);
      expect(point.y).toBe(300);
      expect(point.visibility).toBe(0.95);
    });

    it('correctly calculates vertical letterboxing/cover offsets when aspect ratios differ', () => {
      // 16:9 canvas (1280x720) with 4:3 video (640x480) in 'cover' mode
      const config = {
        canvasWidth: 1280,
        canvasHeight: 720,
        videoWidth: 640,
        videoHeight: 480,
        isMirrored: false,
        fitMode: 'cover' as const,
      };

      const topEdge: NormalizedLandmark = { x: 0.5, y: 0.0, z: 0 };
      const point = projectNormalizedToPixel(topEdge, config);

      // In cover mode, 4:3 video overflows vertically (offsetY < 0)
      expect(point.x).toBe(640);
      expect(point.y).toBeLessThan(0); // Top of video is cropped off-screen
    });

    it('handles zero or invalid video/canvas dimensions gracefully without crashing', () => {
      const invalidConfig = {
        canvasWidth: 0,
        canvasHeight: 0,
        videoWidth: 0,
        videoHeight: 0,
      };

      const point = projectNormalizedToPixel(dummyLandmark, invalidConfig);
      expect(point.x).toBe(0);
      expect(point.y).toBe(0);
    });
  });

  describe('2. Front-Camera Mirroring', () => {
    it('inverts x-coordinate when isMirrored is true for selfie cameras', () => {
      const leftMarker: NormalizedLandmark = { x: 0.2, y: 0.5, z: 0 };

      const unmirrored = projectNormalizedToPixel(leftMarker, {
        canvasWidth: 1000,
        canvasHeight: 500,
        videoWidth: 1000,
        videoHeight: 500,
        isMirrored: false,
      });

      const mirrored = projectNormalizedToPixel(leftMarker, {
        canvasWidth: 1000,
        canvasHeight: 500,
        videoWidth: 1000,
        videoHeight: 500,
        isMirrored: true,
      });

      expect(unmirrored.x).toBe(200);
      expect(mirrored.x).toBe(800); // 1000 - 200 = 800
      expect(mirrored.y).toBe(unmirrored.y); // y-coordinate is untouched
    });
  });

  describe('3. Confidence & Visibility Threshold Filtering', () => {
    let mockCtx: any;

    beforeEach(() => {
      mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        lineWidth: 1,
        strokeStyle: '',
        fillStyle: '',
        lineCap: '',
        lineJoin: '',
      };
    });

    it('filters out joints whose visibility is below the minimum threshold', () => {
      const landmarks: NormalizedLandmark[] = [
        { x: 0.5, y: 0.5, z: 0, visibility: 0.2 }, // Low confidence (below 0.5)
        { x: 0.6, y: 0.6, z: 0, visibility: 0.8 }, // High confidence
      ];

      renderPoseOnCanvas(
        mockCtx,
        landmarks,
        {
          canvasWidth: 500,
          canvasHeight: 500,
          videoWidth: 500,
          videoHeight: 500,
        },
        {
          showSkeleton: false,
          showLandmarks: true,
          minVisibilityThreshold: 0.5,
        },
        []
      );

      // Outer glow and inner point are drawn for landmark[1], but skipped for landmark[0]
      // 2 arc calls per valid landmark -> exactly 2 calls for the 1 visible landmark
      expect(mockCtx.arc).toHaveBeenCalledTimes(2);
    });

    it('skips skeleton connections if either endpoint joint is below confidence threshold', () => {
      const landmarks: NormalizedLandmark[] = [
        { x: 0.4, y: 0.4, z: 0, visibility: 0.9 }, // Joint 0: visible
        { x: 0.6, y: 0.6, z: 0, visibility: 0.1 }, // Joint 1: obscured / low visibility
      ];

      const connections = [{ start: 0, end: 1 }];

      renderPoseOnCanvas(
        mockCtx,
        landmarks,
        {
          canvasWidth: 500,
          canvasHeight: 500,
          videoWidth: 500,
          videoHeight: 500,
        },
        {
          showSkeleton: true,
          showLandmarks: false,
          minVisibilityThreshold: 0.5,
        },
        connections
      );

      // Connection should not be stroked because joint 1 is below threshold
      expect(mockCtx.stroke).not.toHaveBeenCalled();
    });

    it('draws skeleton line when both endpoint joints exceed confidence threshold', () => {
      const landmarks: NormalizedLandmark[] = [
        { x: 0.4, y: 0.4, z: 0, visibility: 0.85 },
        { x: 0.6, y: 0.6, z: 0, visibility: 0.92 },
      ];

      const connections = [{ start: 0, end: 1 }];

      renderPoseOnCanvas(
        mockCtx,
        landmarks,
        {
          canvasWidth: 500,
          canvasHeight: 500,
          videoWidth: 500,
          videoHeight: 500,
        },
        {
          showSkeleton: true,
          showLandmarks: false,
          minVisibilityThreshold: 0.5,
        },
        connections
      );

      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('4. Device Pixel Ratio (DPR) & High-Resolution Scaling', () => {
    let mockCtx: any;

    beforeEach(() => {
      mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        lineWidth: 1,
        strokeStyle: '',
        fillStyle: '',
        lineCap: '',
        lineJoin: '',
      };
    });

    it('scales canvas stroke lineWidth and landmark radius proportionally with dpr', () => {
      const landmarks: NormalizedLandmark[] = [
        { x: 0.5, y: 0.5, z: 0, visibility: 0.95, presence: 0.95 },
      ];

      // Test DPR = 2 (e.g. Retina / High-DPI display)
      renderPoseOnCanvas(
        mockCtx,
        landmarks,
        {
          canvasWidth: 1000,
          canvasHeight: 800,
          videoWidth: 640,
          videoHeight: 480,
          dpr: 2,
        },
        {
          lineWidth: 3,
          landmarkRadius: 4,
          showSkeleton: true,
          showLandmarks: true,
        },
        []
      );

      // Line width should be scaled by dpr (3 * 2 = 6)
      expect(mockCtx.lineWidth).toBe(6);
      // Outer arc radius should be scaled: (4 + 1.5) * 2 = 11
      expect(mockCtx.arc).toHaveBeenCalledWith(500, 400, 11, 0, 2 * Math.PI);
      // Inner arc radius should be scaled: 4 * 2 = 8
      expect(mockCtx.arc).toHaveBeenCalledWith(500, 400, 8, 0, 2 * Math.PI);
    });
  });

  describe('5. Controlled Pose Accuracy Visual Fixtures (9 Scenarios)', () => {
    const baseConfig = {
      canvasWidth: 1000,
      canvasHeight: 1000,
      videoWidth: 1000,
      videoHeight: 1000,
      isMirrored: false,
      fitMode: 'cover' as const,
    };

    let mockCtx: any;

    beforeEach(() => {
      mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        lineWidth: 1,
        strokeStyle: '',
        fillStyle: '',
        lineCap: '',
        lineJoin: '',
      };
    });

    it('Case 1: Person Centered — renders key joints within core bounding box', async () => {
      const { FIXTURE_CENTERED_PERSON } = await import('../utils/landmarkTransform');
      expect(FIXTURE_CENTERED_PERSON.length).toBe(33);

      renderPoseOnCanvas(mockCtx, FIXTURE_CENTERED_PERSON, baseConfig);

      // 33 landmarks with high confidence -> 33 * 2 arc calls (outer + inner)
      expect(mockCtx.arc).toHaveBeenCalledTimes(66);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('Case 2: Person Near Screen Edge — accurately maps edge coordinates without truncation errors', async () => {
      const { FIXTURE_EDGE_PERSON } = await import('../utils/landmarkTransform');
      const rightArm = FIXTURE_EDGE_PERSON[12]; // right shoulder near edge
      const point = projectNormalizedToPixel(rightArm, baseConfig);

      expect(point.x).toBeGreaterThan(900);
      expect(point.x).toBeLessThanOrEqual(1000);
      expect(point.y).toBeCloseTo(350);
    });

    it('Case 3: Person Partially Outside Frame — computes off-canvas coordinates and suppresses low-confidence limbs', async () => {
      const { FIXTURE_PARTIALLY_OUTSIDE } = await import('../utils/landmarkTransform');
      const offscreenArm = FIXTURE_PARTIALLY_OUTSIDE[12];
      const point = projectNormalizedToPixel(offscreenArm, baseConfig);

      // Normalized x = 1.15 -> canvas x = 1150 (outside canvas bounds)
      expect(point.x).toBe(1150);
      expect(point.visibility).toBeLessThan(0.5);

      renderPoseOnCanvas(mockCtx, FIXTURE_PARTIALLY_OUTSIDE, baseConfig);
      // Offscreen limb (x=1.15, visibility=0.3) must be filtered out by confidence gate
      expect(mockCtx.arc).not.toHaveBeenCalledWith(1150, expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number));
    });

    it('Case 4: Person Turning Sideways — renders profile joints and suppresses occluded limbs', async () => {
      const { FIXTURE_TURNING_SIDEWAYS } = await import('../utils/landmarkTransform');

      renderPoseOnCanvas(mockCtx, FIXTURE_TURNING_SIDEWAYS, baseConfig, {
        showSkeleton: false,
        showLandmarks: true,
        minVisibilityThreshold: 0.5,
      });

      // Half the landmarks are occluded (visibility 0.2 < 0.5)
      // Only visible joints receive arc drawing calls
      expect(mockCtx.arc.mock.calls.length).toBeLessThan(66);
      expect(mockCtx.arc.mock.calls.length).toBeGreaterThan(0);
    });

    it('Case 5: Arms Raised Overhead — computes wrist coordinates above shoulder level', async () => {
      const { FIXTURE_ARMS_RAISED } = await import('../utils/landmarkTransform');
      const wrist = projectNormalizedToPixel(FIXTURE_ARMS_RAISED[15], baseConfig);
      const shoulder = projectNormalizedToPixel(FIXTURE_ARMS_RAISED[11], baseConfig);

      // In computer vision (0,0 is top-left), wrist above shoulder means wrist.y < shoulder.y
      expect(wrist.y).toBeLessThan(shoulder.y);
    });

    it('Case 6: Squatting — computes lowered hips and flexed knee angle coordinates', async () => {
      const { FIXTURE_SQUATTING } = await import('../utils/landmarkTransform');
      const hip = projectNormalizedToPixel(FIXTURE_SQUATTING[23], baseConfig);
      const knee = projectNormalizedToPixel(FIXTURE_SQUATTING[25], baseConfig);

      // In deep squat, hip.y is lowered close to knee.y
      expect(Math.abs(hip.y - knee.y)).toBeLessThan(50);
    });

    it('Case 7: Walking — verifies asymmetrical bilateral leg positions', async () => {
      const { FIXTURE_WALKING } = await import('../utils/landmarkTransform');
      const leftFoot = projectNormalizedToPixel(FIXTURE_WALKING[27], baseConfig);
      const rightFoot = projectNormalizedToPixel(FIXTURE_WALKING[28], baseConfig);

      // Staggered gait has distinct vertical positions
      expect(leftFoot.y).not.toBe(rightFoot.y);
    });

    it('Case 8: No Person Visible — renders zero joints and zero skeleton lines', async () => {
      const { FIXTURE_NO_PERSON } = await import('../utils/landmarkTransform');
      expect(FIXTURE_NO_PERSON.length).toBe(0);

      renderPoseOnCanvas(mockCtx, FIXTURE_NO_PERSON, baseConfig);

      expect(mockCtx.arc).not.toHaveBeenCalled();
      expect(mockCtx.stroke).not.toHaveBeenCalled();
    });

    it('Case 9: Poor Lighting — filters out all low-confidence landmarks', async () => {
      const { FIXTURE_POOR_LIGHTING } = await import('../utils/landmarkTransform');

      renderPoseOnCanvas(mockCtx, FIXTURE_POOR_LIGHTING, baseConfig, {
        minVisibilityThreshold: 0.5,
      });

      // All landmarks have visibility 0.22 < 0.5, so none should be drawn
      expect(mockCtx.arc).not.toHaveBeenCalled();
      expect(mockCtx.stroke).not.toHaveBeenCalled();
    });
  });
});
