/**
 * LineGrid - Dynamic line grid with distortion and flow
 * Core visual element of the abstract space
 */

import * as THREE from 'three';

export interface LineGridConfig {
  gridSize: number;
  lineCount: number;
  color: number;
  opacity?: number;
}

export interface LineGridUpdateParams {
  curvature: number;
  flowSpeed: number;
  density: number;
  colorHue: number;
  opacity: number;
}

export class LineGrid {
  private mesh: THREE.LineSegments;
  private geometry: THREE.BufferGeometry;
  private material: THREE.LineBasicMaterial;
  private vertices: Float32Array;
  private originalVertices: Float32Array;

  private config: LineGridConfig;
  private time: number = 0;

  // Current parameters
  private currentCurvature: number = 0;
  private currentFlowSpeed: number = 0;
  private currentDensity: number = 1;
  private currentColorHue: number = 180;
  private currentOpacity: number = 0.6;

  // Effects
  private noiseAmount: number = 0;
  private smoothness: number = 0.5;
  private geometryType: 'curved' | 'sharp' = 'curved';
  private glowIntensity: number = 1.0;

  constructor(config: LineGridConfig) {
    this.config = {
      opacity: 0.6,
      ...config,
    };

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    this.vertices = this.createGridVertices();
    this.originalVertices = new Float32Array(this.vertices);

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.vertices, 3)
    );

    // Create material
    this.material = new THREE.LineBasicMaterial({
      color: this.config.color,
      opacity: this.config.opacity || 0.6,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    // Create mesh
    this.mesh = new THREE.LineSegments(this.geometry, this.material);
  }

  /**
   * Create grid vertices
   */
  private createGridVertices(): Float32Array {
    const { gridSize, lineCount } = this.config;
    const vertices: number[] = [];

    const spacing = gridSize / lineCount;
    const halfSize = gridSize / 2;

    // Create grid lines
    for (let i = 0; i <= lineCount; i++) {
      const pos = -halfSize + i * spacing;

      // Horizontal lines (along X axis)
      vertices.push(-halfSize, 0, pos);
      vertices.push(halfSize, 0, pos);

      // Vertical lines (along Z axis)
      vertices.push(pos, 0, -halfSize);
      vertices.push(pos, 0, halfSize);
    }

    // Add some radial lines for more interesting patterns
    const radialCount = Math.floor(lineCount / 3);
    for (let i = 0; i < radialCount; i++) {
      const angle = (i / radialCount) * Math.PI * 2;
      const radius = gridSize / 2;

      vertices.push(0, 0, 0);
      vertices.push(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
    }

    return new Float32Array(vertices);
  }

  /**
   * Update grid parameters
   */
  update(params: LineGridUpdateParams): void {
    this.currentCurvature = params.curvature;
    this.currentFlowSpeed = params.flowSpeed;
    this.currentDensity = params.density;
    this.currentColorHue = params.colorHue;
    this.currentOpacity = params.opacity;

    // Update color
    const color = new THREE.Color().setHSL(params.colorHue / 360, 0.8, 0.5);
    this.material.color = color;

    // Update opacity
    this.material.opacity = params.opacity * this.glowIntensity;

    // Apply density by adjusting visibility
    const visibilityThreshold = 1 - params.density;
    // In a real implementation, you might show/hide certain lines
  }

  /**
   * Animate the grid
   */
  animate(deltaTime: number): void {
    this.time += deltaTime * this.currentFlowSpeed;

    // Apply distortions
    this.applyCurvature();
    this.applyFlow();
    this.applyNoise();

    // Mark for update
    this.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Apply curvature distortion
   */
  private applyCurvature(): void {
    const curvature = this.currentCurvature;

    for (let i = 0; i < this.vertices.length; i += 3) {
      const x = this.originalVertices[i];
      const y = this.originalVertices[i + 1];
      const z = this.originalVertices[i + 2];

      // Calculate distance from center
      const distance = Math.sqrt(x * x + z * z);

      // Apply distortion based on distance and curvature
      let yOffset = 0;

      if (this.geometryType === 'curved') {
        // Smooth wave-like curvature
        yOffset =
          Math.sin(distance * 0.2 + this.time) * curvature * 2 +
          Math.cos(distance * 0.1 + this.time * 0.5) * curvature;
      } else {
        // Sharp, crystalline distortion
        yOffset =
          Math.abs(Math.sin(distance * 0.3 + this.time)) * curvature * 3;
      }

      // Apply smoothness
      yOffset *= this.smoothness;

      this.vertices[i] = x;
      this.vertices[i + 1] = y + yOffset;
      this.vertices[i + 2] = z;
    }
  }

  /**
   * Apply flow effect
   */
  private applyFlow(): void {
    if (this.currentFlowSpeed === 0) return;

    for (let i = 0; i < this.vertices.length; i += 3) {
      const x = this.vertices[i];
      const z = this.vertices[i + 2];

      // Add subtle spiral flow
      const angle = Math.atan2(z, x);
      const radius = Math.sqrt(x * x + z * z);

      const flowOffset = this.time * 0.1 * this.currentFlowSpeed;
      const newAngle = angle + Math.sin(radius * 0.1) * flowOffset * 0.1;

      // Slight rotation effect
      this.vertices[i] = x + Math.cos(newAngle) * 0.01 * this.currentFlowSpeed;
      this.vertices[i + 2] = z + Math.sin(newAngle) * 0.01 * this.currentFlowSpeed;
    }
  }

  /**
   * Apply noise distortion
   */
  private applyNoise(): void {
    if (this.noiseAmount === 0) return;

    for (let i = 0; i < this.vertices.length; i += 3) {
      const x = this.vertices[i];
      const z = this.vertices[i + 2];

      // Simplex-like noise (simplified)
      const noise =
        Math.sin(x * 0.5 + this.time) *
        Math.cos(z * 0.5 + this.time) *
        this.noiseAmount;

      this.vertices[i + 1] += noise;
    }
  }

  /**
   * Set opacity
   */
  setOpacity(opacity: number): void {
    this.currentOpacity = opacity;
    this.material.opacity = opacity * this.glowIntensity;
  }

  /**
   * Set glow intensity
   */
  setGlow(intensity: number): void {
    this.glowIntensity = intensity;
    this.material.opacity = this.currentOpacity * intensity;
  }

  /**
   * Add noise distortion
   */
  addNoise(amount: number): void {
    this.noiseAmount = amount;
  }

  /**
   * Smoothen the grid
   */
  smoothen(amount: number): void {
    this.smoothness = amount;
  }

  /**
   * Set geometry type
   */
  setGeometryType(type: 'curved' | 'sharp'): void {
    this.geometryType = type;
  }

  /**
   * Set color
   */
  setColor(color: THREE.Color): void {
    this.material.color = color;
  }

  /**
   * Get mesh
   */
  getMesh(): THREE.LineSegments {
    return this.mesh;
  }

  /**
   * Get vertices for external manipulation (e.g., vortex field)
   */
  getVertices(): Float32Array {
    return this.vertices;
  }

  /**
   * Set vertices (after external manipulation)
   */
  setVertices(vertices: Float32Array): void {
    this.vertices = vertices;
    this.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Reset to original vertices
   */
  resetVertices(): void {
    this.vertices.set(this.originalVertices);
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
