import { describe, it, expect, beforeEach } from 'vitest';
import { CalibrationEngine } from '../utils/calibrationEngine';
import { generateLandmarksFromAngles } from '../utils/squatValidationHarness';

describe('Camera Calibration & Framing Engine Suite', () => {
  let engine: CalibrationEngine;

  beforeEach(() => {
    engine = new CalibrationEngine();
  });

  it('1. Initializes in uncalibrated state with guidance', () => {
    const state = engine.getState();
    expect(state.status).toBe('uncalibrated');
    expect(state.feedback.fullBodyVisible).toBe(false);
    expect(state.feedback.canProceedToWorkout).toBe(false);
  });

  it('2. Detects missing subject when empty or incomplete landmarks are provided', () => {
    const state = engine.processFrame([]);
    expect(state.feedback.fullBodyVisible).toBe(false);
    expect(state.feedback.guidanceMessage).toContain('No subject detected');
  });

  it('3. Flags clipped ankles and feet when lower limb landmarks are not visible', () => {
    const landmarks = generateLandmarksFromAngles(175, 170, 0.95);
    // Clip ankles
    landmarks[27].visibility = 0.1;
    landmarks[28].visibility = 0.1;

    const state = engine.processFrame(landmarks);
    expect(state.feedback.visibilityCheck.leftAnkle).toBe(false);
    expect(state.feedback.visibilityCheck.rightAnkle).toBe(false);
    expect(state.feedback.guidanceMessage).toContain('feet and ankles are clipped');
  });

  it('4. Flags clipped head when top landmarks are outside frame', () => {
    const landmarks = generateLandmarksFromAngles(175, 170, 0.95);
    landmarks[0].visibility = 0.1;

    const state = engine.processFrame(landmarks);
    expect(state.feedback.visibilityCheck.head).toBe(false);
    expect(state.feedback.guidanceMessage).toContain('head is clipped');
  });

  it('5. Evaluates subject distance as too_far when athlete occupies < 38% frame height', () => {
    // Generate scaled-down athlete in middle of frame
    const landmarks = generateLandmarksFromAngles(175, 170, 0.95);
    landmarks.forEach((p) => {
      p.y = 0.4 + p.y * 0.3; // Height ~ 0.3
    });

    const state = engine.processFrame(landmarks);
    expect(state.feedback.framingDistance).toBe('too_far');
    expect(state.feedback.guidanceMessage).toContain('Step closer');
  });

  it('6. Evaluates subject distance as too_close when athlete exceeds 88% frame height', () => {
    const landmarks = generateLandmarksFromAngles(175, 170, 0.95);
    landmarks[0].y = 0.01;
    landmarks[27].y = 0.99;
    landmarks[28].y = 0.99;

    const state = engine.processFrame(landmarks);
    expect(state.feedback.framingDistance).toBe('too_close');
    expect(state.feedback.guidanceMessage).toContain('Step back 2–3 feet');
  });

  it('7. Detects sagittal profile orientation vs oblique vs frontal', () => {
    const profileLandmarks = generateLandmarksFromAngles(175, 170, 0.95, 'right');
    const state = engine.processFrame(profileLandmarks);
    expect(state.feedback.bodyOrientation).toBe('sagittal_profile');
  });

  it('8. Transitions to calibrated after holding steady upright stance for 30 consecutive frames', () => {
    const landmarks = generateLandmarksFromAngles(175, 170, 0.95);

    let state = engine.getState();
    // Simulate 35 consecutive steady frames
    for (let f = 0; f < 35; f++) {
      state = engine.processFrame(landmarks, 1000 + f * 33);
    }

    expect(state.status).toBe('calibrated');
    expect(state.feedback.isStable).toBe(true);
    expect(state.feedback.canProceedToWorkout).toBe(true);
    expect(state.calibratedAt).not.toBeNull();
  });

  it('9. Automatically triggers recalibration_needed when athlete leaves camera frame', () => {
    const landmarks = generateLandmarksFromAngles(175, 170, 0.95);
    for (let f = 0; f < 35; f++) {
      engine.processFrame(landmarks, 1000 + f * 33);
    }
    expect(engine.getState().status).toBe('calibrated');

    // Subject steps out of camera
    const emptyState = engine.processFrame([], 2500);
    expect(emptyState.status).toBe('recalibration_needed');
    expect(emptyState.recalibrationReason).toContain('Subject left camera frame');
  });

  it('10. Allows explicit reset with reason', () => {
    engine.reset('User switched camera device.');
    const state = engine.getState();
    expect(state.status).toBe('recalibration_needed');
    expect(state.recalibrationReason).toBe('User switched camera device.');
    expect(state.feedback.canProceedToWorkout).toBe(false);
  });
});
