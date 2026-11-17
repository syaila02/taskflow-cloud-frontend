import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white' | 'muted';
}

export const Spinner: React.FC<SpinnerProps> = ({
  className,
  size = 'md',
  variant = 'primary',
  ...props
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const variants = {
    primary: 'border-flow-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    muted: 'border-slate-400 border-t-transparent',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'inline-block rounded-full animate-spin',
          sizes[size],
          variants[variant],
          className,
        ),
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Memuat...</span>
    </div>
  );
};
