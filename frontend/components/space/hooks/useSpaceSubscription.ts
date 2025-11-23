import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/config/sui';

export function useSpaceSubscription(spaceKioskId: string | null) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      if (!currentAccount || !spaceKioskId) {
        setIsSubscribed(false);
        setIdentityId(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data: identityData } = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: { StructType: `${PACKAGE_ID}::identity::Identity` },
        });
        
        if (identityData.length > 0) {
          setIdentityId(identityData[0].data?.objectId || null);
        }

        const { data: subscriptionData } = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: { StructType: `${PACKAGE_ID}::subscription::Subscription` },
          options: { showContent: true }
        });

        const hasSubscription = subscriptionData.some(sub => {
          const content = sub.data?.content as any;
          return content?.fields?.space_kiosk_id === spaceKioskId;
        });

        setIsSubscribed(hasSubscription);
      } catch (e) {
        setIsSubscribed(false);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, [currentAccount, suiClient, spaceKioskId]);

  return { isSubscribed, identityId, loading, setIsSubscribed };
}

