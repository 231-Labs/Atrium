import { getJsonRpcFallbackClient } from '@/app/providers';
import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { PACKAGE_ID } from '@/config/sui';

export interface SpaceSubscriptionData {
  subscriptionId: string | null;
  expiresAt: number | null; // ms timestamp
  isActive: boolean;
  isExpired: boolean;
  /** positive = days remaining; negative = days since expiry */
  daysRemaining: number | null;
}

export function useSpaceSubscription(spaceId: string | null) {
  const currentAccount = useCurrentAccount();
  const suiClient = getJsonRpcFallbackClient();
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [subData, setSubData] = useState<SpaceSubscriptionData>({
    subscriptionId: null,
    expiresAt: null,
    isActive: false,
    isExpired: false,
    daysRemaining: null,
  });
  const [loading, setLoading] = useState(true);

  // Kept for callers that call setIsSubscribed() imperatively (SpaceDetail)
  const [_isSubscribedOverride, setIsSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkStatus() {
      if (!currentAccount || !spaceId) {
        setIdentityId(null);
        setSubData({ subscriptionId: null, expiresAt: null, isActive: false, isExpired: false, daysRemaining: null });
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
          setIdentityId(identityData[0].data?.objectId ?? null);
        }

        const { data: subscriptionData } = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: { StructType: `${PACKAGE_ID}::subscription::Subscription` },
          options: { showContent: true },
        });

        const match = subscriptionData.find((sub) => {
          const fields = (sub.data?.content as any)?.fields;
          return fields?.space_id === spaceId;
        });

        if (match) {
          const fields = (match.data?.content as any)?.fields;
          const expiresAt = Number(fields?.expires_at ?? 0);
          const nowMs = Date.now();
          const isExpired = expiresAt > 0 && expiresAt < nowMs;
          const isActive = expiresAt > nowMs;
          const msLeft = expiresAt - nowMs;
          const daysRemaining = isActive
            ? Math.ceil(msLeft / 86_400_000)
            : isExpired
            ? -Math.floor((nowMs - expiresAt) / 86_400_000)
            : null;

          setSubData({
            subscriptionId: match.data?.objectId ?? null,
            expiresAt,
            isActive,
            isExpired,
            daysRemaining,
          });
        } else {
          setSubData({ subscriptionId: null, expiresAt: null, isActive: false, isExpired: false, daysRemaining: null });
        }
      } catch {
        setSubData({ subscriptionId: null, expiresAt: null, isActive: false, isExpired: false, daysRemaining: null });
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 60_000);
    return () => clearInterval(interval);
  }, [currentAccount, spaceId]);

  // isSubscribed: respect any override set by parent (e.g. SpaceDetail),
  // otherwise derive from chain data.
  const isSubscribed = _isSubscribedOverride !== null ? _isSubscribedOverride : subData.isActive;

  return {
    // backward-compat
    isSubscribed,
    identityId,
    loading,
    setIsSubscribed,
    // new
    ...subData,
  };
}
