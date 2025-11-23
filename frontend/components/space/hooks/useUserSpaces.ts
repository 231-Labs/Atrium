import { useState, useEffect } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/config/sui';

export interface UserSpaceData {
  spaceId: string;
  ownershipId: string;
  name: string;
  description: string;
  coverImage: string;
  configQuilt: string;
  subscriptionPrice: string;
  creator: string;
  marketplaceKioskId: string;
}

export function useUserSpaces() {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [spaces, setSpaces] = useState<UserSpaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUserSpaces = async () => {
    if (!currentAccount?.address) {
      setSpaces([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: `${PACKAGE_ID}::space::SpaceOwnership` },
        options: { showContent: true }
      });

      const spaceDataPromises = ownedObjects.data.map(async (obj) => {
        try {
          if (obj.data?.content?.dataType !== 'moveObject') return null;

          const ownershipFields = (obj.data.content as any).fields;
          const spaceId = ownershipFields.space_id;
          const ownershipId = obj.data.objectId;

          if (!spaceId) return null;

          const spaceObject = await suiClient.getObject({
            id: spaceId,
            options: { showContent: true }
          });

          if (spaceObject.data?.content?.dataType !== 'moveObject') return null;

          const spaceFields = (spaceObject.data.content as any).fields;

          return {
            spaceId,
            ownershipId,
            name: spaceFields.name || 'Untitled Space',
            description: spaceFields.description || '',
            coverImage: spaceFields.cover_image || spaceFields.cover_image_blob_id || '',
            configQuilt: spaceFields.config_quilt || spaceFields.config_quilt_blob_id || '',
            subscriptionPrice: spaceFields.subscription_price || '0',
            creator: spaceFields.creator || '',
            marketplaceKioskId: spaceFields.marketplace_kiosk_id || '',
          } as UserSpaceData;
        } catch (err) {
          return null;
        }
      });

      const spacesData = (await Promise.all(spaceDataPromises)).filter(
        (space): space is UserSpaceData => space !== null
      );

      setSpaces(spacesData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserSpaces();
  }, [currentAccount?.address]);

  return { spaces, loading, error, refetch: loadUserSpaces };
}

