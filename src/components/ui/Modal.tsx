import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
}) => {
  // Tutup modal ketika tombol Escape ditekan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        className={twMerge(
          clsx(
            'relative w-full rounded-2xl bg-flow-surface p-6 shadow-xl border border-flow-border transition-all animate-in zoom-in-95 duration-200 z-10',
            sizes[size],
          ),
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-flow-border/60">
            <div>
              {title && (
                <h3 className="text-base font-semibold text-flow-dark tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-xs text-flow-muted leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-flow-muted hover:text-flow-dark hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-flow-primary"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="py-4 text-sm text-flow-dark">{children}</div>

        {/* Footer Actions */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-flow-border/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
