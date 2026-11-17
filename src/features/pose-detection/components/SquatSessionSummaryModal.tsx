/**
 * PratibhaScan Web — Squat Session Summary Modal Component
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Comprehensive post-session analysis presenting completed vs. partial repetitions,
 * timing breakdown, joint angle ranges, tracking coverage, and local JSON export.
 */

import React from 'react';
import { SquatSessionMetrics } from '../types/squat.types';
import {
  X,
  Download,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Compass,
  Eye,
  Info,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SquatSessionSummaryModalProps {
  metrics: SquatSessionMetrics;
  isOpen: boolean;
  onClose: () => void;
  onResetSession: () => void;
}

export const SquatSessionSummaryModal: React.FC<SquatSessionSummaryModalProps> = ({
  metrics,
  isOpen,
  onClose,
  onResetSession,
}) => {
  if (!isOpen) return null;

  const {
    repetitionCount,
    partialRepCount,
    sessionDurationSec,
    repHistory,
    primarySide,
    trackingCoveragePercent = 100,
    movementInterruptions = 0,
  } = metrics;

  // Format MM:SS
  const minutes = Math.floor(sessionDurationSec / 60);
  const seconds = sessionDurationSec % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Calculate statistics across completed reps
  const completedReps = repHistory.filter((r) => r.isCompleted !== false);
  const avgDurationMs =
    completedReps.length > 0
      ? Math.round(
          completedReps.reduce((acc, r) => acc + r.durationMs, 0) / completedReps.length
        )
      : null;

  const minKneeAngleOverall =
    completedReps.length > 0
      ? Math.min(...completedReps.map((r) => r.minKneeAngle))
      : null;

  const maxTrunkLeanOverall =
    completedReps.length > 0
      ? Math.max(...completedReps.map((r) => r.maxTrunkLeanAngle ?? 0))
      : null;

  // Client-side JSON download
  const handleExportJSON = () => {
    const exportData = {
      product: 'PratibhaScan Web — AI Biomechanics Studio',
      platform: 'PratibhaScan Sports Technology',
      exportedAt: new Date().toISOString(),
      disclaimer:
        'EXPERIMENTAL RESEARCH SUMMARY — Monocular 2D pose inference. Not a clinical measurement.',
      sessionOverview: {
        sessionDurationSec,
        formattedTime,
        totalCompletedReps: repetitionCount,
        totalPartialReps: partialRepCount,
        trackingCoveragePercent,
        movementInterruptions,
        averageRepDurationMs: avgDurationMs,
        lowestKneeAngleDegrees: minKneeAngleOverall,
        maxTrunkLeanDegrees: maxTrunkLeanOverall,
        primaryTrackedSide: primarySide,
      },
      repetitionRecords: repHistory,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pratibhascan-squat-summary-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-navy-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-navy-100 bg-navy-50/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-navy-950">
                Squat Session Summary &amp; Analytics
              </h2>
              <Badge variant="warning" className="text-[10px]">
                Experimental Research Telemetry
              </Badge>
            </div>
            <p className="text-xs text-navy-600">
              Deterministic kinematic analysis generated locally in volatile browser memory.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-100 cursor-pointer"
            aria-label="Close summary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-navy-900">
          {/* Top KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Completed Reps */}
            <div className="p-4 rounded-xl border border-navy-200 bg-white shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
                Valid Repetitions
              </span>
              <div className="text-3xl font-black text-emerald-700 font-mono">
                {repetitionCount}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Target depth attained</span>
            </div>

            {/* 2. Partial Reps */}
            <div className="p-4 rounded-xl border border-navy-200 bg-white shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
                Partial Repetitions
              </span>
              <div className="text-3xl font-black text-amber-700 font-mono">
                {partialRepCount}
              </div>
              <span className="text-[11px] text-amber-600 font-medium">Incomplete depth</span>
            </div>

            {/* 3. Session Timer */}
            <div className="p-4 rounded-xl border border-navy-200 bg-white shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
                Workout Duration
              </span>
              <div className="text-3xl font-black text-navy-950 font-mono">
                {formattedTime}
              </div>
              <span className="text-[11px] text-navy-500">
                Avg: {avgDurationMs ? `${(avgDurationMs / 1000).toFixed(1)}s / rep` : '--'}
              </span>
            </div>

            {/* 4. Tracking Coverage */}
            <div className="p-4 rounded-xl border border-navy-200 bg-white shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
                Tracking Coverage
              </span>
              <div className="text-3xl font-black text-primary-700 font-mono">
                {trackingCoveragePercent}%
              </div>
              <span className="text-[11px] text-navy-500">
                {movementInterruptions === 0
                  ? 'Zero interruptions'
                  : `${movementInterruptions} ${movementInterruptions === 1 ? 'interruption' : 'interruptions'}`}
              </span>
            </div>
          </div>

          {/* Kinematic Angle Overview */}
          <div className="p-4 rounded-xl border border-navy-200 bg-navy-50/50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Activity className="h-4 w-4 text-primary-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">
                  Peak Knee Flexion
                </span>
                <span className="font-bold text-navy-900">
                  {minKneeAngleOverall !== null ? `${minKneeAngleOverall}° minimum` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Compass className="h-4 w-4 text-primary-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">
                  Max Torso Lean
                </span>
                <span className="font-bold text-navy-900">
                  {maxTrunkLeanOverall !== null ? `${maxTrunkLeanOverall}° from vertical` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Eye className="h-4 w-4 text-primary-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">
                  Tracked Orientation
                </span>
                <span className="font-bold text-navy-900 capitalize">
                  {primarySide === 'bilateral' ? 'Bilateral (Frontal)' : `${primarySide} Profile`}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Repetition History Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700">
              Repetition Breakdown Log
            </h4>

            {repHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-navy-500 border border-dashed border-navy-200 rounded-xl">
                No repetitions recorded in this session.
              </div>
            ) : (
              <div className="border border-navy-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-navy-100/70 border-b border-navy-200 text-navy-700 font-bold text-[11px]">
                      <th className="py-2.5 px-3">Rep #</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Depth (Knee)</th>
                      <th className="py-2.5 px-3">Tempo Breakdown</th>
                      <th className="py-2.5 px-3">Total Time</th>
                      <th className="py-2.5 px-3">Form Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {repHistory.map((rep, idx) => {
                      const isFull = rep.isCompleted !== false;
                      return (
                        <tr key={idx} className="hover:bg-navy-50/50 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-navy-950">
                            #{rep.repNumber}
                          </td>
                          <td className="py-2 px-3">
                            {isFull ? (
                              <span className="inline-flex items-center text-emerald-700 font-bold text-[11px]">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-amber-700 font-bold text-[11px]">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Partial
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold">
                            {rep.minKneeAngle}°
                          </td>
                          <td className="py-2 px-3 text-[11px] text-navy-600">
                            {rep.descentDurationMs !== undefined ? (
                              <span>
                                ↓{(rep.descentDurationMs / 1000).toFixed(1)}s • ⏸
                                {((rep.bottomDurationMs ?? 0) / 1000).toFixed(1)}s • ↑
                                {((rep.ascentDurationMs ?? 0) / 1000).toFixed(1)}s
                              </span>
                            ) : (
                              '--'
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {(rep.durationMs / 1000).toFixed(1)}s
                          </td>
                          <td className="py-2 px-3 text-[11px] text-navy-600">
                            {rep.qualityFeedback ?? 'Standard depth'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Research & Limitations Advisory Note */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="font-bold text-amber-900">
                Scientific Limitations &amp; Camera Constraints
              </h5>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Repetitions and angles are estimated via 2D monocular landmark coordinates. Depth is
                an observable visual proxy, not a certified 3D kinematic standard. Results are saved
                only in volatile browser memory and are never persisted to database records.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between p-4 border-t border-navy-100 bg-white">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetSession}
            className="text-navy-600 hover:bg-navy-50"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset Session
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJSON}
              className="font-bold border-navy-300 text-navy-800 hover:bg-navy-50"
            >
              <Download className="h-4 w-4 mr-1.5 text-primary-600" />
              Download JSON Summary
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="font-bold bg-primary-600 hover:bg-primary-700 text-white"
            >
              Resume Workout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
