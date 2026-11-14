import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkCameraSupport,
  getAvailableCameras,
  requestCameraStream,
  stopMediaStream,
  isSecureContext,
} from '../services/cameraService';

describe('Camera Service Suite', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(global, 'window', {
      value: {
        isSecureContext: true,
        location: { hostname: 'localhost' },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  });

  describe('1. Environment & Secure Context Detection', () => {
    it('detects secure context when running on localhost', () => {
      expect(isSecureContext()).toBe(true);
    });

    it('detects insecure context when running on remote HTTP hostname', () => {
      Object.defineProperty(global, 'window', {
        value: {
          isSecureContext: false,
          location: { hostname: 'insecure-remote.com' },
        },
        writable: true,
        configurable: true,
      });
      expect(isSecureContext()).toBe(false);
    });

    it('reports camera supported when navigator.mediaDevices exists in secure context', () => {
      const mockMediaDevices = {
        getUserMedia: vi.fn(),
        enumerateDevices: vi.fn(),
      };

      Object.defineProperty(global, 'navigator', {
        value: { mediaDevices: mockMediaDevices },
        writable: true,
      });

      const support = checkCameraSupport();
      expect(support.isSupported).toBe(true);
    });

    it('reports unsupported when navigator.mediaDevices is missing', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
      });

      const support = checkCameraSupport();
      expect(support.isSupported).toBe(false);
      expect(support.reason).toContain('does not support');
    });
  });

  describe('2. Stream Lifecycle & Permission Handling', () => {
    it('successfully requests camera stream with expected constraints', async () => {
      const mockTrack = {
        stop: vi.fn(),
        kind: 'video',
      };

      const mockStream = {
        getTracks: vi.fn().mockReturnValue([mockTrack]),
      } as unknown as MediaStream;

      const getUserMediaMock = vi.fn().mockResolvedValue(mockStream);

      Object.defineProperty(global, 'navigator', {
        value: {
          mediaDevices: {
            getUserMedia: getUserMediaMock,
          },
        },
        writable: true,
      });

      const result = await requestCameraStream({
        facingMode: 'user',
        idealWidth: 1280,
        idealHeight: 720,
      });

      expect(result.error).toBeNull();
      expect(result.stream).toBe(mockStream);
      expect(getUserMediaMock).toHaveBeenCalledWith({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: { ideal: 'user' },
        },
        audio: false, // Strict audio exclusion
      });
    });

    it('handles NotAllowedError and returns permission_denied with guidance', async () => {
      const notAllowedErr = new DOMException('Permission denied', 'NotAllowedError');
      const getUserMediaMock = vi.fn().mockRejectedValue(notAllowedErr);

      Object.defineProperty(global, 'navigator', {
        value: {
          mediaDevices: {
            getUserMedia: getUserMediaMock,
          },
        },
        writable: true,
      });

      const result = await requestCameraStream();
      expect(result.stream).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.type).toBe('permission_denied');
      expect(result.error?.message).toContain('Camera permission was denied');
    });

    it('handles NotFoundError when camera hardware is disconnected', async () => {
      const notFoundErr = new DOMException('No camera found', 'NotFoundError');
      const getUserMediaMock = vi.fn().mockRejectedValue(notFoundErr);

      Object.defineProperty(global, 'navigator', {
        value: {
          mediaDevices: {
            getUserMedia: getUserMediaMock,
          },
        },
        writable: true,
      });

      const result = await requestCameraStream();
      expect(result.stream).toBeNull();
      expect(result.error?.type).toBe('not_found');
      expect(result.error?.message).toContain('No camera hardware was detected');
    });

    it('handles NotReadableError when camera is locked by another application', async () => {
      const inUseErr = new DOMException('Device in use', 'NotReadableError');
      const getUserMediaMock = vi.fn().mockRejectedValue(inUseErr);

      Object.defineProperty(global, 'navigator', {
        value: {
          mediaDevices: {
            getUserMedia: getUserMediaMock,
          },
        },
        writable: true,
      });

      const result = await requestCameraStream();
      expect(result.stream).toBeNull();
      expect(result.error?.type).toBe('in_use');
      expect(result.error?.message).toContain('Camera is currently in use');
    });

    it('handles OverconstrainedError when requested deviceId or facingMode is unavailable', async () => {
      const overconstrainedErr = new DOMException('Overconstrained', 'OverconstrainedError');
      const getUserMediaMock = vi.fn().mockRejectedValue(overconstrainedErr);

      Object.defineProperty(global, 'navigator', {
        value: {
          mediaDevices: {
            getUserMedia: getUserMediaMock,
          },
        },
        writable: true,
      });

      const result = await requestCameraStream({ deviceId: 'missing-cam-id' });
      expect(result.stream).toBeNull();
      expect(result.error?.type).toBe('not_found');
      expect(result.error?.message).toContain('not available on this device');
    });

    it('handles SecurityError when execution context violates security policy', async () => {
      const securityErr = new DOMException('Blocked by CSP or permissions policy', 'SecurityError');
      const getUserMediaMock = vi.fn().mockRejectedValue(securityErr);

      Object.defineProperty(global, 'navigator', {
        value: {
          mediaDevices: {
            getUserMedia: getUserMediaMock,
          },
        },
        writable: true,
      });

      const result = await requestCameraStream();
      expect(result.stream).toBeNull();
      expect(result.error?.type).toBe('insecure_context');
      expect(result.error?.message).toContain('insecure context');
    });

    it('passes specific deviceId constraint when deviceId is provided', async () => {
      const mockTrack = { stop: vi.fn(), kind: 'video' };
      const mockStream = { getTracks: vi.fn().mockReturnValue([mockTrack]) } as unknown as MediaStream;
      const getUserMediaMock = vi.fn().mockResolvedValue(mockStream);

      Object.defineProperty(global, 'navigator', {
        value: { mediaDevices: { getUserMedia: getUserMediaMock } },
        writable: true,
      });

      await requestCameraStream({ deviceId: 'external-hd-webcam-123' });

      expect(getUserMediaMock).toHaveBeenCalledWith({
        video: expect.objectContaining({
          deviceId: { exact: 'external-hd-webcam-123' },
        }),
        audio: false,
      });
    });
  });

  describe('3. Stream Teardown & Device Enumeration', () => {
    it('stops and releases all tracks in a stream', () => {
      const track1 = { stop: vi.fn() };
      const track2 = { stop: vi.fn() };
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([track1, track2]),
      } as unknown as MediaStream;

      stopMediaStream(mockStream);
      expect(track1.stop).toHaveBeenCalledTimes(1);
      expect(track2.stop).toHaveBeenCalledTimes(1);
    });

    it('handles null stream in stopMediaStream without throwing', () => {
      expect(() => stopMediaStream(null)).not.toThrow();
    });

    it('enumerates available video devices correctly', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'cam-1', label: 'FaceTime HD Front Camera' },
        { kind: 'videoinput', deviceId: 'cam-2', label: 'USB Back Camera' },
        { kind: 'audioinput', deviceId: 'mic-1', label: 'Internal Mic' },
      ];

      Object.defineProperty(global, 'navigator', {
        value: {
          mediaDevices: {
            enumerateDevices: vi.fn().mockResolvedValue(mockDevices),
            getUserMedia: vi.fn(),
          },
        },
        writable: true,
      });

      const cameras = await getAvailableCameras();
      expect(cameras).toHaveLength(2); // Only videoinput
      expect(cameras[0].deviceId).toBe('cam-1');
      expect(cameras[0].facingMode).toBe('user');
      expect(cameras[1].deviceId).toBe('cam-2');
      expect(cameras[1].facingMode).toBe('environment');
    });
  });
});
