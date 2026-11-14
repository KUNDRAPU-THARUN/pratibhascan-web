/**
 * PratibhaScan Web — useCamera Custom Hook
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Manages video media stream lifecycle, device enumeration,
 * camera switching (front/rear/external), error management, and unmount cleanup.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CameraDeviceInfo,
  CameraErrorDetails,
  CameraFacingMode,
  CameraStatus,
} from '../types/pose.types';
import {
  getAvailableCameras,
  requestCameraStream,
  stopMediaStream,
  checkCameraSupport,
} from '../services/cameraService';

export interface UseCameraOptions {
  autoStart?: boolean;
  initialFacingMode?: CameraFacingMode;
  idealWidth?: number;
  idealHeight?: number;
}

export function useCamera(options: UseCameraOptions = {}) {
  const {
    autoStart = false,
    initialFacingMode = 'user',
    idealWidth = 1280,
    idealHeight = 720,
  } = options;

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<CameraFacingMode>(initialFacingMode);
  const [cameraError, setCameraError] = useState<CameraErrorDetails | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  // Sync streamRef with stream state for clean synchronous teardowns
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  /**
   * Stops the active camera stream and releases hardware resources.
   * Cancels any pending in-flight startCamera requests.
   */
  const stopCamera = useCallback(() => {
    // Invalidate any in-flight startCamera promises
    activeRequestIdRef.current += 1;

    if (streamRef.current) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setCameraStatus('stopped');
  }, []);

  /**
   * Starts the camera with explicit user action.
   * Safe against rapid start/stop race conditions.
   */
  const startCamera = useCallback(
    async (overrideOptions: { deviceId?: string; facingMode?: CameraFacingMode } = {}): Promise<boolean> => {
      // Increment request ID to track this specific invocation
      const currentRequestId = ++activeRequestIdRef.current;

      // Clean up any existing stream before starting a new one
      if (streamRef.current) {
        stopMediaStream(streamRef.current);
        streamRef.current = null;
      }

      setCameraError(null);
      setCameraStatus('requesting_permission');

      const targetFacing = overrideOptions.facingMode || facingMode;
      const targetDevice = overrideOptions.deviceId || activeDeviceId || undefined;

      const { stream: newStream, error } = await requestCameraStream({
        deviceId: targetDevice,
        facingMode: targetFacing,
        idealWidth,
        idealHeight,
      });

      // If user stopped camera or launched a new request while in flight, release immediately
      if (activeRequestIdRef.current !== currentRequestId) {
        if (newStream) {
          stopMediaStream(newStream);
        }
        return false;
      }

      if (error || !newStream) {
        setCameraStatus(error?.type === 'permission_denied' ? 'permission_denied' : 'error');
        setCameraError(
          error || {
            type: 'unknown',
            message: 'Failed to access camera stream.',
          }
        );
        return false;
      }

      // Attach stream to video element
      streamRef.current = newStream;
      setStream(newStream);
      setCameraStatus('active');

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch((playErr) => {
          console.warn('[useCamera] Video play error (may require user gesture):', playErr);
        });
      }

      // Add track.onended listener to handle physical disconnection or system revocation
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.warn('[useCamera] Camera track ended (device unplugged or revoked by OS).');
          stopCamera();
          setCameraStatus('error');
          setCameraError({
            type: 'not_found',
            message: 'Camera was disconnected or stopped by the operating system.',
          });
        };
      }

      // Enumerate devices once permission is granted
      try {
        const devices = await getAvailableCameras();
        setAvailableCameras(devices);

        // Determine active track details
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.deviceId) {
            setActiveDeviceId(settings.deviceId);
          }
          if (settings.facingMode) {
            setFacingMode(settings.facingMode as CameraFacingMode);
          }
        }
      } catch (e) {
        console.warn('[useCamera] Error updating device list:', e);
      }

      return true;
    },
    [facingMode, activeDeviceId, idealWidth, idealHeight, stopCamera]
  );

  /**
   * Switches to a specific camera device ID or toggles front/rear facing mode.
   * If switching fails, automatically rolls back to previous working camera.
   */
  const switchCamera = useCallback(
    async (targetDeviceId?: string): Promise<boolean> => {
      const prevDeviceId = activeDeviceId;
      const prevFacing = facingMode;

      let success = false;
      if (targetDeviceId) {
        setActiveDeviceId(targetDeviceId);
        success = await startCamera({ deviceId: targetDeviceId });
      } else {
        // Toggle between 'user' and 'environment'
        const newFacing: CameraFacingMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacing);
        setActiveDeviceId(null); // Clear specific device ID so facingMode takes precedence
        success = await startCamera({ facingMode: newFacing, deviceId: undefined });
      }

      if (!success) {
        console.warn('[useCamera] Camera switch failed, rolling back to previous camera.');
        setActiveDeviceId(prevDeviceId);
        setFacingMode(prevFacing);
        await startCamera({ deviceId: prevDeviceId || undefined, facingMode: prevFacing });
      }

      return success;
    },
    [facingMode, activeDeviceId, startCamera]
  );

  // Monitor device changes (e.g. plugging in or unplugging USB webcams)
  useEffect(() => {
    const handleDeviceChange = async () => {
      try {
        const devices = await getAvailableCameras();
        setAvailableCameras(devices);
      } catch (e) {
        console.warn('[useCamera] Failed to refresh devices on devicechange:', e);
      }
    };

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    const support = checkCameraSupport();
    if (!support.isSupported) {
      setCameraStatus('error');
      setCameraError({
        type: 'unsupported',
        message: support.reason || 'Camera is not supported on this platform.',
      });
      return;
    }

    if (autoStart) {
      startCamera();
    }

    // Comprehensive unmount cleanup: guarantees camera hardware shuts off
    return () => {
      if (streamRef.current) {
        stopMediaStream(streamRef.current);
        streamRef.current = null;
      }
    };
  }, [autoStart, startCamera]);

  return {
    cameraStatus,
    stream,
    videoRef,
    availableCameras,
    activeDeviceId,
    facingMode,
    cameraError,
    startCamera,
    stopCamera,
    switchCamera,
    isMirrored: facingMode === 'user',
  };
}
