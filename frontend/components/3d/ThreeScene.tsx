"use client";

import { useThreeScene } from '@/hooks/three/useThreeScene';
import { useAIWeather } from '@/hooks/useAIWeather';
import { timeFactors } from '@/services/timeFactors';
import { Model3DItem, ThreeSceneApi } from '@/types/three';
import { WeatherMode, STAGE_THEMES, STATIC_WEATHER_CONFIGS } from '@/types/theme';
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
}, ref) => {
  const [internalWeatherMode, setInternalWeatherMode] = useState<WeatherMode>('dynamic');
  const weatherMode = controlledWeatherMode ?? internalWeatherMode;

  // Track dynamic day/night cycle
  const [isDynamicNight, setIsDynamicNight] = useState(false);

  // Check time periodically for dynamic mode
  useEffect(() => {
    if (weatherMode !== 'dynamic') return;

    const checkTime = () => {
      const hour = new Date().getHours();
      // Sync with timeFactors logic: 20:00 - 05:00 is night
      const isNight = hour >= 20 || hour < 5;
      setIsDynamicNight(isNight);
    };

    checkTime(); // Initial check
    const interval = setInterval(checkTime, 300000); // Check every 5 minute

    return () => clearInterval(interval);
  }, [weatherMode]);

  const themeConfig = useMemo(() => {
    if (weatherMode === 'night') return STAGE_THEMES.dark;
    if (weatherMode === 'day') return STAGE_THEMES.light;
    
    // Dynamic mode: Use time-based determination
    return isDynamicNight ? STAGE_THEMES.dark : STAGE_THEMES.light;
  }, [weatherMode, isDynamicNight]);

  // Memoize scene options to prevent re-initialization
  const sceneOptions = useMemo(() => ({
    backgroundColor: themeConfig.backgroundColor,
    cameraPosition: [18, 10, 18] as [number, number, number], // Flatter angle, close view
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
    updateWeatherParams,
    attachTransformControls,
    detachTransformControls,
    setTransformMode,
    pickObject,
    getSceneState,
    playIntroAnimation,
    setTransformCallbacks,
  } = useThreeScene(sceneOptions);

  // Convert loadedModels array to Map for easy lookup
  const loadedModelsMap = useMemo(() => {
    return new Map(loadedModelsArray.map(({ id, model }) => [id, model]));
  }, [loadedModelsArray]);

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
    loadedModels: loadedModelsArray,
    canvas: canvasRef.current
  }));

  const isDynamicMode = weatherMode === 'dynamic' && !externalWeatherParams;
  const { 
    weatherParams: apiWeatherParams, 
    chainData, 
    isLoading: weatherLoading, 
    refreshWeather, 
    lastUpdate,
    error: weatherError 
  } = useAIWeather({
    autoUpdate: isDynamicMode,
    updateInterval: 5 * 60 * 1000, // 5分鐘更新一次
    fetchOnMount: isDynamicMode && sceneInitialized,
  });

  // --- Loading & Intro Logic ---
  const [isIntroPlayed, setIsIntroPlayed] = useState(false);
  const [showCurtain, setShowCurtain] = useState(true);

  // We are ready to reveal the scene when:
  // 1. Three.js is initialized
  // 2. If in Dynamic Mode, we have received weather data OR we encountered an error (fallback)
  const readyToReveal = sceneInitialized && (isDynamicMode ? (!!apiWeatherParams || !!weatherError) : true);

  useEffect(() => {
    if (readyToReveal && !isIntroPlayed) {
      const play = async () => {
        // Small delay to ensure weather visuals are applied to the scene frame
        await new Promise(r => setTimeout(r, 100));
        
        // 1. Hide Curtain
        setShowCurtain(false);
        
        // 2. Trigger Cinematic Camera Move
        // Use simpler/shorter animation for preview mode
        const animationConfig = isPreview ? {
          duration: 2500, 
          startDistanceMultiplier: 60, 
          startHeightOffset: 20 
        } : {
          duration: 4500,
          startDistanceMultiplier: 120,
          startHeightOffset: 50
        };

        playIntroAnimation(animationConfig);
        
        setIsIntroPlayed(true);
      };
      play();
    }
  }, [readyToReveal, isIntroPlayed, playIntroAnimation, isPreview]);

  const finalWeatherParams = useMemo(() => {
    if (externalWeatherParams) return externalWeatherParams;
    if (weatherMode === 'day') return STATIC_WEATHER_CONFIGS.day;
    if (weatherMode === 'night') return STATIC_WEATHER_CONFIGS.night;
    
    // Apply time-based overrides for dynamic mode
    if (apiWeatherParams) {
      return timeFactors.applyTimeOverrides(apiWeatherParams);
    }
    
    // Fallback for dynamic mode if API fails or is loading
    if (weatherError) {
      console.warn('⚠️ Weather API failed, using static day fallback:', weatherError);
      return STATIC_WEATHER_CONFIGS.day;
    }

    return null;
  }, [weatherMode, externalWeatherParams, apiWeatherParams, weatherError]);

  // Load and update models when they change
  useEffect(() => {
    if (!sceneInitialized || !sceneManager) return;

    models.forEach(modelItem => {
      const existingModel = loadedModelsMap.get(modelItem.id);
      
      if (existingModel) {
        // Update existing model's transform
        if (modelItem.position) {
          existingModel.position.set(modelItem.position.x, modelItem.position.y, modelItem.position.z);
        }
        if (modelItem.rotation) {
          existingModel.rotation.set(modelItem.rotation.x, modelItem.rotation.y, modelItem.rotation.z);
        }
        if (modelItem.scale) {
          existingModel.scale.set(modelItem.scale.x, modelItem.scale.y, modelItem.scale.z);
        }
      } else {
        // Load new model
        loadModel(modelItem);
      }
    });
    
    // Remove models that are no longer in the list
    Array.from(loadedModelsMap.keys()).forEach(modelId => {
      if (!models.find(m => m.id === modelId)) {
        removeModel(modelId);
      }
    });
  }, [sceneInitialized, sceneManager, models, loadedModelsMap, loadModel, removeModel]);

  // Update weather when params change
  useEffect(() => {
    if (sceneInitialized && finalWeatherParams) {
      console.log('🌤️ Applying weather to scene:', finalWeatherParams.weatherType);
      updateWeatherParams(finalWeatherParams);
    }
  }, [sceneInitialized, finalWeatherParams, updateWeatherParams]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full"
        style={{ backgroundColor: `#${themeConfig.backgroundColor.toString(16).padStart(6, '0')}` }}
      />

      {/* Cinematic Curtain / Loading Overlay (Light Mode) */}
      <div 
        className={`absolute inset-0 z-50 bg-[#f3f4f6] transition-opacity duration-[1500ms] ease-in-out pointer-events-none flex items-center justify-center ${
          showCurtain ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {showCurtain && (
          <RetroPanel className="p-8 pointer-events-auto">
            <div className="text-center">
              <div className="inline-block animate-spin text-3xl text-gray-400 mb-4">
                ⟳
              </div>
              <p className="text-sm text-gray-600 font-serif">
                {weatherLoading ? 'Analyzing Atmosphere...' : 'Loading space...'}
              </p>
            </div>
          </RetroPanel>
        )}
      </div>

      {/* Status Widget (Auto-hide) */}
      <div 
        className={`absolute bottom-4 right-4 z-10 transition-all duration-700 ${showCurtain ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
      >
        <div className="group relative flex justify-end items-end font-sans">
            {/* 1. Collapsed State: Small Icon Badge */}
            <div className={`
                absolute bottom-0 right-0 
                transition-all duration-300 ease-out origin-center
                group-hover:opacity-0 group-hover:scale-50 group-hover:pointer-events-none
                backdrop-blur-md border rounded-full w-8 h-8 flex items-center justify-center shadow-sm cursor-pointer
                ${weatherMode === 'night' ? 'bg-black/30 border-white/10 text-gray-300' : 'bg-white/30 border-white/40 text-gray-600'}
            `}>
                <span className="text-sm filter drop-shadow-sm leading-none">
                    {finalWeatherParams?.weatherType === 'sunny' && '☀️'}
                    {finalWeatherParams?.weatherType === 'cloudy' && '⛅'}
                    {finalWeatherParams?.weatherType === 'rainy' && '🌧️'}
                    {finalWeatherParams?.weatherType === 'stormy' && '⛈️'}
                    {finalWeatherParams?.weatherType === 'foggy' && '🌫️'}
                    {finalWeatherParams?.weatherType === 'snowy' && '❄️'}
                    {finalWeatherParams?.weatherType === 'clear' && '✨'}
                    {!finalWeatherParams && '🤖'}
                </span>
            </div>

            {/* 2. Expanded State: Full Card */}
            <div className={`
                transition-all duration-300 ease-out origin-bottom-right
                opacity-0 scale-90 translate-y-2 pointer-events-none
                group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto
                backdrop-blur-md border rounded-lg p-2 min-w-[140px]
                ${weatherMode === 'night' 
                  ? 'bg-black/60 border-white/10 text-gray-200 shadow-lg' 
                  : 'bg-white/60 border-white/50 text-gray-700 shadow-md'
                }
            `}>
            {/* Header Row: Mode & Refresh */}
            <div className="flex items-center justify-between mb-1 pb-1 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                {weatherMode === 'dynamic' ? (
                  <span className="text-[10px] font-bold tracking-wider text-current opacity-90">AI MODE</span>
                ) : (
                  <span className="text-[10px] font-bold tracking-wider opacity-70 uppercase">{weatherMode}</span>
                )}
              </div>
              
              {/* Manual refresh button */}
              {weatherMode === 'dynamic' && isDynamicMode && (
                <button
                  onClick={() => refreshWeather()}
                  disabled={weatherLoading}
                  className={`transition-all ${
                    weatherLoading 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:opacity-60 cursor-pointer active:scale-90'
                  }`}
                  title="Refresh"
                >
                  <span className={`block text-[10px] ${weatherLoading ? 'animate-spin' : ''}`}>
                    ↻
                  </span>
                </button>
              )}
            </div>

            {/* Weather Row */}
            {finalWeatherParams && (
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base filter drop-shadow-sm leading-none">
                    {finalWeatherParams.weatherType === 'sunny' && '☀️'}
                    {finalWeatherParams.weatherType === 'cloudy' && '⛅'}
                    {finalWeatherParams.weatherType === 'rainy' && '🌧️'}
                    {finalWeatherParams.weatherType === 'stormy' && '⛈️'}
                    {finalWeatherParams.weatherType === 'foggy' && '🌫️'}
                    {finalWeatherParams.weatherType === 'snowy' && '❄️'}
                    {finalWeatherParams.weatherType === 'clear' && '✨'}
                  </span>
                  <span className="text-[10px] font-medium capitalize">
                    {finalWeatherParams.weatherType}
                  </span>
                </div>
                <span className="text-[9px] opacity-50 italic">
                  {finalWeatherParams.mood}
                </span>
              </div>
            )}

            {/* Market Data (Dynamic Only) */}
            {weatherMode === 'dynamic' && chainData && (
              <div className="flex items-center justify-between text-[9px] font-mono pt-0.5 opacity-90">
                <span>SUI</span>
                <span className={chainData.sui.priceChange24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                  ${chainData.sui.price.toFixed(2)}
                  <span className="ml-1">
                    {chainData.sui.priceChange24h >= 0 ? '↑' : '↓'}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ThreeScene.displayName = "ThreeScene";
