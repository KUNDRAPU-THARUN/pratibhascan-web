/**
 * PratibhaScan Web — Camera Permission Notice
 * Company: KAARYAN LABS
 * Product: PratibhaScan
 *
 * Actionable user guidance for camera permission denial,
 * device unavailability, or system hardware conflicts.
 */

import React from 'react';
import { CameraErrorDetails } from '../types/pose.types';
import { AlertCircle, CameraOff, RefreshCw, ShieldAlert, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraPermissionNoticeProps {
  error: CameraErrorDetails;
  onRetry: () => void;
}

export const CameraPermissionNotice: React.FC<CameraPermissionNoticeProps> = ({
  error,
  onRetry,
}) => {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 sm:p-6 text-navy-900 shadow-xs animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="p-3 rounded-xl bg-rose-100 text-rose-700 shrink-0">
          {error.type === 'permission_denied' ? (
            <Lock className="h-6 w-6" />
          ) : error.type === 'not_found' ? (
            <CameraOff className="h-6 w-6" />
          ) : error.type === 'insecure_context' ? (
            <ShieldAlert className="h-6 w-6" />
          ) : (
            <AlertCircle className="h-6 w-6" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm sm:text-base font-bold text-rose-950">
              {error.type === 'permission_denied'
                ? 'Camera Access Was Denied'
                : error.type === 'not_found'
                ? 'No Camera Hardware Detected'
                : error.type === 'in_use'
                ? 'Camera Is Currently In Use'
                : error.type === 'insecure_context'
                ? 'Secure Connection Required'
                : 'Camera Connection Problem'}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-rose-300 text-rose-800 hover:bg-rose-100 font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry Connection
            </Button>
          </div>

          <p className="text-xs text-rose-800 leading-relaxed">{error.message}</p>

          {/* Contextual guidance steps */}
          <div className="mt-3 pt-3 border-t border-rose-200/80 text-[11px] text-rose-900 space-y-1">
            <p className="font-semibold uppercase tracking-wider text-rose-950 text-[10px]">
              Troubleshooting Steps:
            </p>
            {error.type === 'permission_denied' && (
              <ul className="list-disc pl-4 space-y-0.5 text-rose-800">
                <li>Click the lock or camera icon in your browser URL bar.</li>
                <li>Set camera permission to <strong>Allow</strong>.</li>
                <li>If on Android or iOS, check system app permissions for your browser.</li>
              </ul>
            )}
            {error.type === 'in_use' && (
              <ul className="list-disc pl-4 space-y-0.5 text-rose-800">
                <li>Close other tabs or video calling applications (Zoom, Teams, Meet).</li>
                <li>Verify no background software is locking the webcam.</li>
              </ul>
            )}
            {error.type === 'not_found' && (
              <ul className="list-disc pl-4 space-y-0.5 text-rose-800">
                <li>Check your USB webcam connection or laptop built-in camera switch.</li>
                <li>Verify your operating system recognizes the camera device.</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
