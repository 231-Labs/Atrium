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

      const spaceObject = await suiClient.getObject({
        id: spaceId,
        options: { showContent: true }
      });

      if (spaceObject.data?.content?.dataType !== 'moveObject') {
        throw new Error('Invalid space object');
      }

      const fields = (spaceObject.data.content as any).fields;
      const videoBlobs: string[] = fields.videos && Array.isArray(fields.videos) ? fields.videos : [];

      const spaceData: SpaceDetailData = {
        id: spaceId,
        name: fields.name || 'Untitled Space',
        description: fields.description || '',
        coverImage: fields.cover_image || fields.cover_image_blob_id || '',
        configQuilt: fields.config_quilt || fields.config_quilt_blob_id || '',
        subscriptionPrice: fields.subscription_price || '0',
        creator: fields.creator || '',
        marketplaceKioskId: fields.marketplace_kiosk_id || '',
        videoBlobs,
      };

      setSpace(spaceData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpace();
  }, [spaceId]);

  return { space, loading, error, refetch: loadSpace };
}

