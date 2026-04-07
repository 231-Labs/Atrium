/**
 * ParticleFlow - Dynamic particle system for abstract space
 * Simulates flowing light particles with glow and motion
 */

import * as THREE from 'three';

export interface ParticleFlowConfig {
  particleCount: number;
  flowSpeed: number;
  color: number;
}

export interface ParticleFlowUpdateParams {
  speed: number;
  density: number;
  color: THREE.Color;
  size: number;
}

export class ParticleFlow {
  private mesh: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;

  private particles: {
    positions: Float32Array;
    velocities: Float32Array;
    lifetimes: Float32Array;
    sizes: Float32Array;
  };

  private config: ParticleFlowConfig;
  private time: number = 0;

  // Current parameters
  private currentSpeed: number = 1.0;
  private currentDensity: number = 1.0;
  private currentColor: THREE.Color;
  private currentSize: number = 0.1;

  // Effects
  private densityMultiplier: number = 1.0;
  private glowIntensity: number = 1.0;

  constructor(config: ParticleFlowConfig) {
    this.config = config;
    this.currentColor = new THREE.Color(config.color);

    // Initialize particle data
    this.particles = this.initializeParticles();

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.particles.positions, 3)
    );
    this.geometry.setAttribute(
      'size',
      new THREE.BufferAttribute(this.particles.sizes, 1)
    );

    // Create material
    this.material = new THREE.PointsMaterial({
      color: config.color,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    // Create mesh
    this.mesh = new THREE.Points(this.geometry, this.material);
  }

  /**
   * Initialize particle data
   */
  private initializeParticles(): {
    positions: Float32Array;
    velocities: Float32Array;
    lifetimes: Float32Array;
    sizes: Float32Array;
  } {
    const count = this.config.particleCount;

    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random position in a sphere
      this.resetParticle(i, positions, velocities, lifetimes, sizes);
    }

    return { positions, velocities, lifetimes, sizes };
  }

  /**
   * Reset a particle to initial state
   */
  private resetParticle(
    index: number,
    positions: Float32Array,
    velocities: Float32Array,
    lifetimes: Float32Array,
    sizes: Float32Array
  ): void {
    const i3 = index * 3;

    // Random position in sphere
    const radius = Math.random() * 30;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = (Math.random() - 0.5) * 20;
    positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    // Velocity (spiral outward flow)
    const speed = 0.5 + Math.random() * 1.5;
    const flowAngle = theta + Math.PI / 4; // Slight spiral

    velocities[i3] = Math.cos(flowAngle) * speed;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.2; // Slight vertical drift
    velocities[i3 + 2] = Math.sin(flowAngle) * speed;

    // Lifetime (normalized 0-1)
    lifetimes[index] = Math.random();

    // Size variation
    sizes[index] = 0.05 + Math.random() * 0.1;
  }

  /**
   * Update particle parameters
   */
  update(params: ParticleFlowUpdateParams): void {
    this.currentSpeed = params.speed;
    this.currentDensity = params.density;
    this.currentColor = params.color;
    this.currentSize = params.size;

    // Update material
    this.material.color = params.color;
    this.material.size = params.size;

    // Update opacity based on density
    this.material.opacity = Math.min(1.0, 0.6 + params.density * 0.4) * this.glowIntensity;
  }

  /**
   * Animate particles
   */
  animate(deltaTime: number): void {
    this.time += deltaTime;

    const { positions, velocities, lifetimes, sizes } = this.particles;
    const speedMultiplier = this.currentSpeed;
    const visibleCount = Math.floor(
      this.config.particleCount * this.currentDensity * this.densityMultiplier
    );

    for (let i = 0; i < this.config.particleCount; i++) {
      const i3 = i * 3;

      // Update lifetime
      lifetimes[i] -= deltaTime * 0.2 * speedMultiplier;

      // Reset particle if lifetime expired or not visible
      if (lifetimes[i] <= 0 || i >= visibleCount) {
        this.resetParticle(i, positions, velocities, lifetimes, sizes);
        continue;
      }

      // Update position based on velocity
      positions[i3] += velocities[i3] * deltaTime * speedMultiplier;
      positions[i3 + 1] += velocities[i3 + 1] * deltaTime * speedMultiplier;
      positions[i3 + 2] += velocities[i3 + 2] * deltaTime * speedMultiplier;

      // Add spiral flow
      const distance = Math.sqrt(
        positions[i3] * positions[i3] + positions[i3 + 2] * positions[i3 + 2]
      );
      const angle = Math.atan2(positions[i3 + 2], positions[i3]);
      const spiralStrength = 0.5 * speedMultiplier;

      velocities[i3] += Math.cos(angle + Math.PI / 2) * spiralStrength * deltaTime;
      velocities[i3 + 2] += Math.sin(angle + Math.PI / 2) * spiralStrength * deltaTime;

      // Add noise
      velocities[i3] += (Math.random() - 0.5) * 0.1 * deltaTime;
      velocities[i3 + 1] += (Math.random() - 0.5) * 0.05 * deltaTime;
      velocities[i3 + 2] += (Math.random() - 0.5) * 0.1 * deltaTime;

      // Update size based on lifetime (fade in/out)
      const fadeIn = Math.min(1, (1 - lifetimes[i]) * 3);
      const fadeOut = Math.min(1, lifetimes[i] * 3);
      const fade = Math.min(fadeIn, fadeOut);

      sizes[i] = this.currentSize * fade * (0.5 + Math.random() * 0.5);

      // Boundary check - reset if too far
      if (distance > 50) {
        this.resetParticle(i, positions, velocities, lifetimes, sizes);
      }
    }

    // Mark for update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  /**
   * Set density multiplier
   */
  setDensityMultiplier(multiplier: number): void {
    this.densityMultiplier = multiplier;
  }

  /**
   * Set glow intensity
   */
  setGlow(intensity: number): void {
    this.glowIntensity = intensity;
    this.material.opacity = Math.min(1.0, 0.6 + this.currentDensity * 0.4) * intensity;
  }

  /**
   * Set particle speed
   */
  setSpeed(speed: number): void {
    this.currentSpeed = speed;
  }

  /**
   * Get mesh
   */
  getMesh(): THREE.Points {
    return this.mesh;
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
