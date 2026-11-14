import { describe, it, expect } from 'vitest';
import {
  calculateJointAngle,
  calculateTrunkInclination,
  evaluateSideVisibility,
  calculateSquatAngles,
} from '../utils/biomechanics';
import { NormalizedLandmark } from '../types/pose.types';

describe('Biomechanical Angle Calculations Suite', () => {
  describe('1. calculateJointAngle (∠A-B-C)', () => {
    it('calculates exact 180° for three collinear points (full joint extension)', () => {
      const a = { x: 0.5, y: 0.2 }; // Hip
      const b = { x: 0.5, y: 0.5 }; // Knee (apex)
      const c = { x: 0.5, y: 0.8 }; // Ankle

      const angle = calculateJointAngle(a, b, c);
      expect(angle).toBe(180.0);
    });

    it('calculates exact 90° for orthogonal vectors (parallel squat depth)', () => {
      const a = { x: 0.2, y: 0.5 }; // Thigh horizontal
      const b = { x: 0.5, y: 0.5 }; // Knee
      const c = { x: 0.5, y: 0.8 }; // Shin vertical

      const angle = calculateJointAngle(a, b, c);
      expect(angle).toBe(90.0);
    });

    it('calculates acute angle (e.g. 45° deep flexion)', () => {
      const a = { x: 0.2, y: 0.2 };
      const b = { x: 0.5, y: 0.5 };
      const c = { x: 0.5, y: 0.1 };

      const angle = calculateJointAngle(a, b, c);
      expect(angle).toBeCloseTo(45.0, 1);
    });

    it('safeguards against coincident or zero-length vectors without NaN', () => {
      const a = { x: 0.5, y: 0.5 };
      const b = { x: 0.5, y: 0.5 }; // a and b are identical
      const c = { x: 0.5, y: 0.8 };

      const angle = calculateJointAngle(a, b, c);
      expect(angle).toBeNull();
    });

    it('safeguards against null, undefined, or non-finite values', () => {
      expect(calculateJointAngle(null, { x: 0, y: 0 }, { x: 1, y: 1 })).toBeNull();
      expect(calculateJointAngle({ x: 0, y: 0 }, undefined, { x: 1, y: 1 })).toBeNull();
      expect(calculateJointAngle({ x: NaN, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 })).toBeNull();
      expect(calculateJointAngle({ x: Infinity, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 })).toBeNull();
    });

    it('safeguards against floating-point overshoot past 1.0 (clamping)', () => {
      // Vectors nearly collinear with small rounding variance
      const a = { x: 0.100000000000001, y: 0.2 };
      const b = { x: 0.1, y: 0.5 };
      const c = { x: 0.1, y: 0.8 };

      const angle = calculateJointAngle(a, b, c);
      expect(Number.isFinite(angle)).toBe(true);
      expect(angle).toBeCloseTo(180.0, 0);
    });
  });

  describe('2. calculateTrunkInclination', () => {
    it('returns 0° for a purely vertical torso (head directly above hips)', () => {
      const shoulder = { x: 0.5, y: 0.2 };
      const hip = { x: 0.5, y: 0.5 };

      const inclination = calculateTrunkInclination(shoulder, hip);
      expect(inclination).toBe(0.0);
    });

    it('returns 45° for forward torso lean during squat descent', () => {
      const shoulder = { x: 0.7, y: 0.3 };
      const hip = { x: 0.5, y: 0.5 }; // dx = 0.2, dy = -0.2 (45° angle)

      const inclination = calculateTrunkInclination(shoulder, hip);
      expect(inclination).toBeCloseTo(45.0, 1);
    });

    it('returns null for coincident points or invalid inputs', () => {
      expect(calculateTrunkInclination({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 })).toBeNull();
      expect(calculateTrunkInclination(null, { x: 0.5, y: 0.5 })).toBeNull();
    });
  });

  describe('3. evaluateSideVisibility & Arbitration', () => {
    const createLandmarksWithSideConfidence = (
      leftVis: number,
      rightVis: number
    ): NormalizedLandmark[] => {
      return Array.from({ length: 33 }, (_, i) => {
        const isLeft = i === 11 || i === 23 || i === 25 || i === 27;
        const isRight = i === 12 || i === 24 || i === 26 || i === 28;
        return {
          x: 0.5,
          y: 0.5,
          z: 0.0,
          visibility: isLeft ? leftVis : isRight ? rightVis : 0.9,
          presence: isLeft ? leftVis : isRight ? rightVis : 0.9,
        };
      });
    };

    it('selects bilateral when both sides have high confidence', () => {
      const landmarks = createLandmarksWithSideConfidence(0.95, 0.92);
      const result = evaluateSideVisibility(landmarks, 0.5);

      expect(result.primarySide).toBe('bilateral');
      expect(result.leftConfidence).toBeGreaterThanOrEqual(0.9);
      expect(result.rightConfidence).toBeGreaterThanOrEqual(0.9);
    });

    it('selects left profile when right side is occluded (e.g. sagittal side view)', () => {
      const landmarks = createLandmarksWithSideConfidence(0.95, 0.15);
      const result = evaluateSideVisibility(landmarks, 0.5);

      expect(result.primarySide).toBe('left');
      expect(result.leftConfidence).toBeGreaterThanOrEqual(0.9);
      expect(result.rightConfidence).toBeLessThan(0.5);
    });

    it('selects right profile when left side is occluded', () => {
      const landmarks = createLandmarksWithSideConfidence(0.12, 0.88);
      const result = evaluateSideVisibility(landmarks, 0.5);

      expect(result.primarySide).toBe('right');
    });

    it('returns unknown when both sides are below confidence threshold', () => {
      const landmarks = createLandmarksWithSideConfidence(0.3, 0.25);
      const result = evaluateSideVisibility(landmarks, 0.5);

      expect(result.primarySide).toBe('unknown');
    });
  });

  describe('4. calculateSquatAngles', () => {
    it('returns null angles when confidence is insufficient', () => {
      const landmarks: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({
        x: 0.5,
        y: 0.5,
        z: 0,
        visibility: 0.2, // Below 0.5
        presence: 0.2,
      }));

      const angles = calculateSquatAngles(landmarks, 0.5);
      expect(angles.kneeAngle).toBeNull();
      expect(angles.hipAngle).toBeNull();
      expect(angles.side).toBe('unknown');
    });

    it('calculates bilateral average angles when both legs are visible', () => {
      // Build landmarks where left knee is 170° and right knee is 180°
      const landmarks: NormalizedLandmark[] = Array.from({ length: 33 }, (_, i) => {
        let x = 0.5;
        let y = 0.5;
        if (i === 11) { x = 0.45; y = 0.2; }
        else if (i === 12) { x = 0.55; y = 0.2; }
        else if (i === 23) { x = 0.45; y = 0.5; }
        else if (i === 24) { x = 0.55; y = 0.5; }
        else if (i === 25) { x = 0.45; y = 0.7; }
        else if (i === 26) { x = 0.55; y = 0.7; }
        else if (i === 27) { x = 0.45; y = 0.9; }
        else if (i === 28) { x = 0.55; y = 0.9; }
        return { x, y, z: 0.0, visibility: 0.95, presence: 0.95 };
      });

      const angles = calculateSquatAngles(landmarks);
      expect(angles.side).toBe('bilateral');
      expect(angles.kneeAngle).toBe(180.0);
      expect(angles.hipAngle).toBe(180.0);
    });
  });
});
