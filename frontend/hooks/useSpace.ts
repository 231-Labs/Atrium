import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';

export interface SpaceDetailData {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  configQuilt: string;
  subscriptionPrice: string;
  creator: string;
  marketplaceKioskId: string;
  videoBlobs: string[];
}

/**
 * Hook to fetch a single space by ID
 */
export function useSpace(spaceId: string | null) {
  const suiClient = useSuiClient();
  const [space, setSpace] = useState<SpaceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSpace = async () => {
    if (!spaceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch the Space object
      const spaceObject = await suiClient.getObject({
        id: spaceId,
        options: { showContent: true }
      });

      if (spaceObject.data?.content?.dataType !== 'moveObject') {
        throw new Error('Invalid space object');
      }

      const fields = (spaceObject.data.content as any).fields;
      
      // Parse video blobs from dynamic field if available
      const videoBlobs: string[] = [];
      if (fields.videos && Array.isArray(fields.videos)) {
        videoBlobs.push(...fields.videos);
      }

      const spaceData: SpaceDetailData = {
        id: spaceId,
        name: fields.name || 'Untitled Space',
        description: fields.description || '',
        coverImage: fields.cover_image_blob_id 
          ? `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${fields.cover_image_blob_id}`
          : '',
        configQuilt: fields.config_quilt_blob_id || '',
        subscriptionPrice: fields.subscription_price_per_day || '0',
        creator: fields.creator || '',
        marketplaceKioskId: fields.marketplace_kiosk_id || '',
        videoBlobs,
      };

      console.log('✅ Loaded space:', spaceData);
      setSpace(spaceData);
    } catch (err) {
      console.error('❌ Failed to load space:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpace();
  }, [spaceId]);

  return {
    space,
    loading,
    error,
    refetch: loadSpace,
  };
}

