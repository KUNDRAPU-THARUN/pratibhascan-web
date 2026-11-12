import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Inbox, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

/**
 * LoadingState - Accessible spinner and message
 */
export interface LoadingStateProps {
  message?: string;
  description?: string;
  className?: string;
}

export function LoadingState({
  message = 'Loading data...',
  description,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-navy-200 bg-white/60',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-3" />
      <p className="text-sm font-semibold text-navy-800">{message}</p>
      {description && <p className="text-xs text-navy-500 mt-1 max-w-sm">{description}</p>}
    </div>
  );
}

/**
 * EmptyState - Accessible empty container with clear illustration and CTA
 */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-navy-200 bg-white shadow-subtle',
        className
      )}
    >
      <div className="h-12 w-12 rounded-2xl bg-navy-100 text-navy-600 flex items-center justify-center mb-4">
        {icon || <Inbox className="h-6 w-6 text-navy-400" />}
      </div>
      <h4 className="text-base font-bold text-navy-900">{title}</h4>
      <p className="text-xs sm:text-sm text-navy-500 max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * ErrorState - Accessible error container with retry action
 */
export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 text-center rounded-xl border border-rose-200 bg-rose-50/50 text-navy-900',
        className
      )}
      role="alert"
    >
      <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-bold text-rose-900">{title}</h4>
      <p className="text-xs text-rose-700 max-w-md mt-1 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4 border-rose-300 hover:bg-rose-100" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
