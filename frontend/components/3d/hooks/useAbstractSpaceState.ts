/**
 * useAbstractSpaceState — bridges live SpacePulseParams to SpaceState.
 *
 * Takes the three-layer pulse data (global activity, creator foundation,
 * visitor trace) and maps it to the 6 abstract dimensions that drive
 * the AbstractSpaceScene visual system.
 *
 * Mapping rationale
 * ─────────────────
 * energy     ← globalPulse (platform activity) + visitor engagement
 * mood       ← subscriberCount tier + visitorIsSubscribed
 * density    ← contentCount (richer space = denser)
 * temperature← creatorTenure (seasoned creator = warmer) + timeOfDay
 * flow       ← visitCount (returning visitors feel more dynamic)
 * luminosity ← timeOfDay (day=bright, dusk=mid, night=dim) + globalPulse
 */

import { useMemo, useRef } from 'react';
import { SpaceState, SpaceTrait } from '@/types/spaceState';
import { SpaceStateInterpreter } from '@/lib/SpaceStateInterpreter';
import { SpacePulseParams, TimeOfDay } from '@/types/spacePulse';

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

function timeOfDayLuminosity(tod: TimeOfDay): number {
  if (tod === 'day') return 0.8;
  if (tod === 'dusk') return 0.5;
  return 0.2;
}

function timeOfDayTemperature(tod: TimeOfDay): number {
  if (tod === 'day') return 0.3;
  if (tod === 'dusk') return 0.1;
  return -0.4;
}

/** Derive traits from pulse dimensions */
function deriveTraits(
  energy: number,
  mood: number,
  density: number,
  temperature: number,
  flow: number,
  luminosity: number,
  subscriberCount: number,
): SpaceTrait[] {
  const traits: SpaceTrait[] = [];

  if (energy > 0.75) traits.push('electric');
  if (energy > 0.85 && flow > 0.7) traits.push('chaotic');
  if (energy < 0.3 && flow < 0.3) traits.push('meditative');
  if (energy < 0.35) traits.push('serene');
  if (density < 0.35) traits.push('ethereal');
  if (density < 0.15 && energy < 0.2) traits.push('void');
  if (temperature < -0.5) traits.push('crystalline');
  if (temperature > 0.5 && energy > 0.6) traits.push('volatile');
  if (mood > 0.5 && energy > 0.4) traits.push('pulsating');
  if (subscriberCount >= 10) traits.push('organic'); // community feel

  // Deduplicate
  return [...new Set(traits)];
}

export function useAbstractSpaceState(
  pulse: SpacePulseParams,
  spaceId: string | null,
): SpaceState {
  const interpreterRef = useRef(new SpaceStateInterpreter(0.12));
  const prevStateRef = useRef<SpaceState | null>(null);

  const state = useMemo<SpaceState>(() => {
    const {
      timeOfDay,
      globalPulse,
      subscriberCount,
      contentCount,
      encryptedContentCount,
      creatorTenureDays,
      isConnected,
      isSubscribed,
      visitCount,
      isCreator,
    } = pulse;

    // ── energy ─────────────────────────────────────────────────────────────
    // Platform activity + visitor engagement boost
    const visitorBoost = isSubscribed ? 0.15 : isConnected ? 0.05 : 0;
    const energy = clamp(globalPulse * 0.7 + visitorBoost + (visitCount > 3 ? 0.1 : 0));

    // ── mood ───────────────────────────────────────────────────────────────
    // Subscriber tier drives positivity; negative if no subscribers at all
    const subscriberMood =
      subscriberCount >= 100 ? 0.8
      : subscriberCount >= 10 ? 0.5
      : subscriberCount >= 1  ? 0.2
      : -0.2;
    const mood = clamp(subscriberMood + (isSubscribed ? 0.2 : 0), -1, 1);

    // ── density ────────────────────────────────────────────────────────────
    // More content = denser space; encrypted content adds mysticism (density boost)
    const density = clamp(Math.min((contentCount / 30) + (encryptedContentCount / 15), 1));

    // ── temperature ────────────────────────────────────────────────────────
    // Creator tenure → warmer over time; day/night offset
    const tenureWarmth = Math.min(creatorTenureDays / 365, 0.6); // max after ~1 year
    const temperature = clamp(
      tenureWarmth + timeOfDayTemperature(timeOfDay),
      -1, 1,
    );

    // ── flow ───────────────────────────────────────────────────────────────
    // Returning visitors feel more alive; creator sees their space flow
    const flowFromVisits = Math.min(visitCount * 0.08, 0.4);
    const flow = clamp(
      0.2 + flowFromVisits + (isCreator ? 0.2 : 0) + globalPulse * 0.2,
    );

    // ── luminosity ─────────────────────────────────────────────────────────
    const luminosity = clamp(
      timeOfDayLuminosity(timeOfDay) + globalPulse * 0.15,
    );

    const traits = deriveTraits(energy, mood, density, temperature, flow, luminosity, subscriberCount);

    const raw: SpaceState = {
      version: '2.0.0',
      timestamp: Date.now(),
      stateId: `pulse-${spaceId ?? 'unknown'}-${Date.now()}`,
      energy,
      mood,
      density,
      temperature,
      flow,
      luminosity,
      traits,
      contributors: [],
    };

    // Smooth transition from previous state
    const interpreted = interpreterRef.current.interpret(raw, prevStateRef.current ?? undefined);
    prevStateRef.current = interpreted;
    return interpreted;
  }, [
    pulse.timeOfDay,
    pulse.globalPulse,
    pulse.subscriberCount,
    pulse.contentCount,
    pulse.encryptedContentCount,
    pulse.creatorTenureDays,
    pulse.isConnected,
    pulse.isSubscribed,
    pulse.visitCount,
    pulse.isCreator,
    spaceId,
  ]);

  return state;
}
