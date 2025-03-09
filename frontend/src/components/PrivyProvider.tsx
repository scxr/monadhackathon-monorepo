'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import { privyConfig, PRIVY_APP_ID } from '@/lib/privy';

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <BasePrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      {children}
    </BasePrivyProvider>
  );
} 