/**
 * PratibhaScan Web — MediaPipe Pose Landmarker Service
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Manages official @mediapipe/tasks-vision PoseLandmarker lifecycle,
 * model loading, GPU-to-CPU fallback, video frame inference, and resource disposal.
 */

import {
  FilesetResolver,
  PoseLandmarker,
  PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { PoseDetectionOptions } from '../types/pose.types';

// Pin official CDN asset versions matching package.json
export const MEDIAPIPE_VISION_VERSION = '1.2.3';
export const WASM_ASSET_PATH = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VISION_VERSION}/wasm`;

// Official Google MediaPipe Pose Landmarker models (float16 quantized)
export const MODEL_URLS = {
  lite: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
  full: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
};

export const DEFAULT_DETECTION_OPTIONS: PoseDetectionOptions = {
  modelVariant: 'lite',
  delegate: 'GPU',
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  minPresenceConfidence: 0.5,
  numPoses: 1,
};

class PoseLandmarkerService {
  private landmarker: PoseLandmarker | null = null;
  private isInitializing = false;
  private lastProcessedTimestamp = -1;
  private activeDelegate: 'GPU' | 'CPU' = 'GPU';

  /**
   * Initializes or returns the cached PoseLandmarker instance.
   * Employs automatic GPU-to-CPU fallback if WebGL/GPU acceleration fails.
   */
  public async initialize(
    options: Partial<PoseDetectionOptions> = {}
  ): Promise<PoseLandmarker> {
    if (this.landmarker && !this.isInitializing) {
      return this.landmarker;
    }

    if (this.isInitializing) {
      // Wait for in-flight initialization
      let attempts = 0;
      while (this.isInitializing && attempts < 50) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }
      if (this.landmarker) return this.landmarker;
    }

    this.isInitializing = true;
    const mergedOptions: PoseDetectionOptions = {
      ...DEFAULT_DETECTION_OPTIONS,
      ...options,
    };

    try {
      // Step 1: Initialize FilesetResolver for WASM runtime
      const visionWasm = await FilesetResolver.forVisionTasks(WASM_ASSET_PATH);

      const modelAssetPath =
        mergedOptions.modelVariant === 'full' ? MODEL_URLS.full : MODEL_URLS.lite;

      // Step 2: Attempt creation with requested delegate (Default: GPU)
      try {
        this.activeDelegate = mergedOptions.delegate;
        this.landmarker = await PoseLandmarker.createFromOptions(visionWasm, {
          baseOptions: {
            modelAssetPath,
            delegate: this.activeDelegate,
          },
          runningMode: 'VIDEO',
          numPoses: mergedOptions.numPoses,
          minPoseDetectionConfidence: mergedOptions.minDetectionConfidence,
          minTrackingConfidence: mergedOptions.minTrackingConfidence,
          minPosePresenceConfidence: mergedOptions.minPresenceConfidence,
        });

        console.info(
          `[MediaPipeService] PoseLandmarker initialized successfully using ${this.activeDelegate} delegate (${mergedOptions.modelVariant} model).`
        );
      } catch (gpuError) {
        if (mergedOptions.delegate === 'GPU') {
          console.warn(
            '[MediaPipeService] GPU delegate initialization failed. Falling back to CPU delegate:',
            gpuError
          );

          this.activeDelegate = 'CPU';
          this.landmarker = await PoseLandmarker.createFromOptions(visionWasm, {
            baseOptions: {
              modelAssetPath,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numPoses: mergedOptions.numPoses,
            minPoseDetectionConfidence: mergedOptions.minDetectionConfidence,
            minTrackingConfidence: mergedOptions.minTrackingConfidence,
            minPosePresenceConfidence: mergedOptions.minPresenceConfidence,
          });

          console.info(
            `[MediaPipeService] PoseLandmarker initialized on CPU fallback (${mergedOptions.modelVariant} model).`
          );
        } else {
          throw gpuError;
        }
      }

      this.lastProcessedTimestamp = -1;
      return this.landmarker;
    } catch (err) {
      this.landmarker = null;
      console.error('[MediaPipeService] Failed to load MediaPipe Pose Landmarker:', err);
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Executes pose landmark detection for a single video frame.
   * Enforces strictly monotonically increasing timestamps required by MediaPipe Tasks VIDEO mode.
   */
  public detectForVideo(
    videoElement: HTMLVideoElement,
    timestamp: number
  ): PoseLandmarkerResult | null {
    if (!this.landmarker) {
      return null;
    }

    // Video must have valid dimensions and be actively playing (HAVE_CURRENT_DATA = 2)
    const haveCurrentData =
      typeof HTMLMediaElement !== 'undefined' ? HTMLMediaElement.HAVE_CURRENT_DATA : 2;

    if (
      videoElement.readyState < haveCurrentData ||
      videoElement.videoWidth === 0 ||
      videoElement.videoHeight === 0
    ) {
      return null;
    }

    // MediaPipe Tasks VIDEO mode requires timestamp > lastProcessedTimestamp
    const safeTimestamp =
      timestamp <= this.lastProcessedTimestamp
        ? this.lastProcessedTimestamp + 1
        : timestamp;

    try {
      const result = this.landmarker.detectForVideo(videoElement, safeTimestamp);
      this.lastProcessedTimestamp = safeTimestamp;
      return result;
    } catch (err) {
      console.warn('[MediaPipeService] detectForVideo frame execution warning:', err);
      return null;
    }
  }

  /**
   * Returns current active delegate (GPU or CPU fallback).
   */
  public getActiveDelegate(): 'GPU' | 'CPU' {
    return this.activeDelegate;
  }

  /**
   * Returns whether the model is currently initialized and ready.
   */
  public isReady(): boolean {
    return this.landmarker !== null;
  }

  /**
   * Closes and cleans up all WebGL / WASM memory resources.
   */
  public dispose(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch (err) {
        console.warn('[MediaPipeService] Error disposing PoseLandmarker:', err);
      }
      this.landmarker = null;
    }
    this.lastProcessedTimestamp = -1;
    this.isInitializing = false;
  }
}

// Export singleton instance
export const poseLandmarkerService = new PoseLandmarkerService();
