import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/config/sui';
import { fetchCategoryFromConfig } from '@/utils/configHelpers';

export interface SubscribedSpaceData {
  id: string; // Space ID
  kioskId: string; // For compatibility with SpaceCard
  name: string;
  description: string;
  coverImage: string;
  subscriptionPrice: string;
  creator: string;
  category?: string;
  subscriptionId: string; // The Subscription NFT ID
}

/**
 * Hook to fetch spaces that the current user has subscribed to
 * Queries user's Subscription NFTs and fetches corresponding Space data
 */
export function useSubscribedSpaces() {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [spaces, setSpaces] = useState<SubscribedSpaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSubscribedSpaces = async () => {
    if (!currentAccount?.address) {
      setSpaces([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all Subscription NFTs owned by the user
      const ownedSubscriptions = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${PACKAGE_ID}::subscription::Subscription`
        },
        options: {
          showContent: true,
        }
      });

      console.log('📊 Found Subscription NFTs:', ownedSubscriptions.data.length);

      const spaceDataPromises = ownedSubscriptions.data.map(async (obj) => {
        try {
          if (obj.data?.content?.dataType !== 'moveObject') {
            return null;
          }

          const subscriptionFields = (obj.data.content as any).fields;
          const spaceId = subscriptionFields.space_id;
          const subscriptionId = obj.data.objectId;

          if (!spaceId) {
            console.warn('⚠️ Subscription has no space_id:', subscriptionId);
            return null;
          }

          const spaceObject = await suiClient.getObject({
            id: spaceId,
            options: { showContent: true }
          });

          if (spaceObject.data?.content?.dataType !== 'moveObject') {
            console.warn('⚠️ Space object not found:', spaceId);
            return null;
          }

          const spaceFields = (spaceObject.data.content as any).fields;
          const configQuilt = spaceFields.config_quilt || spaceFields.cover_image_blob_id || '';
          const category = await fetchCategoryFromConfig(configQuilt);

          return {
            id: spaceId,
            kioskId: spaceId,
            name: spaceFields.name || 'Untitled Space',
            description: spaceFields.description || '',
            coverImage: spaceFields.cover_image || spaceFields.cover_image_blob_id || '',
            subscriptionPrice: spaceFields.subscription_price || '0',
            creator: spaceFields.creator || '',
            category,
            subscriptionId,
          } as SubscribedSpaceData;
        } catch (err) {
          console.error('Failed to fetch subscribed space:', err);
          return null;
        }
      });

      const spacesData = (await Promise.all(spaceDataPromises)).filter(
        (space): space is SubscribedSpaceData => space !== null
      );

      console.log('✅ Loaded subscribed spaces:', spacesData.length);
      setSpaces(spacesData);
    } catch (err) {
      console.error('❌ Failed to load subscribed spaces:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribedSpaces();
  }, [currentAccount?.address]);

  return {
    spaces,
    loading,
    error,
    refetch: loadSubscribedSpaces,
  };
}

