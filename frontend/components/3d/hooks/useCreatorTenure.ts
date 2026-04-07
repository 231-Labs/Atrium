/**
 * Layer B — Creator Foundation
 *
 * Reads the Space object's `created_at` field to derive creator tenure in days.
 * Also consumes already-fetched content data to count total vs encrypted items.
 */

import { getJsonRpcFallbackClient } from '@/app/providers';
import { useState, useEffect } from 'react';

export interface CreatorTenureData {
  tenureDays: number;
  contentCount: number;
  encryptedContentCount: number;
}

export function useCreatorTenure(
  spaceId: string | null,
  contentItems: Array<{ isLocked: boolean }> = [],
): CreatorTenureData {
  const suiClient = getJsonRpcFallbackClient();
  const [tenureDays, setTenureDays] = useState(0);

  useEffect(() => {
    if (!spaceId) {
      setTenureDays(0);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const obj = await suiClient.getObject({
          id: spaceId,
          options: { showContent: true },
        });
        if (cancelled) return;

        const fields = (obj.data?.content as any)?.fields;
        const createdAtMs = Number(fields?.created_at ?? 0);
        if (createdAtMs > 0) {
          const days = Math.floor((Date.now() - createdAtMs) / 86_400_000);
          setTenureDays(Math.max(0, days));
        }
      } catch {
        // ignore
      }
    })();

    return () => { cancelled = true; };
  }, [spaceId]);

  return {
    tenureDays,
    contentCount: contentItems.length,
    encryptedContentCount: contentItems.filter((c) => c.isLocked).length,
  };
}
