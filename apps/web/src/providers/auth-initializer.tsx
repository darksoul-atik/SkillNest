'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '../stores/auth.store';

export function AuthInitializer({ children }: { children: ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}
