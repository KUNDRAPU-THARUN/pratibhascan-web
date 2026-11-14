/**
 * PratibhaScan Web — Camera Preview Component
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Renders the live video viewport and aligned skeleton canvas overlay.
 * Handles mirroring for front-facing camera, aspect ratio adjustments,
 * loading animations, and inactive placeholder states.
 */

import React from 'react';
import { CameraStatus, ModelStatus, TrackingStatus } from '../types/pose.types';
import { Camera, Loader2, Sparkles, User, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null> | React.RefObject<any>;
  canvasRef: React.RefObject<HTMLCanvasElement | null> | React.RefObject<any>;
  cameraStatus: CameraStatus;
  modelStatus: ModelStatus;
  trackingStatus: TrackingStatus;
  isMirrored: boolean;
  isPersonDetected: boolean;
  onStartCamera: () => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  canvasRef,
  cameraStatus,
  modelStatus,
  trackingStatus,
  isMirrored,
  isPersonDetected,
  onStartCamera,
}) => {
  const isCameraActive = cameraStatus === 'active';
  const isInitializing =
    cameraStatus === 'requesting_permission' ||
    cameraStatus === 'initializing' ||
    (isCameraActive && modelStatus === 'loading');

  return (
    <div className="relative w-full aspect-4/3 sm:aspect-16/9 max-h-[640px] bg-navy-950 rounded-2xl overflow-hidden shadow-elevated border border-navy-800 flex items-center justify-center select-none">
      {/* 1. HTML5 Video Element */}
      <video
        ref={videoRef as any}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-200 ${
          isMirrored ? '-scale-x-100' : ''
        } ${isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* 2. Hardware Canvas Overlay for MediaPipe Pose Skeleton */}
      <canvas
        ref={canvasRef as any}
        className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${
          isCameraActive ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 3. Live Floating Badges (Top Bar) */}
      {isCameraActive && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-navy-950/80 text-white backdrop-blur-md border border-white/20 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse mr-1.5" />
              LIVE CAMERA
            </span>

            {trackingStatus === 'paused' ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/90 text-navy-950 backdrop-blur-md">
                <Pause className="h-2.5 w-2.5 mr-1" />
                PAUSED
              </span>
            ) : isPersonDetected ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/90 text-white backdrop-blur-md">
                <User className="h-2.5 w-2.5 mr-1" />
                TRACKING ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-navy-800/80 text-navy-200 backdrop-blur-md">
                SEARCHING SUBJECT...
              </span>
            )}
          </div>

          {modelStatus === 'loading' && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-primary-950/80 text-primary-200 border border-primary-500/30 backdrop-blur-md">
              <Loader2 className="h-3 w-3 animate-spin mr-1.5 text-primary-400" />
              Initializing AI Model...
            </span>
          )}
        </div>
      )}

      {/* 3b. Center Pause State Notification */}
      {isCameraActive && trackingStatus === 'paused' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-navy-950/40 backdrop-blur-2xs pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-900/90 border border-amber-500/40 text-amber-300 shadow-lg text-xs font-semibold">
            <Pause className="h-4 w-4 text-amber-400" />
            <span>Tracking Paused — Camera Feed on Standby</span>
          </div>
        </div>
      )}

      {/* 4. Loading State Spinner Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-navy-950/85 backdrop-blur-xs text-white p-6 space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary-400" />
          <div className="text-center space-y-1">
            <h4 className="text-sm sm:text-base font-bold text-white">
              {cameraStatus === 'requesting_permission'
                ? 'Requesting Camera Permission...'
                : modelStatus === 'loading'
                ? 'Loading MediaPipe Pose Model...'
                : 'Initializing Video Stream...'}
            </h4>
            <p className="text-xs text-navy-300 max-w-sm">
              Please grant camera access when prompted by your browser. Processing runs strictly
              on-device in your browser.
            </p>
          </div>
        </div>
      )}

      {/* 5. Inactive / Standby Placeholder */}
      {!isCameraActive && !isInitializing && (
        <div className="z-20 text-center p-8 max-w-md space-y-4">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-navy-900 border border-navy-800 text-primary-400 shadow-inner">
            <Camera className="h-10 w-10" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center justify-center gap-2">
              <span>Ready for Real-Time Pose Tracking</span>
              <Sparkles className="h-4 w-4 text-primary-400" />
            </h3>
            <p className="text-xs text-navy-300 leading-relaxed">
              Activate your camera to launch Google MediaPipe 33-point body landmark estimation. All
              frames are analyzed entirely locally in your browser with zero video recording or upload.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={onStartCamera}
              className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-6 py-2.5 shadow-lg shadow-primary-900/40"
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Live Camera Studio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
