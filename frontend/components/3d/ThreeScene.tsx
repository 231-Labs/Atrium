"use client";

import * as THREE from 'three';
import { useThreeScene } from './hooks/useThreeScene';
import { useSpacePulse } from './hooks/useSpacePulse';
import { useSpaceSubscribers } from '@/components/space/hooks/useSpaceSubscribers';
import { useSpaceContent } from '@/components/space/hooks/useSpaceContent';
import { Model3DItem, ThreeSceneApi } from '@/types/three';
import { WeatherMode, STAGE_THEMES } from '@/types/theme';
import { RetroPanel } from '@/components/common/RetroPanel';
import { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';

interface ThreeSceneProps {
  spaceId?: string;
  models?: Model3DItem[];
  enableGallery?: boolean;
  className?: string;
  weatherMode?: WeatherMode;
  weatherParams?: any;
  onWeatherModeChange?: (mode: WeatherMode) => void;
  isPreview?: boolean;
  enableSubscriberAvatars?: boolean;
  isConnected?: boolean;
  isSubscribed?: boolean;
  isCreator?: boolean;
}

export const ThreeScene = forwardRef<ThreeSceneApi, ThreeSceneProps>(({
  spaceId,
  models = [],
  enableGallery = true,
  className = '',
  weatherMode: controlledWeatherMode,
  weatherParams: externalWeatherParams,
  onWeatherModeChange,
  isPreview = false,
  enableSubscriberAvatars = true,
  isConnected = false,
  isSubscribed = false,
  isCreator = false,
}, ref) => {
  // Track day/night for theme
  const [isDynamicNight, setIsDynamicNight] = useState(() => {
    const h = new Date().getHours();
    return h >= 20 || h < 5;
  });

  useEffect(() => {
    const check = () => {
      const h = new Date().getHours();
      setIsDynamicNight(h >= 20 || h < 5);
    };
    const id = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const [internalWeatherMode, setInternalWeatherMode] = useState<WeatherMode>('dynamic');
  const weatherMode = controlledWeatherMode ?? internalWeatherMode;

  const themeConfig = useMemo(() => {
    if (weatherMode === 'night') return STAGE_THEMES.dark;
    if (weatherMode === 'day') return STAGE_THEMES.light;
    return isDynamicNight ? STAGE_THEMES.dark : STAGE_THEMES.light;
  }, [weatherMode, isDynamicNight]);

  const sceneOptions = useMemo(() => ({
    backgroundColor: themeConfig.backgroundColor,
    cameraPosition: [18, 10, 18] as [number, number, number],
    enableGallery,
    enableShadows: true,
    theme: themeConfig,
  }), [enableGallery, themeConfig]);

  const {
    canvasRef,
    sceneManager,
    sceneInitialized,
    isLoading,
    loadedModels: loadedModelsArray,
    loadModel,
    loadModels,
    removeModel,
    clearModels,
    updatePulseParams,
    updateWeatherParams,
    attachTransformControls,
    detachTransformControls,
    setTransformMode,
    pickObject,
    getSceneState,
    playIntroAnimation,
    setTransformCallbacks,
    updateFloatingIslandBaseStyle,
    updateAudienceSeats,
    getAudienceSeatPositions,
  } = useThreeScene(sceneOptions);

  const subscriberSpaceId = enableSubscriberAvatars && spaceId ? spaceId : null;
  const { subscribers, loading: subscribersLoading } = useSpaceSubscribers(subscriberSpaceId);
  const { contentItems } = useSpaceContent(spaceId ?? null);

  // Three-layer pulse — replaces AI weather
  const pulseParams = useSpacePulse({
    spaceId: spaceId ?? null,
    subscriberCount: subscribers.length,
    contentItems,
    isConnected,
    isSubscribed,
    isCreator,
  });

  const loadedModelsMap = useMemo(
    () => new Map(loadedModelsArray.map(({ id, model }) => [id, model])),
    [loadedModelsArray],
  );

  // Expose API via ref
  useImperativeHandle(ref, () => ({
    loadModel,
    loadModels,
    removeModel,
    clearModels,
    attachTransformControls,
    attachTransformControlsById: (modelId: string) => {
      const modelData = loadedModelsArray.find(m => m.id === modelId);
      if (modelData) {
        attachTransformControls(modelData.model);
        return true;
      }
      return false;
    },
    detachTransformControls,
    setTransformMode,
    pickObject,
    getSceneState,
    playIntroAnimation,
    setTransformCallbacks,
    updateModelPosition: (modelId: string, position: { x: number; y: number; z: number }) => {
      sceneManager?.updateModelPosition(modelId, position);
    },
    updateModelRotation: (modelId: string, rotation: { x: number; y: number; z: number }) => {
      sceneManager?.updateModelRotation(modelId, rotation);
    },
    updateModelScale: (modelId: string, scale: { x: number; y: number; z: number }) => {
      sceneManager?.updateModelScale(modelId, scale);
    },
    updateFloatingIslandBaseStyle: (subscriberCount: number) => {
      updateFloatingIslandBaseStyle(subscriberCount);
    },
    updateAudienceSeats: (subscriberCount: number, maxDisplay: number = 50) => {
      updateAudienceSeats(subscriberCount, maxDisplay);
    },
    loadedModels: loadedModelsArray,
    canvas: canvasRef.current,
  }));

  // Loading & intro curtain
  const [isIntroPlayed, setIsIntroPlayed] = useState(false);
  const [showCurtain, setShowCurtain] = useState(true);

  useEffect(() => {
    if (!sceneInitialized || isIntroPlayed) return;
    const play = async () => {
      await new Promise(r => setTimeout(r, 100));
      setShowCurtain(false);
      playIntroAnimation(
        isPreview
          ? { duration: 2500, startDistanceMultiplier: 60, startHeightOffset: 20 }
          : { duration: 4500, startDistanceMultiplier: 120, startHeightOffset: 50 },
      );
      setIsIntroPlayed(true);
    };
    play();
  }, [sceneInitialized, isIntroPlayed, playIntroAnimation, isPreview]);

  // Push pulse params to the 3D scene
  useEffect(() => {
    if (!sceneInitialized) return;
    if (externalWeatherParams) {
      // Legacy external params (e.g. editor preview)
      updateWeatherParams(externalWeatherParams);
    } else {
      updatePulseParams(pulseParams);
    }
  }, [sceneInitialized, pulseParams, externalWeatherParams, updatePulseParams, updateWeatherParams]);

  // Load / update / remove user-placed models
  useEffect(() => {
    if (!sceneInitialized || !sceneManager) return;
    models.forEach(modelItem => {
      const existing = loadedModelsMap.get(modelItem.id);
      if (existing) {
        if (modelItem.position) existing.position.set(modelItem.position.x, modelItem.position.y, modelItem.position.z);
        if (modelItem.rotation) existing.rotation.set(modelItem.rotation.x, modelItem.rotation.y, modelItem.rotation.z);
        if (modelItem.scale) existing.scale.set(modelItem.scale.x, modelItem.scale.y, modelItem.scale.z);
      } else {
        loadModel(modelItem);
      }
    });
    Array.from(loadedModelsMap.keys()).forEach(modelId => {
      if (modelId.startsWith('subscriber-')) return;
      if (!models.find(m => m.id === modelId)) removeModel(modelId);
    });
  }, [sceneInitialized, sceneManager, models, loadedModelsMap, loadModel, removeModel]);

  // Handle subscriber avatars on audience seats
  useEffect(() => {
    if (!sceneInitialized || !sceneManager || !enableSubscriberAvatars) return;
    if (subscribersLoading) return;

    if (subscribers.length === 0) {
      Array.from(loadedModelsMap.keys()).forEach(id => {
        if (id.startsWith('subscriber-') || id.startsWith('platform-')) removeModel(id);
      });
      return;
    }

    const seatPositions = getAudienceSeatPositions();
    if (!seatPositions || seatPositions.length === 0) return;

    const shuffledSubscribers = [...subscribers].sort(() => Math.random() - 0.5);
    const maxSeats = Math.min(shuffledSubscribers.length, seatPositions.length, 50);
    const displayedSubscribers = shuffledSubscribers.slice(0, maxSeats);
    const shuffledSeats = [...seatPositions].sort(() => Math.random() - 0.5).slice(0, maxSeats);

    const currentIds = new Set(displayedSubscribers.map(s => `subscriber-${s.address}`));
    const loadedIds = new Set(Array.from(loadedModelsMap.keys()).filter(id => id.startsWith('subscriber-')));
    if (currentIds.size === loadedIds.size && [...currentIds].every(id => loadedIds.has(id))) return;

    Array.from(loadedModelsMap.keys()).forEach(id => {
      if (id.startsWith('subscriber-') || id.startsWith('platform-')) removeModel(id);
    });

    const isDark = weatherMode === 'night' || (weatherMode === 'dynamic' && isDynamicNight);
    displayedSubscribers.forEach((subscriber, index) => {
      const seat = shuffledSeats[index];
      if (!seat) return;
      createFloatingPlatform(seat, `platform-${subscriber.address}`, isDark, index);
      loadModel({
        id: `subscriber-${subscriber.address}`,
        name: subscriber.username || `Subscriber ${subscriber.address.slice(0, 6)}`,
        modelUrl: subscriber.avatarUrl,
        position: { x: seat.position.x, y: seat.position.y + 0.5, z: seat.position.z },
        rotation: { x: 0, y: seat.rotation, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      });
    });
  }, [sceneInitialized, sceneManager, enableSubscriberAvatars, subscribers, subscribersLoading, weatherMode, isDynamicNight]);

  // Update island style when subscriber count changes
  useEffect(() => {
    if (!sceneInitialized || !sceneManager || subscribersLoading) return;
    updateFloatingIslandBaseStyle(subscribers.length);
  }, [sceneInitialized, sceneManager, subscribers.length, subscribersLoading, updateFloatingIslandBaseStyle]);

  const createFloatingPlatform = (
    seat: { position: THREE.Vector3; rotation: number; index: number },
    platformId: string,
    isDark: boolean,
    index: number,
  ) => {
    if (!sceneManager) return;
    const scene = sceneManager.getScene();
    const platformGroup = new THREE.Group();
    platformGroup.name = platformId;
    const platformColor = isDark ? 0x334155 : 0xe8dcc8;
    const accentColor = isDark ? 0x38bdf8 : 0xff8844;
    const emissiveColor = isDark ? 0x1e293b : 0xffffff;
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.0, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: platformColor, roughness: isDark ? 0.4 : 0.6, metalness: isDark ? 0.5 : 0.1, flatShading: true, emissive: emissiveColor, emissiveIntensity: isDark ? 0.2 : 0.1 }),
    );
    platform.castShadow = true;
    platform.receiveShadow = true;
    platformGroup.add(platform);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.03, 6, 8),
      new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.6 }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.rotation.z = Math.PI / 8;
    platformGroup.add(rim);
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 1.5, 6),
      new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.4, roughness: 0.2, metalness: 0.8, transparent: true, opacity: 0.8 }),
    );
    crystal.position.y = -1.0;
    crystal.rotation.x = Math.PI;
    platformGroup.add(crystal);
    platformGroup.position.copy(seat.position);
    platformGroup.position.y -= 0.3;
    platformGroup.userData.floatOffset = index * 0.5;
    platformGroup.userData.baseY = platformGroup.position.y;
    platformGroup.userData.isFloatingPlatform = true;
    scene.add(platformGroup);
    const manager = sceneManager as any;
    if (manager.loadedModels) manager.loadedModels.set(platformId, platformGroup);
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ backgroundColor: `#${themeConfig.backgroundColor.toString(16).padStart(6, '0')}` }}
      />

      {/* Loading curtain */}
      <div
        className={`absolute inset-0 z-50 bg-[#f3f4f6] transition-opacity duration-[1500ms] ease-in-out pointer-events-none flex items-center justify-center ${
          showCurtain ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {showCurtain && (
          <RetroPanel className="p-8 pointer-events-auto">
            <div className="text-center">
              <div className="inline-block animate-spin text-3xl text-gray-400 mb-4">⟳</div>
              <p className="text-sm text-gray-600 font-serif">Loading space...</p>
            </div>
          </RetroPanel>
        )}
      </div>
    </div>
  );
});
