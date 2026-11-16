/**
 * PratibhaScan Web — Camera Framing & Calibration Hook
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * React hook connecting Camera CalibrationEngine to video frames and UI state.
 */

import { useState, useRef, useCallback } from 'react';
import { CalibrationEngine } from '../utils/calibrationEngine';
import { CalibrationState } from '../types/calibration.types';
import { NormalizedLandmark } from '../types/pose.types';

export function useCalibration() {
  const engineRef = useRef<CalibrationEngine>(new CalibrationEngine());

  const [calibrationState, setCalibrationState] = useState<CalibrationState>(() =>
    engineRef.current.getState()
  );

  const processFrame = useCallback(
    (landmarks: NormalizedLandmark[], timestamp = performance.now()) => {
      const nextState = engineRef.current.processFrame(landmarks, timestamp);
      // Throttle React state updates to avoid unnecessary high-frequency renders
      setCalibrationState(nextState);
      return nextState;
    },
    []
  );

  const resetCalibration = useCallback((reason: string | null = null) => {
    engineRef.current.reset(reason);
    setCalibrationState(engineRef.current.getState());
  }, []);

  const forceCalibrate = useCallback(() => {
    // Allows user to manually accept calibration if framing looks good
    setCalibrationState((prev) => ({
      ...prev,
      status: 'calibrated',
      calibratedAt: performance.now(),
      recalibrationReason: null,
      feedback: {
        ...prev.feedback,
        canProceedToWorkout: true,
        guidanceMessage: 'Calibration accepted by user.',
      },
    }));
  }, []);

  return {
    calibrationState,
    processCalibrationFrame: processFrame,
    resetCalibration,
    forceCalibrate,
    isCalibrated: calibrationState.status === 'calibrated',
  };
}
