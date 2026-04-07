/**
 * SpacePulseParams — three-layer co-creation data model
 *
 * Layer A (Global Pulse):  All spaces share the same global signal.
 * Layer B (Creator Foundation):  Per-space, set by the creator's activity.
 * Layer C (Visitor Trace):  Per-viewer, derived from the current visitor.
 */

export type TimeOfDay = 'day' | 'dusk' | 'night';

/** 0 = calm, 4 = burst */
export type PulseLevel = 0 | 1 | 2 | 3 | 4;

export interface SpacePulseParams {
  // ── Layer A: Global Pulse ──────────────────────────────────────────────────
  /** Current time of day derived from local clock */
  timeOfDay: TimeOfDay;
  /**
   * Normalised activity level (0–1) based on 24 h new-subscription count
   * across the whole Atrium platform.
   */
  globalPulse: number;
  /**
   * Deterministic hue offset (0–360) seeded by UTC date.
   * Every visitor on the same day sees the same ambient colour shift.
   */
  seasonalHue: number;

  // ── Layer B: Creator Foundation ────────────────────────────────────────────
  /** Number of active subscribers in this space */
  subscriberCount: number;
  /** Total content items published in this space */
  contentCount: number;
  /** Encrypted (premium) content items — represents the creator's "secrets" */
  encryptedContentCount: number;
  /** Days since the space was created — creator tenure */
  creatorTenureDays: number;

  // ── Layer C: Visitor Trace ─────────────────────────────────────────────────
  /** Whether the visitor has a connected wallet */
  isConnected: boolean;
  /** Whether the visitor holds an active subscription for this space */
  isSubscribed: boolean;
  /** How many times this visitor has visited this space (localStorage) */
  visitCount: number;
  /** Whether the current viewer is the space creator */
  isCreator: boolean;
}
