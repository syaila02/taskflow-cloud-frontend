import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-flow-dark mb-1.5 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-flow-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={twMerge(
              clsx(
                'w-full rounded-lg border bg-flow-surface px-3 py-2 text-sm text-flow-dark placeholder:text-slate-400 transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:cursor-not-allowed',
                leftIcon ? 'pl-9' : 'pl-3',
                rightIcon ? 'pr-9' : 'pr-3',
                error
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-flow-border focus:border-flow-primary focus:ring-blue-100',
                className,
              ),
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-flow-muted flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="mt-1 text-xs text-flow-muted">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
