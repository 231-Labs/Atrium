import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/config/sui';
import { fetchCategoryFromConfig } from '@/utils/configHelpers';

export interface SubscribedSpaceData {
  id: string;
  kioskId: string;
  name: string;
  description: string;
  coverImage: string;
  subscriptionPrice: string;
  creator: string;
  category?: string;
  subscriptionId: string;
}

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

      const ownedSubscriptions = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: `${PACKAGE_ID}::subscription::Subscription` },
        options: { showContent: true }
      });

      const spaceDataPromises = ownedSubscriptions.data.map(async (obj) => {
        try {
          if (obj.data?.content?.dataType !== 'moveObject') return null;

          const subscriptionFields = (obj.data.content as any).fields;
          const spaceId = subscriptionFields.space_id;
          const subscriptionId = obj.data.objectId;

          if (!spaceId) return null;

          const spaceObject = await suiClient.getObject({
            id: spaceId,
            options: { showContent: true }
          });

          if (spaceObject.data?.content?.dataType !== 'moveObject') return null;

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
          return null;
        }
      });

      const spacesData = (await Promise.all(spaceDataPromises)).filter(
        (space): space is SubscribedSpaceData => space !== null
      );

      setSpaces(spacesData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribedSpaces();
  }, [currentAccount?.address]);

  return { spaces, loading, error, refetch: loadSubscribedSpaces };
}

