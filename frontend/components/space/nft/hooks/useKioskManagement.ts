import { useState, useEffect, useCallback, useRef } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { useKioskClient } from '@/hooks/utils/useKioskClient';

export interface KioskNFT {
  id: string;
  type: string;
  name: string;
  description?: string;
  imageUrl?: string;
  glbFile?: string;
  objectType: '2d' | '3d';
  isListed: boolean;
  price?: string;
}

interface UseKioskManagementProps {
  kioskId: string | null;
  enabled?: boolean;
}

export function useKioskManagement({ kioskId, enabled = true }: UseKioskManagementProps) {
  const suiClient = useSuiClient();
  const kioskClient = useKioskClient();
  const [nfts, setNfts] = useState<KioskNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const loadKioskNFTs = useCallback(async () => {
    if (!kioskId || !enabled) {
      setNfts([]);
      setLoading(false);
      return;
    }

    if (retryCountRef.current >= maxRetries) {
      console.warn('Max retries reached for loading Kiosk NFTs');
      setLoading(false);
      return;
    }

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
        setNfts([]);
        retryCountRef.current = 0;
        return;
      }

      const nftList: KioskNFT[] = [];

      for (const item of kioskData.items) {
        try {
          const objectData = await suiClient.getObject({
            id: item.objectId,
            options: {
              showContent: true,
              showDisplay: true,
            },
          });

          if (objectData.data) {
            const display = (objectData.data as any).display?.data;
            const content = (objectData.data as any).content;
            
            let objectType: '2d' | '3d' = '2d';
            
            if (content?.fields?.object_type) {
              objectType = content.fields.object_type;
            } else if (
              display?.glb_file || 
              content?.fields?.glb_file || 
              display?.model_url || 
              content?.fields?.model_url
            ) {
              objectType = '3d';
            } else if (display?.image_url || display?.imageUrl) {
              objectType = '2d';
            }

            const glbFile = display?.glb_file || content?.fields?.glb_file;

            nftList.push({
              id: item.objectId,
              type: item.type,
              name: display?.name || 'Unnamed NFT',
              description: display?.description,
              imageUrl: display?.image_url || display?.imageUrl,
              glbFile: glbFile,
              objectType,
              isListed: !!item.listing,
              price: item.listing?.price,
            });
          }
        } catch (err) {
          console.error('Failed to load NFT:', item.objectId, err);
        }
      }

      setNfts(nftList);
      retryCountRef.current = 0;
    } catch (err) {
      setError(err as Error);
      retryCountRef.current += 1;
    } finally {
      setLoading(false);
    }
  }, [kioskId, enabled, kioskClient, suiClient]);

  useEffect(() => {
    retryCountRef.current = 0;
    loadKioskNFTs();
  }, [kioskId, enabled, loadKioskNFTs]);

  return {
    nfts,
    loading,
    error,
    refetch: loadKioskNFTs,
    kioskClient,
  };
}

