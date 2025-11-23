import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useKioskClient } from '@/components/providers/KioskClientProvider';

export interface KioskData {
  objectId: string;
  kioskId: string;
  isPersonal: boolean;
}

export interface UseKioskDataReturn {
  ownedKiosks: KioskData[] | null;
  fetchingKiosks: boolean;
  selectedKioskId: string | null;
  setSelectedKioskId: (id: string | null) => void;
}

export function useKioskData(): UseKioskDataReturn {
  const [ownedKiosks, setOwnedKiosks] = useState<KioskData[] | null>(null);
  const [fetchingKiosks, setFetchingKiosks] = useState(false);
  const [selectedKioskId, setSelectedKioskId] = useState<string | null>(null);

  const currentAccount = useCurrentAccount();
  const kioskClient = useKioskClient();

  useEffect(() => {
    let aborted = false;
    
    const run = async () => {
      if (!currentAccount) {
        setOwnedKiosks(null);
        setSelectedKioskId(null);
        return;
      }
      
      try {
        setFetchingKiosks(true);
        const res = await kioskClient.getOwnedKiosks({ 
          address: currentAccount.address 
        });
        
        if (aborted) return;

        const kioskList = (res.kioskOwnerCaps ?? []).map((c: any) => ({
          objectId: c.objectId,
          kioskId: c.kioskId,
          isPersonal: c.isPersonal
        }));

        setOwnedKiosks(kioskList);
      } catch (error) {
        if (!aborted) {
          console.error('Failed to fetch kiosks:', error);
          setOwnedKiosks([]);
        }
      } finally {
        if (!aborted) {
          setFetchingKiosks(false);
        }
      }
    };
    
    void run();
    return () => { aborted = true; };
  }, [currentAccount, kioskClient]);

  return {
    ownedKiosks,
    fetchingKiosks,
    selectedKioskId,
    setSelectedKioskId,
  };
}

