/**
 * AbstractSpaceScene - New abstract 3D visualization system
 * Replaces concrete weather metaphors with abstract geometric forms
 */

import * as THREE from 'three';
import { SpaceState } from '@/types/spaceState';
import { LineGrid } from './elements/LineGrid';
import { VortexField } from './elements/VortexField';
import { ParticleFlow } from './elements/ParticleFlow';
import { TopologyMorph } from './elements/TopologyMorph';

export interface AbstractSpaceSceneConfig {
  enableLineGrid?: boolean;
  enableVortex?: boolean;
  enableParticles?: boolean;
  enableTopology?: boolean;
  performanceMode?: 'high' | 'medium' | 'low';
}

export class AbstractSpaceScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // Visual elements
  private lineGrid: LineGrid | null = null;
  private vortexField: VortexField | null = null;
  private particleFlow: ParticleFlow | null = null;
  private topologyMorph: TopologyMorph | null = null;

  // State
  private currentState: SpaceState | null = null;
  private animationFrameId: number | null = null;
  private config: AbstractSpaceSceneConfig;

  // Performance tracking
  private lastFrameTime: number = 0;
  private fps: number = 60;

  constructor(
    canvas: HTMLCanvasElement,
    config: AbstractSpaceSceneConfig = {}
  ) {
    this.config = {
      enableLineGrid: true,
      enableVortex: true,
      enableParticles: true,
      enableTopology: true,
      performanceMode: 'high',
      ...config,
    };

    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 10, 100);

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 30);
    this.camera.lookAt(0, 0, 0);

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.config.performanceMode !== 'low',
      alpha: true,
    });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(
      this.config.performanceMode === 'high' ? window.devicePixelRatio : 1
    );

    // Initialize abstract space
    this.initializeAbstractSpace();

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);

    // Start animation loop
    this.animate();
  }

  /**
   * Initialize all abstract space elements
   */
  private initializeAbstractSpace(): void {
    // Line Grid - Primary visual element
    if (this.config.enableLineGrid) {
      this.lineGrid = new LineGrid({
        gridSize: 50,
        lineCount: this.getLineCountForPerformance(),
        color: 0x00ffff,
        opacity: 0.6,
      });
      this.scene.add(this.lineGrid.getMesh());
    }

    // Vortex Field - Black hole-like distortion
    if (this.config.enableVortex) {
      this.vortexField = new VortexField({
        centerPosition: new THREE.Vector3(0, 0, 0),
        radius: 10,
        strength: 1.0,
      });
    }

    // Particle Flow - Dynamic light particles
    if (this.config.enableParticles) {
      this.particleFlow = new ParticleFlow({
        particleCount: this.getParticleCountForPerformance(),
        flowSpeed: 1.0,
        color: 0x00ffff,
      });
      this.scene.add(this.particleFlow.getMesh());
    }

    // Topology Morph - Space curvature
    if (this.config.enableTopology) {
      this.topologyMorph = new TopologyMorph({
        intensity: 1.0,
      });
    }
  }

  /**
   * Get line count based on performance mode
   */
  private getLineCountForPerformance(): number {
    switch (this.config.performanceMode) {
      case 'high':
        return 150;
      case 'medium':
        return 100;
      case 'low':
        return 50;
      default:
        return 100;
    }
  }

  /**
   * Get particle count based on performance mode
   */
  private getParticleCountForPerformance(): number {
    switch (this.config.performanceMode) {
      case 'high':
        return 2000;
      case 'medium':
        return 1000;
      case 'low':
        return 500;
      default:
        return 1000;
    }
  }

  /**
   * Core method: Update visual from SpaceState
   */
  updateFromSpaceState(state: SpaceState): void {
    this.currentState = state;

    // 1. Update line grid
    if (this.lineGrid) {
      this.lineGrid.update({
        curvature: state.energy * 2.0,
        flowSpeed: state.flow * 5.0,
        density: state.density,
        colorHue: this.deriveHue(state.mood, state.temperature),
        opacity: this.deriveOpacity(state.luminosity, state.density),
      });
    }

    // 2. Update vortex field
    if (this.vortexField) {
      this.vortexField.update({
        strength: state.energy * state.density,
        rotationSpeed: state.flow * 0.1,
        radius: 10 + state.energy * 10,
      });
    }

    // 3. Update particle flow
    if (this.particleFlow) {
      this.particleFlow.update({
        speed: state.flow * 2.0,
        density: state.energy,
        color: this.deriveColor(state),
        size: this.deriveParticleSize(state.density),
      });
    }

    // 4. Update topology morph
    if (this.topologyMorph) {
      this.topologyMorph.update({
        curvature: state.mood,
        intensity: state.temperature,
      });
    }

    // 5. Apply visual hints if provided
    if (state.interpretation?.visualSuggestions) {
      this.applyVisualHints(state.interpretation.visualSuggestions);
    }

    // 6. Apply trait effects
    this.applyTraits(state.traits);

    // 7. Update fog based on density and luminosity
    this.updateFog(state);

    // 8. Update camera effects
    this.updateCameraEffects(state);
  }

  /**
   * Derive hue from mood and temperature
   */
  private deriveHue(mood: number, temperature: number): number {
    // mood: -1(sad) → blue(240), 0(neutral) → cyan(180), 1(joyful) → yellow(60)
    // temperature: -1(cold) → blue shift, 1(hot) → red shift
    const baseMoodHue = (mood + 1) * 90 + 150; // 150-330
    const tempOffset = temperature * 30; // -30 to +30
    return (baseMoodHue + tempOffset) % 360;
  }

  /**
   * Derive color from full state
   */
  private deriveColor(state: SpaceState): THREE.Color {
    const hue = this.deriveHue(state.mood, state.temperature);
    const saturation = 0.7 + state.energy * 0.3; // Higher energy = more saturated
    const lightness = 0.3 + state.luminosity * 0.4;

    return new THREE.Color().setHSL(hue / 360, saturation, lightness);
  }

  /**
   * Derive opacity from luminosity and density
   */
  private deriveOpacity(luminosity: number, density: number): number {
    // Higher luminosity = more visible
    // Higher density = more opaque
    return 0.3 + luminosity * 0.4 + density * 0.3;
  }

  /**
   * Derive particle size from density
   */
  private deriveParticleSize(density: number): number {
    return 0.05 + density * 0.15; // 0.05 - 0.2
  }

  /**
   * Apply visual hints from AI
   */
  private applyVisualHints(hints: any): void {
    if (hints.colorPalette && hints.colorPalette.length > 0) {
      // Apply custom color palette
      const primaryColor = new THREE.Color(hints.colorPalette[0]);
      if (this.lineGrid) {
        this.lineGrid.setColor(primaryColor);
      }
    }

    if (hints.particleDensity !== undefined && this.particleFlow) {
      this.particleFlow.setDensityMultiplier(hints.particleDensity);
    }

    if (hints.specialEffects) {
      for (const effect of hints.specialEffects) {
        this.applySpecialEffect(effect);
      }
    }
  }

  /**
   * Apply trait-specific visual effects
   */
  private applyTraits(traits: string[]): void {
    for (const trait of traits) {
      switch (trait) {
        case 'ethereal':
          if (this.lineGrid) this.lineGrid.setOpacity(0.3);
          if (this.particleFlow) this.particleFlow.setGlow(2.0);
          break;

        case 'chaotic':
          if (this.vortexField) this.vortexField.addTurbulence(3.0);
          if (this.lineGrid) this.lineGrid.addNoise(0.5);
          break;

        case 'serene':
          if (this.lineGrid) this.lineGrid.smoothen(0.8);
          if (this.particleFlow) this.particleFlow.setSpeed(0.3);
          break;

        case 'pulsating':
          this.enableRhythmicPulse(true);
          break;

        case 'crystalline':
          if (this.lineGrid) this.lineGrid.setGeometryType('sharp');
          break;

        case 'organic':
          if (this.lineGrid) this.lineGrid.setGeometryType('curved');
          break;

        case 'void':
          if (this.lineGrid) this.lineGrid.setOpacity(0.1);
          if (this.particleFlow) this.particleFlow.setDensityMultiplier(0.2);
          this.scene.fog = new THREE.Fog(0x000000, 5, 50);
          break;

        case 'electric':
          if (this.particleFlow) {
            this.particleFlow.setGlow(3.0);
            this.particleFlow.setSpeed(3.0);
          }
          break;
      }
    }
  }

  /**
   * Apply special effect
   */
  private applySpecialEffect(effect: string): void {
    // Future: Implement special effects
    console.log(`Applying special effect: ${effect}`);
  }

  /**
   * Enable rhythmic pulse effect
   */
  private enableRhythmicPulse(enable: boolean): void {
    // Future: Implement pulsating animation
  }

  /**
   * Update fog based on state
   */
  private updateFog(state: SpaceState): void {
    const near = 10 - state.density * 5; // Higher density = closer fog
    const far = 100 - state.density * 50;

    const fogColor = this.deriveColor(state);
    fogColor.multiplyScalar(0.3); // Darker fog

    this.scene.fog = new THREE.Fog(fogColor.getHex(), near, far);
  }

  /**
   * Update camera effects based on state
   */
  private updateCameraEffects(state: SpaceState): void {
    // Subtle camera movement based on flow
    const time = Date.now() * 0.0001;
    const flowIntensity = state.flow * 2;

    this.camera.position.x = Math.sin(time * flowIntensity) * 2;
    this.camera.position.y = 10 + Math.cos(time * flowIntensity * 0.5) * 1;

    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Calculate FPS
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.fps = 1000 / delta;
    this.lastFrameTime = now;

    // Update elements
    const deltaTime = delta / 1000;

    if (this.lineGrid) {
      this.lineGrid.animate(deltaTime);
    }

    if (this.vortexField && this.lineGrid) {
      // Animate vortex field
      this.vortexField.animate(deltaTime);
      // Apply vortex influence to line grid
      this.vortexField.applyToLineGrid(this.lineGrid);
    }

    if (this.particleFlow) {
      this.particleFlow.animate(deltaTime);
    }

    if (this.topologyMorph && this.lineGrid) {
      // Animate topology morphing
      this.topologyMorph.animate(deltaTime);
      // Apply topology morphing
      this.topologyMorph.applyToLineGrid(this.lineGrid);
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Handle window resize
   */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get current state
   */
  getCurrentState(): SpaceState | null {
    return this.currentState;
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Dispose elements
    this.lineGrid?.dispose();
    this.vortexField?.dispose();
    this.particleFlow?.dispose();
    this.topologyMorph?.dispose();

    // Dispose renderer
    this.renderer.dispose();

    // Clear scene
    this.scene.clear();
  }
}
