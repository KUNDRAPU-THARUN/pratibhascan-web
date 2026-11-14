/**
 * PratibhaScan Web — Camera Controls
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Interactive action buttons to start/stop the camera, switch camera devices,
 * toggle anatomical skeleton lines, toggle joint markers, and pause/resume tracking.
 */

import React from 'react';
import {
  Camera,
  CameraOff,
  SwitchCamera,
  Play,
  Pause,
  Eye,
  EyeOff,
  Bone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraDeviceInfo, CameraStatus } from '../types/pose.types';

interface CameraControlsProps {
  cameraStatus: CameraStatus;
  isPaused: boolean;
  showSkeleton: boolean;
  showLandmarks: boolean;
  availableCameras: CameraDeviceInfo[];
  activeDeviceId: string | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSwitchCamera: (deviceId?: string) => void;
  onTogglePause: () => void;
  onToggleSkeleton: () => void;
  onToggleLandmarks: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  cameraStatus,
  isPaused,
  showSkeleton,
  showLandmarks,
  availableCameras,
  activeDeviceId,
  onStartCamera,
  onStopCamera,
  onSwitchCamera,
  onTogglePause,
  onToggleSkeleton,
  onToggleLandmarks,
}) => {
  const isCameraActive = cameraStatus === 'active';
  const isInitializing = cameraStatus === 'requesting_permission' || cameraStatus === 'initializing';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-navy-200/90 rounded-2xl shadow-xs">
      {/* Primary Lifecycle Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {!isCameraActive ? (
          <Button
            variant="primary"
            size="sm"
            onClick={onStartCamera}
            isLoading={isInitializing}
            disabled={isInitializing}
            className="font-bold shadow-xs bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Camera className="h-4 w-4 mr-1.5" />
            Start Camera
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onStopCamera}
            className="font-bold border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400"
          >
            <CameraOff className="h-4 w-4 mr-1.5 text-rose-600" />
            Stop Camera
          </Button>
        )}

        {isCameraActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePause}
            className="text-navy-700 hover:bg-navy-50"
            title={isPaused ? 'Resume live pose tracking' : 'Pause pose tracking'}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-1.5 text-emerald-600" />
                Resume Tracking
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-1.5 text-amber-600" />
                Pause Tracking
              </>
            )}
          </Button>
        )}

        {/* Camera Switcher */}
        {isCameraActive && (
          <>
            {availableCameras.length > 1 ? (
              <div className="flex items-center gap-1.5">
                <SwitchCamera className="h-4 w-4 text-navy-400 hidden sm:inline" />
                <select
                  value={activeDeviceId || ''}
                  onChange={(e) => onSwitchCamera(e.target.value)}
                  className="text-xs px-2.5 py-1.5 bg-navy-50/80 border border-navy-200 rounded-lg text-navy-800 font-medium focus:ring-1 focus:ring-primary-500 cursor-pointer"
                  aria-label="Select camera device"
                >
                  {availableCameras.map((cam, idx) => (
                    <option key={cam.deviceId || idx} value={cam.deviceId}>
                      {cam.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwitchCamera()}
                className="text-navy-700 hover:bg-navy-50"
                title="Toggle between front and rear cameras"
              >
                <SwitchCamera className="h-4 w-4 mr-1.5 text-navy-500" />
                Switch Camera
              </Button>
            )}
          </>
        )}
      </div>

      {/* Visual Overlay Toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={showSkeleton ? 'primary' : 'outline'}
          size="sm"
          onClick={onToggleSkeleton}
          disabled={!isCameraActive}
          className={`text-xs ${
            showSkeleton
              ? 'bg-navy-900 hover:bg-navy-950 text-white'
              : 'text-navy-600 hover:bg-navy-50'
          }`}
          title="Toggle skeleton connection lines"
        >
          <Bone className="h-3.5 w-3.5 mr-1.5" />
          Skeleton: {showSkeleton ? 'ON' : 'OFF'}
        </Button>

        <Button
          variant={showLandmarks ? 'primary' : 'outline'}
          size="sm"
          onClick={onToggleLandmarks}
          disabled={!isCameraActive}
          className={`text-xs ${
            showLandmarks
              ? 'bg-teal-700 hover:bg-teal-800 text-white'
              : 'text-navy-600 hover:bg-navy-50'
          }`}
          title="Toggle anatomical joint landmarks"
        >
          {showLandmarks ? (
            <Eye className="h-3.5 w-3.5 mr-1.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 mr-1.5 text-navy-400" />
          )}
          Joints: {showLandmarks ? 'ON' : 'OFF'}
        </Button>
      </div>
    </div>
  );
};
