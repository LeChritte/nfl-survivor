'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'error' | 'info';
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bg = type === 'error' ? 'bg-red-600' : 'bg-blue-600';

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 lg:bottom-auto lg:top-4 lg:right-4 lg:left-auto lg:translate-x-0 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${bg} max-w-xs`}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="text-white/80 hover:text-white text-lg leading-none">
        ✕
      </button>
    </div>
  );
}
