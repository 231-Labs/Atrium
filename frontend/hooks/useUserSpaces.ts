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

/**
 * Hook to fetch user's owned spaces
 * Uses SpaceOwnership NFTs owned by the current account
 */
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

      // Get all objects owned by the user
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${PACKAGE_ID}::space::SpaceOwnership`
        },
        options: {
          showContent: true,
        }
      });

      console.log('📊 Found SpaceOwnership NFTs:', ownedObjects.data.length);

      // Fetch space data for each ownership NFT
      const spaceDataPromises = ownedObjects.data.map(async (obj) => {
        try {
          if (obj.data?.content?.dataType !== 'moveObject') {
            return null;
          }

          const ownershipFields = (obj.data.content as any).fields;
          const spaceId = ownershipFields.space_id;
          const ownershipId = obj.data.objectId;

          if (!spaceId) return null;

          // Fetch the Space object
          const spaceObject = await suiClient.getObject({
            id: spaceId,
            options: { showContent: true }
          });

          if (spaceObject.data?.content?.dataType !== 'moveObject') {
            return null;
          }

          const spaceFields = (spaceObject.data.content as any).fields;

          return {
            spaceId,
            ownershipId,
            name: spaceFields.name || 'Untitled Space',
            description: spaceFields.description || '',
            coverImage: spaceFields.cover_image_blob_id
              ? `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${spaceFields.cover_image_blob_id}`
              : '',
            configQuilt: spaceFields.config_quilt_blob_id || '',
            subscriptionPrice: spaceFields.subscription_price_per_day || '0',
            creator: spaceFields.creator || '',
            marketplaceKioskId: spaceFields.marketplace_kiosk_id || '',
          } as UserSpaceData;
        } catch (err) {
          console.error('Failed to fetch space:', err);
          return null;
        }
      });

      const spacesData = (await Promise.all(spaceDataPromises)).filter(
        (space): space is UserSpaceData => space !== null
      );

      console.log('✅ Loaded user spaces:', spacesData.length);
      setSpaces(spacesData);
    } catch (err) {
      console.error('❌ Failed to load user spaces:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserSpaces();
  }, [currentAccount?.address]);

  return {
    spaces,
    loading,
    error,
    refetch: loadUserSpaces,
  };
}

