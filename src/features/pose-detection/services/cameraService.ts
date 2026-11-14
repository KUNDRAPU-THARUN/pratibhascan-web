/**
 * PratibhaScan Web — Camera Service
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Low-level interface for MediaDevices API, device enumeration,
 * permission querying, stream lifecycle management, and error translation.
 */

import {
  CameraDeviceInfo,
  CameraErrorDetails,
  CameraFacingMode,
} from '../types/pose.types';

export interface CameraRequestOptions {
  deviceId?: string;
  facingMode?: CameraFacingMode;
  idealWidth?: number;
  idealHeight?: number;
  idealFrameRate?: number;
}

/**
 * Checks if the current execution context is secure (HTTPS or localhost).
 * MediaDevices.getUserMedia() strictly requires a secure context in modern browsers.
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true; // Non-browser / Node.js test environment
  if (window.isSecureContext) return true;

  // Localhost / 127.0.0.1 exceptions for local development & testing
  const hostname = window.location?.hostname || '';
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.localhost')
  );
}

/**
 * Checks if the user's browser environment supports MediaDevices.
 */
export function checkCameraSupport(): { isSupported: boolean; reason?: string } {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return {
      isSupported: false,
      reason: 'Your browser does not support the MediaDevices camera API.',
    };
  }

  if (typeof navigator.mediaDevices.getUserMedia !== 'function') {
    return {
      isSupported: false,
      reason: 'getUserMedia is not implemented in this browser environment.',
    };
  }

  if (!isSecureContext()) {
    return {
      isSupported: false,
      reason:
        'Camera access requires a secure connection (HTTPS) or local development server (localhost).',
    };
  }

  return { isSupported: true };
}

/**
 * Enumerates all available video input devices (cameras).
 * Label details may be empty until initial camera permission has been granted by the user.
 */
export async function getAvailableCameras(): Promise<CameraDeviceInfo[]> {
  const support = checkCameraSupport();
  if (!support.isSupported) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((device) => device.kind === 'videoinput');

    return videoDevices.map((device, index) => {
      let inferredFacing: CameraFacingMode | undefined;
      const lowerLabel = device.label.toLowerCase();
      if (lowerLabel.includes('front') || lowerLabel.includes('user') || lowerLabel.includes('facetime')) {
        inferredFacing = 'user';
      } else if (
        lowerLabel.includes('back') ||
        lowerLabel.includes('rear') ||
        lowerLabel.includes('environment')
      ) {
        inferredFacing = 'environment';
      }

      return {
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`,
        facingMode: inferredFacing,
      };
    });
  } catch (err) {
    console.warn('[CameraService] Failed to enumerate camera devices:', err);
    return [];
  }
}

/**
 * Requests camera access with explicit constraints.
 * Audio is strictly disabled to respect athlete privacy.
 */
export async function requestCameraStream(
  options: CameraRequestOptions = {}
): Promise<{ stream: MediaStream | null; error: CameraErrorDetails | null }> {
  const support = checkCameraSupport();
  if (!support.isSupported) {
    return {
      stream: null,
      error: {
        type: isSecureContext() ? 'unsupported' : 'insecure_context',
        message: support.reason || 'Camera is not supported in this environment.',
      },
    };
  }

  const {
    deviceId,
    facingMode = 'user',
    idealWidth = 1280,
    idealHeight = 720,
    idealFrameRate = 30,
  } = options;

  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: idealWidth },
    height: { ideal: idealHeight },
    frameRate: { ideal: idealFrameRate },
  };

  if (deviceId) {
    videoConstraints.deviceId = { exact: deviceId };
  } else if (facingMode) {
    videoConstraints.facingMode = { ideal: facingMode };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false, // Explicitly no microphone
    });

    return { stream, error: null };
  } catch (err: unknown) {
    const errorDetails = translateCameraError(err, options);
    return { stream: null, error: errorDetails };
  }
}

/**
 * Completely stops and releases all media tracks in a stream.
 * Ensures the physical camera indicator turns off immediately.
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;

  try {
    const tracks = stream.getTracks();
    tracks.forEach((track) => {
      try {
        track.stop();
      } catch (e) {
        console.warn('[CameraService] Error stopping media track:', e);
      }
    });
  } catch (err) {
    console.warn('[CameraService] Error accessing stream tracks for cleanup:', err);
  }
}

/**
 * Translates native browser DOMExceptions into user-actionable error states.
 */
function translateCameraError(
  err: unknown,
  requestedOptions: CameraRequestOptions
): CameraErrorDetails {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return {
          type: 'permission_denied',
          message:
            'Camera permission was denied. Please allow camera access in your browser settings to use the AI Pose Detection Studio.',
          originalError: err,
        };

      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return {
          type: 'not_found',
          message:
            'No camera hardware was detected on your device. Please connect a working webcam.',
          originalError: err,
        };

      case 'NotReadableError':
      case 'TrackStartError':
        return {
          type: 'in_use',
          message:
            'Camera is currently in use by another application, browser tab, or system process. Please close other camera apps and retry.',
          originalError: err,
        };

      case 'OverconstrainedError':
        return {
          type: 'not_found',
          message: `The requested camera configuration (${requestedOptions.facingMode || requestedOptions.deviceId}) is not available on this device.`,
          originalError: err,
        };

      case 'SecurityError':
        return {
          type: 'insecure_context',
          message:
            'Camera access is blocked due to an insecure context. HTTPS or localhost is required.',
          originalError: err,
        };

      default:
        return {
          type: 'unknown',
          message: `Camera error: ${err.message || err.name}`,
          originalError: err,
        };
    }
  }

  return {
    type: 'unknown',
    message: err instanceof Error ? err.message : 'An unexpected camera error occurred.',
    originalError: err,
  };
}
