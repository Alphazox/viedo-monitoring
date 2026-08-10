'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Modal({
  title,
  onClose,
  children,
  widthClassName = 'max-w-lg',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-10">
      <button
        aria-label="Close"
        className="fixed inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        className={`relative w-full ${widthClassName} rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
