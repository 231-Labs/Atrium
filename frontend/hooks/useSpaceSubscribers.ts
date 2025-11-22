import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID, FAN_REGISTRY_ID } from '@/config/sui';
import { getWalrusBlobUrl } from '@/config/walrus';

export interface SubscriberAvatar {
  address: string;
  username?: string;
  avatarBlobId: string;
  avatarUrl: string;
}

interface UseSpaceSubscribersReturn {
  subscribers: SubscriberAvatar[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch all subscribers of a space with their latest avatars
 * 
 * Strategy:
 * 1. Query FanRegistry for subscriber addresses (primary)
 * 2. Fetch latest avatar from each subscriber's Identity NFT
 * 3. Fallback to event query if registry fails
 */
export function useSpaceSubscribers(spaceId: string | null): UseSpaceSubscribersReturn {
  const suiClient = useSuiClient();
  const [subscribers, setSubscribers] = useState<SubscriberAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadSubscribers() {
      if (!spaceId) {
        setSubscribers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Primary: Query from FanRegistry + Identity NFTs
        let subscriberAvatars = await loadSubscribersFromRegistry(spaceId);
        
        // Fallback: Query from events if registry returns empty
        if (subscriberAvatars.length === 0 && !cancelled) {
          subscriberAvatars = await loadSubscribersFromEvents(spaceId);
        }
        
        if (cancelled) return;

        setSubscribers(subscriberAvatars);
        
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load subscribers:', err);
        setError(err as Error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    /**
     * Load subscribers from event log (fallback method)
     * Note: May contain outdated avatar blob IDs
     */
    async function loadSubscribersFromEvents(spaceId: string): Promise<SubscriberAvatar[]> {
      const eventType = `${PACKAGE_ID}::space::FanAvatarAdded`;

      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: eventType,
        },
        limit: 100,
        order: 'descending'
      });

      if (cancelled) return [];

      const spaceEvents = events.data.filter((event: any) => {
        const parsedJson = event.parsedJson;
        return parsedJson?.space_id === spaceId;
      });

      if (spaceEvents.length === 0) {
        return [];
      }

      const subscriberMap = new Map<string, { address: string; avatarBlobId: string }>();
      
      spaceEvents.forEach((event: any) => {
        const parsedJson = event.parsedJson;
        if (parsedJson?.fan_address && parsedJson?.avatar_blob_id) {
          const normalizedAddress = parsedJson.fan_address.toLowerCase();
          
          if (!subscriberMap.has(normalizedAddress)) {
            subscriberMap.set(normalizedAddress, {
              address: parsedJson.fan_address,
              avatarBlobId: parsedJson.avatar_blob_id,
            });
          }
        }
      });

      if (cancelled) return [];

      const subscriberAvatars: SubscriberAvatar[] = [];
      
      for (const [_, subscriberData] of subscriberMap) {
        if (cancelled) return [];

        try {
          const { data: identityData } = await suiClient.getOwnedObjects({
            owner: subscriberData.address,
            filter: { StructType: `${PACKAGE_ID}::identity::Identity` },
            options: { showContent: true },
          });

          let username: string | undefined;
          if (identityData.length > 0) {
            const identityContent = identityData[0].data?.content as any;
            username = identityContent?.fields?.username || undefined;
          }

          subscriberAvatars.push({
            address: subscriberData.address,
            username,
            avatarBlobId: subscriberData.avatarBlobId,
            avatarUrl: getWalrusBlobUrl(subscriberData.avatarBlobId),
          });
        } catch (err) {
          subscriberAvatars.push({
            address: subscriberData.address,
            username: undefined,
            avatarBlobId: subscriberData.avatarBlobId,
            avatarUrl: getWalrusBlobUrl(subscriberData.avatarBlobId),
          });
        }
      }

      return subscriberAvatars;
    }

    /**
     * Load subscribers from FanRegistry + Identity NFTs (primary method)
     * Ensures we always get the latest avatar blob IDs from user's Identity
     */
    async function loadSubscribersFromRegistry(spaceId: string): Promise<SubscriberAvatar[]> {
      try {
        const fanRegistryObj = await suiClient.getObject({
          id: FAN_REGISTRY_ID,
          options: { showContent: true },
        });

        if (fanRegistryObj.data?.content?.dataType !== 'moveObject') {
          return [];
        }

        const content = fanRegistryObj.data.content as any;
        const fansTableId = content.fields?.fans?.fields?.id?.id;

        if (!fansTableId) {
          return [];
        }

        try {
          const spaceFieldObj = await suiClient.getDynamicFieldObject({
            parentId: fansTableId,
            name: {
              type: '0x2::object::ID',
              value: spaceId,
            }
          });

          if (spaceFieldObj.data?.content?.dataType !== 'moveObject') {
            return [];
          }

          const spaceFieldContent = spaceFieldObj.data.content as any;
          const spaceFansTableId = spaceFieldContent.fields?.value?.fields?.id?.id;

          if (!spaceFansTableId) {
            return [];
          }

          // Paginate through all fan records
          let allFanFields: any[] = [];
          let cursor = null;
          let hasNextPage = true;

          while (hasNextPage) {
            const result: any = await suiClient.getDynamicFields({
              parentId: spaceFansTableId,
              cursor,
              limit: 50,
            });
            allFanFields = [...allFanFields, ...result.data];
            cursor = result.nextCursor;
            hasNextPage = result.hasNextPage;
          }

          if (allFanFields.length === 0) return [];

          // Extract subscriber addresses
          const subscriberAddresses = allFanFields
            .map(field => field.name?.value)
            .filter(addr => addr) as string[];

          // Batch fetch Identity NFTs to get latest avatars
          const subscriberAvatars: SubscriberAvatar[] = [];
          const chunkSize = 50;

          for (let i = 0; i < subscriberAddresses.length; i += chunkSize) {
            if (cancelled) return [];
            
            const chunk = subscriberAddresses.slice(i, i + chunkSize);
            
            const identityPromises = chunk.map(address => 
              suiClient.getOwnedObjects({
                owner: address,
                filter: { StructType: `${PACKAGE_ID}::identity::Identity` },
                options: { showContent: true },
              })
            );

            const results = await Promise.all(identityPromises);

            for (let j = 0; j < chunk.length; j++) {
              const address = chunk[j];
              const { data: identityData } = results[j];

              if (identityData.length > 0) {
                const identityContent = identityData[0].data?.content as any;
                const fields = identityContent?.fields;
                
                if (fields) {
                  const username = fields.username;
                  const avatarBlobIdOption = fields.avatar_blob_id;

                  // Parse Option<String> (supports multiple RPC formats)
                  let actualAvatarBlobId: string | undefined;
                  
                  if (typeof avatarBlobIdOption === 'string') {
                    actualAvatarBlobId = avatarBlobIdOption;
                  } else if (avatarBlobIdOption && typeof avatarBlobIdOption === 'object') {
                    if ('vec' in avatarBlobIdOption && Array.isArray(avatarBlobIdOption.vec) && avatarBlobIdOption.vec.length > 0) {
                      actualAvatarBlobId = avatarBlobIdOption.vec[0];
                    }
                  }

                  if (actualAvatarBlobId) {
                    subscriberAvatars.push({
                      address,
                      username,
                      avatarBlobId: actualAvatarBlobId,
                      avatarUrl: getWalrusBlobUrl(actualAvatarBlobId),
                    });
                  }
                }
              }
            }
          }

          return subscriberAvatars;

        } catch (err) {
          return [];
        }

      } catch (err) {
        console.error('Failed to query FanRegistry:', err);
        throw err;
      }
    }

    loadSubscribers();

    return () => {
      cancelled = true;
    };
  }, [spaceId, suiClient, refetchTrigger]);

  return {
    subscribers,
    loading,
    error,
    refetch,
  };
}
