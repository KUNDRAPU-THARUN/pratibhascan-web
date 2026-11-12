import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  helperText,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const generatedId = React.useId();
  const fieldId = htmlFor || generatedId;

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      <label htmlFor={fieldId} className="flex items-center gap-1 text-xs font-semibold text-navy-700">
        <span>{label}</span>
        {required && <span className="text-rose-500 font-bold" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-navy-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
