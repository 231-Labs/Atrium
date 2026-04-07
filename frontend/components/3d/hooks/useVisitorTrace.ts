/**
 * Layer C — Visitor Trace
 *
 * Tracks the current visitor's relationship with a space:
 * - Visit count (localStorage per space)
 * - Subscription status
 * - Connected wallet
 * - Creator status
 */

import { useEffect, useState } from 'react';

const visitCountKey = (spaceId: string) => `atrium_visits_${spaceId}`;

export interface VisitorTraceData {
  visitCount: number;
  isConnected: boolean;
  isSubscribed: boolean;
  isCreator: boolean;
}

export function useVisitorTrace(
  spaceId: string | null,
  options: {
    isConnected: boolean;
    isSubscribed: boolean;
    isCreator: boolean;
  },
): VisitorTraceData {
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    if (!spaceId || typeof window === 'undefined') return;

    const key = visitCountKey(spaceId);
    const prev = parseInt(localStorage.getItem(key) ?? '0', 10);
    const next = prev + 1;
    localStorage.setItem(key, String(next));
    setVisitCount(next);
  }, [spaceId]);

  return {
    visitCount,
    ...options,
  };
}
