import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { poseLandmarkerService } from '../services/poseLandmarkerService';

vi.mock('@mediapipe/tasks-vision', () => {
  const mockLandmarker = {
    detectForVideo: vi.fn(),
    close: vi.fn(),
  };

  return {
    FilesetResolver: {
      forVisionTasks: vi.fn().mockResolvedValue({}),
    },
    PoseLandmarker: {
      createFromOptions: vi.fn().mockResolvedValue(mockLandmarker),
    },
  };
});

describe('Pose Landmarker Service Pipeline Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    poseLandmarkerService.dispose();
  });

  afterEach(() => {
    poseLandmarkerService.dispose();
  });

  it('initializes MediaPipe PoseLandmarker with GPU delegate by default', async () => {
    await poseLandmarkerService.initialize({ modelVariant: 'lite', delegate: 'GPU' });

    expect(FilesetResolver.forVisionTasks).toHaveBeenCalledTimes(1);
    expect(PoseLandmarker.createFromOptions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        baseOptions: expect.objectContaining({
          delegate: 'GPU',
        }),
        runningMode: 'VIDEO',
      })
    );
    expect(poseLandmarkerService.isReady()).toBe(true);
    expect(poseLandmarkerService.getActiveDelegate()).toBe('GPU');
  });

  it('automatically falls back to CPU delegate when GPU delegate throws an error', async () => {
    const mockLandmarkerInstance = { detectForVideo: vi.fn(), close: vi.fn() };

    // First call (GPU) rejects, second call (CPU) resolves
    (PoseLandmarker.createFromOptions as any)
      .mockRejectedValueOnce(new Error('WebGL unsupported on target system'))
      .mockResolvedValueOnce(mockLandmarkerInstance);

    await poseLandmarkerService.initialize({ modelVariant: 'lite', delegate: 'GPU' });

    expect(PoseLandmarker.createFromOptions).toHaveBeenCalledTimes(2);
    // Second invocation has delegate: 'CPU'
    expect(PoseLandmarker.createFromOptions).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        baseOptions: expect.objectContaining({
          delegate: 'CPU',
        }),
      })
    );

    expect(poseLandmarkerService.getActiveDelegate()).toBe('CPU');
    expect(poseLandmarkerService.isReady()).toBe(true);
  });

  it('guarantees monotonically increasing timestamps for video frame inference', async () => {
    const mockDetect = vi.fn().mockReturnValue({ landmarks: [] });
    const mockLandmarkerInstance = { detectForVideo: mockDetect, close: vi.fn() };
    (PoseLandmarker.createFromOptions as any).mockResolvedValue(mockLandmarkerInstance);

    await poseLandmarkerService.initialize();

    const mockVideo = {
      readyState: 4, // HAVE_ENOUGH_DATA
      videoWidth: 640,
      videoHeight: 480,
    } as unknown as HTMLVideoElement;

    // Frame 1 with timestamp 100
    poseLandmarkerService.detectForVideo(mockVideo, 100);
    expect(mockDetect).toHaveBeenLastCalledWith(mockVideo, 100);

    // Frame 2 with identical timestamp 100 (must be adjusted to strictly > 100 to prevent MediaPipe error)
    poseLandmarkerService.detectForVideo(mockVideo, 100);
    expect(mockDetect).toHaveBeenLastCalledWith(mockVideo, 101);

    // Frame 3 with earlier timestamp 90 (must be adjusted to > 101)
    poseLandmarkerService.detectForVideo(mockVideo, 90);
    expect(mockDetect).toHaveBeenLastCalledWith(mockVideo, 102);
  });

  it('disposes underlying MediaPipe model and frees memory cleanly', async () => {
    const mockClose = vi.fn();
    const mockLandmarkerInstance = { detectForVideo: vi.fn(), close: mockClose };
    (PoseLandmarker.createFromOptions as any).mockResolvedValue(mockLandmarkerInstance);

    await poseLandmarkerService.initialize();
    expect(poseLandmarkerService.isReady()).toBe(true);

    poseLandmarkerService.dispose();
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(poseLandmarkerService.isReady()).toBe(false);
  });
});
