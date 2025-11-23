import { useState, useEffect, useCallback } from 'react';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { PACKAGE_ID } from '@/config/sui';

interface AuthToken {
  type: 'ownership' | 'subscription' | null;
  id: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSpaceAuthToken(
  spaceId: string | undefined,
  userAddress: string | undefined,
  isCreator: boolean
): AuthToken {
  const [authToken, setAuthToken] = useState<AuthToken>({
    type: null,
    id: null,
    loading: false,
    error: null,
    refetch: () => {},
  });
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!spaceId || !userAddress) {
      setAuthToken({
        type: null,
        id: null,
        loading: false,
        error: null,
        refetch,
      });
      return;
    }

    let isCancelled = false;

    const queryAuthToken = async () => {
      setAuthToken(prev => ({ ...prev, loading: true, error: null, refetch }));

      try {
        const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

        if (isCreator) {
          const ownershipType = `${PACKAGE_ID}::space::SpaceOwnership`;
          
          const ownedObjects = await suiClient.getOwnedObjects({
            owner: userAddress,
            filter: { StructType: ownershipType },
            options: { showContent: true, showType: true },
          });

          if (isCancelled) return;

          const ownershipNFT = ownedObjects.data.find(obj => {
            if (obj.data?.content?.dataType !== 'moveObject') return false;
            const fields = obj.data.content.fields as any;
            return fields?.space_id === spaceId;
          });

          if (ownershipNFT) {
            setAuthToken({
              type: 'ownership',
              id: ownershipNFT.data?.objectId || null,
              loading: false,
              error: null,
              refetch,
            });
          } else {
            setAuthToken({
              type: null,
              id: null,
              loading: false,
              error: 'SpaceOwnership not found',
              refetch,
            });
          }
        } else {
          const subscriptionType = `${PACKAGE_ID}::subscription::Subscription`;
          
          const ownedObjects = await suiClient.getOwnedObjects({
            owner: userAddress,
            filter: { StructType: subscriptionType },
            options: { showContent: true, showType: true },
          });

          if (isCancelled) return;

          const subscriptionNFT = ownedObjects.data.find(obj => {
            if (obj.data?.content?.dataType !== 'moveObject') return false;
            const fields = obj.data.content.fields as any;
            return fields?.space_id === spaceId;
          });

          if (subscriptionNFT) {
            setAuthToken({
              type: 'subscription',
              id: subscriptionNFT.data?.objectId || null,
              loading: false,
              error: null,
              refetch,
            });
          } else {
            setAuthToken({
              type: null,
              id: null,
              loading: false,
              error: 'Subscription not found. Please subscribe to access content.',
              refetch,
            });
          }
        }
      } catch (error: any) {
        if (isCancelled) return;
        
        setAuthToken({
          type: null,
          id: null,
          loading: false,
          error: error.message || 'Failed to query authentication token',
          refetch,
        });
      }
    };

    queryAuthToken();

    return () => {
      isCancelled = true;
    };
  }, [spaceId, userAddress, isCreator, refetchTrigger, refetch]);

  return authToken;
}

