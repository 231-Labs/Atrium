import { useMemo } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { KioskClient, Network } from '@mysten/kiosk';

export function useKioskClient() {
  const suiClient = useSuiClient();
  
  const kioskClient = useMemo(() => new KioskClient({
    client: suiClient,
    network: Network.TESTNET,
  }), [suiClient]);

  return kioskClient;
}

