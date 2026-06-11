import type React from 'react';
import { Toast } from '@/components/Toast';
import { useNotificationStore } from '@/hooks/useNotificationStore';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const current = useNotificationStore((state) => state.current);
  const dismiss = useNotificationStore((state) => state.dismiss);

  return (
    <>
      {children}
      {current && <Toast notification={current} onDismiss={dismiss} isVisible={true} />}
    </>
  );
}
