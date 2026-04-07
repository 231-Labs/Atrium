import { useMemo } from 'react';
import { KioskClient } from '@mysten/kiosk';
import { getJsonRpcFallbackClient } from '@/app/providers';

export function useKioskClient() {
  const kioskClient = useMemo(() => new KioskClient({
    client: getJsonRpcFallbackClient(),
    network: 'testnet',
  }), []);

  return kioskClient;
}

