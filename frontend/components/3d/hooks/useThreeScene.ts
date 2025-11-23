import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { SceneManager } from '@/lib/three/SceneManager';
import { ThreeSceneConfig, LoadGLBOptions, Model3DItem } from '@/types/three';
import { StageThemeConfig } from '@/types/theme';

export interface UseThreeSceneOptions extends ThreeSceneConfig {
  enableGallery?: boolean;
  theme?: StageThemeConfig;
}

export function useThreeScene(options: UseThreeSceneOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const initializedRef = useRef(false);
  const [sceneInitialized, setSceneInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedModels, setLoadedModels] = useState<Map<string, THREE.Group>>(new Map());

  // Memoize scene config to prevent unnecessary re-initialization
  const sceneConfig = useMemo<ThreeSceneConfig>(() => ({
    backgroundColor: options.backgroundColor,
    ambientLightColor: options.ambientLightColor,
    ambientLightIntensity: options.ambientLightIntensity,
    directionalLightColor: options.directionalLightColor,
    directionalLightIntensity: options.directionalLightIntensity,
    enableShadows: options.enableShadows,
    cameraPosition: options.cameraPosition,
    galleryScene: options.enableGallery !== false ? {
      theme: options.theme,
      enablePlatform: true,
      enableGrid: false,
      enableSpotlights: true,
      enableAmbientParticles: true,
      enableParametricElements: true,
      enableAudienceSeats: true,
      stageStyle: 'minimal' as const,
    } : undefined
  }), [
    options.backgroundColor,
    options.ambientLightColor,
    options.ambientLightIntensity,
    options.directionalLightColor,
    options.directionalLightIntensity,
    options.enableShadows,
    options.enableGallery,
    options.theme,
  ]);

  useEffect(() => {
    if (!canvasRef.current || initializedRef.current) return;

    initializedRef.current = true;
    setIsLoading(true);

    // Initialize scene
    const initializeScene = async () => {
      try {
        const sceneManager = new SceneManager(canvasRef.current!, sceneConfig);
        sceneManagerRef.current = sceneManager;
        sceneManager.startAnimation();
        
        setSceneInitialized(true);
        
        // Give scene a moment to render
        setTimeout(() => {
          setIsLoading(false);
        }, 500);

      } catch (error) {
        console.error('Scene initialization failed:', error);
        setIsLoading(false);
      }
    };

    initializeScene();

    // Cleanup function
    return () => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
        sceneManagerRef.current = null;
      }
      
      initializedRef.current = false;
      setSceneInitialized(false);
      setLoadedModels(new Map());
    };
  }, [sceneConfig]);

  // Load a single model
  const loadModel = useCallback(async (modelItem: Model3DItem) => {
    const sceneManager = sceneManagerRef.current;
    if (!sceneManager) {
      console.warn('SceneManager not initialized');
      return null;
    }

    try {
      const url = modelItem.modelUrl || modelItem.blobId || '';
      if (!url) {
        throw new Error('No model URL or blob ID provided');
      }

      const loadOptions: LoadGLBOptions = {
        name: modelItem.name,
        position: modelItem.position || { x: 0, y: 1, z: 0 },
        rotation: modelItem.rotation || { x: 0, y: 0, z: 0 },
        scale: modelItem.scale || { x: 1, y: 1, z: 1 },
        castShadow: true,
        receiveShadow: true,
      };

      const model = await sceneManager.loadGLBModel(url, loadOptions);
      
      setLoadedModels(prev => {
        const newMap = new Map(prev);
        newMap.set(modelItem.id, model);
        return newMap;
      });

      console.log(`✅ Model loaded: ${modelItem.name}`);
      return model;
    } catch (error) {
      console.error(`❌ Failed to load model ${modelItem.name}:`, error);
      return null;
    }
  }, []);

  // Load multiple models
  const loadModels = useCallback(async (modelItems: Model3DItem[]) => {
    const promises = modelItems.map(item => loadModel(item));
    const results = await Promise.all(promises);
    return results.filter((model): model is THREE.Group => model !== null);
  }, [loadModel]);

  // Remove a model
  const removeModel = useCallback((modelId: string) => {
    const sceneManager = sceneManagerRef.current;
    if (!sceneManager) return;
    
    setLoadedModels(prev => {
      const model = prev.get(modelId);
      if (model) {
        sceneManager.removeLoadedModel(model);
      }
      const newMap = new Map(prev);
      newMap.delete(modelId);
      return newMap;
    });
  }, []);

  // Clear all models
  const clearModels = useCallback(() => {
    const sceneManager = sceneManagerRef.current;
    if (!sceneManager) return;
    
    setLoadedModels(prev => {
      prev.forEach((model) => {
        sceneManager.removeLoadedModel(model);
      });
      return new Map();
    });
  }, []);

  // Update floating island base style
  const updateFloatingIslandBaseStyle = useCallback((subscriberCount: number) => {
    sceneManagerRef.current?.updateFloatingIslandBaseStyle(subscriberCount);
  }, []);

  // Audience seat management
  const updateAudienceSeats = useCallback((subscriberCount: number, maxDisplay: number = 50) => {
    sceneManagerRef.current?.updateAudienceSeats(subscriberCount, maxDisplay);
  }, []);

  const getAudienceSeatPositions = useCallback(() => {
    return sceneManagerRef.current?.getAudienceSeatPositions() || [];
  }, []);

  const getHolographicScreen = useCallback(() => {
    return sceneManagerRef.current?.getHolographicScreen();
  }, []);

  const getVideoScreenMesh = useCallback(() => {
    return sceneManagerRef.current?.getVideoScreenMesh();
  }, []);

  // Weather system integration
  const updateWeatherParams = useCallback((params: any) => {
    sceneManagerRef.current?.updateWeatherParams(params);
  }, []);

  const getCurrentWeatherParams = useCallback(() => {
    return sceneManagerRef.current?.getCurrentWeatherParams();
  }, []);

  // Transform controls
  const attachTransformControls = useCallback((object: THREE.Object3D) => {
    sceneManagerRef.current?.attachTransformControls(object);
  }, []);

  const detachTransformControls = useCallback(() => {
    sceneManagerRef.current?.detachTransformControls();
  }, []);

  const setTransformMode = useCallback((mode: 'translate' | 'rotate' | 'scale') => {
    sceneManagerRef.current?.setTransformMode(mode);
  }, []);

  const pickObject = useCallback((x: number, y: number) => {
    return sceneManagerRef.current?.pickObject(x, y) || null;
  }, []);

  const getSceneState = useCallback(() => {
    return sceneManagerRef.current?.getSceneState() || [];
  }, []);

  const playIntroAnimation = useCallback(async (options?: { duration?: number; startDistanceMultiplier?: number; startHeightOffset?: number }) => {
    if (sceneManagerRef.current) {
      await sceneManagerRef.current.playIntroAnimation(options);
    }
  }, []);

  const setTransformCallbacks = useCallback((
    onDraggingChanged?: (isDragging: boolean) => void,
    onTransformChange?: () => void
  ) => {
    sceneManagerRef.current?.setTransformCallbacks(onDraggingChanged, onTransformChange);
  }, []);

  return {
    canvasRef,
    sceneManager: sceneManagerRef.current || undefined,
    sceneInitialized,
    isLoading,
    loadedModels: Array.from(loadedModels.entries()).map(([id, model]) => ({ id, model })),
    loadModel,
    loadModels,
    removeModel,
    clearModels,
    updateFloatingIslandBaseStyle,
    updateAudienceSeats,
    getAudienceSeatPositions,
    getHolographicScreen,
    getVideoScreenMesh,
    updateWeatherParams,
    getCurrentWeatherParams,
    attachTransformControls,
    detachTransformControls,
    setTransformMode,
    pickObject,
    getSceneState,
    playIntroAnimation,
    setTransformCallbacks,
  };
}

