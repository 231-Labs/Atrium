/**
 * Layer A — Global Pulse
 *
 * Fetches the 24-hour platform-wide subscription event count and converts
 * it into a normalised pulse value (0–1) that all spaces share.
 * Results are cached in localStorage with a 5-minute TTL so repeated
 * page loads don't hammer the RPC endpoint.
 */

import { getJsonRpcFallbackClient } from '@/app/providers';
import { PACKAGE_ID } from '@/config/sui';

const CACHE_KEY = 'atrium_global_pulse';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface PulseCache {
  pulse: number;
  seasonalHue: number;
  ts: number;
}

/** Deterministic daily hue seed (0–360) based on UTC date string. */
function dailyHueSeed(): number {
  const dateStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

/** Normalise event count to 0–1 using a soft cap of 100 events. */
function normalise(count: number): number {
  return Math.min(count / 100, 1);
}

export async function fetchAtriumPulse(): Promise<{ pulse: number; seasonalHue: number }> {
  // Check cache
  if (typeof window !== 'undefined') {
    try {
      const cached: PulseCache = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return { pulse: cached.pulse, seasonalHue: cached.seasonalHue };
      }
    } catch {
      // ignore stale/malformed cache
    }
  }

  const seasonalHue = dailyHueSeed();

  try {
    const client = getJsonRpcFallbackClient();
    const nowMs = Date.now();
    const since24hAgo = nowMs - 24 * 60 * 60 * 1000;

    const result = await client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::subscription::SubscriptionCreated` },
      limit: 50,
      order: 'descending',
    });

    // Count only events from the last 24 h
    const recentCount = result.data.filter((ev: any) => {
      const ts = Number(ev.timestampMs ?? 0);
      return ts >= since24hAgo;
    }).length;

    const pulse = normalise(recentCount);

    if (typeof window !== 'undefined') {
      const cache: PulseCache = { pulse, seasonalHue, ts: nowMs };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }

    return { pulse, seasonalHue };
  } catch {
    return { pulse: 0, seasonalHue };
  }
}
