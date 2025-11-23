import { useState, useEffect, useCallback } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { useKioskClient } from '@/hooks/utils/useKioskClient';

export interface ListedNFT {
  id: string;
  type: string;
  name: string;
  imageUrl: string;
  price: string;
  objectType: string;
}

export function useKioskListedItems(kioskId: string | null) {
  const suiClient = useSuiClient();
  const kioskClient = useKioskClient();
  const [listedItems, setListedItems] = useState<ListedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!kioskId) {
      setListedItems([]);
      return;
    }

    const fetchListedItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const kioskData = await kioskClient.getKiosk({
          id: kioskId,
          options: {
            withKioskFields: true,
            withListingPrices: true,
          },
        });

        if (!kioskData?.items) {
          setListedItems([]);
          return;
        }

        const listedNFTs = kioskData.items.filter(item => item.listing);

        const itemPromises = listedNFTs.map(async (item): Promise<ListedNFT | null> => {
          try {
            const itemData = await suiClient.getObject({
              id: item.objectId,
              options: {
                showContent: true,
                showDisplay: true,
              },
            });

            const display = (itemData.data as any)?.display?.data;
            const content = (itemData.data as any)?.content;
            
            let objectType: '2d' | '3d' = '2d';
            if (content?.fields?.object_type) {
              objectType = content.fields.object_type;
            } else if (display?.glb_file || content?.fields?.glb_file) {
              objectType = '3d';
            }

            return {
              id: item.objectId,
              type: item.type,
              name: display?.name || `Item ${item.objectId.slice(0, 8)}`,
              imageUrl: display?.image_url || display?.imageUrl || '',
              price: item.listing?.price || '0',
              objectType,
            } as ListedNFT;
          } catch (err) {
            return null;
          }
        });

        const items = (await Promise.all(itemPromises)).filter((item): item is ListedNFT => item !== null);
        setListedItems(items);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchListedItems();
  }, [kioskId, kioskClient, suiClient, refreshTrigger]);

  return { listedItems, loading, error, refetch };
}

