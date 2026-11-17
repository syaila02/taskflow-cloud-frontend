import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  hoverable = false,
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-xl border border-flow-border bg-flow-surface text-flow-dark shadow-sm transition-all duration-150',
          hoverable && 'hover:shadow-md hover:border-slate-300 cursor-pointer',
          className,
        ),
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx('flex flex-col space-y-1.5 p-5 pb-4 border-b border-flow-border/60', className),
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3
      className={twMerge(
        clsx('text-base font-semibold leading-none tracking-tight text-flow-dark', className),
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p
      className={twMerge(clsx('text-xs text-flow-muted leading-relaxed', className))}
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={twMerge(clsx('p-5 pt-4', className))} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx('flex items-center p-5 pt-3 border-t border-flow-border/60 text-xs text-flow-muted', className),
      )}
      {...props}
    >
      {children}
    </div>
  );
};
