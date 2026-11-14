/**
 * PratibhaScan Web — Performance Monitor
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Tracks real-time FPS, inference latency, rendering duration,
 * and frame dropping metrics using a rolling timestamp window.
 */

import { PerformanceMetrics } from '../types/pose.types';

export class PerformanceMonitor {
  private frameTimestamps: number[] = [];
  private inferenceDurations: number[] = [];
  private renderDurations: number[] = [];
  private windowSize: number;
  private droppedFrameCount = 0;
  private lastInferenceTime = 0;
  private currentFps = 0;

  constructor(windowSize = 25) {
    this.windowSize = windowSize;
  }

  /**
   * Records a processed frame and computes current instantaneous FPS.
   */
  public recordFrame(inferenceTimeMs = 0, renderTimeMs = 0): PerformanceMetrics {
    const now = performance.now();
    this.frameTimestamps.push(now);
    this.inferenceDurations.push(inferenceTimeMs);
    this.renderDurations.push(renderTimeMs);

    // Maintain sliding window
    if (this.frameTimestamps.length > this.windowSize) {
      this.frameTimestamps.shift();
      this.inferenceDurations.shift();
      this.renderDurations.shift();
    }

    // Compute FPS based on time delta across sliding window
    if (this.frameTimestamps.length >= 2) {
      const oldest = this.frameTimestamps[0];
      const deltaSec = (now - oldest) / 1000;
      if (deltaSec > 0) {
        this.currentFps = Math.round(((this.frameTimestamps.length - 1) / deltaSec) * 10) / 10;
      }
    } else {
      this.currentFps = 0;
    }

    this.lastInferenceTime = inferenceTimeMs;

    const avgInference = this.average(this.inferenceDurations);
    const avgRender = this.average(this.renderDurations);

    return {
      fps: this.currentFps,
      inferenceTimeMs: Math.round(avgInference * 10) / 10,
      renderTimeMs: Math.round(avgRender * 10) / 10,
      droppedFrames: this.droppedFrameCount,
      timestamp: now,
    };
  }

  /**
   * Records a dropped/skipped frame where video was active but inference couldn't run.
   */
  public recordDroppedFrame(): void {
    this.droppedFrameCount++;
  }

  /**
   * Resets all sliding metrics when tracking starts, stops, or pauses.
   */
  public reset(): void {
    this.frameTimestamps = [];
    this.inferenceDurations = [];
    this.renderDurations = [];
    this.droppedFrameCount = 0;
    this.lastInferenceTime = 0;
    this.currentFps = 0;
  }

  public getFps(): number {
    return this.currentFps;
  }

  public getLastInferenceTimeMs(): number {
    return this.lastInferenceTime;
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((acc, v) => acc + v, 0);
    return sum / arr.length;
  }
}
