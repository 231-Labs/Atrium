/**
 * SpaceStateInterpreter - Validates and smooths SpaceState transitions
 * Simplified for abstract space (no concrete weather mapping needed)
 */

import {
  SpaceState,
  SpaceStateParameters,
  SPACE_STATE_CONSTRAINTS,
  SpaceTrait,
} from '@/types/spaceState';

export class SpaceStateInterpreter {
  private smoothingAlpha: number;

  constructor(smoothingAlpha: number = 0.1) {
    this.smoothingAlpha = smoothingAlpha;
  }

  /**
   * Interpret and validate a space state
   */
  interpret(state: SpaceState, previousState?: SpaceState): SpaceState {
    // 1. Validate parameter ranges
    const validated = this.validateParameters(state);

    // 2. Smooth transition if previous state exists
    const smoothed = previousState
      ? this.smoothTransition(validated, previousState, this.smoothingAlpha)
      : validated;

    // 3. Ensure trait consistency
    const consistent = this.ensureTraitConsistency(smoothed);

    return consistent;
  }

  /**
   * Validate all parameters are within constraints
   */
  private validateParameters(state: SpaceState): SpaceState {
    const validated = { ...state };

    // Validate each parameter
    for (const [param, constraint] of Object.entries(SPACE_STATE_CONSTRAINTS)) {
      const key = param as keyof SpaceStateParameters;
      const value = validated[key];

      if (typeof value !== 'number') {
        console.warn(`Invalid ${param}: ${value}, using default 0.5`);
        validated[key] = 0.5 as any;
        continue;
      }

      // Clamp to valid range
      if (value < constraint.min || value > constraint.max) {
        console.warn(
          `${param} out of range: ${value}, clamping to [${constraint.min}, ${constraint.max}]`
        );
        validated[key] = Math.max(
          constraint.min,
          Math.min(constraint.max, value)
        ) as any;
      }
    }

    return validated;
  }

  /**
   * Smooth transition between states
   */
  private smoothTransition(
    target: SpaceState,
    current: SpaceState,
    alpha: number
  ): SpaceState {
    return {
      ...target,
      energy: this.lerp(current.energy, target.energy, alpha),
      mood: this.lerp(current.mood, target.mood, alpha),
      density: this.lerp(current.density, target.density, alpha),
      temperature: this.lerp(current.temperature, target.temperature, alpha),
      flow: this.lerp(current.flow, target.flow, alpha),
      luminosity: this.lerp(current.luminosity, target.luminosity, alpha),
    };
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Ensure trait consistency with parameters
   * Remove contradictory traits
   */
  private ensureTraitConsistency(state: SpaceState): SpaceState {
    const filtered = state.traits.filter((trait) => {
      return this.isTraitConsistent(trait as SpaceTrait, state);
    });

    return {
      ...state,
      traits: filtered,
    };
  }

  /**
   * Check if a trait is consistent with current parameters
   */
  private isTraitConsistent(trait: SpaceTrait, state: SpaceState): boolean {
    switch (trait) {
      case 'serene':
        // Serene conflicts with high energy or chaos
        return state.energy < 0.7 && state.flow < 0.7;

      case 'chaotic':
        // Chaotic requires high energy or flow
        return state.energy > 0.5 || state.flow > 0.5;

      case 'ethereal':
        // Ethereal works with low density
        return state.density < 0.7;

      case 'void':
        // Void requires very low density and energy
        return state.density < 0.3 && state.energy < 0.3;

      case 'electric':
        // Electric needs high energy
        return state.energy > 0.6;

      case 'meditative':
        // Meditative needs low flow and energy
        return state.flow < 0.4 && state.energy < 0.5;

      case 'crystalline':
      case 'organic':
      case 'pulsating':
      case 'volatile':
        // These are generally compatible
        return true;

      default:
        // Unknown traits are allowed
        return true;
    }
  }

  /**
   * Calculate difference between two states
   * Returns a score 0-1 representing how different they are
   */
  calculateStateDifference(state1: SpaceState, state2: SpaceState): number {
    const paramDiffs = [
      Math.abs(state1.energy - state2.energy),
      Math.abs(state1.mood - state2.mood),
      Math.abs(state1.density - state2.density),
      Math.abs(state1.temperature - state2.temperature),
      Math.abs(state1.flow - state2.flow),
      Math.abs(state1.luminosity - state2.luminosity),
    ];

    const avgDiff = paramDiffs.reduce((a, b) => a + b, 0) / paramDiffs.length;

    // Add trait difference
    const trait1Set = new Set(state1.traits);
    const trait2Set = new Set(state2.traits);
    const traitUnion = new Set([...trait1Set, ...trait2Set]);
    const traitIntersection = new Set(
      [...trait1Set].filter((x) => trait2Set.has(x))
    );

    const traitDiff =
      traitUnion.size > 0
        ? 1 - traitIntersection.size / traitUnion.size
        : 0;

    // Weighted average
    return avgDiff * 0.8 + traitDiff * 0.2;
  }

  /**
   * Suggest traits based on current parameters
   */
  suggestTraits(state: SpaceState): SpaceTrait[] {
    const suggested: SpaceTrait[] = [];

    // High energy
    if (state.energy > 0.7) {
      suggested.push('electric');
      if (state.flow > 0.7) suggested.push('chaotic');
      if (state.flow > 0.5) suggested.push('volatile');
    }

    // Low energy
    if (state.energy < 0.3) {
      suggested.push('serene');
      if (state.density < 0.3) suggested.push('void');
      if (state.flow < 0.3) suggested.push('meditative');
    }

    // Low density
    if (state.density < 0.5) {
      suggested.push('ethereal');
    }

    // Pulsating can work with mid-high energy
    if (state.energy > 0.4 && state.energy < 0.8) {
      suggested.push('pulsating');
    }

    return [...new Set(suggested)]; // Remove duplicates
  }

  /**
   * Generate a default SpaceState
   */
  static createDefault(): SpaceState {
    return {
      version: '2.0.0',
      timestamp: Date.now(),
      stateId: `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      energy: 0.5,
      mood: 0,
      density: 0.5,
      temperature: 0,
      flow: 0.5,
      luminosity: 0.5,
      traits: [],
      contributors: [],
    };
  }
}
