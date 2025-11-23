import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/config/sui';
import { fetchCategoryFromConfig } from '@/utils/configHelpers';

export interface SpaceData {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  configQuilt: string;
  subscriptionPrice: string;
  creator: string;
  marketplaceKioskId: string;
  category?: string;
}

/**
 * Hook to fetch all spaces from the blockchain
 * Uses SpaceInitialized events to discover spaces
 */
export function useSpaces() {
  const suiClient = useSuiClient();
  const [spaces, setSpaces] = useState<SpaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query SpaceInitialized events
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::space::SpaceInitialized`
        },
        limit: 50, // Get up to 50 most recent spaces
        order: 'descending'
      });

      console.log('📊 Found space events:', events.data.length);

      const spaceDataPromises = events.data.map(async (event: any) => {
        try {
          const spaceId = event.parsedJson?.space_id;
          if (!spaceId) return null;

          const spaceObject = await suiClient.getObject({
            id: spaceId,
            options: { showContent: true }
          });

          if (spaceObject.data?.content?.dataType !== 'moveObject') {
            return null;
          }

          const fields = (spaceObject.data.content as any).fields;
          const configQuilt = fields.config_quilt || fields.config_quilt_blob_id || '';
          const category = await fetchCategoryFromConfig(configQuilt);
          
          return {
            id: spaceId,
            name: fields.name || 'Untitled Space',
            description: fields.description || '',
            coverImage: fields.cover_image || fields.cover_image_blob_id || '',
            configQuilt,
            subscriptionPrice: fields.subscription_price || '0',
            creator: fields.creator || '',
            marketplaceKioskId: fields.marketplace_kiosk_id || '',
            category,
          } as SpaceData;
        } catch (err) {
          console.error('Failed to fetch space:', err);
          return null;
        }
      });

      const spacesData = (await Promise.all(spaceDataPromises)).filter(
        (space): space is SpaceData => space !== null
      );

      console.log('✅ Loaded spaces:', spacesData.length);
      setSpaces(spacesData);
    } catch (err) {
      console.error('❌ Failed to load spaces:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpaces();
    
    // Listen for space creation events
    const handleSpaceCreated = () => {
      console.log('🔔 Space created event received, refreshing space list...');
      loadSpaces();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('atrium-space-created', handleSpaceCreated as EventListener);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('atrium-space-created', handleSpaceCreated as EventListener);
      }
    };
  }, []);

  return {
    spaces,
    loading,
    error,
    refetch: loadSpaces,
  };
}

