/**
 * PratibhaScan Web — Pose Status & Telemetry Panel
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Real-time telemetry dashboard presenting live frame rate (FPS), inference latency,
 * model initialization status, hardware delegate (GPU/CPU), and body detection indicators.
 */

import React from 'react';
import {
  CameraStatus,
  ModelStatus,
  PerformanceMetrics,
  TrackingStatus,
} from '../types/pose.types';
import {
  Activity,
  Cpu,
  UserCheck,
  UserX,
  Gauge,
  Camera,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface PoseStatusPanelProps {
  cameraStatus: CameraStatus;
  modelStatus: ModelStatus;
  trackingStatus: TrackingStatus;
  activeDelegate: 'GPU' | 'CPU';
  metrics: PerformanceMetrics;
  isPersonDetected: boolean;
  activeDeviceLabel?: string;
}

export const PoseStatusPanel: React.FC<PoseStatusPanelProps> = ({
  cameraStatus,
  modelStatus,
  trackingStatus,
  activeDelegate,
  metrics,
  isPersonDetected,
  activeDeviceLabel,
}) => {
  const isCameraActive = cameraStatus === 'active';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Body Detection Status */}
      <div className="p-3.5 rounded-xl border border-navy-200/90 bg-white shadow-xs space-y-1">
        <div className="flex items-center justify-between text-navy-500">
          <span className="text-[10px] font-bold uppercase tracking-wider">Subject</span>
          {isPersonDetected ? (
            <UserCheck className="h-4 w-4 text-emerald-600" />
          ) : (
            <UserX className="h-4 w-4 text-amber-500" />
          )}
        </div>
        <div className="text-xs font-bold text-navy-900 truncate">
          {isPersonDetected ? (
            <span className="text-emerald-700 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Person In Frame
            </span>
          ) : isCameraActive ? (
            <span className="text-amber-700">Searching...</span>
          ) : (
            <span className="text-navy-400">Camera Off</span>
          )}
        </div>
        <div className="text-[10px] text-navy-500 truncate capitalize">
          {trackingStatus.replace(/_/g, ' ')}
        </div>
      </div>

      {/* 2. Real-time Frame Rate (FPS) */}
      <div className="p-3.5 rounded-xl border border-navy-200/90 bg-white shadow-xs space-y-1">
        <div className="flex items-center justify-between text-navy-500">
          <span className="text-[10px] font-bold uppercase tracking-wider">Frame Rate</span>
          <Gauge className="h-4 w-4 text-primary-600" />
        </div>
        <div className="text-base font-extrabold text-navy-950 font-mono">
          {isCameraActive && metrics.fps > 0 ? (
            `${metrics.fps} FPS`
          ) : (
            <span className="text-navy-300 font-normal text-xs">-- FPS</span>
          )}
        </div>
        <div className="text-[10px] text-navy-500">
          {metrics.fps >= 24 ? (
            <span className="text-emerald-600 font-semibold">Real-time Optimal</span>
          ) : metrics.fps > 0 ? (
            <span className="text-amber-600 font-semibold">Moderate</span>
          ) : (
            'Standby'
          )}
        </div>
      </div>

      {/* 3. Inference Latency */}
      <div className="p-3.5 rounded-xl border border-navy-200/90 bg-white shadow-xs space-y-1">
        <div className="flex items-center justify-between text-navy-500">
          <span className="text-[10px] font-bold uppercase tracking-wider">Inference</span>
          <Activity className="h-4 w-4 text-teal-600" />
        </div>
        <div className="text-base font-extrabold text-navy-950 font-mono">
          {isCameraActive && metrics.inferenceTimeMs > 0 ? (
            `${metrics.inferenceTimeMs} ms`
          ) : (
            <span className="text-navy-300 font-normal text-xs">-- ms</span>
          )}
        </div>
        <div className="text-[10px] text-navy-500">
          {metrics.inferenceTimeMs > 0 ? `Render: ${metrics.renderTimeMs}ms` : 'Per-frame cost'}
        </div>
      </div>

      {/* 4. Hardware Delegate / Acceleration */}
      <div className="p-3.5 rounded-xl border border-navy-200/90 bg-white shadow-xs space-y-1">
        <div className="flex items-center justify-between text-navy-500">
          <span className="text-[10px] font-bold uppercase tracking-wider">Hardware</span>
          <Cpu className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="text-xs font-bold text-navy-900 truncate">
          {activeDelegate === 'GPU' ? (
            <span className="inline-flex items-center text-indigo-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-indigo-500 mr-1.5" />
              GPU (WebGL)
            </span>
          ) : (
            <span className="inline-flex items-center text-navy-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-navy-400 mr-1.5" />
              CPU Fallback
            </span>
          )}
        </div>
        <div className="text-[10px] text-navy-500">MediaPipe Tasks Engine</div>
      </div>

      {/* 5. Model Architecture Status */}
      <div className="p-3.5 rounded-xl border border-navy-200/90 bg-white shadow-xs space-y-1">
        <div className="flex items-center justify-between text-navy-500">
          <span className="text-[10px] font-bold uppercase tracking-wider">AI Model</span>
          <Layers className="h-4 w-4 text-primary-500" />
        </div>
        <div className="text-xs font-bold truncate">
          {modelStatus === 'ready' ? (
            <span className="text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              PoseLandmarker
            </span>
          ) : modelStatus === 'loading' ? (
            <span className="text-primary-700 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-primary-600" />
              Loading Model...
            </span>
          ) : modelStatus === 'error' ? (
            <span className="text-rose-700 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
              Model Error
            </span>
          ) : (
            <span className="text-navy-400">Ready to Load</span>
          )}
        </div>
        <div className="text-[10px] text-navy-500">Lite Quantized Float16</div>
      </div>

      {/* 6. Active Device */}
      <div className="p-3.5 rounded-xl border border-navy-200/90 bg-white shadow-xs space-y-1">
        <div className="flex items-center justify-between text-navy-500">
          <span className="text-[10px] font-bold uppercase tracking-wider">Camera</span>
          <Camera className="h-4 w-4 text-navy-400" />
        </div>
        <div className="text-xs font-bold text-navy-900 truncate" title={activeDeviceLabel}>
          {isCameraActive ? (
            activeDeviceLabel || 'Active Camera'
          ) : (
            <span className="text-navy-400">Inactive</span>
          )}
        </div>
        <div className="text-[10px] text-navy-500">Local Browser Stream</div>
      </div>
    </div>
  );
};
