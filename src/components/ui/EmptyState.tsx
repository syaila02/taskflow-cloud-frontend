import React, { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-flow-border bg-flow-surface/50',
          className,
        ),
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-flow-muted flex items-center justify-center mb-3">
        {icon || <Inbox className="w-6 h-6 stroke-[1.5]" />}
      </div>
      <h3 className="text-sm font-semibold text-flow-dark mb-1">{title}</h3>
      <p className="text-xs text-flow-muted max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};
