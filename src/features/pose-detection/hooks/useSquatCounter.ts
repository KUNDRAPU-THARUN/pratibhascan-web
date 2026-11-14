/**
 * PratibhaScan Web — useSquatCounter Custom Hook
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Manages the squat movement state machine session lifecycle,
 * exposes live telemetry metrics, and provides workout controls (start, pause, reset).
 */

import { useState, useRef, useCallback } from 'react';
import { NormalizedLandmark } from '../types/pose.types';
import {
  DEFAULT_SQUAT_CONFIG,
  SquatConfig,
  SquatSessionMetrics,
} from '../types/squat.types';
import { SquatStateMachine } from '../utils/squatStateMachine';

export function useSquatCounter(customConfig: Partial<SquatConfig> = {}) {
  const fsmRef = useRef<SquatStateMachine>(
    new SquatStateMachine({ ...DEFAULT_SQUAT_CONFIG, ...customConfig })
  );

  const [metrics, setMetrics] = useState<SquatSessionMetrics>({
    repetitionCount: 0,
    partialRepCount: 0,
    currentState: 'idle',
    kneeAngle: null,
    hipAngle: null,
    trunkAngle: null,
    minKneeAngleInCurrentRep: null,
    lastRepDurationMs: null,
    primarySide: 'unknown',
    trackingQuality: 'lost',
    sessionDurationSec: 0,
    isSessionActive: false,
    repHistory: [],
  });

  const lastUpdateRef = useRef<number>(0);

  /**
   * Processes each video frame's landmarks through the squat state machine.
   * Throttles React state telemetry dispatches to ~100ms for UI responsiveness.
   */
  const processFrame = useCallback((landmarks: NormalizedLandmark[], timestamp = performance.now()) => {
    const updatedMetrics = fsmRef.current.processFrame(landmarks, timestamp);

    // Throttle UI updates to 10Hz (every 100ms) or whenever state/rep changes
    const now = performance.now();
    const stateChanged = updatedMetrics.currentState !== metrics.currentState;
    const repChanged = updatedMetrics.repetitionCount !== metrics.repetitionCount;
    const partialChanged = updatedMetrics.partialRepCount !== metrics.partialRepCount;

    if (stateChanged || repChanged || partialChanged || now - lastUpdateRef.current > 100) {
      lastUpdateRef.current = now;
      setMetrics(updatedMetrics);
    }
  }, [metrics.currentState, metrics.repetitionCount, metrics.partialRepCount]);

  const startSession = useCallback(() => {
    fsmRef.current.startSession();
    setMetrics(fsmRef.current.processFrame([], performance.now()));
  }, []);

  const pauseSession = useCallback(() => {
    fsmRef.current.pauseSession();
    setMetrics(fsmRef.current.processFrame([], performance.now()));
  }, []);

  const resetSession = useCallback(() => {
    fsmRef.current.reset();
    setMetrics(fsmRef.current.processFrame([], performance.now()));
  }, []);

  return {
    metrics,
    processFrame,
    startSession,
    pauseSession,
    resetSession,
    fsm: fsmRef.current,
  };
}
