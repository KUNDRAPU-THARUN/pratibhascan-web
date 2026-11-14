/**
 * PratibhaScan Web — Squat Counter Panel Component
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Real-time biometric squat counter interface presenting live repetition counts,
 * movement state machine phase, joint angle indicators, session stopwatch,
 * workout controls, and camera framing guidance.
 */

import React from 'react';
import { SquatSessionMetrics, SquatState } from '../types/squat.types';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Timer,
  ChevronDown,
  ArrowUp,
  Eye,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SquatCounterPanelProps {
  metrics: SquatSessionMetrics;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  isCameraActive: boolean;
}

export const SquatCounterPanel: React.FC<SquatCounterPanelProps> = ({
  metrics,
  onStart,
  onPause,
  onReset,
  isCameraActive,
}) => {
  const {
    repetitionCount,
    partialRepCount,
    currentState,
    kneeAngle,
    hipAngle,
    trunkAngle,
    primarySide,
    trackingQuality,
    sessionDurationSec,
    isSessionActive,
    lastRepDurationMs,
  } = metrics;

  // Format MM:SS timer
  const minutes = Math.floor(sessionDurationSec / 60);
  const seconds = sessionDurationSec % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Depth percentage towards target 100° (180° = 0%, 100° = 100%)
  const depthPercentage =
    kneeAngle !== null
      ? Math.max(0, Math.min(100, Math.round(((180 - kneeAngle) / 80) * 100)))
      : 0;

  // State badge styling
  const getStateBadge = (state: SquatState) => {
    switch (state) {
      case 'standing':
        return {
          label: 'Standing Upright',
          color: 'bg-primary-50 text-primary-800 border-primary-200',
          icon: <Activity className="h-3.5 w-3.5 mr-1 text-primary-600" />,
        };
      case 'descending':
        return {
          label: 'Descending into Squat',
          color: 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse',
          icon: <ChevronDown className="h-3.5 w-3.5 mr-1 text-amber-600" />,
        };
      case 'bottom':
        return {
          label: 'Target Depth Reached',
          color: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-extrabold',
          icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />,
        };
      case 'ascending':
        return {
          label: 'Ascending',
          color: 'bg-indigo-50 text-indigo-900 border-indigo-200',
          icon: <ArrowUp className="h-3.5 w-3.5 mr-1 text-indigo-600" />,
        };
      case 'completed':
        return {
          label: 'Rep Completed!',
          color: 'bg-emerald-600 text-white border-emerald-700 shadow-sm',
          icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-white" />,
        };
      case 'tracking_lost':
        return {
          label: 'Tracking Lost (Adjust Camera)',
          color: 'bg-rose-50 text-rose-800 border-rose-300',
          icon: <AlertCircle className="h-3.5 w-3.5 mr-1 text-rose-600" />,
        };
      default:
        return {
          label: 'Session Idle (Click Start)',
          color: 'bg-navy-50 text-navy-700 border-navy-200',
          icon: <Timer className="h-3.5 w-3.5 mr-1 text-navy-500" />,
        };
    }
  };

  const stateBadge = getStateBadge(currentState);

  return (
    <div className="space-y-4">
      {/* Top Bar: Rep Count & Timer Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 1. Large Rep Counter Card */}
        <div className="p-5 rounded-2xl bg-white border border-navy-200/90 shadow-xs flex flex-col justify-between space-y-2 md:col-span-2">
          <div className="flex items-center justify-between text-navy-600">
            <span className="text-xs font-bold uppercase tracking-wider">Squat Repetitions</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stateBadge.color}`}
            >
              {stateBadge.icon}
              {stateBadge.label}
            </span>
          </div>

          <div className="flex items-baseline gap-4">
            <div className="text-5xl font-black text-navy-950 font-mono tracking-tight">
              {repetitionCount}
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-emerald-700">Valid Completed Reps</span>
              {partialRepCount > 0 && (
                <div className="text-[11px] text-amber-600 font-medium">
                  {partialRepCount} incomplete depth {partialRepCount === 1 ? 'rep' : 'reps'}
                </div>
              )}
            </div>
          </div>

          {/* Depth progress bar towards 100° */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-navy-500">
              <span>Squat Depth Progress</span>
              <span className="font-semibold text-navy-900">{depthPercentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-navy-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 rounded-full ${
                  depthPercentage >= 100
                    ? 'bg-emerald-500'
                    : depthPercentage >= 60
                    ? 'bg-primary-500'
                    : 'bg-navy-300'
                }`}
                style={{ width: `${depthPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Session Timer & Last Rep Duration */}
        <div className="p-5 rounded-2xl bg-white border border-navy-200/90 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-navy-600">
            <span className="text-xs font-bold uppercase tracking-wider">Workout Timer</span>
            <Timer className="h-4 w-4 text-primary-600" />
          </div>
          <div className="text-3xl font-extrabold text-navy-950 font-mono">
            {formattedTime}
          </div>
          <div className="text-xs text-navy-500">
            {lastRepDurationMs ? (
              <span>Last Rep: <strong>{(lastRepDurationMs / 1000).toFixed(1)}s</strong></span>
            ) : (
              <span>Standard Tempo: 2.0s - 3.5s</span>
            )}
          </div>
        </div>

        {/* 3. Workout Controls (Start / Pause / Reset) */}
        <div className="p-5 rounded-2xl bg-white border border-navy-200/90 shadow-xs flex flex-col justify-between space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-navy-600">
            Squat Controls
          </div>

          <div className="flex items-center gap-2">
            {!isSessionActive ? (
              <Button
                variant="primary"
                size="sm"
                onClick={onStart}
                disabled={!isCameraActive}
                className="flex-1 font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
              >
                <Play className="h-4 w-4 mr-1.5" />
                Start Reps
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="flex-1 font-bold border-amber-300 text-amber-800 hover:bg-amber-50"
              >
                <Pause className="h-4 w-4 mr-1.5 text-amber-600" />
                Pause
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-navy-600 hover:bg-navy-50"
              title="Reset repetition count and timer"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-[10px] text-navy-500">
            {!isCameraActive ? (
              <span className="text-amber-600 font-medium">Activate camera to start session</span>
            ) : isSessionActive ? (
              <span className="text-emerald-600 font-medium">Counter active — begin squatting</span>
            ) : (
              <span>Click Start to track reps</span>
            )}
          </div>
        </div>
      </div>

      {/* Middle Bar: Real-time Biomechanical Angles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Knee Angle Gauge */}
        <div className="p-4 rounded-xl bg-white border border-navy-200/90 shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
            Knee Angle (∠H-K-A)
          </div>
          <div className="text-2xl font-black text-navy-950 font-mono">
            {kneeAngle !== null ? `${kneeAngle}°` : '--°'}
          </div>
          <div className="text-[10px] text-navy-500">
            {kneeAngle !== null ? (
              kneeAngle <= 100 ? (
                <span className="text-emerald-600 font-bold">Full Depth Attained</span>
              ) : kneeAngle <= 140 ? (
                <span className="text-amber-600 font-semibold">Descent in Progress</span>
              ) : (
                <span className="text-navy-600">Standing (Target ≤ 100°)</span>
              )
            ) : (
              'Stand in frame'
            )}
          </div>
        </div>

        {/* Hip Angle Gauge */}
        <div className="p-4 rounded-xl bg-white border border-navy-200/90 shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
            Hip Angle (∠S-H-K)
          </div>
          <div className="text-2xl font-black text-navy-950 font-mono">
            {hipAngle !== null ? `${hipAngle}°` : '--°'}
          </div>
          <div className="text-[10px] text-navy-500">
            Flexion: {hipAngle !== null ? `${Math.round(180 - hipAngle)}°` : '--'}
          </div>
        </div>

        {/* Trunk Angle Gauge */}
        <div className="p-4 rounded-xl bg-white border border-navy-200/90 shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
            Trunk Inclination
          </div>
          <div className="text-2xl font-black text-navy-950 font-mono">
            {trunkAngle !== null ? `${trunkAngle}°` : '--°'}
          </div>
          <div className="text-[10px] text-navy-500">
            {trunkAngle !== null && trunkAngle > 45 ? (
              <span className="text-amber-600">Excessive Forward Lean</span>
            ) : (
              'Normal Torso Posture'
            )}
          </div>
        </div>

        {/* Tracked Side & Quality */}
        <div className="p-4 rounded-xl bg-white border border-navy-200/90 shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
            Tracking Side
          </div>
          <div className="text-base font-extrabold text-navy-950 capitalize flex items-center gap-1.5 pt-1">
            <Eye className="h-4 w-4 text-primary-600" />
            <span>{primarySide === 'bilateral' ? 'Bilateral (Front)' : `${primarySide} Profile`}</span>
          </div>
          <div className="text-[10px] text-navy-500 capitalize">
            Quality: <strong className="text-navy-800">{trackingQuality}</strong>
          </div>
        </div>
      </div>

      {/* Positioning Guidance Card */}
      <div className="p-4 rounded-xl bg-primary-50/70 border border-primary-200/80 text-primary-950 flex items-start gap-3 shadow-xs">
        <Info className="h-5 w-5 text-primary-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-primary-950">
            Squat Camera Framing &amp; Posture Guidance
          </h4>
          <ul className="list-disc pl-4 space-y-0.5 text-primary-800 text-[11px]">
            <li>Position your device 6 to 9 feet away so your <strong>entire body (head, hips, knees, and feet)</strong> is in view.</li>
            <li>Stand at a <strong>sagittal side profile (90°) or 45° oblique angle</strong> to the camera for the most accurate knee tracking.</li>
            <li>Squat smoothly until your thighs reach parallel to the floor (knee angle ≤ 100°) and return to full standing extension.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
