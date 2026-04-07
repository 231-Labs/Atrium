/**
 * useSpacePulse — aggregates Layer A + B + C into a single SpacePulseParams
 * for the 3D scene to consume.
 *
 * Replaces the old useAIWeather hook.  Instead of fetching external market
 * data and calling an LLM, the scene expression is derived entirely from:
 *   A) Global Atrium platform activity (24 h subscription count)
 *   B) This space's own data (creator tenure, content, subscribers)
 *   C) The current visitor's relationship with this space
 */

import { useEffect, useState } from 'react';
import { SpacePulseParams, TimeOfDay } from '@/types/spacePulse';
import { fetchAtriumPulse } from '@/services/atriumPulse';
import { useCreatorTenure } from './useCreatorTenure';
import { useVisitorTrace } from './useVisitorTrace';

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

interface UseSpacePulseOptions {
  spaceId: string | null;
  subscriberCount: number;
  contentItems: Array<{ isLocked: boolean }>;
  isConnected: boolean;
  isSubscribed: boolean;
  isCreator: boolean;
}

export function useSpacePulse({
  spaceId,
  subscriberCount,
  contentItems,
  isConnected,
  isSubscribed,
  isCreator,
}: UseSpacePulseOptions): SpacePulseParams {
  const [globalPulse, setGlobalPulse] = useState(0);
  const [seasonalHue, setSeasonalHue] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay);

  // Layer A: fetch global pulse once on mount, refresh every 5 min
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { pulse, seasonalHue: hue } = await fetchAtriumPulse();
      if (!cancelled) {
        setGlobalPulse(pulse);
        setSeasonalHue(hue);
      }
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Track time-of-day changes (every 5 minutes is fine)
  useEffect(() => {
    const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Layer B
  const { tenureDays, contentCount, encryptedContentCount } = useCreatorTenure(
    spaceId,
    contentItems,
  );

  // Layer C
  const visitorTrace = useVisitorTrace(spaceId, { isConnected, isSubscribed, isCreator });

  return {
    // Layer A
    timeOfDay,
    globalPulse,
    seasonalHue,
    // Layer B
    subscriberCount,
    contentCount,
    encryptedContentCount,
    creatorTenureDays: tenureDays,
    // Layer C
    isConnected: visitorTrace.isConnected,
    isSubscribed: visitorTrace.isSubscribed,
    visitCount: visitorTrace.visitCount,
    isCreator: visitorTrace.isCreator,
  };
}
