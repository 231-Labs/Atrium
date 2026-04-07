/**
 * TopologyMorph - Space curvature and topology distortion
 * Applies non-linear space deformations based on mood and temperature
 */

import * as THREE from 'three';
import { LineGrid } from './LineGrid';

export interface TopologyMorphConfig {
  intensity: number;
}

export interface TopologyMorphUpdateParams {
  curvature: number;  // Mood-based curvature (-1 to 1)
  intensity: number;  // Temperature-based intensity (-1 to 1)
}

export class TopologyMorph {
  private intensity: number;
  private curvature: number = 0;
  private currentIntensity: number = 0;
  private time: number = 0;

  constructor(config: TopologyMorphConfig) {
    this.intensity = config.intensity;
  }

  /**
   * Update topology parameters
   */
  update(params: TopologyMorphUpdateParams): void {
    this.curvature = params.curvature;
    this.currentIntensity = params.intensity;
  }

  /**
   * Apply topology morphing to line grid
   */
  applyToLineGrid(lineGrid: LineGrid): void {
    if (this.intensity === 0 || this.currentIntensity === 0) return;

    const vertices = lineGrid.getVertices();
    const tempVertex = new THREE.Vector3();

    for (let i = 0; i < vertices.length; i += 3) {
      tempVertex.set(vertices[i], vertices[i + 1], vertices[i + 2]);

      // Calculate distance from center
      const distanceXZ = Math.sqrt(
        tempVertex.x * tempVertex.x + tempVertex.z * tempVertex.z
      );

      // 1. Curvature-based warping (mood influence)
      const curvatureEffect = this.applyCurvatureWarp(tempVertex, distanceXZ);

      // 2. Intensity-based expansion/contraction (temperature influence)
      const intensityEffect = this.applyIntensityWarp(tempVertex, distanceXZ);

      // 3. Ripple effect (combined influence)
      const rippleEffect = this.applyRippleEffect(tempVertex, distanceXZ);

      // Apply all effects
      vertices[i] += curvatureEffect.x + intensityEffect.x + rippleEffect.x;
      vertices[i + 1] += curvatureEffect.y + intensityEffect.y + rippleEffect.y;
      vertices[i + 2] += curvatureEffect.z + intensityEffect.z + rippleEffect.z;
    }

    lineGrid.setVertices(vertices);
  }

  /**
   * Apply curvature-based warping (positive = upward curve, negative = downward curve)
   */
  private applyCurvatureWarp(vertex: THREE.Vector3, distance: number): THREE.Vector3 {
    const warp = new THREE.Vector3(0, 0, 0);

    if (this.curvature === 0) return warp;

    // Paraboloid surface: y = k * (x^2 + z^2)
    const normalizedDistance = distance / 50; // Normalize to grid size
    const curvatureStrength = this.curvature * this.intensity * 5;

    // Vertical displacement based on distance
    warp.y = normalizedDistance * normalizedDistance * curvatureStrength;

    // Radial compression/expansion
    if (this.curvature > 0) {
      // Positive curvature: compress towards center at higher distances
      const compressionFactor = 1 - normalizedDistance * 0.1 * this.curvature * this.intensity;
      warp.x = vertex.x * (compressionFactor - 1);
      warp.z = vertex.z * (compressionFactor - 1);
    } else {
      // Negative curvature: expand outward
      const expansionFactor = 1 + normalizedDistance * 0.1 * Math.abs(this.curvature) * this.intensity;
      warp.x = vertex.x * (expansionFactor - 1);
      warp.z = vertex.z * (expansionFactor - 1);
    }

    return warp;
  }

  /**
   * Apply intensity-based warping (thermal expansion/contraction)
   */
  private applyIntensityWarp(vertex: THREE.Vector3, distance: number): THREE.Vector3 {
    const warp = new THREE.Vector3(0, 0, 0);

    if (this.currentIntensity === 0) return warp;

    const normalizedDistance = distance / 50;

    // Thermal expansion: positive intensity = expansion, negative = contraction
    const expansionFactor = this.currentIntensity * this.intensity * 0.2;

    // Radial expansion/contraction
    warp.x = vertex.x * expansionFactor * normalizedDistance;
    warp.z = vertex.z * expansionFactor * normalizedDistance;

    // Vertical component (heated air rises, cold air sinks)
    warp.y = this.currentIntensity * this.intensity * normalizedDistance * 2;

    return warp;
  }

  /**
   * Apply ripple effect (wave propagation)
   */
  private applyRippleEffect(vertex: THREE.Vector3, distance: number): THREE.Vector3 {
    const warp = new THREE.Vector3(0, 0, 0);

    // Combined influence determines ripple strength
    const rippleStrength = Math.abs(this.curvature * this.currentIntensity) * this.intensity;

    if (rippleStrength < 0.1) return warp;

    // Wave propagation from center
    const wavelength = 5;
    const frequency = 2;
    const phase = distance / wavelength - this.time * frequency;

    const amplitude = rippleStrength * Math.exp(-distance / 30); // Decay with distance

    // Vertical ripple
    warp.y += Math.sin(phase * Math.PI * 2) * amplitude * 2;

    // Radial ripple (push/pull)
    const radialRipple = Math.cos(phase * Math.PI * 2) * amplitude * 0.5;
    if (distance > 0) {
      warp.x += (vertex.x / distance) * radialRipple;
      warp.z += (vertex.z / distance) * radialRipple;
    }

    return warp;
  }

  /**
   * Animate topology morphing
   */
  animate(deltaTime: number): void {
    this.time += deltaTime;
  }

  /**
   * Set intensity
   */
  setIntensity(intensity: number): void {
    this.intensity = intensity;
  }

  /**
   * Get intensity
   */
  getIntensity(): number {
    return this.intensity;
  }

  /**
   * Dispose (cleanup if needed)
   */
  dispose(): void {
    // No resources to dispose for now
  }
}
