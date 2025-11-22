import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { AtriumGalleryScene, AtriumGallerySceneConfig } from './AtriumGalleryScene';
import { ThreeSceneConfig, LoadGLBOptions } from '../../types/three';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationId: number | null = null;
  private resizeHandler: () => void;
  private loadedModels: Map<string, THREE.Group> = new Map();
  private galleryScene?: AtriumGalleryScene;
  private dracoLoader: DRACOLoader;
  private clock: THREE.Clock;
  private transformControls?: TransformControls;
  private onDraggingChanged?: (isDragging: boolean) => void;
  private onTransformChange?: () => void;
  
  // Animation state
  private introAnimation: {
    isActive: boolean;
    startTime: number;
    duration: number;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
  } | null = null;

  constructor(canvas: HTMLCanvasElement, config: ThreeSceneConfig = {}) {
    this.clock = new THREE.Clock();
    
    // Setup scene
    this.scene = new THREE.Scene();

    // Setup DRACOLoader for compressed GLB models
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    this.dracoLoader.setDecoderConfig({ type: 'js' });

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      60, // Slightly narrower FOV for more elegant perspective
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    const [x, y, z] = config.cameraPosition || [0, 1.6, 8];
    this.camera.position.set(x, y, z);

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (config.enableShadows !== false) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Tone mapping for more realistic lighting
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Setup controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0); // Look at stage center
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 60; // Increased for intro view
    this.controls.maxPolarAngle = Math.PI / 2.2; // Slight constraint to maintain architectural feel
    this.controls.update(); // Apply initial target

    // Setup transform controls for object manipulation
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.setMode('translate');
    this.transformControls.setSpace('world');
    this.scene.add(this.transformControls as any);
    
    // Disable orbit controls when dragging with transform controls
    this.transformControls.addEventListener('dragging-changed', (event: any) => {
      this.controls.enabled = !event.value;
      if (this.onDraggingChanged) {
        this.onDraggingChanged(event.value);
      }
    });

    this.transformControls.addEventListener('change', () => {
      if (this.onTransformChange) {
        this.onTransformChange();
      }
    });

    // Initialize gallery scene
    if (config.galleryScene) {
      this.galleryScene = new AtriumGalleryScene(this.scene, config.galleryScene, this.camera);
    } else {
      // Fallback to basic background
      this.scene.background = new THREE.Color(config.backgroundColor || 0xe8f4f8);
    }

    // Add lighting
    this.setupLights(config);

    // Setup resize handler
    this.resizeHandler = this.handleResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);
  }

  private setupLights(config: ThreeSceneConfig) {
    // Bright ambient light - daylight ambience
    const ambientLight = new THREE.AmbientLight(
      config.ambientLightColor || 0xffffff,
      config.ambientLightIntensity || 0.7
    );
    this.scene.add(ambientLight);

    // Main directional light - natural sunlight
    const directionalLight = new THREE.DirectionalLight(
      config.directionalLightColor || 0xfff8f0,
      config.directionalLightIntensity || 1.2
    );
    directionalLight.position.set(5, 15, 8);
    directionalLight.castShadow = true;

    // Shadow configuration
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 30;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.bias = -0.00005;

    this.scene.add(directionalLight);

    // Warm fill light
    const fillLight = new THREE.DirectionalLight(0xfff5e6, 0.4);
    fillLight.position.set(-8, 10, -5);
    this.scene.add(fillLight);

    // Hemisphere light for natural sky
    const hemisphereLight = new THREE.HemisphereLight(
      0xe8f4f8, // Light sky blue
      0xf0f0f0, // Neutral ground
      0.6
    );
    this.scene.add(hemisphereLight);
  }

  // Start animation loop
  startAnimation() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      const deltaTime = this.clock.getDelta();
      const elapsedTime = this.clock.getElapsedTime();
      
      this.controls.update();

      // Handle Intro Animation
      if (this.introAnimation && this.introAnimation.isActive) {
        const elapsed = Date.now() - this.introAnimation.startTime;
        const progress = Math.min(elapsed / this.introAnimation.duration, 1.0);
        
        // Cubic Ease Out
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const alpha = easeOutCubic(progress);

        this.camera.position.lerpVectors(
          this.introAnimation.startPos, 
          this.introAnimation.endPos, 
          alpha
        );
        
        this.controls.target.lerpVectors(
          this.introAnimation.startTarget,
          this.introAnimation.endTarget,
          alpha
        );
        this.controls.update();

        if (progress >= 1.0) {
          this.introAnimation.isActive = false;
          this.controls.enabled = true;
        }
      }

      // Animate floating platforms
      this.scene.traverse((obj) => {
        if (obj.userData.isFloatingPlatform) {
          const baseY = obj.userData.baseY || 0;
          const offset = obj.userData.floatOffset || 0;
          // Gentle sine wave float: amplitude 0.1, period 3 seconds
          obj.position.y = baseY + Math.sin(elapsedTime * 2.0 + offset) * 0.1;
          // Slight rotation for organic feel
          obj.rotation.y = Math.sin(elapsedTime * 0.5 + offset) * 0.05;
        }
      });

      // Update gallery scene animations
      if (this.galleryScene) {
        this.galleryScene.update(deltaTime);
      }

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  // Stop animation
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // Handle window resize
  private handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Load GLB model
  async loadGLBModel(url: string, options: LoadGLBOptions = {}): Promise<THREE.Group> {
    const loader = new GLTFLoader();
    loader.setDRACOLoader(this.dracoLoader);

    // Check cache
    if (this.loadedModels.has(url)) {
      console.log(`Loading model from cache: ${url}`);
      const cachedModel = this.loadedModels.get(url)!;

      if (cachedModel.parent !== this.scene) {
        this.applyModelOptions(cachedModel, options);
        this.scene.add(cachedModel);
      }

      return Promise.resolve(cachedModel);
    }

    return new Promise<THREE.Group>((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          this.applyModelOptions(model, options);
          this.scene.add(model);
          this.loadedModels.set(url, model);
          resolve(model);
        },
        (progress) => {
          if (options.onProgress) {
            options.onProgress(progress);
          }
        },
        (error) => {
          console.error(`Failed to load GLB model: ${url}`, error);
          reject(new Error(`Failed to load GLB model: ${url}`));
        }
      );
    });
  }

  private applyModelOptions(model: THREE.Group, options: LoadGLBOptions) {
    if (options.name) {
      model.name = options.name;
    }
    if (options.position) {
      model.position.set(options.position.x, options.position.y, options.position.z);
    }
    if (options.rotation) {
      model.rotation.set(options.rotation.x, options.rotation.y, options.rotation.z);
    }
    if (options.scale) {
      model.scale.set(options.scale.x, options.scale.y, options.scale.z);
    }

    const castShadow = options.castShadow !== false;
    const receiveShadow = options.receiveShadow !== false;
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                mat.needsUpdate = true;
              }
            });
          } else if (child.material instanceof THREE.MeshStandardMaterial || child.material instanceof THREE.MeshPhysicalMaterial) {
            child.material.needsUpdate = true;
          }
        }
      }
    });
  }

  // Remove loaded model
  removeLoadedModel(model: THREE.Group) {
    this.scene.remove(model);

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  // Add object to scene
  addObject(object: THREE.Object3D) {
    this.scene.add(object);
  }

  // Remove object
  removeObject(object: THREE.Object3D) {
    this.scene.remove(object);
  }

  // Get scene object
  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }

  // Dispose resources
  dispose() {
    this.stopAnimation();
    window.removeEventListener('resize', this.resizeHandler);

    // Dispose gallery scene
    if (this.galleryScene) {
      this.galleryScene.dispose();
    }

    // Dispose DRACOLoader
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }

    // Dispose Three.js resources
    // Explicitly remove TransformControls before traversal to prevent errors
    if (this.transformControls) {
      this.scene.remove(this.transformControls as unknown as THREE.Object3D);
      this.transformControls.dispose();
      this.transformControls = undefined;
    }

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    this.controls.dispose();
    this.loadedModels.clear();
  }

  // Audience seat management methods
  updateAudienceSeats(subscriberCount: number, maxDisplay: number = 50) {
    if (this.galleryScene) {
      this.galleryScene.updateAudienceSeats(subscriberCount, maxDisplay);
    }
  }

  addAudienceSeat(seatIndex: number): boolean {
    if (this.galleryScene) {
      return this.galleryScene.addAudienceSeat(seatIndex);
    }
    return false;
  }

  removeAudienceSeat(seatIndex: number): boolean {
    if (this.galleryScene) {
      return this.galleryScene.removeAudienceSeat(seatIndex);
    }
    return false;
  }

  clearAudienceSeats() {
    if (this.galleryScene) {
      this.galleryScene.clearAudienceSeats();
    }
  }

  getAudienceSeatPositions() {
    return this.galleryScene?.getAudienceSeatPositions() || [];
  }

  // Get holographic screen for video playback
  getHolographicScreen() {
    return this.galleryScene?.getHolographicScreen();
  }

  // Get the main video screen mesh for applying video texture
  getVideoScreenMesh() {
    return this.galleryScene?.getVideoScreenMesh();
  }

  // Set TransformControls callbacks
  setTransformCallbacks(
    onDraggingChanged?: (isDragging: boolean) => void,
    onTransformChange?: () => void
  ) {
    this.onDraggingChanged = onDraggingChanged;
    this.onTransformChange = onTransformChange;
  }

  // Attach TransformControls to an object
  attachTransformControls(object: THREE.Object3D) {
    if (this.transformControls) {
      this.transformControls.attach(object);
    }
  }

  // Detach TransformControls
  detachTransformControls() {
    if (this.transformControls) {
      this.transformControls.detach();
    }
  }

  // Set TransformControls mode
  setTransformMode(mode: 'translate' | 'rotate' | 'scale') {
    if (this.transformControls) {
      this.transformControls.setMode(mode);
    }
  }

  // Pick object at normalized coordinates (-1 to +1)
  pickObject(normalizedX: number, normalizedY: number): THREE.Object3D | null {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(normalizedX, normalizedY), this.camera);

    const intersects = raycaster.intersectObjects(this.scene.children, true);
    
    console.log('🎯 Pick attempt:', { intersects: intersects.length, normalized: { x: normalizedX, y: normalizedY } });
    
    // Filter out TransformControls, grid, helpers, etc.
    for (const intersect of intersects) {
      let obj = intersect.object;
      
      // Traverse up to find the root group if it's a model
      while (obj.parent && obj.parent !== this.scene) {
        // If we hit a special object (like TransformControls), ignore it
        if (obj.parent.type === 'TransformControls') {
          console.log('❌ Hit TransformControls, skipping');
          return null;
        }
        obj = obj.parent;
      }

      // Ignore grid/lights/helpers if needed
      if (obj.type === 'GridHelper' || obj.type === 'AxesHelper' || obj.type === 'Light') {
        console.log('❌ Hit helper/light, skipping:', obj.type);
        continue;
      }
      
      // Check if it's a loaded model (check if it's in our loaded models Map)
      const isLoadedModel = Array.from(this.loadedModels.values()).some(model => model === obj);
      
      if (isLoadedModel || obj.type === 'Group' || obj.type === 'Mesh') {
        console.log('✅ Picked object:', { name: obj.name, type: obj.type, isLoadedModel });
        return obj;
      }
      
      console.log('⚠️ Object found but skipped:', { name: obj.name, type: obj.type });
    }
    
    console.log('❌ No valid object picked');
    return null;
  }

  // Get scene objects (serialized for config)
  getSceneState() {
    const models = Array.from(this.loadedModels.entries()).map(([id, group]) => {
      return {
        id,
        name: group.name,
        position: { x: group.position.x, y: group.position.y, z: group.position.z },
        rotation: { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z },
        scale: { x: group.scale.x, y: group.scale.y, z: group.scale.z },
        // Note: URL is not stored in the Group directly, would need to be mapped back
      };
    });
    return models;
  }

  // Update model position
  updateModelPosition(modelId: string, position: { x: number; y: number; z: number }) {
    const model = this.loadedModels.get(modelId);
    if (model) {
      model.position.set(position.x, position.y, position.z);
    }
  }

  // Update model rotation
  updateModelRotation(modelId: string, rotation: { x: number; y: number; z: number }) {
    const model = this.loadedModels.get(modelId);
    if (model) {
      model.rotation.set(rotation.x, rotation.y, rotation.z);
    }
  }

  // Update model scale
  updateModelScale(modelId: string, scale: { x: number; y: number; z: number }) {
    const model = this.loadedModels.get(modelId);
    if (model) {
      model.scale.set(scale.x, scale.y, scale.z);
    }
  }

  // Update weather parameters (delegates to gallery scene)
  updateWeatherParams(params: any) {
    if (this.galleryScene) {
      this.galleryScene.updateWeatherParams(params);
    }
  }

  // Get current weather parameters
  getCurrentWeatherParams() {
    return this.galleryScene?.getCurrentWeatherParams();
  }

  /**
   * Plays a cinematic intro animation (Monument Valley style)
   */
  playIntroAnimation(options: {
    duration?: number;
    startDistanceMultiplier?: number;
    startHeightOffset?: number;
  } = {}): Promise<void> {
    const {
      duration = 4000,
      startDistanceMultiplier = 120,
      startHeightOffset = 50
    } = options;

    return new Promise((resolve) => {
      const currentPos = this.camera.position.clone();
      const currentTarget = this.controls.target.clone();

      // Define start position (High altitude, isometric-ish)
      // Start further away and higher to create a longer "approach" shot
      const startPos = currentPos.clone().normalize().multiplyScalar(startDistanceMultiplier).add(new THREE.Vector3(0, startHeightOffset, 0));
      
      this.controls.enabled = false; // Disable user interaction
      
      this.introAnimation = {
        isActive: true,
        startTime: Date.now(),
        duration,
        startPos,
        endPos: currentPos,
        startTarget: currentTarget,
        endTarget: currentTarget // Keep looking at same target
      };
      
      // Set initial position immediately
      this.camera.position.copy(startPos);

      // Resolve after duration
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }
}


