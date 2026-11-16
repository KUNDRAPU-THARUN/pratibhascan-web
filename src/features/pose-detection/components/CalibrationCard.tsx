/**
 * PratibhaScan Web — Camera Framing & Calibration Card Component
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Interactive guidance panel for checking subject distance, joint visibility,
 * and stable upright posture before commencing workout repetition analysis.
 */

import React from 'react';
import { CalibrationState } from '../types/calibration.types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Maximize2,
  UserCheck,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CalibrationCardProps {
  calibrationState: CalibrationState;
  onRecalibrate: () => void;
  onAcceptCalibration: () => void;
  isCameraActive: boolean;
  onStartCamera: () => void;
}

export const CalibrationCard: React.FC<CalibrationCardProps> = ({
  calibrationState,
  onRecalibrate,
  onAcceptCalibration,
  isCameraActive,
  onStartCamera,
}) => {
  const { status, feedback, recalibrationReason } = calibrationState;
  const {
    fullBodyVisible,
    visibilityCheck,
    isStable,
    stableFramesCount,
    requiredStableFrames,
    framingDistance,
    bodyOrientation,
    guidanceMessage,
    canProceedToWorkout,
  } = feedback;

  const stabilityPercentage = Math.min(
    100,
    Math.round((stableFramesCount / requiredStableFrames) * 100)
  );

  const getStatusBadge = () => {
    switch (status) {
      case 'calibrated':
        return (
          <Badge variant="default" className="bg-emerald-50 text-emerald-800 border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
            Calibrated &amp; Ready
          </Badge>
        );
      case 'calibrating':
        return (
          <Badge variant="warning" className="animate-pulse">
            <Sparkles className="h-3 w-3 mr-1 text-amber-600" />
            Calibrating Posture...
          </Badge>
        );
      case 'recalibration_needed':
        return (
          <Badge variant="danger">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Recalibration Required
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-navy-600">
            Awaiting Framing
          </Badge>
        );
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-navy-200 shadow-xs space-y-4 max-w-full overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-navy-100 pb-3">
        <div className="flex items-center gap-2">
          <Maximize2 className="h-4 w-4 text-primary-600 shrink-0" />
          <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
            Camera Framing & Calibration
          </h3>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {recalibrationReason && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>{recalibrationReason}</span>
        </div>
      )}

      {/* Main Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* 1. Full Body Landmark Visibility */}
        <div className="p-3.5 rounded-xl border border-navy-200/80 bg-navy-50/50 space-y-2">
          <div className="flex items-center justify-between font-semibold text-navy-900">
            <span className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-primary-600" />
              Body Visibility
            </span>
            {fullBodyVisible ? (
              <span className="inline-flex items-center text-emerald-700 font-bold text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Pass
              </span>
            ) : (
              <span className="inline-flex items-center text-rose-600 font-bold text-[11px]">
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Incomplete
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-navy-600">
            <span className={visibilityCheck.head ? 'text-emerald-700' : 'text-navy-400'}>
              • Head: {visibilityCheck.head ? 'In frame' : 'Clipped'}
            </span>
            <span className={visibilityCheck.leftHip || visibilityCheck.rightHip ? 'text-emerald-700' : 'text-navy-400'}>
              • Hips: {visibilityCheck.leftHip || visibilityCheck.rightHip ? 'In frame' : 'Clipped'}
            </span>
            <span className={visibilityCheck.leftKnee || visibilityCheck.rightKnee ? 'text-emerald-700' : 'text-navy-400'}>
              • Knees: {visibilityCheck.leftKnee || visibilityCheck.rightKnee ? 'In frame' : 'Clipped'}
            </span>
            <span className={visibilityCheck.leftAnkle || visibilityCheck.rightAnkle ? 'text-emerald-700' : 'text-navy-400'}>
              • Feet: {visibilityCheck.leftAnkle || visibilityCheck.rightAnkle ? 'In frame' : 'Clipped'}
            </span>
          </div>
        </div>

        {/* 2. Camera Framing Distance */}
        <div className="p-3.5 rounded-xl border border-navy-200/80 bg-navy-50/50 space-y-2">
          <div className="flex items-center justify-between font-semibold text-navy-900">
            <span className="flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5 text-primary-600" />
              Framing Distance
            </span>
            {framingDistance === 'optimal' ? (
              <span className="inline-flex items-center text-emerald-700 font-bold text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Optimal
              </span>
            ) : framingDistance === 'too_close' ? (
              <span className="text-amber-700 font-bold text-[11px]">Too Close</span>
            ) : framingDistance === 'too_far' ? (
              <span className="text-amber-700 font-bold text-[11px]">Too Far</span>
            ) : (
              <span className="text-navy-500 font-medium text-[11px]">Detecting...</span>
            )}
          </div>
          <p className="text-[11px] text-navy-600 leading-snug">
            {framingDistance === 'optimal'
              ? 'Subject height is well proportioned in frame.'
              : framingDistance === 'too_close'
              ? 'Step back so joints do not exit frame during descent.'
              : framingDistance === 'too_far'
              ? 'Step closer for reliable joint angle detection.'
              : 'Stand in view 6–9 ft from the camera.'}
          </p>
        </div>

        {/* 3. Orientation & Stability Progress */}
        <div className="p-3.5 rounded-xl border border-navy-200/80 bg-navy-50/50 space-y-2">
          <div className="flex items-center justify-between font-semibold text-navy-900">
            <span className="flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-primary-600" />
              Pose Stability
            </span>
            <span className="font-mono text-[11px] font-bold text-navy-900">
              {stabilityPercentage}%
            </span>
          </div>

          <div className="w-full h-2 bg-navy-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 rounded-full ${
                isStable ? 'bg-emerald-500' : 'bg-primary-500'
              }`}
              style={{ width: `${stabilityPercentage}%` }}
            />
          </div>

          <div className="text-[10px] text-navy-500 flex justify-between">
            <span>Orientation:</span>
            <span className="font-semibold text-navy-800 capitalize">
              {bodyOrientation === 'sagittal_profile'
                ? 'Sagittal Profile (Ideal)'
                : bodyOrientation === 'oblique_45'
                ? '45° Oblique (Good)'
                : bodyOrientation === 'frontal'
                ? 'Frontal (Acceptable)'
                : 'Detecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Guidance Banner */}
      <div className="p-3 rounded-xl bg-primary-50/80 border border-primary-200 text-primary-950 text-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-primary-600 shrink-0" />
          <span className="font-medium truncate">{guidanceMessage}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isCameraActive ? (
            <Button size="sm" variant="primary" onClick={onStartCamera} className="text-xs h-7">
              Start Camera First
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onRecalibrate}
                className="text-xs h-7 text-navy-600 hover:bg-navy-100"
                title="Restart calibration"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={onAcceptCalibration}
                disabled={!canProceedToWorkout}
                className="text-xs h-7 font-bold bg-primary-600 hover:bg-primary-700 text-white"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {status === 'calibrated' ? 'Calibrated' : 'Lock Calibration'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
