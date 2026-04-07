'use client';

import React, { createContext, useContext, useMemo } from 'react';

import { KioskClient } from '@mysten/kiosk';
import { getJsonRpcFallbackClient } from '@/app/providers';

const KioskClientContext = createContext<KioskClient | null>(null);

export function KioskClientProvider({ 
  children, 
  networkName = 'testnet' 
}: { 
  children: React.ReactNode; 
  networkName?: 'testnet' | 'mainnet';
}) {
  const kioskClient = useMemo(() => {
    return new KioskClient({
      client: getJsonRpcFallbackClient(),
      network: networkName,
    });
  }, [networkName]);

  return (
    <KioskClientContext.Provider value={kioskClient}>
      {children}
    </KioskClientContext.Provider>
  );
}

export function useKioskClient() {
  const ctx = useContext(KioskClientContext);
  if (!ctx) {
    throw new Error('useKioskClient must be used within a KioskClientProvider');
  }
  return ctx;
}

