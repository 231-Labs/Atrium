/**
 * VortexField - Black hole-like distortion field
 * Applies gravitational pull and rotation to vertices
 */

import * as THREE from 'three';
import { LineGrid } from './LineGrid';

export interface VortexFieldConfig {
  centerPosition: THREE.Vector3;
  radius: number;
  strength: number;
}

export interface VortexFieldUpdateParams {
  strength: number;
  rotationSpeed: number;
  radius: number;
}

export class VortexField {
  private centerPosition: THREE.Vector3;
  private radius: number;
  private strength: number;
  private rotationSpeed: number = 0;
  private turbulence: number = 0;
  private time: number = 0;

  constructor(config: VortexFieldConfig) {
    this.centerPosition = config.centerPosition.clone();
    this.radius = config.radius;
    this.strength = config.strength;
  }

  /**
   * Update vortex parameters
   */
  update(params: VortexFieldUpdateParams): void {
    this.strength = params.strength;
    this.rotationSpeed = params.rotationSpeed;
    this.radius = params.radius;
  }

  /**
   * Add turbulence to the vortex
   */
  addTurbulence(amount: number): void {
    this.turbulence = amount;
  }

  /**
   * Apply vortex influence to line grid
   */
  applyToLineGrid(lineGrid: LineGrid): void {
    if (this.strength === 0) return;

    const vertices = lineGrid.getVertices();
    const tempVertex = new THREE.Vector3();

    for (let i = 0; i < vertices.length; i += 3) {
      tempVertex.set(vertices[i], vertices[i + 1], vertices[i + 2]);

      // Calculate distance from vortex center
      const distanceVec = tempVertex.clone().sub(this.centerPosition);
      const distance = distanceVec.length();

      // Only affect vertices within radius
      if (distance > this.radius) continue;

      // Calculate influence (inverse square falloff)
      const influence = this.calculateInfluence(distance);

      // 1. Pull towards center (gravitational effect)
      const pullVector = distanceVec.clone().normalize().multiplyScalar(-influence * this.strength * 0.5);

      // 2. Add rotational component (spiral effect)
      const angle = Math.atan2(distanceVec.z, distanceVec.x);
      const rotationalAngle = angle + this.rotationSpeed * influence * this.time;

      const rotationalX = Math.cos(rotationalAngle) * distance;
      const rotationalZ = Math.sin(rotationalAngle) * distance;

      // 3. Add vertical pull (funnel effect)
      const verticalPull = -influence * this.strength * 2;

      // 4. Add turbulence if enabled
      let turbulenceOffset = 0;
      if (this.turbulence > 0) {
        turbulenceOffset =
          Math.sin(tempVertex.x * 0.5 + this.time * 5) *
          Math.cos(tempVertex.z * 0.5 + this.time * 5) *
          this.turbulence * influence;
      }

      // Apply all effects
      vertices[i] += pullVector.x + (rotationalX - tempVertex.x) * this.rotationSpeed * 0.1;
      vertices[i + 1] += verticalPull + turbulenceOffset;
      vertices[i + 2] += pullVector.z + (rotationalZ - tempVertex.z) * this.rotationSpeed * 0.1;
    }

    lineGrid.setVertices(vertices);
  }

  /**
   * Calculate influence based on distance (inverse square falloff)
   */
  private calculateInfluence(distance: number): number {
    if (distance === 0) return 1;

    // Normalized distance (0 at center, 1 at radius edge)
    const normalizedDistance = distance / this.radius;

    // Inverse square falloff with smooth cutoff
    const falloff = 1 / (1 + normalizedDistance * normalizedDistance * 4);

    return falloff;
  }

  /**
   * Update animation time
   */
  animate(deltaTime: number): void {
    this.time += deltaTime;
  }

  /**
   * Set center position
   */
  setCenterPosition(position: THREE.Vector3): void {
    this.centerPosition.copy(position);
  }

  /**
   * Get center position
   */
  getCenterPosition(): THREE.Vector3 {
    return this.centerPosition.clone();
  }

  /**
   * Set radius
   */
  setRadius(radius: number): void {
    this.radius = radius;
  }

  /**
   * Set strength
   */
  setStrength(strength: number): void {
    this.strength = strength;
  }

  /**
   * Dispose (cleanup if needed)
   */
  dispose(): void {
    // No resources to dispose for now
  }
}
