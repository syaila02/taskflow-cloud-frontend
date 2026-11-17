import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant =
  | 'primary'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  // Task Status variants (sesuai enum schema backend)
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'done'
  // Task Priority variants (sesuai enum schema backend)
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  hasDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  hasDot = false,
  children,
  ...props
}) => {
  const variants = {
    // Generic
    primary: 'bg-blue-50 text-flow-primary border-blue-200/60',
    neutral: 'bg-slate-100 text-flow-dark border-slate-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/60',

    // Task Status
    todo: 'bg-slate-100 text-slate-700 border-slate-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    review: 'bg-amber-50 text-amber-700 border-amber-200',
    done: 'bg-emerald-50 text-emerald-700 border-emerald-200',

    // Task Priority
    low: 'bg-slate-50 text-slate-600 border-slate-200',
    medium: 'bg-sky-50 text-sky-700 border-sky-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
  };

  const dotColors: Record<BadgeVariant, string> = {
    primary: 'bg-flow-primary',
    neutral: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    todo: 'bg-slate-400',
    in_progress: 'bg-blue-600',
    review: 'bg-amber-500',
    done: 'bg-emerald-600',
    low: 'bg-slate-400',
    medium: 'bg-sky-500',
    high: 'bg-orange-500',
    urgent: 'bg-rose-600',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-md border select-none transition-colors duration-150',
          variants[variant],
          sizes[size],
          className,
        ),
      )}
      {...props}
    >
      {hasDot && (
        <span
          className={twMerge(
            clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant]),
          )}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
