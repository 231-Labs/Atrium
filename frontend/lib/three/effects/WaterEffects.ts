/**
 * Water effects system
 * Handles calm, ripples, waves, turbulent, frozen water states
 */

import * as THREE from 'three';

export type WaterEffectType = 'calm' | 'ripples' | 'waves' | 'turbulent' | 'frozen';

export interface WaterEffectConfig {
  scene: THREE.Scene;
  waterPlane: THREE.Mesh;
  effectType: WaterEffectType;
  waterColor?: string;
  intensity?: number;
}

/**
 * Water effects manager
 */
export class WaterEffectsManager {
  private scene: THREE.Scene;
  private waterPlane: THREE.Mesh | null = null;
  private currentEffect: WaterEffectType = 'calm';
  private waveAnimations: Array<(time: number) => void> = [];
  private particles: THREE.Points | null = null;
  private iceOverlay: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, waterMesh?: THREE.Mesh) {
    this.scene = scene;
    if (waterMesh) {
      this.waterPlane = waterMesh;
    } else {
      this.createWaterPlane();
    }
  }

  /**
   * Create water plane
   */
  private createWaterPlane(): void {
    const geometry = new THREE.PlaneGeometry(200, 200, 100, 100);
    // Use MeshPhongMaterial for better color control in bright environments
    const material = new THREE.MeshPhongMaterial({
      color: 0x2299dd,
      emissive: 0x1166aa,
      emissiveIntensity: 0.4,
      specular: 0x1166aa, // Blue specular highlights instead of white
      shininess: 100,
      transparent: true,
      opacity: 0.85,
      flatShading: false,
    });

    this.waterPlane = new THREE.Mesh(geometry, material);
    this.waterPlane.rotation.x = -Math.PI / 2;
    this.waterPlane.position.y = 0;
    this.waterPlane.receiveShadow = true;

    this.scene.add(this.waterPlane);
  }

  /**
   * Update water effect
   */
  updateEffect(config: Partial<WaterEffectConfig>): void {
    if (!this.waterPlane) return;

    if (config.effectType) {
      this.currentEffect = config.effectType;
    }

    // Enable external waterColor updates to allow changing color
    if (config.waterColor) {
      if (this.waterPlane.material instanceof THREE.MeshStandardMaterial || this.waterPlane.material instanceof THREE.MeshPhongMaterial) {
        this.waterPlane.material.color.set(config.waterColor);
        if (this.waterPlane.material instanceof THREE.MeshPhongMaterial) {
          this.waterPlane.material.emissive.set(config.waterColor);
        }
      }
    }

    const intensity = config.intensity || 1.0;

    this.clearEffects();
    switch (this.currentEffect) {
      case 'calm':
        this.applyCalmEffect(intensity);
        break;
      case 'ripples':
        this.applyRipplesEffect(intensity);
        break;
      case 'waves':
        this.applyWavesEffect(intensity);
        break;
      case 'turbulent':
        this.applyTurbulentEffect(intensity);
        break;
      case 'frozen':
        this.applyFrozenEffect(intensity);
        break;
    }
  }

  /**
   * Calm water
   */
  private applyCalmEffect(intensity: number): void {
    if (!this.waterPlane) return;

    const geometry = this.waterPlane.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.attributes.position;
    const originalPositions = positionAttribute.array.slice();

    this.waveAnimations.push((time: number) => {
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = originalPositions[i * 3];
        const y = originalPositions[i * 3 + 1];
        
        const wave = Math.sin(x * 0.01 + time * 0.5) * 0.1 * intensity;
        positionAttribute.setZ(i, wave);
      }
      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
    });
  }

  /**
   * Ripples effect
   */
  private applyRipplesEffect(intensity: number): void {
    if (!this.waterPlane) return;

    const geometry = this.waterPlane.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.attributes.position;
    const originalPositions = positionAttribute.array.slice();

    const rippleCenters = [
      { x: 0, y: 0 },
      { x: 30, y: 30 },
      { x: -30, y: -30 },
      { x: 30, y: -30 },
    ];

    this.waveAnimations.push((time: number) => {
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = originalPositions[i * 3];
        const y = originalPositions[i * 3 + 1];
        
        let wave = 0;
        rippleCenters.forEach(center => {
          const distance = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
          wave += Math.sin(distance * 0.1 - time * 2) * Math.exp(-distance * 0.01) * intensity;
        });
        
        positionAttribute.setZ(i, wave * 0.5);
      }
      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
    });

    this.createWaterSplash(intensity * 0.5);
  }

  /**
   * Waves effect
   */
  private applyWavesEffect(intensity: number): void {
    if (!this.waterPlane) return;

    const geometry = this.waterPlane.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.attributes.position;
    const originalPositions = positionAttribute.array.slice();

    this.waveAnimations.push((time: number) => {
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = originalPositions[i * 3];
        const y = originalPositions[i * 3 + 1];
        
        const wave1 = Math.sin(x * 0.05 + time * 1.5) * intensity;
        const wave2 = Math.sin(y * 0.03 - time * 1.2) * intensity * 0.7;
        const wave3 = Math.sin((x + y) * 0.02 + time) * intensity * 0.5;
        
        positionAttribute.setZ(i, wave1 + wave2 + wave3);
      }
      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
    });

    this.createWaterSplash(intensity);
  }

  /**
   * Turbulent water
   */
  private applyTurbulentEffect(intensity: number): void {
    if (!this.waterPlane) return;

    const geometry = this.waterPlane.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.attributes.position;
    const originalPositions = positionAttribute.array.slice();

    this.waveAnimations.push((time: number) => {
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = originalPositions[i * 3];
        const y = originalPositions[i * 3 + 1];
        
        const wave1 = Math.sin(x * 0.1 + time * 3) * intensity * 2;
        const wave2 = Math.cos(y * 0.08 - time * 2.5) * intensity * 1.5;
        const wave3 = Math.sin((x + y) * 0.05 + time * 4) * intensity;
        const noise = (Math.random() - 0.5) * intensity * 0.3;
        
        positionAttribute.setZ(i, wave1 + wave2 + wave3 + noise);
      }
      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
    });

    this.createWaterSplash(intensity * 1.5);
    this.createWhitecaps(intensity);
  }

  /**
   * Frozen effect
   */
  private applyFrozenEffect(intensity: number): void {
    if (!this.waterPlane) return;

    if (this.waterPlane.material instanceof THREE.MeshStandardMaterial) {
      this.waterPlane.material.color.set(0xB0E0E6);
      this.waterPlane.material.metalness = 0.3;
      this.waterPlane.material.roughness = 0.8;
      this.waterPlane.material.opacity = 0.95;
    }

    const iceGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    const iceMaterial = new THREE.MeshStandardMaterial({
      color: 0xE0F7FF,
      transparent: true,
      opacity: 0.5,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.iceOverlay = new THREE.Mesh(iceGeometry, iceMaterial);
    this.iceOverlay.rotation.x = -Math.PI / 2;
    this.iceOverlay.position.y = 0.1;

    const positions = iceGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const noise = (Math.random() - 0.5) * 0.2 * intensity;
      positions.setZ(i, noise);
    }
    positions.needsUpdate = true;

    this.scene.add(this.iceOverlay);
    this.createSnowflakes(intensity);
  }

  /**
   * Create water splash particles
   */
  private createWaterSplash(intensity: number): void {
    const particleCount = Math.floor(100 * intensity);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Get water height from water plane position if available, otherwise default to -20
    const waterHeight = this.waterPlane ? this.waterPlane.position.y : -20;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = waterHeight + Math.random() * 2; // Start at water surface
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = Math.random() * 2 + 1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.6,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  /**
   * Create whitecaps effect
   */
  private createWhitecaps(intensity: number): void {
    const particleCount = Math.floor(200 * intensity);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    // Get water height
    const waterHeight = this.waterPlane ? this.waterPlane.position.y : -20;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = waterHeight + Math.random() * 1; // Just above water
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const whitecaps = new THREE.Points(geometry, material);
    this.scene.add(whitecaps);
  }

  /**
   * Create snowflake particles
   */
  private createSnowflakes(intensity: number): void {
    const particleCount = Math.floor(300 * intensity);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.8,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  /**
   * Update animation
   */
  update(deltaTime: number): void {
    const time = performance.now() * 0.001;

    this.waveAnimations.forEach(anim => anim(time));

    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array as Float32Array;
      const velocities = this.particles.geometry.attributes.velocity?.array as Float32Array;

      if (velocities) {
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i] * deltaTime;
          positions[i + 1] += velocities[i + 1] * deltaTime;
          positions[i + 2] += velocities[i + 2] * deltaTime;

          velocities[i + 1] -= 9.8 * deltaTime; // gravity

          // Reset if below water
          const waterHeight = this.waterPlane ? this.waterPlane.position.y : -20;
          if (positions[i + 1] < waterHeight) {
            positions[i] = (Math.random() - 0.5) * 100;
            positions[i + 1] = waterHeight;
            positions[i + 2] = (Math.random() - 0.5) * 100;
            velocities[i + 1] = Math.random() * 2 + 1;
          }
        }
      } else {
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] -= deltaTime * 2;

          if (positions[i + 1] < 0) {
            positions[i + 1] = 50;
          }
        }
      }

      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }

  /**
   * Clear all effects
   */
  private clearEffects(): void {
    this.waveAnimations = [];

    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      if (this.particles.material instanceof THREE.Material) {
        this.particles.material.dispose();
      }
      this.particles = null;
    }

    if (this.iceOverlay) {
      this.scene.remove(this.iceOverlay);
      this.iceOverlay.geometry.dispose();
      if (this.iceOverlay.material instanceof THREE.Material) {
        this.iceOverlay.material.dispose();
      }
      this.iceOverlay = null;
    }

    if (this.waterPlane && (this.waterPlane.material instanceof THREE.MeshStandardMaterial || this.waterPlane.material instanceof THREE.MeshPhongMaterial)) {
      this.waterPlane.material.color.set(0x6688aa); // Grayish blue
      this.waterPlane.material.transparent = true;
      this.waterPlane.material.opacity = 0.85;
      
      if (this.waterPlane.material instanceof THREE.MeshStandardMaterial) {
         this.waterPlane.material.metalness = 0.1;
         this.waterPlane.material.roughness = 0.05;
         this.waterPlane.material.emissive.set(0x6688aa);
         this.waterPlane.material.emissiveIntensity = 0.2;
      } else if (this.waterPlane.material instanceof THREE.MeshPhongMaterial) {
         this.waterPlane.material.specular.set(0x0055aa);
         this.waterPlane.material.shininess = 100;
         this.waterPlane.material.emissive.set(0x6688aa);
         this.waterPlane.material.emissiveIntensity = 0.2;
      }
    }
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.clearEffects();

    if (this.waterPlane) {
      this.scene.remove(this.waterPlane);
      this.waterPlane.geometry.dispose();
      if (this.waterPlane.material instanceof THREE.Material) {
        this.waterPlane.material.dispose();
      }
      this.waterPlane = null;
    }
  }
}

