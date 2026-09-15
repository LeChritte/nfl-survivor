'use client';

import { useEffect, useRef } from 'react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export default function Toast({ message, onDismiss }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (message) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onDismiss, 2600);
    }
  }, [message, onDismiss]);

  return <div className={`toast${message ? ' show' : ''}`}>{message}</div>;
}
