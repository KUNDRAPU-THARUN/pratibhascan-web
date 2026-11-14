import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footerActions,
  size = 'md',
}: ModalProps) {
  const titleId = React.useId();
  const descId = React.useId();
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full max-h-[90vh] flex flex-col rounded-2xl bg-white p-5 sm:p-6 text-left shadow-elevated border border-navy-200/80 transition-all z-10 animate-in zoom-in-95 my-auto',
          sizeClasses[size]
        )}
      >
        <div className="flex items-start justify-between pb-3 border-b border-navy-100 shrink-0">
          <div>
            <h3 id={titleId} className="text-lg font-bold text-navy-900 leading-tight">
              {title}
            </h3>
            {description && (
              <p id={descId} className="mt-1 text-xs text-navy-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="py-3 sm:py-4 text-sm text-navy-600 leading-relaxed overflow-y-auto flex-1">
          {children}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-navy-100 shrink-0">
          {footerActions ? (
            footerActions
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
