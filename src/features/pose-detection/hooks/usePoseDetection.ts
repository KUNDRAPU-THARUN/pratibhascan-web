/**
 * PratibhaScan Web — usePoseDetection Custom Hook
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Bridges the video stream to MediaPipe Tasks Vision PoseLandmarker,
 * runs continuous requestAnimationFrame inference loops, renders skeleton directly to canvas,
 * and tracks real-time performance telemetry without React state churn.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ModelStatus,
  NormalizedLandmark,
  PerformanceMetrics,
  PoseDetectionOptions,
  PoseOverlayDisplaySettings,
  TrackingStatus,
} from '../types/pose.types';
import { poseLandmarkerService } from '../services/poseLandmarkerService';
import { renderPoseOnCanvas } from '../utils/landmarkTransform';
import { PerformanceMonitor } from '../utils/performanceMonitor';

export interface UsePoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  isMirrored?: boolean;
  options?: Partial<PoseDetectionOptions>;
  overlaySettings?: Partial<PoseOverlayDisplaySettings>;
  onLandmarksDetected?: (landmarks: NormalizedLandmark[], timestamp: number) => void;
}

export function usePoseDetection({
  videoRef,
  canvasRef,
  isCameraActive,
  isMirrored = true,
  options = {},
  overlaySettings = {},
  onLandmarksDetected,
}: UsePoseDetectionProps) {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('unloaded');
  const [modelError, setModelError] = useState<string | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [activeDelegate, setActiveDelegate] = useState<'GPU' | 'CPU'>('GPU');
  const [isPersonDetected, setIsPersonDetected] = useState(false);

  // Throttled performance telemetry for React UI display
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    inferenceTimeMs: 0,
    renderTimeMs: 0,
    droppedFrames: 0,
    timestamp: 0,
  });

  const animFrameIdRef = useRef<number | null>(null);
  const perfMonitorRef = useRef<PerformanceMonitor>(new PerformanceMonitor());
  const lastTelemetryUpdateRef = useRef<number>(0);
  const latestLandmarksRef = useRef<NormalizedLandmark[]>([]);
  const lastVideoTimeRef = useRef<number>(-1);
  const isTabVisibleRef = useRef<boolean>(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  const onLandmarksDetectedRef = useRef(onLandmarksDetected);
  onLandmarksDetectedRef.current = onLandmarksDetected;

  // Keep options & settings in refs to avoid recreating the animation loop
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const overlaySettingsRef = useRef(overlaySettings);
  overlaySettingsRef.current = overlaySettings;

  const isMirroredRef = useRef(isMirrored);
  isMirroredRef.current = isMirrored;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  /**
   * Preloads or initializes the MediaPipe Pose Landmarker model.
   */
  const loadModel = useCallback(async () => {
    if (poseLandmarkerService.isReady()) {
      setModelStatus('ready');
      setActiveDelegate(poseLandmarkerService.getActiveDelegate());
      return true;
    }

    setModelStatus('loading');
    setModelError(null);

    try {
      await poseLandmarkerService.initialize(optionsRef.current);
      setModelStatus('ready');
      setActiveDelegate(poseLandmarkerService.getActiveDelegate());
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setModelStatus('error');
      setModelError(errMsg);
      console.error('[usePoseDetection] Model load error:', err);
      return false;
    }
  }, []);

  /**
   * Animation Frame processing loop.
   * Runs at full display refresh rate, but decouples canvas drawing from React re-renders.
   * Avoids running inference repeatedly on identical/duplicate video frames.
   */
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || isPausedRef.current || !isTabVisibleRef.current) {
      if (isCameraActive && !isPausedRef.current && isTabVisibleRef.current) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }

    // Ensure video is playing and has frames ready
    if (
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      // Check if video currentTime has advanced to avoid duplicate inference on same frame
      const currentVideoTime = video.currentTime;
      if (currentVideoTime === lastVideoTimeRef.current && lastVideoTimeRef.current >= 0) {
        // Frame has not updated yet (e.g. 120Hz display with 30fps webcam stream)
        animFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastVideoTimeRef.current = currentVideoTime;

      const now = performance.now();
      const ctx = canvas.getContext('2d');

      // Adjust canvas internal dimensions to match display client dimensions (with DPR)
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (displayWidth > 0 && displayHeight > 0) {
        const targetWidth = Math.round(displayWidth * dpr);
        const targetHeight = Math.round(displayHeight * dpr);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }
      }

      try {
        // Step 1: Execute MediaPipe Inference
        const t0 = performance.now();
        const result = poseLandmarkerService.detectForVideo(video, now);
        const inferenceDuration = performance.now() - t0;

        // Step 2: Render skeleton directly to canvas (Zero React state overhead)
        const t1 = performance.now();
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (result && result.landmarks && result.landmarks.length > 0) {
            const primaryPose = result.landmarks[0];
            latestLandmarksRef.current = primaryPose;

            if (onLandmarksDetectedRef.current) {
              onLandmarksDetectedRef.current(primaryPose, now);
            }

            renderPoseOnCanvas(
              ctx,
              primaryPose,
              {
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                isMirrored: isMirroredRef.current,
                fitMode: 'cover',
                dpr,
              },
              overlaySettingsRef.current
            );
          } else {
            latestLandmarksRef.current = [];
            if (onLandmarksDetectedRef.current) {
              onLandmarksDetectedRef.current([], now);
            }
          }
        }
        const renderDuration = performance.now() - t1;

        // Step 3: Performance Telemetry (Throttled React state updates every 250ms)
        const currentMetrics = perfMonitorRef.current.recordFrame(
          inferenceDuration,
          renderDuration
        );

        const hasPerson = !!(result && result.landmarks && result.landmarks.length > 0);

        if (now - lastTelemetryUpdateRef.current > 250) {
          lastTelemetryUpdateRef.current = now;
          setMetrics(currentMetrics);
          setIsPersonDetected(hasPerson);
          setTrackingStatus(hasPerson ? 'tracking' : 'no_person_detected');
        }
      } catch (inferenceErr) {
        console.warn('[usePoseDetection] Frame processing anomaly:', inferenceErr);
        perfMonitorRef.current.recordDroppedFrame();
      }
    } else {
      perfMonitorRef.current.recordDroppedFrame();
    }

    // Schedule next frame
    animFrameIdRef.current = requestAnimationFrame(processFrame);
  }, [videoRef, canvasRef, isCameraActive]);

  // Handle browser tab visibility changes (suspend processing when hidden, resume when visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
      isTabVisibleRef.current = isVisible;

      if (!isVisible) {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
      } else if (isCameraActive && !isPausedRef.current) {
        perfMonitorRef.current.reset();
        lastVideoTimeRef.current = -1;
        animFrameIdRef.current = requestAnimationFrame(processFrame);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isCameraActive, processFrame]);

  /**
   * Starts / Stops the processing loop when camera state or pause state changes.
   */
  useEffect(() => {
    if (!isCameraActive || isPaused) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }

      // Clear canvas when camera stops
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }

      if (!isCameraActive) {
        setTrackingStatus('idle');
        setIsPersonDetected(false);
        perfMonitorRef.current.reset();
        setMetrics({
          fps: 0,
          inferenceTimeMs: 0,
          renderTimeMs: 0,
          droppedFrames: 0,
          timestamp: 0,
        });
      } else if (isPaused) {
        setTrackingStatus('paused');
      }
      return;
    }

    // Camera is active and not paused: ensure model is ready and launch loop
    let isCancelled = false;

    const startTrackingLoop = async () => {
      const isReady = await loadModel();
      if (!isReady || isCancelled) return;

      perfMonitorRef.current.reset();
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    startTrackingLoop();

    return () => {
      isCancelled = true;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [isCameraActive, isPaused, loadModel, processFrame, canvasRef]);

  /**
   * Toggles pause/resume tracking.
   */
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (!next) {
        setTrackingStatus(isPersonDetected ? 'tracking' : 'no_person_detected');
      } else {
        setTrackingStatus('paused');
      }
      return next;
    });
  }, [isPersonDetected]);

  /**
   * Cleanup on complete unmount.
   */
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, []);

  return {
    modelStatus,
    modelError,
    trackingStatus,
    isPaused,
    togglePause,
    activeDelegate,
    isPersonDetected,
    metrics,
    loadModel,
    latestLandmarks: latestLandmarksRef.current,
  };
}
