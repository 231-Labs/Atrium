'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { KioskClient, Network } from '@mysten/kiosk';
import { useSuiClient } from '@mysten/dapp-kit';

const KioskClientContext = createContext<KioskClient | null>(null);

export function KioskClientProvider({ 
  children, 
  networkName = 'testnet' 
}: { 
  children: React.ReactNode; 
  networkName?: 'testnet' | 'mainnet';
}) {
  const suiClient = useSuiClient();
  const kioskNetwork = networkName === 'mainnet' ? Network.MAINNET : Network.TESTNET;

  const kioskClient = useMemo(() => {
    return new KioskClient({ 
      client: suiClient as any, 
      network: kioskNetwork 
    });
  }, [suiClient, kioskNetwork]);

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

