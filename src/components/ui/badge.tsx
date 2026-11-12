import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'teal' | 'blue' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'sm', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-navy-100 text-navy-700 border-navy-200',
    teal: 'bg-primary-50 text-primary-700 border-primary-200 font-semibold',
    blue: 'bg-secondary-50 text-secondary-700 border-secondary-200 font-semibold',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 font-medium',
    outline: 'border-navy-300 text-navy-700 bg-transparent',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border transition-colors select-none font-sans',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
