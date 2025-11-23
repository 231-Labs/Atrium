import * as THREE from 'three';
import { StageThemeConfig } from '../../types/theme';
import type { SceneWeatherParams } from '../../services/poeApi';
import { SpecialEffectsManager } from './effects/SpecialEffects';
import { WaterEffectsManager } from './effects/WaterEffects';

export interface AtriumGallerySceneConfig {
  theme?: StageThemeConfig;
  enablePlatform?: boolean;
  enableGrid?: boolean;
  enableSpotlights?: boolean;
  enableAmbientParticles?: boolean;
  enableParametricElements?: boolean;
  enableAudienceSeats?: boolean;
  stageStyle?: 'minimal' | 'ethereal' | 'abstract';
  weatherParams?: SceneWeatherParams; // AI-generated weather params
}

export interface AudienceSeatPosition {
  position: THREE.Vector3;
  rotation: number;
  index: number;
}

export class AtriumGalleryScene {
  private scene: THREE.Scene;
  private ambientParticles?: THREE.Points;
  private spotlights: THREE.SpotLight[] = [];
  private animatedElements: THREE.Object3D[] = [];
  private gridHelper?: THREE.GridHelper;
  private theme: StageThemeConfig;
  private parametricElements: THREE.Object3D[] = [];
  private audienceSeatPositions: AudienceSeatPosition[] = [];
  private audienceSeatObjects: Map<number, THREE.Object3D[]> = new Map(); // Track seat objects for removal
  private waterSurface?: THREE.Mesh; // Keep water reference separate
  private floatingOrbs: THREE.Mesh[] = []; // Decorative floating orbs
  private lightBeam?: THREE.Mesh; // Central light beam
  private holographicScreen?: THREE.Group; // Main holographic screen for video playback
  private currentWeatherParams?: SceneWeatherParams; // Current weather params
  private weatherParticles?: THREE.Points; // Weather particles (rain, snow, etc.)
  private directionalLight?: THREE.DirectionalLight; // Main light reference
  private ambientLight?: THREE.AmbientLight; // Ambient light reference
  private effectsManager?: SpecialEffectsManager; // Effects manager
  private waterManager?: WaterEffectsManager; // Water effects manager
  private fishSchool: THREE.Mesh[] = []; // Swimming fish based on volume
  private guardianStones: THREE.Group[] = []; // Floating polygonal guardian stones
  private energyBeams: THREE.Mesh[] = []; // Energy beams based on momentum
  private smokeParticles?: THREE.Points; // Smoke particles for "smoking" island state
  private fireParticles?: THREE.Points; // Fire particles for "burning" island state

  constructor(scene: THREE.Scene, config: AtriumGallerySceneConfig = {}, camera?: THREE.Camera) {
    this.scene = scene;
    
    // Use theme config or fallback to defaults
    this.theme = config.theme || {
      backgroundColor: 0xe8f4f8,
      fogColor: 0xe8f4f8,
      fogNear: 50, // Increased from 25 for less fog
      fogFar: 120, // Increased from 70 for better visibility
    } as StageThemeConfig;
    
    this.initializeBackground();
    this.createPlatform(config.enablePlatform);
    this.createWaterSurface(); // Add water/ocean below the island
    this.createAbstractGrid(config.enableGrid);
    this.createParametricElements(config.enableParametricElements);
    this.createFloatingIslands(); // Add small floating island fragments
    // this.createCentralLightBeam(); // Disabled - may interfere with screen placement
    this.createHolographicScreen(); // Create main holographic video screen
    this.createFloatingOrbs(); // Add decorative light orbs
    this.createGuardianStones(); // Add cyber polygonal guardian stones
    this.initializeAudienceSeatPositions(); // Initialize positions without creating visual seats
    // this.createAudienceAreaDebugVisual(); // DEBUG REMOVED
    this.createStageSpotlights(config.enableSpotlights);
    this.createAmbientParticles(config.enableAmbientParticles);
    
    // Initialize effects and water managers if camera is provided
    if (camera) {
      this.effectsManager = new SpecialEffectsManager(this.scene, camera);
      console.log('✨ Special Effects Manager initialized');
      
      // Initialize water manager with existing water surface
      if (this.waterSurface) {
        this.waterManager = new WaterEffectsManager(this.scene, this.waterSurface);
        console.log('🌊 Water Effects Manager initialized');
      }
    }
  }

  private initializeBackground() {
    // Create gradient sky
    const baseColor = new THREE.Color(this.theme.backgroundColor);
    const topColor = baseColor.clone().offsetHSL(0, 0, -0.1); // Slightly darker at top
    const bottomColor = baseColor.clone().offsetHSL(0, 0, 0.1); // Lighter at horizon
    
    this.scene.background = this.createGradientTexture(topColor, bottomColor);
    
    const fog = new THREE.Fog(this.theme.fogColor, this.theme.fogNear, this.theme.fogFar);
    this.scene.fog = fog;
  }

  private createGradientTexture(colorTop: THREE.Color, colorBottom: THREE.Color): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#' + colorTop.getHexString());
      gradient.addColorStop(1, '#' + colorBottom.getHexString());
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, 2, 512);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private createPlatform(enabled = true) {
    if (!enabled) return;

    const isNightMode = this.theme.backgroundColor === 0x0f172a; // Check if night mode (Slate-900)

    // Create clean geometric platform - Monument Valley style
    const createGeometricPlatform = () => {
      const group = new THREE.Group();

      // 1. Main Platform Surface (Top)
      // Octagonal prism for a more architectural look than a simple cylinder
      const topGeometry = new THREE.CylinderGeometry(8, 8, 0.6, 8);
      const topMaterial = new THREE.MeshStandardMaterial({
        color: isNightMode ? 0x475569 : this.theme.platformColor, // Night: Slate-600 (Brighter grey)
        roughness: isNightMode ? 0.4 : 0.1, // Night: More matte to catch light
        metalness: isNightMode ? 0.5 : 0.1, // Night: Reduced metalness to avoid darkness
        flatShading: true, // Low-poly look
        emissive: isNightMode ? 0x1e293b : 0xffffff, // Night: Subtle slate glow
        emissiveIntensity: isNightMode ? 0.25 : 0.15,
      });
      const topPlatform = new THREE.Mesh(topGeometry, topMaterial);
      topPlatform.receiveShadow = true;
      topPlatform.castShadow = true;
      group.add(topPlatform);

      // 2. Secondary Tier (Middle)
      // Slightly smaller, contrasting or same color
      const midGeometry = new THREE.CylinderGeometry(6.5, 7, 1.2, 8);
      const midMaterial = new THREE.MeshStandardMaterial({
        color: isNightMode ? 0x334155 : this.theme.platformColor, // Night: Slate-700 (Medium grey)
        roughness: isNightMode ? 0.5 : 0.4,
        metalness: isNightMode ? 0.6 : 0.1,
        flatShading: true,
        emissive: isNightMode ? 0x0f172a : this.theme.platformColor,
        emissiveIntensity: isNightMode ? 0.2 : 0.12,
      });
      const midPlatform = new THREE.Mesh(midGeometry, midMaterial);
      midPlatform.position.y = -0.9;
      midPlatform.receiveShadow = true;
      midPlatform.castShadow = true;
      group.add(midPlatform);

      // 3. Architectural Support (Bottom)
      // Inverted stepped pyramid feel
      const bottomGeometry = new THREE.CylinderGeometry(4, 6, 2.5, 8);
      const bottomMaterial = new THREE.MeshStandardMaterial({
        color: isNightMode ? 0x1e293b : this.theme.platformColor, // Night: Slate-800 (Darker base)
        roughness: isNightMode ? 0.6 : 0.5,
        metalness: isNightMode ? 0.7 : 0.2,
        flatShading: true,
        emissive: isNightMode ? 0x020617 : this.theme.platformColor,
        emissiveIntensity: isNightMode ? 0.15 : 0.1,
      });
      const bottomPlatform = new THREE.Mesh(bottomGeometry, bottomMaterial);
      bottomPlatform.position.y = -2.75;
      bottomPlatform.receiveShadow = true;
      bottomPlatform.castShadow = true;
      group.add(bottomPlatform);

      // 4. Decorative Accent Ring (Golden/Glowing)
      // Increased radius to 9.0 to be clearly outside platform
      const ringGeometry = new THREE.TorusGeometry(9.0, 0.08, 6, 8); 
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: this.theme.rimColor,
        transparent: true,
        opacity: this.theme.rimOpacity,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = Math.PI / 8; // Align with octagon
      ring.position.y = 0.3;
      // Softer breathing: reduced speed and range
      ring.userData = { isBreathing: true, baseOpacity: this.theme.rimOpacity, breathingSpeed: 0.8, breathingRange: 0.15 };
      group.add(ring);
      this.animatedElements.push(ring);

      return group;
    };

    const platformGroup = createGeometricPlatform();
    this.scene.add(platformGroup);

    // Create floating island base - detailed underside
    // Default to geometric, but will be updated by subscriber count later
    this.updateFloatingIslandBaseStyle(0); // Start with low count style
  }

  // Base style configuration thresholds
  private readonly BASE_STYLE_THRESHOLDS = {
    GEOMETRIC: 0,      // Start with geometric (Monument Valley)
    LAPUTA: 1,         // Switch to Laputa style at 1 subscriber
  };

  private currentBaseObject?: THREE.Object3D;

  /**
   * Update the floating island base style based on subscriber count
   */
  public updateFloatingIslandBaseStyle(subscriberCount: number) {
    // Determine style
    const useLaputaStyle = subscriberCount >= this.BASE_STYLE_THRESHOLDS.LAPUTA;
    const styleKey = useLaputaStyle ? 'LAPUTA' : 'GEOMETRIC';

    console.log(`🏝️ Updating island base style: ${styleKey} (Subscribers: ${subscriberCount})`);

    // Remove existing base
    if (this.currentBaseObject) {
      this.scene.remove(this.currentBaseObject);
      
      // Cleanup animated elements from old base
      this.currentBaseObject.traverse(child => {
        const idx = this.animatedElements.indexOf(child);
        if (idx > -1) {
          this.animatedElements.splice(idx, 1);
        }
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.currentBaseObject = undefined;
    }

    // Create new base
    const newBase = new THREE.Group();
    
    if (useLaputaStyle) {
      this.createLaputaBase(newBase);
    } else {
      this.createGeometricBase(newBase);
    }

    this.currentBaseObject = newBase;
    this.scene.add(newBase);
  }

  private createGeometricBase(parentGroup: THREE.Group) {
    // Geometric/Architectural base (Monument Valley style)
    
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: this.theme.platformColor,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true,
      emissive: this.theme.platformColor,
      emissiveIntensity: 0.1,
    });

    // Main inverted pyramid (large)
    const mainConeGeometry = new THREE.CylinderGeometry(0.5, 5, 8, 6);
    const mainCone = new THREE.Mesh(mainConeGeometry, baseMaterial);
    mainCone.position.y = -6.5; 
    mainCone.receiveShadow = true;
    parentGroup.add(mainCone);

    // Secondary floating geometric elements (crystals/satellite prisms)
    const satelliteCount = 5;
    for(let i=0; i<satelliteCount; i++) {
      const angle = (i / satelliteCount) * Math.PI * 2;
      const radius = 4 + Math.random() * 2;
      const y = -4 - Math.random() * 3;
      
      // Triangular Prism
      const prismGeo = new THREE.CylinderGeometry(0.4, 0, 1.5, 3);
      const prism = new THREE.Mesh(prismGeo, baseMaterial);
      prism.position.set(Math.cos(angle)*radius, y, Math.sin(angle)*radius);
      prism.rotation.x = Math.random() * 0.5;
      prism.rotation.z = Math.random() * 0.5;
      prism.rotation.y = angle;
      
      parentGroup.add(prism);
      this.animatedElements.push(prism); // Rotate them slowly
    }

    // Add a large glowing crystal at the very bottom tip
    const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: this.theme.rimColor,
      emissive: this.theme.rimColor,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.9
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = -11;
    parentGroup.add(crystal);
    this.animatedElements.push(crystal);
    
    // Add subtle energy rings around the crystal
    const ringGeo = new THREE.TorusGeometry(2, 0.05, 4, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.theme.rimColor,
      transparent: true,
      opacity: 0.3
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -11;
    ring.rotation.x = Math.PI/2;
    ring.userData = { isBreathing: true, baseOpacity: 0.3, breathingSpeed: 2.0, breathingRange: 0.2 };
    parentGroup.add(ring);
    this.animatedElements.push(ring);

    // --- Cyber Accents ---
    const cyberColor = 0x00ffff; // Cyan
    const cyberColor2 = 0xff00ff; // Magenta

    // 1. Glowing circuit lines on the main cone
    const coneEdges = new THREE.EdgesGeometry(mainConeGeometry);
    const coneLineMat = new THREE.LineBasicMaterial({ color: cyberColor, transparent: true, opacity: 0.4 });
    const coneLines = new THREE.LineSegments(coneEdges, coneLineMat);
    coneLines.position.copy(mainCone.position);
    parentGroup.add(coneLines);

    // 2. Vertical Laser/Data Streams
    const streamCount = 4;
    for(let i=0; i<streamCount; i++) {
       const height = 15;
       const geo = new THREE.CylinderGeometry(0.05, 0.05, height, 8);
       const mat = new THREE.MeshBasicMaterial({
           color: cyberColor,
           transparent: true,
           opacity: 0.3,
           blending: THREE.AdditiveBlending
       });
       const beam = new THREE.Mesh(geo, mat);
       const angle = (i / streamCount) * Math.PI * 2;
       const r = 6;
       beam.position.set(Math.cos(angle)*r, -4, Math.sin(angle)*r);
       parentGroup.add(beam);
       this.animatedElements.push(beam);
       
       // Add pulse effect to beam (via update loop if possible, or simple visual here)
    }

    // 3. Floating Cyber Rings (Multiple flat rings around the bottom base)
    const ringCount = 4;
    for(let i=0; i<ringCount; i++) {
      // Rings getting wider as they go down
      const radius =  3 + (i * 1.5); 
      const yPos = -6 - (i * 1.1); // -8, -9.5, -11
      
      const cyberRingGeo = new THREE.TorusGeometry(radius, 0.05, 16, 100);
      // Rotate geometry to lie flat on XZ plane (ensure horizontal)
      cyberRingGeo.rotateX(Math.PI / 2);
      
      const cyberRingMat = new THREE.MeshBasicMaterial({ 
        color: cyberColor2, 
        transparent: true, 
        opacity: 0.4
      });
      
      const cyberRing = new THREE.Mesh(cyberRingGeo, cyberRingMat);
      cyberRing.position.y = yPos;
      
      // Animation params
      cyberRing.userData = { 
        isBreathing: true, 
        baseOpacity: 0.3, 
        breathingSpeed: 0.5 + (i * 0.1), // Slower breathing
        breathingRange: 0.1, // Reduced breathing range
        rotationSpeed: 0.02 * (i % 2 === 0 ? 1 : -1) // Very slow rotation, no wobble
      };
      
      parentGroup.add(cyberRing);
      this.animatedElements.push(cyberRing);
      this.parametricElements.push(cyberRing); // Use parametric loop for rotation
    }
  }

  private createGuardianStones() {
    // Create floating polygonal guardian stones - adapted to match scene style
    const stoneCount = 5;
    const orbitRadius = 28; // Increased from 18
    
    for(let i=0; i<stoneCount; i++) {
      const group = new THREE.Group();
      
      // 1. Core Stone (Match platform style - Geometric/Ethereal)
      // Using theme colors instead of dark metal for better integration
      const geometry = new THREE.IcosahedronGeometry(1.2, 0);
      const material = new THREE.MeshStandardMaterial({
        color: this.theme.platformColor, // Match platform base
        roughness: 0.3,
        metalness: 0.2,
        flatShading: true,
        transparent: true,
        opacity: 0.95
      });
      const stone = new THREE.Mesh(geometry, material);
      group.add(stone);
      
      // 2. Wireframe Cage (Subtle, matching rim color)
      const wireGeo = new THREE.WireframeGeometry(geometry);
      const wireMat = new THREE.LineBasicMaterial({
        color: this.theme.rimColor, // Match theme rim color (Gold/Blue/Orange)
        transparent: true,
        opacity: 0.25, // Much more subtle
        linewidth: 1
      });
      const wireframe = new THREE.LineSegments(wireGeo, wireMat);
      wireframe.scale.set(1.02, 1.02, 1.02); // Closer fit
      group.add(wireframe);
      
      // 3. Inner Core Glow (Soft light)
      const coreGeo = new THREE.IcosahedronGeometry(0.5, 0);
      const coreMat = new THREE.MeshBasicMaterial({
        color: this.theme.rimColor, // Match theme
        transparent: true,
        opacity: 0.8
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);
      
      // Position
      const angle = (i / stoneCount) * Math.PI * 2;
      group.position.set(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle * 3) * 2, // Wavy height
        Math.sin(angle) * orbitRadius
      );
      
      // Animation Data
      group.userData = {
        angle: angle,
        radius: orbitRadius,
        speed: 0.05 + Math.random() * 0.05, // Slower, more majestic
        bobSpeed: 0.5 + Math.random() * 0.5,
        bobHeight: 2,
        rotationSpeed: Math.random() * 0.2
      };
      
      this.scene.add(group);
      this.guardianStones.push(group);
    }
  }

  private createLaputaBase(parentGroup: THREE.Group) {
    // Laputa-inspired floating island base - Premium Geometric Version
    const isNightMode = this.theme.backgroundColor === 0x0f172a || this.theme.backgroundColor === 0x0a0a0f;

    // 1. Premium Materials - Unified with Scene Tone
    // Using theme.platformColor ensures it matches the original "Atrium" aesthetic (Clean/White in Day)
    const baseColor = isNightMode ? 0x1e293b : (this.theme.platformColor || 0xe8f4f8);
    const accentColor = isNightMode ? 0x475569 : (this.theme.platformColor || 0xe8f4f8);

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: baseColor, 
      roughness: isNightMode ? 0.6 : 0.2, // Day: Smoother/Glossier like marble/plastic
      metalness: isNightMode ? 0.3 : 0.1,
      flatShading: true,
      emissive: baseColor,
      emissiveIntensity: isNightMode ? 0.1 : 0.05,
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.4,
      metalness: isNightMode ? 0.6 : 0.3, // Slightly more metallic for accent
      flatShading: true,
      emissive: isNightMode ? 0x0f172a : accentColor,
      emissiveIntensity: isNightMode ? 0.2 : 0.15,
    });

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.theme.rimColor, // Uses theme rim color (Gold/Blue)
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    // 2. Main Architectural Body (Layered Geometric Structure)
    
    // Layer A: Main Platform Support (Inverted Octagonal Frustum)
    // Top radius 8 (matches platform), Bottom radius 5, Height 4
    const mainBodyGeo = new THREE.CylinderGeometry(8, 5, 4, 8);
    const mainBody = new THREE.Mesh(mainBodyGeo, baseMaterial);
    mainBody.position.y = -2;
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    parentGroup.add(mainBody);

    // Layer B: Secondary Core (Inverted Hexagonal Frustum)
    // Top radius 4.8, Bottom radius 2, Height 5
    const midBodyGeo = new THREE.CylinderGeometry(4.8, 2, 5, 6);
    const midBody = new THREE.Mesh(midBodyGeo, accentMaterial);
    midBody.position.y = -6.5; // Below main body
    midBody.rotation.y = Math.PI / 6; // Offset rotation
    midBody.castShadow = true;
    midBody.receiveShadow = true;
    parentGroup.add(midBody);

    // Layer C: Bottom Crystal Cluster (The power source housing)
    const bottomGeo = new THREE.DodecahedronGeometry(2.5, 0);
    const bottomMesh = new THREE.Mesh(bottomGeo, baseMaterial);
    bottomMesh.position.y = -9;
    bottomMesh.scale.set(1, 1.5, 1);
    parentGroup.add(bottomMesh);

    // 3. Floating Geometric Halos (The "Light Rings")
    const ringCount = 3;
    const baseRadius = 10;
    
    for(let i = 0; i < ringCount; i++) {
      // Create segmented geometric rings instead of perfect torus for style
      const radius = baseRadius + (i * 2.5);
      const tube = 0.05 - (i * 0.01); // Thinner as they go out
      const segments = 6 + (i * 2); // 6, 8, 10 sided rings
      
      const ringGeo = new THREE.TorusGeometry(radius, tube, 4, segments); 
      // Rotate geometry to be flat initially
      ringGeo.rotateX(Math.PI / 2);
      
      // Clone material for independent animation
      const ringMat = glowMaterial.clone();
      const ring = new THREE.Mesh(ringGeo, ringMat);
      
      // Position rings at different heights around the island
      ring.position.y = -2 - (i * 1.5);
      
      // Add animation data
      ring.userData = {
        rotationSpeed: 0.1 + (i * 0.05), // Different speeds
        rotationAxis: new THREE.Vector3(0, 1, 0), // Rotate around Y
        isBreathing: true,
        baseOpacity: 0.4 - (i * 0.1),
        breathingSpeed: 1.5 + i,
        breathingRange: 0.2
      };
      
      // Add slight tilt to outer rings
      if (i > 0) {
        ring.rotation.x = (Math.random() - 0.5) * 0.2;
        ring.rotation.z = (Math.random() - 0.5) * 0.2;
      }

      parentGroup.add(ring);
      this.animatedElements.push(ring);
      this.parametricElements.push(ring); // Enable rotation
    }

    // 4. Vertical Energy Lines (Holographic pillars)
    const lineCount = 8;
    for(let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      const r = 7.8; // Just inside the rim
      
      const lineGeo = new THREE.BoxGeometry(0.1, 3, 0.1);
      const lineMat = glowMaterial.clone();
      const line = new THREE.Mesh(lineGeo, lineMat);
      
      line.position.set(
        Math.cos(angle) * r,
        -1.5, // Center Y
        Math.sin(angle) * r
      );
      
      // Animation for lines
      line.userData = {
        isBreathing: true,
        baseOpacity: 0.4,
        breathingSpeed: 2.0,
        breathingRange: 0.15
      };
      
      parentGroup.add(line);
      this.animatedElements.push(line);
      
      // Add glowing orb at bottom of line
      const orbGeo = new THREE.OctahedronGeometry(0.2, 0);
      const orbMat = glowMaterial.clone();
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(
        Math.cos(angle) * r,
        -3,
        Math.sin(angle) * r
      );
      
      orb.userData = {
        isBreathing: true,
        baseOpacity: 0.8,
        breathingSpeed: 3.0,
        breathingRange: 0.2
      };
      
      parentGroup.add(orb);
      this.animatedElements.push(orb); 
    }

    // 5. The Central Power Crystal (Volucite) - Premium
    const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: this.theme.rimColor,
      emissive: this.theme.rimColor,
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 1.0,
      transparent: true,
      opacity: 0.9,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = -9;
    
    // Inner light
    const pointLight = new THREE.PointLight(this.theme.rimColor, 1.0, 15);
    pointLight.position.y = -9;
    parentGroup.add(pointLight);
    this.animatedElements.push(pointLight); // Pulsing light

    parentGroup.add(crystal);
    this.animatedElements.push(crystal); // Rotation

    // 6. Floating Debris / Satellite Rocks (Geometric)
    const debrisCount = 6;
    const debrisGeo = new THREE.DodecahedronGeometry(0.6, 0); // Low poly rocks
    
    for(let i = 0; i < debrisCount; i++) {
      const angle = (i / debrisCount) * Math.PI * 2 + (Math.random() * 0.5);
      const r = 6 + Math.random() * 4;
      const y = -5 - Math.random() * 5;
      
      const debris = new THREE.Mesh(debrisGeo, baseMaterial);
      debris.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      debris.scale.setScalar(0.5 + Math.random() * 0.8);
      
      // Random rotation
      debris.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
      
      parentGroup.add(debris);
      
      // Animate orbit? (Maybe simple rotation in update loop if parentGroup rotates, but let's just make them static relative to base for now, or add to animatedElements for local rotation)
      this.animatedElements.push(debris); // Will use standard mesh rotation from update()
    }
  }

  private createFloatingIslandBase_DEPRECATED() {
    // Deprecated - logic moved to createGeometricBase / createLaputaBase
    // Kept empty to satisfy interface if needed, or remove
  }

  private createWaterSurface() {
    // Create organic lake shape with curved edges
    const isNightMode = this.theme.backgroundColor === 0x0f172a || this.theme.backgroundColor === 0x0a0a0f;
    // More vibrant blue colors
    const waterColor = isNightMode ? 0x0ea5e9 : 0x6688aa; // Night: Cyan/Blue glow, Day: Steel Blue
    
    // Create organic shape using bezier curves
    const lakeShape = new THREE.Shape();
    const scale = 40; // Overall size
    
    // Start point
    lakeShape.moveTo(scale, 0);
    
    // Create organic lake outline with bezier curves
    lakeShape.bezierCurveTo(
      scale, scale * 0.8,
      scale * 0.8, scale * 1.2,
      0, scale
    );
    lakeShape.bezierCurveTo(
      -scale * 0.7, scale * 1.1,
      -scale * 1.1, scale * 0.6,
      -scale, 0
    );
    lakeShape.bezierCurveTo(
      -scale * 1.05, -scale * 0.7,
      -scale * 0.6, -scale * 1.1,
      0, -scale
    );
    lakeShape.bezierCurveTo(
      scale * 0.7, -scale * 0.9,
      scale * 0.9, -scale * 0.5,
      scale, 0
    );
    
    // Create geometry from shape with segments for wave animation
    const waterGeometry = new THREE.ShapeGeometry(lakeShape, 30);
    
    const waterMaterial = new THREE.MeshPhongMaterial({
      color: waterColor,
      transparent: true,
      opacity: 0.85,
      emissive: waterColor,
      emissiveIntensity: 0.2, // Lower emission for lighter feel
      specular: 0x1166aa, // Blue specular highlights
      shininess: 100,
      side: THREE.DoubleSide,
      reflectivity: 0.5,
    });
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2; // Make horizontal
    water.position.y = -20;
    water.receiveShadow = true;
    
    // Add subtle wave effect to vertices
    const positionAttr = waterGeometry.getAttribute('position');
    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const wave = Math.sin(x * 0.15) * Math.cos(y * 0.15) * 0.2;
      positionAttr.setZ(i, wave);
    }
    waterGeometry.computeVertexNormals();
    
    this.waterSurface = water;
    this.scene.add(water);
    
    // Add very subtle rim/foam effect around the island (circular)
    const foamRadius = 12;
    const foamGeometry = new THREE.RingGeometry(foamRadius - 0.3, foamRadius + 0.3, 48);
    const foamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: isNightMode ? 0.08 : 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    
    const foam = new THREE.Mesh(foamGeometry, foamMaterial);
    foam.rotation.x = -Math.PI / 2;
    foam.position.y = -9.9;
    foam.renderOrder = 3;
    this.scene.add(foam);
  }

  private createAbstractGrid(enabled = true) {
    if (!enabled) return;

    const gridSize = 30;
    const gridDivisions = 30;

    // Main grid with theme colors
    this.gridHelper = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      this.theme.gridColor1,
      this.theme.gridColor2
    );
    this.gridHelper.position.y = 0;
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = this.theme.gridOpacity;
    this.scene.add(this.gridHelper);

    // Add horizontal grid planes at different heights for 3D depth
    const gridPlanes = [
      { y: -2, opacity: this.theme.gridOpacity * 0.4 },
      { y: 5, opacity: this.theme.gridOpacity * 0.2 },
      { y: 10, opacity: this.theme.gridOpacity * 0.1 },
    ];

    gridPlanes.forEach(({ y, opacity }) => {
      const gridHelper = new THREE.GridHelper(
        gridSize * 1.5,
        gridDivisions,
        this.theme.gridColor1,
        this.theme.gridColor2
      );
      gridHelper.position.y = y;
      (gridHelper.material as THREE.Material).transparent = true;
      (gridHelper.material as THREE.Material).opacity = opacity;
      this.scene.add(gridHelper);
    });
  }

  private createFloatingIslands() {
    // Create 4 small floating architectural fragments (Monument Valley style)
    // Update logic to detect night mode based on new background color (0x0f172a) or old one (0x0a0a0f)
    const isNightMode = this.theme.backgroundColor === 0x0f172a || this.theme.backgroundColor === 0x0a0a0f;
    const islandCount = 4;
    
    const islandConfigs = [
      { distance: 22, angle: 0.3, height: -1, scale: 1.2 },
      { distance: 25, angle: 2.0, height: -4, scale: 1.0 },
      { distance: 26, angle: 3.8, height: -2, scale: 1.5 },
      { distance: 24, angle: 5.2, height: -3, scale: 1.1 },
    ];

    // Helper: Create a simple staircase
    const createStairs = (steps: number, width: number, height: number, depth: number, color: number) => {
      const geometry = new THREE.BoxGeometry(width, height / steps, depth);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.4,
        metalness: 0.1,
        flatShading: true,
      });
      
      const group = new THREE.Group();
      for (let i = 0; i < steps; i++) {
        const step = new THREE.Mesh(geometry, material);
        step.position.y = i * (height / steps);
        step.position.z = i * (depth * 0.8); // Overlap slightly
        step.castShadow = true;
        step.receiveShadow = true;
        group.add(step);
      }
      return group;
    };

    // Helper: Create a simple tower
    const createTower = (height: number, width: number, color: number) => {
      const geometry = new THREE.CylinderGeometry(width, width, height, 6); // Hexagonal tower
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.4,
        metalness: 0.1,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    islandConfigs.forEach((config, index) => {
      const islandGroup = new THREE.Group();
      // Day: Warm Beige / Orange | Night: Cool Slate / Blue
      const baseColor = isNightMode ? 0x1e293b : 0xe8dcc8; // Night: Slate-800, Day: Beige
      const accentColor = isNightMode ? 0x38bdf8 : 0xff8844; // Night: Sky-400, Day: Orange

      // 1. Base Platform (Inverted Pyramid)
      const baseGeo = new THREE.CylinderGeometry(config.scale * 2, 0.2, config.scale * 3, 5);
      const baseMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: isNightMode ? 0.4 : 0.6, // Night: smoother, Day: matte stone
        metalness: isNightMode ? 0.6 : 0.1, // Night: metallic, Day: stone
        flatShading: true,
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = -config.scale * 1.5;
      islandGroup.add(base);

      // 2. Top Architecture (Varied per island)
      if (index % 2 === 0) {
        // Type A: Stairs leading to nowhere
        const stairs = createStairs(5, config.scale, config.scale * 1.5, config.scale * 0.4, baseColor);
        stairs.position.y = 0.1;
        stairs.position.x = -config.scale * 0.5;
        islandGroup.add(stairs);

        // Add an arch or pillar
        const pillar = createTower(config.scale * 2, config.scale * 0.3, accentColor);
        pillar.position.x = config.scale * 0.8;
        pillar.position.y = config.scale;
        islandGroup.add(pillar);
      } else {
        // Type B: Twin Towers
        const t1 = createTower(config.scale * 2.5, config.scale * 0.4, baseColor);
        t1.position.x = -config.scale * 0.5;
        t1.position.y = config.scale * 1.25;
        islandGroup.add(t1);

        const t2 = createTower(config.scale * 1.5, config.scale * 0.3, baseColor);
        t2.position.x = config.scale * 0.5;
        t2.position.y = config.scale * 0.75;
        islandGroup.add(t2);
      }
      
      // Position island
      const x = Math.cos(config.angle) * config.distance;
      const z = Math.sin(config.angle) * config.distance;
      islandGroup.position.set(x, config.height, z);
      
      // Look at center but keep upright
      islandGroup.lookAt(0, config.height, 0);
      
      this.scene.add(islandGroup);
      this.animatedElements.push(islandGroup);
    });
  }

  private createCentralLightBeam() {
    // Create central light column from stage
    const isNightMode = this.theme.backgroundColor === 0x0a0a0f;
    
    const beamGeometry = new THREE.CylinderGeometry(1.5, 2.5, 30, 32, 1, true);
    const beamMaterial = new THREE.MeshBasicMaterial({
      // Day: Warm Peach | Night: Cool Blue
      color: isNightMode ? 0x6688ff : 0xffd4a3,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.y = 15; // Start from above stage
    beam.renderOrder = 1;
    
    this.lightBeam = beam;
    this.scene.add(beam);
    this.animatedElements.push(beam);
  }

  private createHolographicScreen() {
    // Create curved holographic screen around the stage perimeter
    // Update logic: use the new night background color
    const isNightMode = this.theme.backgroundColor === 0x0f172a || this.theme.backgroundColor === 0x0a0a0f;
    const screenGroup = new THREE.Group();
    
    // Curved screen parameters
    const screenRadius = 14; // Distance from stage center
    const screenHeight = 6;
    const screenArcAngle = Math.PI * 0.8; // 144 degrees arc
    const screenSegments = 48; // Smooth curve
    
    // Create curved screen - face backward (toward -Z)
    const screenGeometry = new THREE.CylinderGeometry(
      screenRadius, // top radius
      screenRadius, // bottom radius
      screenHeight, // height
      screenSegments, // radial segments (smoothness)
      1, // height segments
      true, // open ended
      Math.PI - screenArcAngle / 2, // start angle (centered at back)
      screenArcAngle // arc angle
    );
    
    const screenMaterial = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x1a2040 : 0xf0f8ff,
      transparent: true,
      opacity: 0.12,
      roughness: 0.1,
      metalness: 0.9,
      emissive: isNightMode ? 0x2244aa : 0xffaa66, // Day: Warm Orange Glow
      emissiveIntensity: 0.15,
      side: THREE.DoubleSide,
    });
    
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.name = 'videoScreen'; // Name for easy reference when adding video
    screenGroup.add(screen);
    
    // Glowing frame elements
    const frameColor = isNightMode ? 0x4488ff : 0xff8844; // Day: Orange Frame
    const frameMaterial = new THREE.LineBasicMaterial({
      color: frameColor,
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    });
    
    // Create frame lines matching the cylinder geometry
    const frameSegments = 50;
    const startAngle = Math.PI - screenArcAngle / 2;
    const endAngle = Math.PI + screenArcAngle / 2;
    
    // Top arc frame
    const topArcPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= frameSegments; i++) {
      const t = i / frameSegments;
      const angle = startAngle + t * screenArcAngle;
      const x = Math.sin(angle) * screenRadius;
      const z = Math.cos(angle) * screenRadius;
      const y = screenHeight / 2;
      topArcPoints.push(new THREE.Vector3(x, y, z));
    }
    const topArc = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(topArcPoints),
      frameMaterial
    );
    screenGroup.add(topArc);
    this.animatedElements.push(topArc);
    
    // Bottom arc frame
    const bottomArcPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= frameSegments; i++) {
      const t = i / frameSegments;
      const angle = startAngle + t * screenArcAngle;
      const x = Math.sin(angle) * screenRadius;
      const z = Math.cos(angle) * screenRadius;
      const y = -screenHeight / 2;
      bottomArcPoints.push(new THREE.Vector3(x, y, z));
    }
    const bottomArc = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(bottomArcPoints),
      frameMaterial.clone()
    );
    screenGroup.add(bottomArc);
    this.animatedElements.push(bottomArc);
    
    // Vertical side frames
    const leftX = Math.sin(startAngle) * screenRadius;
    const leftZ = Math.cos(startAngle) * screenRadius;
    const leftFrame = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(leftX, -screenHeight / 2, leftZ),
        new THREE.Vector3(leftX, screenHeight / 2, leftZ),
      ]),
      frameMaterial.clone()
    );
    screenGroup.add(leftFrame);
    
    const rightX = Math.sin(endAngle) * screenRadius;
    const rightZ = Math.cos(endAngle) * screenRadius;
    const rightFrame = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(rightX, -screenHeight / 2, rightZ),
        new THREE.Vector3(rightX, screenHeight / 2, rightZ),
      ]),
      frameMaterial.clone()
    );
    screenGroup.add(rightFrame);
    
    // Corner accent lights
    const cornerSize = 0.25;
    const cornerGeometry = new THREE.OctahedronGeometry(cornerSize, 0);
    const cornerMaterial = new THREE.MeshBasicMaterial({
      color: frameColor,
      transparent: true,
      opacity: 0.8,
    });
    
    const corners = [
      { angle: startAngle, y: screenHeight / 2 },
      { angle: endAngle, y: screenHeight / 2 },
      { angle: startAngle, y: -screenHeight / 2 },
      { angle: endAngle, y: -screenHeight / 2 },
    ];
    
    corners.forEach(pos => {
      const corner = new THREE.Mesh(cornerGeometry, cornerMaterial.clone());
      corner.position.x = Math.sin(pos.angle) * screenRadius;
      corner.position.y = pos.y;
      corner.position.z = Math.cos(pos.angle) * screenRadius;
      screenGroup.add(corner);
      this.animatedElements.push(corner);
    });
    
    // Outer glow effect
    const glowGeometry = new THREE.CylinderGeometry(
      screenRadius * 1.05,
      screenRadius * 1.05,
      screenHeight * 1.1,
      screenSegments,
      1,
      true,
      Math.PI - screenArcAngle / 2,
      screenArcAngle
    );
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: frameColor,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    screenGroup.add(glow);
    this.animatedElements.push(glow);
    
    // Position the screen group
    screenGroup.position.set(0, 3.5, 0);
    
    this.holographicScreen = screenGroup;
    this.scene.add(screenGroup);
    this.animatedElements.push(screenGroup);
  }

  private createFloatingOrbs() {
    // Create 5-8 floating light orbs
    const isNightMode = this.theme.backgroundColor === 0x0a0a0f;
    const orbCount = 7;
    
    for (let i = 0; i < orbCount; i++) {
      const orbGroup = new THREE.Group();
      
      // Orb sphere
      const orbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const orbMaterial = new THREE.MeshBasicMaterial({
        color: isNightMode ? 
          [0x88aaff, 0xaa88ff, 0x88ffaa][i % 3] : 
          [0xffd4a3, 0xffb88c, 0xff8844][i % 3], // Day: Warm array
        transparent: true,
        opacity: 0.6,
      });
      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      orbGroup.add(orb);
      
      // Soft glow around orb
      const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: isNightMode ? 0x6688ff : 0xffd4a3,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      orbGroup.add(glow);
      
      // Random position around stage
      const angle = (i / orbCount) * Math.PI * 2;
      const radius = 8 + Math.random() * 12;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.random() * 10 - 5;
      
      orbGroup.position.set(x, y, z);
      
      // Store for animation
      (orbGroup as any).floatSpeed = 0.3 + Math.random() * 0.4;
      (orbGroup as any).floatOffset = Math.random() * Math.PI * 2;
      
      this.floatingOrbs.push(orb);
      this.scene.add(orbGroup);
      this.animatedElements.push(orbGroup);
    }
  }

  private createParametricElements(enabled = true) {
    if (!enabled) return;

    // Parametric wireframe orbits - moved higher to avoid blocking view
    const createOrbit = (radius: number, segments: number, tilt: number, rotationSpeed: number, opacity: number = 0.3, yPos: number = 8) => {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.3;
        const z = Math.sin(angle) * radius;
        points.push(new THREE.Vector3(x, y, z));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: this.theme.rimColor,
        transparent: true,
        opacity: opacity,
        linewidth: 2,
      });

      const orbit = new THREE.Line(geometry, material);
      orbit.rotation.x = tilt;
      orbit.rotation.z = Math.random() * Math.PI * 2;
      orbit.position.y = yPos; // Moved higher
      orbit.userData.rotationSpeed = rotationSpeed;
      
      this.scene.add(orbit);
      this.parametricElements.push(orbit);
    };

    // Create orbits higher up to avoid blocking stage-screen view
    createOrbit(2.5, 64, Math.PI / 6, 0.2, 0.25, 12);
    createOrbit(3, 48, Math.PI / 4, -0.15, 0.2, 13);
    createOrbit(3.5, 56, Math.PI / 8, 0.25, 0.18, 14);

    // Vertical parametric pillars - moved behind the screen
    const pillarCount = 6; // Reduced count
    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const radius = 16; // Behind the screen (screen is at 14)
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Main pillar - taller and more subtle
      const pillarGeometry = new THREE.CylinderGeometry(0.02, 0.02, 12, 12);
      const pillarMaterial = new THREE.MeshStandardMaterial({
        color: this.theme.rimColor,
        transparent: true,
        opacity: 0.15, // More transparent
        emissive: this.theme.rimColor,
        emissiveIntensity: 0.2,
        roughness: 0.3,
        metalness: 0.7,
      });

      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(x, 6, z);
      pillar.castShadow = false; // Disable shadow for cleaner look
      this.scene.add(pillar);
      this.parametricElements.push(pillar);

      // Add subtle glowing node at top
      const nodeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
      const nodeMaterial = new THREE.MeshStandardMaterial({
        color: this.theme.rimColor,
        transparent: true,
        opacity: 0.5, // More subtle
        emissive: this.theme.rimColor,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8,
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(x, 12, z);
      this.scene.add(node);
      this.animatedElements.push(node);
      
      // Add subtle point light at node
      const pointLight = new THREE.PointLight(this.theme.rimColor, 0.2, 4);
      pointLight.position.set(x, 12, z);
      this.scene.add(pointLight);
      this.animatedElements.push(pointLight);
    }

    // Parametric floor pattern
    const createFloorPattern = () => {
      const points = [];
      const segments = 12;
      const innerRadius = 2;
      const outerRadius = 7.5;

      for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        points.push(
          new THREE.Vector3(Math.cos(angle1) * innerRadius, 0.02, Math.sin(angle1) * innerRadius),
          new THREE.Vector3(Math.cos(angle1) * outerRadius, 0.02, Math.sin(angle1) * outerRadius)
        );
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: this.theme.rimColor,
        transparent: true,
        opacity: 0.2,
      });

      const pattern = new THREE.LineSegments(geometry, material);
      this.scene.add(pattern);
      this.parametricElements.push(pattern);
    };

    createFloorPattern();
  }

  // Initialize seat positions without creating visual objects
  // Positions audience members in front of the stage, facing center
  private initializeAudienceSeatPositions() {
    const totalSeats = 100;
    const minRadius = 15;  // Increased from 10 to 15
    const maxRadius = 22;  // Increased from 18 to 22
    const minHeight = 0.5;
    const maxHeight = 2.0;
    
    // Screen is at the BACK (around π ≈ 180°, from ~108° to 252°)
    // Define audience viewing area - in front of the screen, looking at stage
    // Corrected for Z-axis visual mirroring: To match the visual "Red Zone" (Z > 0),
    // we need angles 30° to 150° (sin > 0)
    const frontArcStart = Math.PI / 6;      // 30 degrees
    const frontArcEnd = Math.PI * 5/6;      // 150 degrees
    
    // Use seeded random for consistent positions
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < totalSeats; i++) {
      // Generate angle in specified arc (210° to 330°)
      const angleRange = frontArcEnd - frontArcStart;
      
      let angle = frontArcStart + seededRandom(i * 7 + 1) * angleRange;
      
      const variation = (seededRandom(i * 11 + 3) - 0.5) * 0.1; 
      angle += variation;
      
      // Strict clamping to ensure models stay inside
      const buffer = 0.05;
      angle = Math.max(frontArcStart + buffer, Math.min(frontArcEnd - buffer, angle));
      
      const radiusRandom = seededRandom(i * 13 + 2);
      const radiusBuffer = 0.5;
      let radius = minRadius + Math.pow(radiusRandom, 1.8) * (maxRadius - minRadius);
      radius = Math.max(minRadius + radiusBuffer, Math.min(maxRadius - radiusBuffer, radius));
      
      const height = minHeight + seededRandom(i * 17 + 3) * (maxHeight - minHeight);
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const seatPosition: AudienceSeatPosition = {
        position: new THREE.Vector3(x, height, z),
        rotation: Math.atan2(-x, -z),
        index: i,
      };
      this.audienceSeatPositions.push(seatPosition);
    }
    
    // Shuffle for natural fill order
    for (let i = this.audienceSeatPositions.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(i * 23 + 5) * (i + 1));
      [this.audienceSeatPositions[i], this.audienceSeatPositions[j]] = 
        [this.audienceSeatPositions[j], this.audienceSeatPositions[i]];
      this.audienceSeatPositions[i].index = i;
      this.audienceSeatPositions[j].index = j;
    }
  }

  // Add a single audience seat at the specified index
  addAudienceSeat(seatIndex: number): boolean {
    if (seatIndex < 0 || seatIndex >= this.audienceSeatPositions.length) {
      return false;
    }
    
    if (this.audienceSeatObjects.has(seatIndex)) {
      return false; // Seat already exists
    }

    const seatPos = this.audienceSeatPositions[seatIndex];
    const objects: THREE.Object3D[] = [];

    // Calculate base height from position
    const baseHeight = seatPos.position.y - 0.2;

    // Create seat platform
    const seatGeometry = new THREE.CylinderGeometry(0.6, 0.5, 0.2, 16);
    const seatMaterial = new THREE.MeshStandardMaterial({
      color: this.theme.platformColor,
      roughness: this.theme.platformRoughness + 0.1,
      metalness: this.theme.platformMetalness,
      transparent: true,
      opacity: 0.7,
    });

    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.copy(seatPos.position).sub(new THREE.Vector3(0, 0.2, 0));
    seat.castShadow = true;
    seat.receiveShadow = true;
    this.scene.add(seat);
    objects.push(seat);

    // Add rim glow
    const rimGeometry = new THREE.TorusGeometry(0.62, 0.02, 8, 32);
    const rimMaterial = new THREE.MeshBasicMaterial({
      color: this.theme.rimColor,
      transparent: true,
      opacity: 0.3,
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.copy(seatPos.position).sub(new THREE.Vector3(0, 0.1, 0));
    rim.rotation.x = Math.PI / 2;
    this.scene.add(rim);
    this.animatedElements.push(rim);
    objects.push(rim);

    // Add spotlight
    const spotLight = new THREE.SpotLight(this.theme.rimColor, 0.2, 5, Math.PI / 6, 0.5, 2);
    spotLight.position.set(seatPos.position.x, baseHeight + 3, seatPos.position.z);
    spotLight.target.position.copy(seatPos.position).sub(new THREE.Vector3(0, 0.2, 0));
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);
    this.animatedElements.push(spotLight);
    objects.push(spotLight, spotLight.target);

    this.audienceSeatObjects.set(seatIndex, objects);
    return true;
  }

  // Remove a single audience seat
  removeAudienceSeat(seatIndex: number): boolean {
    const objects = this.audienceSeatObjects.get(seatIndex);
    if (!objects) return false;

    objects.forEach(obj => {
      this.scene.remove(obj);
      
      // Remove from animated elements
      const animIndex = this.animatedElements.indexOf(obj);
      if (animIndex > -1) {
        this.animatedElements.splice(animIndex, 1);
      }

      // Dispose geometry and material
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });

    this.audienceSeatObjects.delete(seatIndex);
    return true;
  }

  // Update audience seats to match a specific count
  // Performance optimization: limits display to maxDisplay, randomly sampling if needed
  updateAudienceSeats(subscriberCount: number, maxDisplay: number = 10) {
    const maxSeats = this.audienceSeatPositions.length;
    
    // Determine how many seats to show
    const actualSubscribers = Math.min(subscriberCount, maxSeats);
    const seatsToShow = Math.min(actualSubscribers, maxDisplay);
    
    // If we need to limit display, randomly sample seat indices
    let targetIndices: Set<number>;
    
    if (actualSubscribers <= maxDisplay) {
      // Show all subscribers
      targetIndices = new Set(Array.from({ length: actualSubscribers }, (_, i) => i));
    } else {
      // Random sampling: pick maxDisplay seats from actualSubscribers
      targetIndices = new Set();
      const availableIndices = Array.from({ length: actualSubscribers }, (_, i) => i);
      
      // Fisher-Yates shuffle to get random sample
      for (let i = 0; i < seatsToShow; i++) {
        const randomIndex = Math.floor(Math.random() * (availableIndices.length - i)) + i;
        [availableIndices[i], availableIndices[randomIndex]] = 
          [availableIndices[randomIndex], availableIndices[i]];
        targetIndices.add(availableIndices[i]);
      }
    }
    
    // Add seats that should be shown
    targetIndices.forEach(index => {
      if (!this.audienceSeatObjects.has(index)) {
        this.addAudienceSeat(index);
      }
    });
    
    // Remove seats that shouldn't be shown
    const currentSeats = Array.from(this.audienceSeatObjects.keys());
    currentSeats.forEach(index => {
      if (!targetIndices.has(index)) {
        this.removeAudienceSeat(index);
      }
    });
  }

  // Clear all audience seats
  clearAudienceSeats() {
    const seatIndices = Array.from(this.audienceSeatObjects.keys());
    seatIndices.forEach(index => this.removeAudienceSeat(index));
  }

  // Get available audience seat positions for placing 3D models
  getAudienceSeatPositions(): AudienceSeatPosition[] {
    return this.audienceSeatPositions;
  }

  private createStageSpotlights(enabled = true) {
    if (!enabled) return;

    // Stage lights using theme colors
    const spotlightConfigs = [
      // Main light
      { x: 0, y: 15, z: 8, color: this.theme.mainLightColor, intensity: this.theme.mainLightIntensity, angle: Math.PI / 6 },
      // Side lights
      { x: -10, y: 12, z: 3, color: this.theme.sideLightColor, intensity: this.theme.sideLightIntensity, angle: Math.PI / 5 },
      { x: 10, y: 12, z: 3, color: this.theme.sideLightColor, intensity: this.theme.sideLightIntensity, angle: Math.PI / 5 },
      // Back lights
      { x: -5, y: 10, z: -8, color: this.theme.backLightColor, intensity: this.theme.backLightIntensity, angle: Math.PI / 6 },
      { x: 5, y: 10, z: -8, color: this.theme.backLightColor, intensity: this.theme.backLightIntensity, angle: Math.PI / 6 },
    ];

    spotlightConfigs.forEach((config) => {
      const spotlight = new THREE.SpotLight(config.color, config.intensity);
      spotlight.position.set(config.x, config.y, config.z);
      spotlight.angle = config.angle;
      spotlight.penumbra = 0.7; // Softer edges
      spotlight.decay = 1.2;
      spotlight.distance = 30;
      spotlight.castShadow = true;
      
      // Soft natural shadows
      spotlight.shadow.mapSize.width = 2048;
      spotlight.shadow.mapSize.height = 2048;
      spotlight.shadow.camera.near = 1;
      spotlight.shadow.camera.far = 25;
      spotlight.shadow.bias = -0.0001;

      // Point toward center stage
      const target = new THREE.Object3D();
      target.position.set(0, 1, 0);
      this.scene.add(target);
      spotlight.target = target;

      this.scene.add(spotlight);
      this.spotlights.push(spotlight);

      // Add subtle light beam visualization (daytime rays)
      this.createLightBeam(spotlight, config.color);
    });
  }

  private createLightBeam(spotlight: THREE.SpotLight, color: number) {
    // Subtle light rays - like sun beams through windows
    const beamGeometry = new THREE.ConeGeometry(0.1, 3, 16, 1, true);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.02,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.copy(spotlight.position);
    beam.position.y -= 1.5;
    beam.rotation.x = Math.PI;
    this.scene.add(beam);
    this.animatedElements.push(beam);
  }

  private createAmbientParticles(enabled = true) {
    if (!enabled) return;

    // Reduce particle count to make it sparser as requested
    const particleCount = Math.floor(this.theme.particleCount * 0.3); 
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Distribute particles in a wider area and higher up
      const radius = 15 + Math.random() * 20; // Widen radius (was 10+12)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.random() * 15 + 5; // Lift up (was 0.5 to 10.5)
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Use theme colors
      const colorChoice = Math.floor(Math.random() * this.theme.particleColors.length);
      const [r, g, b] = this.theme.particleColors[colorChoice];
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;

      // Larger, more varied sizes for better color visibility
      sizes[i] = Math.random() * 0.25 + 0.08;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: this.theme.particleOpacity,
      blending: this.theme.particleBlending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    this.ambientParticles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.ambientParticles);
  }

  update(deltaTime: number) {
    const time = Date.now() * 0.001;

    // Particle movement
    if (this.ambientParticles) {
      const positions = this.ambientParticles.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(time * 0.3 + i * 0.1) * deltaTime * 0.02;
        positions[i + 1] += Math.cos(time * 0.2 + i * 0.12) * deltaTime * 0.025;
        positions[i + 2] += Math.sin(time * 0.25 + i * 0.11) * deltaTime * 0.02;
      }
      
      this.ambientParticles.geometry.attributes.position.needsUpdate = true;
      this.ambientParticles.rotation.y += deltaTime * 0.015;
    }

    // Weather particles movement (rain, snow, etc.)
    if (this.weatherParticles && this.weatherParticles.geometry.attributes.velocity) {
      const positions = this.weatherParticles.geometry.attributes.position.array as Float32Array;
      const velocities = this.weatherParticles.geometry.attributes.velocity.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Apply velocity
        positions[i] += velocities[i] * deltaTime;
        positions[i + 1] += velocities[i + 1] * deltaTime;
        positions[i + 2] += velocities[i + 2] * deltaTime;
        
        // Reset particles that fall below ground
        if (positions[i + 1] < -5) {
          positions[i + 1] = 30 + Math.random() * 10;
          positions[i] = (Math.random() - 0.5) * 60;
          positions[i + 2] = (Math.random() - 0.5) * 60;
        }
      }
      
      this.weatherParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Water surface wave animation - handled by water manager
    if (this.waterManager) {
      this.waterManager.update(deltaTime);
    }

    // Dynamic light variation
    this.spotlights.forEach((spotlight, index) => {
      const offset = index * 0.5;
      const baseIntensity = index === 0 ? this.theme.mainLightIntensity : 
                           (index <= 2 ? this.theme.sideLightIntensity : this.theme.backLightIntensity);
      spotlight.intensity = baseIntensity + Math.sin(time * 0.5 + offset) * (baseIntensity * 0.15);
    });

    // Animated platform elements
    this.animatedElements.forEach((element, index) => {
      if (element instanceof THREE.Mesh) {
        // Handle dedicated breathing effect
        if (element.userData.isBreathing && element.material instanceof THREE.MeshBasicMaterial) {
           const baseOpacity = element.userData.baseOpacity || 0.5;
           const speed = element.userData.breathingSpeed || 1.0;
           const range = element.userData.breathingRange || 0.3;
           // Breathing sine wave
           element.material.opacity = baseOpacity + Math.sin(time * speed + index * 0.5) * range;
           return; // Skip default animation
        }

        if (element.material instanceof THREE.MeshBasicMaterial) {
          const baseOpacity = this.theme.rimOpacity;
          element.material.opacity = baseOpacity + Math.sin(time * 1.2 + index * 0.5) * (baseOpacity * 0.4);
        } else if (element.material instanceof THREE.MeshStandardMaterial) {
          // Animate emissive intensity for glowing elements (crystals)
          if (element.material.emissiveIntensity !== undefined) {
            const baseEmissive = 0.6;
            element.material.emissiveIntensity = baseEmissive + Math.sin(time * 1.5 + index * 0.3) * 0.3;
            
            // Slowly rotate crystals
            element.rotation.y += deltaTime * 0.3;
            element.rotation.x += deltaTime * 0.2;
          }
        }
      } else if (element instanceof THREE.PointLight) {
        // Animate point light intensity
        const baseIntensity = 0.3;
        element.intensity = baseIntensity + Math.sin(time * 1.8 + index * 0.4) * 0.2;
      }
    });

    // Grid breathing effect
    if (this.gridHelper && this.gridHelper.material) {
      (this.gridHelper.material as THREE.Material).opacity = 
        this.theme.gridOpacity + Math.sin(time * 0.4) * (this.theme.gridOpacity * 0.15);
    }

    // Parametric orbits rotation (affected by cloudSpeed)
    const cloudSpeedMultiplier = this.currentWeatherParams?.cloudSpeed ?? 1.0;
    this.parametricElements.forEach((element) => {
      if (element.userData.rotationSpeed !== undefined) {
        const adjustedSpeed = element.userData.rotationSpeed * (cloudSpeedMultiplier / 2.5); // cloudSpeed normal range 0-5
        element.rotation.y += deltaTime * adjustedSpeed;
      }
    });

    // Holographic screen animation
    if (this.holographicScreen) {
      // Gentle floating motion
      this.holographicScreen.position.y = 3.5 + Math.sin(time * 0.4) * 0.12;
      
      // Animate screen elements
      this.holographicScreen.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          // Corner crystals rotation
          if (child.geometry instanceof THREE.OctahedronGeometry) {
            child.rotation.y += deltaTime * 0.5;
            child.rotation.x += deltaTime * 0.3;
          }
          // Outer glow pulsing
          else if (child.geometry instanceof THREE.CylinderGeometry && child.material instanceof THREE.MeshBasicMaterial) {
            child.material.opacity = 0.05 + Math.sin(time * 1.2) * 0.03;
          }
        }
        // Frame lines pulsing
        else if (child instanceof THREE.Line && child.material instanceof THREE.LineBasicMaterial) {
          child.material.opacity = 0.6 + Math.sin(time * 1.5 + index * 0.5) * 0.2;
        }
      });
    }

    // Floating islands slow rotation (affected by windSpeed)
    const windSpeedMultiplier = (this.currentWeatherParams?.windSpeed ?? 1.0) / 5; // Normalize to 0-2
    this.animatedElements.forEach((element) => {
      if (element instanceof THREE.Group && element.children.some(child => 
        child instanceof THREE.Mesh && child.geometry instanceof THREE.DodecahedronGeometry)) {
        // Slow rotation for floating islands (wind speed effect)
        element.rotation.y += deltaTime * 0.08 * (1 + windSpeedMultiplier);
        // Gentle bobbing motion (higher wind = more movement)
        const bobbingIntensity = 0.15 * (1 + windSpeedMultiplier * 0.5);
        element.position.y += Math.sin(time * 0.5 + element.position.x) * deltaTime * bobbingIntensity;
      }
    });

    // Floating orbs movement
    this.animatedElements.forEach((element) => {
      if ((element as any).floatSpeed !== undefined) {
        // Gentle upward float and circular drift
        const floatSpeed = (element as any).floatSpeed;
        const floatOffset = (element as any).floatOffset;
        
        element.position.y += deltaTime * floatSpeed;
        element.position.x += Math.sin(time * 0.3 + floatOffset) * deltaTime * 0.1;
        element.position.z += Math.cos(time * 0.3 + floatOffset) * deltaTime * 0.1;
        
        // Reset if too high
        if (element.position.y > 20) {
          element.position.y = -5;
        }
        
        // Gentle glow pulsing
        if (element.children.length > 0) {
          element.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
              const baseOpacity = child === element.children[0] ? 0.6 : 0.15;
              child.material.opacity = baseOpacity + Math.sin(time * 1.5 + floatOffset) * (baseOpacity * 0.3);
            }
          });
        }
      }
    });

    // Update special effects (meteors, aurora, lightning, etc.)
    if (this.effectsManager) {
      this.effectsManager.update(deltaTime);
    }

    // Water manager temporarily disabled to avoid conflicts
    // if (this.waterManager) {
    //   this.waterManager.update(deltaTime);
    // }

    // Animate fish school
    this.fishSchool.forEach((fish) => {
      const swimSpeed = (fish as any).swimSpeed || 0.5;
      const swimRadius = (fish as any).swimRadius || 15;
      const swimPhase = (fish as any).swimPhase || 0;
      const verticalPhase = (fish as any).verticalPhase || 0;
      const baseDepth = (fish as any).baseDepth || -21.5; // Use stored depth (below water surface)
      
      // Update swim angle (circular swimming pattern)
      (fish as any).swimAngle += deltaTime * swimSpeed * 0.2;
      const angle = (fish as any).swimAngle;
      
      // Circular swimming with gentle vertical bobbing
      fish.position.x = Math.cos(angle) * swimRadius;
      fish.position.z = Math.sin(angle) * swimRadius;
      fish.position.y = baseDepth + Math.sin(time * swimSpeed + verticalPhase) * 0.15; // Gentle bobbing
      
      // Face swimming direction
      fish.rotation.y = angle + Math.PI / 2;
      
      // Tail wiggle (subtle)
      fish.rotation.z = Math.sin(time * 5 + swimPhase) * 0.1;
    });

    // Animate floating orbs
    this.floatingOrbs.forEach((orb) => {
      const floatSpeed = (orb as any).floatSpeed || 0.3;
      const floatRadius = (orb as any).floatRadius || 15;
      const floatHeight = (orb as any).floatHeight || 5;
      const floatPhase = (orb as any).floatPhase || 0;
      
      // Update rotation around center
      (orb as any).floatAngle += deltaTime * floatSpeed * 0.15;
      const angle = (orb as any).floatAngle;
      
      // Circular orbit with vertical bobbing
      orb.position.x = Math.cos(angle) * floatRadius;
      orb.position.z = Math.sin(angle) * floatRadius;
      orb.position.y = floatHeight + Math.sin(time * floatSpeed + floatPhase) * 1.5;
      
      // Gentle rotation
      orb.rotation.y += deltaTime * 0.5;
      orb.rotation.x += deltaTime * 0.3;
      
      // Pulsing emissive intensity
      if (orb.material instanceof THREE.MeshStandardMaterial) {
        orb.material.emissiveIntensity = 0.5 + Math.sin(time * 2 + floatPhase) * 0.3;
      }
    });

    // Animate energy beams
    this.energyBeams.forEach((beam) => {
      const pulsePhase = (beam as any).pulsePhase || 0;
      const pulseSpeed = (beam as any).pulseSpeed || 1.0;
      
      // Pulsing effect
      beam.scale.y = 0.8 + Math.sin(time * pulseSpeed + pulsePhase) * 0.2;
      
      // Opacity pulsing
      if (beam.material instanceof THREE.MeshBasicMaterial) {
        const baseOpacity = beam.material.opacity;
        beam.material.opacity = baseOpacity * (0.7 + Math.sin(time * pulseSpeed * 1.5 + pulsePhase) * 0.3);
      }
      
      // Slight rotation
      beam.rotation.y += deltaTime * 0.5;
    });

    // Animate Guardian Stones
    this.guardianStones.forEach(group => {
      const data = group.userData;
      const time = Date.now() * 0.001;
      
      // Orbit
      data.angle += deltaTime * data.speed * 0.5;
      group.position.x = Math.cos(data.angle) * data.radius;
      group.position.z = Math.sin(data.angle) * data.radius;
      
      // Bobbing
      group.position.y = Math.sin(time * data.bobSpeed) * data.bobHeight;
      
      // Self rotation
      group.rotation.x += deltaTime * data.rotationSpeed;
      group.rotation.y += deltaTime * data.rotationSpeed;
      
      // Pulse wireframe
      const wireframe = group.children.find(c => c instanceof THREE.LineSegments) as THREE.LineSegments;
      if (wireframe && wireframe.material instanceof THREE.LineBasicMaterial) {
        wireframe.material.opacity = 0.4 + Math.sin(time * 2) * 0.3;
      }
    });

    // Animate smoke particles
    if (this.smokeParticles) {
      const positions = this.smokeParticles.geometry.attributes.position.array as Float32Array;
      const velocities = this.smokeParticles.geometry.attributes.velocity.array as Float32Array;
      const sizes = this.smokeParticles.geometry.attributes.size.array as Float32Array;
      const count = positions.length / 3;
      
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        
        // Move up and drift
        positions[idx] += velocities[idx] * deltaTime;
        positions[idx + 1] += velocities[idx + 1] * deltaTime;
        positions[idx + 2] += velocities[idx + 2] * deltaTime;
        
        // Grow size as they rise
        sizes[i] += deltaTime * 0.5;
        
        // Reset if too high or faded out (visual trick)
        if (positions[idx + 1] > 15) {
          // Respawn at base
          const r = Math.random() * 6;
          const theta = Math.random() * Math.PI * 2;
          positions[idx] = r * Math.cos(theta);
          positions[idx + 1] = 0;
          positions[idx + 2] = r * Math.sin(theta);
          
          // Reset size
          sizes[i] = 1 + Math.random() * 2;
          
          // Random velocity
          velocities[idx] = (Math.random() - 0.5) * 1.0; // More drift
          velocities[idx + 1] = 1 + Math.random() * 2;   // Up speed
          velocities[idx + 2] = (Math.random() - 0.5) * 1.0;
        }
      }
      
      this.smokeParticles.geometry.attributes.position.needsUpdate = true;
      this.smokeParticles.geometry.attributes.size.needsUpdate = true;
      
      // Slowly rotate the whole smoke system
      this.smokeParticles.rotation.y += deltaTime * 0.1;
    }

    // Animate fire particles
    if (this.fireParticles) {
      const positions = this.fireParticles.geometry.attributes.position.array as Float32Array;
      const velocities = this.fireParticles.geometry.attributes.velocity.array as Float32Array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        
        // Move up fast
        positions[idx] += velocities[idx] * deltaTime;
        positions[idx + 1] += velocities[idx + 1] * deltaTime;
        positions[idx + 2] += velocities[idx + 2] * deltaTime;
        
        // Reset if too high
        if (positions[idx + 1] > 8) {
          const r = Math.random() * 5;
          const theta = Math.random() * Math.PI * 2;
          positions[idx] = r * Math.cos(theta);
          positions[idx + 1] = 0;
          positions[idx + 2] = r * Math.sin(theta);
          
          // Random fast upward velocity
          velocities[idx] = (Math.random() - 0.5) * 0.5;
          velocities[idx + 1] = 3 + Math.random() * 4; 
          velocities[idx + 2] = (Math.random() - 0.5) * 0.5;
        }
      }
      
      this.fireParticles.geometry.attributes.position.needsUpdate = true;
      
      // Flicker effect
      if (this.fireParticles.material instanceof THREE.PointsMaterial) {
        this.fireParticles.material.opacity = 0.6 + Math.random() * 0.4;
      }
    }
  }

  // Get holographic screen for video texture attachment
  getHolographicScreen(): THREE.Group | undefined {
    return this.holographicScreen;
  }

  // Get the main video screen mesh for texture/video application
  getVideoScreenMesh(): THREE.Mesh | undefined {
    if (!this.holographicScreen) return undefined;
    return this.holographicScreen.children.find(
      child => child instanceof THREE.Mesh && child.name === 'videoScreen'
    ) as THREE.Mesh | undefined;
  }

  /**
   * Update scene weather params
   * Dynamically adjust scene appearance based on AI-generated params
   */
  updateWeatherParams(params: SceneWeatherParams) {
    console.log('🌤️ Updating scene weather:', {
      weatherType: params.weatherType,
      mood: params.mood,
      skyColor: params.skyColor,
      waterEffect: params.waterEffect,
      waterColor: params.waterColor,
      windSpeed: params.windSpeed,
      cloudSpeed: params.cloudSpeed,
      specialEvents: params.specialEvents,
      islandState: params.islandState,
      fogDensity: params.fogDensity,
      particleIntensity: params.particleIntensity,
    });

    this.currentWeatherParams = params;

    // 1. Update sky color (Gradient)
    const skyColor = new THREE.Color(params.skyColor);
    const topColor = skyColor.clone().offsetHSL(0, 0, -0.1);
    const bottomColor = skyColor.clone().offsetHSL(0, 0, 0.1);
    
    // Clean up old texture if it exists
    if (this.scene.background instanceof THREE.Texture) {
      this.scene.background.dispose();
    }
    this.scene.background = this.createGradientTexture(topColor, bottomColor);

    // 2. Update fog
    if (this.scene.fog) {
      const fogColor = new THREE.Color(params.fogColor);
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.copy(fogColor);
        const baseFar = 120; // Updated base
        const baseNear = 50; // Updated base
        this.scene.fog.far = baseFar - (params.fogDensity * 40);
        this.scene.fog.near = baseNear - (params.fogDensity * 20);
      }
    }

    // 3. Update main light (sun)
    this.scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight && !this.directionalLight) {
        this.directionalLight = object;
      }
      if (object instanceof THREE.AmbientLight && !this.ambientLight) {
        this.ambientLight = object;
      }
    });

    if (this.directionalLight) {
      const sunColor = new THREE.Color(params.sunColor);
      this.directionalLight.color.copy(sunColor);
      this.directionalLight.intensity = params.sunIntensity;
    }

    if (this.ambientLight) {
      this.ambientLight.intensity = params.ambientIntensity;
    }

    // 4. Update ambient particles intensity
    if (this.ambientParticles && this.ambientParticles.material instanceof THREE.PointsMaterial) {
      const baseOpacity = this.theme.particleOpacity;
      this.ambientParticles.material.opacity = baseOpacity * (0.5 + params.particleIntensity * 0.5);
    }

    // 5. Create or update weather particles (rain, snow, etc.)
    this.updateWeatherParticles(params);

    // 6. Update scene mood
    this.updateSceneMood(params);

    // 7. Update water effects
    if (this.waterManager) {
      this.waterManager.updateEffect({
        effectType: params.waterEffect as any,
        waterColor: params.waterColor,
        intensity: params.effectIntensity || 1.0
      });
      console.log('🌊 Water effect updated:', params.waterEffect, params.waterColor);
    }

    // 8. Update special effects
    if (this.effectsManager) {
      this.effectsManager.clearAll();
      
      if (params.specialEvents && params.specialEvents.length > 0) {
        params.specialEvents.forEach(event => {
          if (event !== 'none') {
            let colors: number[] | undefined;
            // Pass custom colors for rainbow if available
            if (event === 'rainbow' && params.rainbowColors) {
               colors = params.rainbowColors.map(c => parseInt(c.replace('#', ''), 16));
            }
            this.effectsManager!.addEffect(event, params.effectIntensity || 1.0, colors);
          }
        });
        console.log('✨ Special effects updated:', params.specialEvents);
      }

      // Handle ambient effects that are managed by SpecialEffectsManager
      if (params.ambientEffects && params.ambientEffects.length > 0) {
        params.ambientEffects.forEach(effect => {
          // Currently only 'embers' is in Manager. 'sparkles' is handled by createAmbientParticles (partially) or could be moved here.
          if (effect === 'embers') {
             this.effectsManager!.addEffect('embers', params.effectIntensity || 1.0);
             console.log('✨ Ambient effect added:', effect);
          }
        });
      }
    }

    // 9. Update island state
    if (params.islandState) {
      this.updateIslandState(params.islandState);
    }

    // 10. Update parametric fish school
    if (params.fishCount !== undefined) {
      this.updateFishSchool(params.fishCount);
    }

    // 11. Update floating orbs
    if (params.floatingOrbCount !== undefined) {
      this.updateFloatingOrbs(params.floatingOrbCount);
    }

    // 12. Update theme-dependent colors (Screen, Platform, etc.)
    this.updateThemeColors();

    // 13. Update energy beams
    if (params.energyBeamIntensity !== undefined) {
      this.updateEnergyBeams(params.energyBeamIntensity);
    }

    console.log('✅ Scene weather updated successfully');
  }

  /**
   * Update theme-dependent colors for existing objects
   * Ensures elements like the holographic screen update when day/night changes
   */
  private updateThemeColors() {
    const isNightMode = this.theme.backgroundColor === 0x0f172a || this.theme.backgroundColor === 0x0a0a0f;

    // 1. Update Holographic Screen
    if (this.holographicScreen) {
      // Screen mesh
      const screen = this.holographicScreen.children.find(c => c.name === 'videoScreen') as THREE.Mesh;
      if (screen && screen.material instanceof THREE.MeshStandardMaterial) {
        screen.material.color.setHex(isNightMode ? 0x1a2040 : 0xf0f8ff);
        screen.material.emissive.setHex(isNightMode ? 0x2244aa : 0xffaa66);
      }

      // Frame lines
      const frameColor = isNightMode ? 0x4488ff : 0xff8844;
      this.holographicScreen.children.forEach(child => {
        if (child instanceof THREE.Line && child.material instanceof THREE.LineBasicMaterial) {
          child.material.color.setHex(frameColor);
        }
        // Corner accents
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.OctahedronGeometry && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.color.setHex(frameColor);
        }
        // Outer glow
        if (child instanceof THREE.Mesh && child !== screen && child.geometry instanceof THREE.CylinderGeometry && child.material instanceof THREE.MeshBasicMaterial) {
           child.material.color.setHex(frameColor);
        }
      });
    }

    // 2. Update Platform
    const platformGroup = this.scene.children.find(c => c instanceof THREE.Group && c.children.some(child => child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry && child.position.y === 0));
    
    if (platformGroup) {
       const topPlatform = platformGroup.children[0] as THREE.Mesh;
       const midPlatform = platformGroup.children[1] as THREE.Mesh;
       const bottomPlatform = platformGroup.children[2] as THREE.Mesh;
       
       if (topPlatform && topPlatform.material instanceof THREE.MeshStandardMaterial) {
         topPlatform.material.color.setHex(isNightMode ? 0x475569 : this.theme.platformColor);
         topPlatform.material.roughness = isNightMode ? 0.4 : 0.1;
         topPlatform.material.metalness = isNightMode ? 0.5 : 0.1;
         topPlatform.material.emissive.setHex(isNightMode ? 0x1e293b : 0xffffff);
         topPlatform.material.emissiveIntensity = isNightMode ? 0.25 : 0.15;
       }
       
       if (midPlatform && midPlatform.material instanceof THREE.MeshStandardMaterial) {
         midPlatform.material.color.setHex(isNightMode ? 0x334155 : this.theme.platformColor);
         midPlatform.material.emissive.setHex(isNightMode ? 0x0f172a : this.theme.platformColor);
       }
       
       if (bottomPlatform && bottomPlatform.material instanceof THREE.MeshStandardMaterial) {
         bottomPlatform.material.color.setHex(isNightMode ? 0x1e293b : this.theme.platformColor);
         bottomPlatform.material.emissive.setHex(isNightMode ? 0x020617 : this.theme.platformColor);
       }
    }
  }

  /**
   * Update weather particle system
   */
  private updateWeatherParticles(params: SceneWeatherParams) {
    // Remove old weather particles
    if (this.weatherParticles) {
      this.scene.remove(this.weatherParticles);
      this.weatherParticles.geometry.dispose();
      if (this.weatherParticles.material instanceof THREE.PointsMaterial) {
        this.weatherParticles.material.dispose();
      }
      this.weatherParticles = undefined;
    }

    // Create particles only for specific weather types
    if (params.weatherType === 'rainy' || params.weatherType === 'snowy' || params.weatherType === 'stormy') {
      const particleCount = Math.floor(params.particleIntensity * 2000);
      if (particleCount > 0) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 60;
          positions[i * 3 + 1] = Math.random() * 30 + 10;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

          if (params.weatherType === 'snowy') {
            velocities[i * 3 + 1] = -0.5 - Math.random() * 0.5;
          } else {
            velocities[i * 3 + 1] = -2 - Math.random() * 2;
          }

          velocities[i * 3] = (Math.random() - 0.5) * params.windSpeed * 0.1;
          velocities[i * 3 + 2] = (Math.random() - 0.5) * params.windSpeed * 0.1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

          const material = new THREE.PointsMaterial({
          size: params.weatherType === 'snowy' ? 0.5 : 0.25,
          color: params.weatherType === 'snowy' ? 0xffffff : 0x8899aa, // Colder blue-grey for rain
          transparent: true,
          opacity: params.particleIntensity * 0.8,
          depthWrite: false,
        });

        this.weatherParticles = new THREE.Points(geometry, material);
        this.scene.add(this.weatherParticles);
      }
    }
  }

  /**
   * Adjust scene atmosphere based on mood
   */
  private updateSceneMood(params: SceneWeatherParams) {
    this.spotlights.forEach((spotlight) => {
      switch (params.mood) {
        case 'energetic':
          spotlight.intensity *= 1.3;
          break;
        case 'melancholic':
          spotlight.intensity *= 0.65; // 調整為 0.65，在陰冷和可見度之間平衡
          break;
        case 'mysterious':
          spotlight.intensity *= 0.8;
          break;
        case 'chaotic':
          spotlight.intensity *= 1.5;
          break;
        default: // calm
          break;
      }
    });

    // Adjust animation speed based on mood
    this.animatedElements.forEach((element) => {
      if (!element.userData.baseMoodSpeed) {
        element.userData.baseMoodSpeed = 1.0;
      }
      
      switch (params.mood) {
        case 'energetic':
          element.userData.moodSpeedMultiplier = 1.5;
          break;
        case 'melancholic':
          element.userData.moodSpeedMultiplier = 0.6;
          break;
        case 'chaotic':
          element.userData.moodSpeedMultiplier = 2.0;
          break;
        default:
          element.userData.moodSpeedMultiplier = 1.0;
          break;
      }
    });
  }

  /**
   * Update island state (glowing, smoking, frozen, burning)
   */
  private updateIslandState(state: 'normal' | 'glowing' | 'smoking' | 'frozen' | 'burning') {
    console.log('🏝️ Updating island state:', state);
    
    const platform = this.scene.children.find(
      child => child instanceof THREE.Mesh && child.geometry instanceof THREE.BufferGeometry
    );
    
    if (!platform || !(platform instanceof THREE.Mesh)) return;
    
    switch (state) {
      case 'glowing':
        if (platform.material instanceof THREE.MeshStandardMaterial) {
          // Day: Gold | Night: Cyan
          platform.material.emissive.setHex(this.theme.backgroundColor === 0x0a0a0f ? 0x00ffff : 0xFFD700);
          platform.material.emissiveIntensity = 0.5;
        }
        break;
        
      case 'smoking':
        this.updateSmokeParticles(true);
        this.updateFireParticles(false);
        break;
        
      case 'frozen':
        this.updateSmokeParticles(false);
        this.updateFireParticles(false);
        if (platform.material instanceof THREE.MeshStandardMaterial) {
          platform.material.color.setHex(0xB0E0E6);
          platform.material.metalness = 0.8;
          platform.material.roughness = 0.2;
        }
        break;
        
      case 'burning':
        this.updateSmokeParticles(true); // Smoke usually accompanies fire
        this.updateFireParticles(true);
        if (platform.material instanceof THREE.MeshStandardMaterial) {
          platform.material.emissive.setHex(0xFF4500);
          platform.material.emissiveIntensity = 0.8;
        }
        break;
        
      case 'normal':
      default:
        this.updateSmokeParticles(false);
        this.updateFireParticles(false);
        if (platform.material instanceof THREE.MeshStandardMaterial) {
          platform.material.emissive.setHex(0x000000);
          platform.material.emissiveIntensity = 0;
          platform.material.color.setHex(this.theme.platformColor || 0xd9f0f5);
          platform.material.metalness = 0.1;
          platform.material.roughness = 0.8;
        }
        break;
    }
  }

  /**
   * Update smoke particles
   */
  private updateSmokeParticles(enabled: boolean) {
    if (!enabled) {
      if (this.smokeParticles) {
        this.scene.remove(this.smokeParticles);
        this.smokeParticles.geometry.dispose();
        if (this.smokeParticles.material instanceof THREE.Material) {
          this.smokeParticles.material.dispose();
        }
        this.smokeParticles = undefined;
      }
      return;
    }

    if (this.smokeParticles) return; // Already exists

    console.log('💨 Creating smoke particles');
    
    const particleCount = 200; // Reduced from 500
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Emit from platform surface (circle radius ~8)
      const r = Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = Math.random() * 2; // Start slightly above ground
      positions[i * 3 + 2] = r * Math.sin(theta);

      velocities[i * 3] = (Math.random() - 0.5) * 0.5; // Slight horizontal drift
      velocities[i * 3 + 1] = 1 + Math.random() * 2; // Upward speed
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      
      sizes[i] = Math.random() * 1.5 + 0.5; // Reduced size
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0x555555,
      size: 1.2, // Reduced from 2
      transparent: true,
      opacity: 0.3, // Reduced from 0.4
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.smokeParticles = new THREE.Points(geometry, material);
    this.scene.add(this.smokeParticles);
  }

  /**
   * Update fire particles
   */
  private updateFireParticles(enabled: boolean) {
    if (!enabled) {
      if (this.fireParticles) {
        this.scene.remove(this.fireParticles);
        this.fireParticles.geometry.dispose();
        if (this.fireParticles.material instanceof THREE.Material) {
          this.fireParticles.material.dispose();
        }
        this.fireParticles = undefined;
      }
      return;
    }

    if (this.fireParticles) return; // Already exists

    console.log('🔥 Creating fire particles');

    const particleCount = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Emit from platform surface
      const r = Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = Math.random() * 1;
      positions[i * 3 + 2] = r * Math.sin(theta);

      velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 1] = 3 + Math.random() * 4; // Fast upward
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      color: 0xff4500, // Orange-Red
      size: 0.8,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.fireParticles = new THREE.Points(geometry, material);
    this.scene.add(this.fireParticles);
  }

  /**
   * Update fish school based on trading volume
   */
  private updateFishSchool(fishCount: number) {
    // Remove existing fish
    this.fishSchool.forEach(fish => {
      this.scene.remove(fish);
      fish.geometry.dispose();
      // Material disposal handled below if unique, but if shared we need to be careful.
      // Here we assume we are replacing all fish, so we can dispose their materials if they were unique.
      if (fish.material instanceof THREE.Material) {
         // If we switch to shared materials, we shouldn't dispose them here unless we track them.
         // For now, let's assume we might re-create them. 
         // Actually, to be safe with shared materials, we should NOT dispose them blindly if shared.
         // But since we are about to create new ones, let's just dispose for now and re-create to be safe, 
         // OR better: use a pool of materials.
      }
    });
    this.fishSchool = [];

    // If fishCount is 0, just clear and return
    if (fishCount === 0) {
      console.log(`🐟 Fish school cleared (count: 0)`);
      return;
    }

    console.log(`🐟 Creating fish school: ${fishCount} fish`);

    // Create new fish
    const fishGeometry = new THREE.ConeGeometry(0.3, 0.8, 4);
    fishGeometry.rotateZ(Math.PI / 2);

    // Performance Optimization: Create a palette of shared materials
    const materialPalette: THREE.MeshPhongMaterial[] = [];
    const paletteSize = 5;
    for(let i=0; i<paletteSize; i++) {
      const hue = 0.55 + (i / paletteSize) * 0.1; // Range 0.55 - 0.65
      const saturation = 0.7;
      const lightness = 0.5;
      
      materialPalette.push(new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(hue, saturation, lightness),
        shininess: 50,
        emissive: new THREE.Color().setHSL(hue, saturation, 0.2),
        emissiveIntensity: 0.4,
      }));
    }

    for (let i = 0; i < fishCount; i++) {
      // Assign material from palette
      const materialIndex = i % paletteSize;
      const fishMaterial = materialPalette[materialIndex];

      const fish = new THREE.Mesh(fishGeometry, fishMaterial);

      // Position fish in water (below surface at y=-20)
      const angle = (i / fishCount) * Math.PI * 2;
      const radius = 10 + Math.random() * 15;
      const baseDepth = -20.5 - Math.random() * 2.5; // Below water: -20.5 to -23
      
      fish.position.set(
        Math.cos(angle) * radius,
        baseDepth,
        Math.sin(angle) * radius
      );

      // Random rotation
      fish.rotation.y = angle + Math.PI / 2;

      // Store initial position and movement params
      (fish as any).swimSpeed = 0.5 + Math.random() * 0.5;
      (fish as any).swimRadius = radius;
      (fish as any).swimAngle = angle;
      (fish as any).swimPhase = Math.random() * Math.PI * 2;
      (fish as any).verticalPhase = Math.random() * Math.PI * 2;
      (fish as any).baseDepth = baseDepth; // Store base depth for animation

      this.scene.add(fish);
      this.fishSchool.push(fish);
    }
  }

  /**
   * Update floating orbs based on market activity
   */
  private updateFloatingOrbs(orbCount: number) {
    // Remove existing extra orbs
    while (this.floatingOrbs.length > orbCount) {
      const orb = this.floatingOrbs.pop();
      if (orb) {
        this.scene.remove(orb);
        orb.geometry.dispose();
        // Avoid disposing shared materials if we implement sharing here too
        if (orb.material instanceof THREE.Material) {
          // orb.material.dispose(); // Commented out for safety if sharing
        }
      }
    }

    console.log(`💫 Adjusting floating orbs: ${orbCount} orbs`);

    // Create palette for orbs too
    const orbMaterialPalette: THREE.MeshStandardMaterial[] = [];
    for(let i=0; i<3; i++) {
       orbMaterialPalette.push(new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
        emissive: new THREE.Color().setHSL(Math.random(), 0.8, 0.4),
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
      }));
    }

    // Add new orbs if needed
    while (this.floatingOrbs.length < orbCount) {
      const orbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const orbMaterial = orbMaterialPalette[this.floatingOrbs.length % 3];

      const orb = new THREE.Mesh(orbGeometry, orbMaterial);

      // Position around the central area
      const angle = (this.floatingOrbs.length / orbCount) * Math.PI * 2;
      const radius = 12 + Math.random() * 8;
      orb.position.set(
        Math.cos(angle) * radius,
        3 + Math.random() * 6,
        Math.sin(angle) * radius
      );

      // Store animation params
      (orb as any).floatSpeed = 0.3 + Math.random() * 0.3;
      (orb as any).floatRadius = radius;
      (orb as any).floatAngle = angle;
      (orb as any).floatHeight = orb.position.y;
      (orb as any).floatPhase = Math.random() * Math.PI * 2;

      this.scene.add(orb);
      this.floatingOrbs.push(orb);
    }
  }

  /**
   * Update energy beams based on price momentum
   */
  private updateEnergyBeams(intensity: number) {
    // Remove existing beams
    this.energyBeams.forEach(beam => {
      this.scene.remove(beam);
      beam.geometry.dispose();
      if (beam.material instanceof THREE.Material) {
        beam.material.dispose();
      }
    });
    this.energyBeams = [];

    if (intensity < 0.1) {
      console.log('⚡ No energy beams (intensity too low)');
      return;
    }

    console.log(`⚡ Creating energy beams with intensity: ${intensity.toFixed(2)}`);

    // Create 3-5 vertical energy beams
    const beamCount = Math.floor(3 + intensity * 2);
    const beamGeometry = new THREE.CylinderGeometry(0.4, 0.4, 15, 8);

    const isNightMode = this.theme.backgroundColor === 0x0a0a0f;

    for (let i = 0; i < beamCount; i++) {
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(
          isNightMode ? 0.55 + Math.random() * 0.1 : 0.15 + Math.random() * 0.1, // Blue vs Yellow-Orange
          1.0,
          0.6 + intensity * 0.3
        ),
        transparent: true,
        opacity: 0.5 + intensity * 0.5,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });

      const beam = new THREE.Mesh(beamGeometry, beamMaterial);

      // Position around the scene
      const angle = (i / beamCount) * Math.PI * 2;
      const radius = 8 + Math.random() * 5;
      beam.position.set(
        Math.cos(angle) * radius,
        7.5,
        Math.sin(angle) * radius
      );

      // Store animation params
      (beam as any).pulsePhase = Math.random() * Math.PI * 2;
      (beam as any).pulseSpeed = 1 + intensity;

      this.scene.add(beam);
      this.energyBeams.push(beam);
    }
  }

  /**
   * Get current weather params
   */
  getCurrentWeatherParams(): SceneWeatherParams | undefined {
    return this.currentWeatherParams;
  }

  dispose() {
    // Clean up geometry and materials
    if (this.ambientParticles) {
      this.scene.remove(this.ambientParticles);
      this.ambientParticles.geometry.dispose();
      if (Array.isArray(this.ambientParticles.material)) {
        this.ambientParticles.material.forEach(material => material.dispose());
      } else {
        this.ambientParticles.material.dispose();
      }
    }

    // Remove spotlights
    this.spotlights.forEach(spotlight => {
      this.scene.remove(spotlight);
      if (spotlight.target) {
        this.scene.remove(spotlight.target);
      }
    });
    this.spotlights = [];

    // Clean up special effects manager
    if (this.effectsManager) {
      this.effectsManager.dispose();
      this.effectsManager = undefined;
    }

    // Water manager cleanup
    if (this.waterManager) {
      this.waterManager.dispose();
      this.waterManager = undefined;
    }
  }
}


