import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMonitor } from '../utils/performanceMonitor';

describe('Performance Monitor Telemetry Suite', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor(10);
  });

  it('initializes with zero FPS and zero latency', () => {
    expect(monitor.getFps()).toBe(0);
    expect(monitor.getLastInferenceTimeMs()).toBe(0);
  });

  it('computes rolling FPS accurately based on time elapsed', () => {
    let mockTime = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => mockTime);

    // Frame 1 at t = 1000ms
    monitor.recordFrame(15, 2);

    // Frame 2 at t = 1033.3ms (30 FPS cadence)
    mockTime += 33.33;
    const metrics2 = monitor.recordFrame(14, 2);
    expect(metrics2.fps).toBeCloseTo(30, 0);

    // Frame 3 at t = 1066.6ms
    mockTime += 33.33;
    const metrics3 = monitor.recordFrame(16, 2);
    expect(metrics3.fps).toBeCloseTo(30, 0);
  });

  it('averages inference and rendering duration across the sliding window', () => {
    monitor.recordFrame(10, 5);
    monitor.recordFrame(20, 5);
    const metrics = monitor.recordFrame(30, 5);

    expect(metrics.inferenceTimeMs).toBe(20); // (10+20+30)/3 = 20
    expect(metrics.renderTimeMs).toBe(5);
  });

  it('increments dropped frame count', () => {
    monitor.recordDroppedFrame();
    monitor.recordDroppedFrame();
    const metrics = monitor.recordFrame(15, 2);
    expect(metrics.droppedFrames).toBe(2);
  });

  it('clears all metrics cleanly upon reset()', () => {
    monitor.recordFrame(15, 2);
    monitor.recordDroppedFrame();
    monitor.reset();

    expect(monitor.getFps()).toBe(0);
    expect(monitor.getLastInferenceTimeMs()).toBe(0);
    const freshMetrics = monitor.recordFrame(12, 1);
    expect(freshMetrics.droppedFrames).toBe(0);
  });
});
