import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuthStore } from '@/hooks/useAuthStore';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const [initialized, setInitialized] = useState(false);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    checkAuth().then(() => setInitialized(true));
  }, [checkAuth]);

  if (!initialized || isLoading) {
    return <LoadingSpinner testID="auth-initializer-spinner" overlay />;
  }

  return <>{children}</>;
}
