import { useState, useEffect } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { KioskClient, Network } from '@mysten/kiosk';

export interface KioskCapData {
  objectId: string;
  kioskId: string;
  isPersonal?: boolean;
}

export function useMarketplaceKioskCap(marketplaceKioskId: string | null) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [kioskCapId, setKioskCapId] = useState<string | null>(null);
  const [kioskCap, setKioskCap] = useState<KioskCapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!marketplaceKioskId || !currentAccount?.address) {
      setKioskCapId(null);
      setKioskCap(null);
      return;
    }

    const fetchKioskCap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try using KioskClient first (more reliable)
        try {
          const kioskClient = new KioskClient({
            client: suiClient,
            network: Network.TESTNET,
          });

          const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({
            address: currentAccount.address,
          });

          const matchingCap = kioskOwnerCaps?.find(
            (cap: any) => cap.kioskId === marketplaceKioskId
          );

          if (matchingCap) {
            setKioskCapId(matchingCap.objectId);
            setKioskCap({
              objectId: matchingCap.objectId,
              kioskId: matchingCap.kioskId,
              isPersonal: matchingCap.isPersonal,
            });
            return;
          }
        } catch (kioskClientError) {
          console.warn('Failed to fetch via KioskClient, trying direct query:', kioskClientError);
        }

        // Fallback to direct query
        const { data: kioskCaps } = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: '0x2::kiosk::KioskOwnerCap',
          },
          options: {
            showContent: true,
          },
        });

        const matchingCap = kioskCaps.find(cap => {
          const fields = (cap.data?.content as any)?.fields;
          return fields?.for === marketplaceKioskId;
        });

        if (matchingCap) {
          const objectId = matchingCap.data?.objectId || null;
          setKioskCapId(objectId);
          setKioskCap(objectId ? {
            objectId,
            kioskId: marketplaceKioskId,
          } : null);
        } else {
          setKioskCapId(null);
          setKioskCap(null);
        }
      } catch (err) {
        console.error('Failed to fetch KioskOwnerCap:', err);
        setError(err as Error);
        setKioskCapId(null);
        setKioskCap(null);
      } finally {
        setLoading(false);
      }
    };

    fetchKioskCap();
  }, [marketplaceKioskId, currentAccount?.address, suiClient]);

  return { kioskCapId, kioskCap, loading, error };
}

