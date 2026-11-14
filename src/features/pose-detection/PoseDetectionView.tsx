/**
 * PratibhaScan Web — AI Pose Detection Studio View
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Professional, real-time computer vision studio leveraging MediaPipe Tasks Vision
 * for on-device 33-point human pose estimation.
 */

import React, { useState, useRef } from 'react';
import { useCamera } from './hooks/useCamera';
import { usePoseDetection } from './hooks/usePoseDetection';
import { useSquatCounter } from './hooks/useSquatCounter';
import { CameraPreview } from './components/CameraPreview';
import { CameraControls } from './components/CameraControls';
import { PoseStatusPanel } from './components/PoseStatusPanel';
import { SquatCounterPanel } from './components/SquatCounterPanel';
import { CameraPermissionNotice } from './components/CameraPermissionNotice';
import { ShieldCheck, AlertTriangle, Sparkles, Lock, Info, Dumbbell, Monitor } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PoseDetectionViewProps {
  isPreview?: boolean;
}

export const PoseDetectionView: React.FC<PoseDetectionViewProps> = ({ isPreview = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active feature mode: 'squat' (Squat Counter Mode) vs 'studio' (Telemetry Monitor)
  const [activeMode, setActiveMode] = useState<'squat' | 'studio'>('squat');

  // Overlay visualization toggles
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);

  // Squat Biomechanics State Machine
  const {
    metrics: squatMetrics,
    processFrame: processSquatFrame,
    startSession: startSquatSession,
    pauseSession: pauseSquatSession,
    resetSession: resetSquatSession,
  } = useSquatCounter();

  // Camera stream management
  const {
    cameraStatus,
    videoRef,
    availableCameras,
    activeDeviceId,
    cameraError,
    startCamera,
    stopCamera,
    switchCamera,
    isMirrored,
  } = useCamera({
    autoStart: false,
    initialFacingMode: 'user',
  });

  const isCameraActive = cameraStatus === 'active';

  // MediaPipe Pose Inference & Canvas Rendering loop
  const {
    modelStatus,
    trackingStatus,
    isPaused,
    togglePause,
    activeDelegate,
    isPersonDetected,
    metrics,
  } = usePoseDetection({
    videoRef,
    canvasRef,
    isCameraActive,
    isMirrored,
    overlaySettings: {
      showSkeleton,
      showLandmarks,
      minVisibilityThreshold: 0.5,
    },
    onLandmarksDetected: (landmarks, timestamp) => {
      processSquatFrame(landmarks, timestamp);
    },
  });

  // Find label of active camera device
  const activeDevice = availableCameras.find((c) => c.deviceId === activeDeviceId);
  const activeDeviceLabel = activeDevice?.label;

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-navy-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950 tracking-tight">
              AI Pose Detection &amp; Squat Counter
            </h1>
            <Badge variant="default" className="bg-primary-50 text-primary-700 border-primary-200 font-bold text-[11px]">
              <Sparkles className="h-3 w-3 mr-1 text-primary-600" />
              Phase 4B Biomechanics
            </Badge>
            {isPreview && (
              <Badge variant="warning" className="text-[10px]">
                Demonstration Mode
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-navy-600">
            Real-time biomechanical analysis and automated bodyweight squat repetition tracking
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1 bg-navy-100 rounded-xl border border-navy-200">
            <Button
              variant={activeMode === 'squat' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveMode('squat')}
              className={`text-xs font-bold px-3 py-1 h-8 ${
                activeMode === 'squat'
                  ? 'bg-white text-navy-950 shadow-xs'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              <Dumbbell className="h-3.5 w-3.5 mr-1.5 text-primary-600" />
              Squat Counter
            </Button>
            <Button
              variant={activeMode === 'studio' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveMode('studio')}
              className={`text-xs font-bold px-3 py-1 h-8 ${
                activeMode === 'studio'
                  ? 'bg-white text-navy-950 shadow-xs'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              <Monitor className="h-3.5 w-3.5 mr-1.5 text-primary-600" />
              Studio Telemetry
            </Button>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            100% Local Inference
          </span>
        </div>
      </div>

      {/* 2. Camera Error or Permission Notice (When applicable) */}
      {cameraError && (
        <CameraPermissionNotice
          error={cameraError}
          onRetry={() => startCamera()}
        />
      )}

      {/* 3. Main Camera Viewport Panel */}
      <div className="space-y-4">
        <CameraPreview
          videoRef={videoRef}
          canvasRef={canvasRef}
          cameraStatus={cameraStatus}
          modelStatus={modelStatus}
          trackingStatus={trackingStatus}
          isMirrored={isMirrored}
          isPersonDetected={isPersonDetected}
          onStartCamera={() => startCamera()}
        />

        {/* 4. Interactive Camera Controls */}
        <CameraControls
          cameraStatus={cameraStatus}
          isPaused={isPaused}
          showSkeleton={showSkeleton}
          showLandmarks={showLandmarks}
          availableCameras={availableCameras}
          activeDeviceId={activeDeviceId}
          onStartCamera={() => startCamera()}
          onStopCamera={stopCamera}
          onSwitchCamera={(devId) => switchCamera(devId)}
          onTogglePause={togglePause}
          onToggleSkeleton={() => setShowSkeleton((prev) => !prev)}
          onToggleLandmarks={() => setShowLandmarks((prev) => !prev)}
        />

        {/* 5. Active Mode Workspace: Squat Counter Panel vs Studio Telemetry */}
        {activeMode === 'squat' ? (
          <SquatCounterPanel
            metrics={squatMetrics}
            onStart={startSquatSession}
            onPause={pauseSquatSession}
            onReset={resetSquatSession}
            isCameraActive={isCameraActive}
          />
        ) : (
          <PoseStatusPanel
            cameraStatus={cameraStatus}
            modelStatus={modelStatus}
            trackingStatus={trackingStatus}
            activeDelegate={activeDelegate}
            metrics={metrics}
            isPersonDetected={isPersonDetected}
            activeDeviceLabel={activeDeviceLabel}
          />
        )}
      </div>

      {/* 6. Mandatory Privacy & Experimental Policy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Privacy Notice */}
        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/90 text-teal-950 flex items-start gap-3 shadow-xs">
          <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
              Browser-Local Privacy Guarantee
            </h4>
            <p className="text-xs text-teal-800 leading-relaxed">
              Camera frames are processed locally in your browser by default. No video is uploaded
              or recorded by this feature.
            </p>
          </div>
        </div>

        {/* Experimental Feature Disclaimer */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 text-amber-950 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Experimental Studio Disclaimer
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Pose detection is experimental and is not a certified sports measurement.
            </p>
          </div>
        </div>
      </div>

      {/* 7. Technical Specifications Reference */}
      <div className="p-4 rounded-xl border border-navy-200 bg-white text-navy-700 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-navy-900">
          <Info className="h-4 w-4 text-primary-600" />
          <span>Computer Vision Architecture &amp; MediaPipe Pipeline</span>
        </div>
        <p className="text-navy-600 leading-relaxed text-[11px]">
          PratibhaScan Web implements the official Google MediaPipe Tasks Vision library (
          <code>@mediapipe/tasks-vision</code> v1.2.3) in <code>VIDEO</code> running mode. The model evaluates 33 3D anatomical landmarks per frame using WebAssembly and WebGL acceleration. Body coordinates and tracking points remain entirely in browser volatile memory and are never persisted to the Supabase database during this phase.
        </p>
      </div>
    </div>
  );
};
