"use client";

import { useThreeScene } from '@/hooks/three/useThreeScene';
import { useAIWeather } from '@/hooks/useAIWeather';
import { timeFactors } from '@/services/timeFactors';
import { Model3DItem, ThreeSceneApi } from '@/types/three';
import { WeatherMode, STAGE_THEMES, STATIC_WEATHER_CONFIGS } from '@/types/theme';
import { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';

interface ThreeSceneProps {
  spaceId?: string;
  models?: Model3DItem[];
  enableGallery?: boolean;
  className?: string;
  weatherMode?: WeatherMode;
  weatherParams?: any;
  onWeatherModeChange?: (mode: WeatherMode) => void;
}

export const ThreeScene = forwardRef<ThreeSceneApi, ThreeSceneProps>(({ 
  spaceId, 
  models = [], 
  enableGallery = true, 
  className = '', 
  weatherMode: controlledWeatherMode,
  weatherParams: externalWeatherParams,
  onWeatherModeChange,
}, ref) => {
  const [internalWeatherMode, setInternalWeatherMode] = useState<WeatherMode>('dynamic');
  const weatherMode = controlledWeatherMode ?? internalWeatherMode;

  const themeConfig = useMemo(() => {
    if (weatherMode === 'night') return STAGE_THEMES.dark;
    return STAGE_THEMES.light;
  }, [weatherMode]);

  // Memoize scene options to prevent re-initialization
  const sceneOptions = useMemo(() => ({
    backgroundColor: themeConfig.backgroundColor,
    cameraPosition: [25, 25, 25] as [number, number, number],
    enableGallery,
    enableShadows: true,
    theme: themeConfig,
  }), [enableGallery, themeConfig]);

  const {
    canvasRef,
    sceneInitialized,
    isLoading,
    loadModel,
    loadModels,
    removeModel,
    clearModels,
    updateWeatherParams,
    attachTransformControls,
    detachTransformControls,
    setTransformMode,
    pickObject,
    getSceneState
  } = useThreeScene(sceneOptions);

  // Expose API via ref
  useImperativeHandle(ref, () => ({
    loadModel,
    loadModels,
    removeModel,
    clearModels,
    attachTransformControls,
    detachTransformControls,
    setTransformMode,
    pickObject,
    getSceneState,
    canvas: canvasRef.current
  }));

  const isDynamicMode = weatherMode === 'dynamic' && !externalWeatherParams;
  const { weatherParams: apiWeatherParams, chainData, isLoading: weatherLoading, refreshWeather, lastUpdate } = useAIWeather({
    autoUpdate: isDynamicMode,
    updateInterval: 5 * 60 * 1000, // 5分鐘更新一次
    fetchOnMount: isDynamicMode && sceneInitialized,
  });

  const finalWeatherParams = useMemo(() => {
    if (externalWeatherParams) return externalWeatherParams;
    if (weatherMode === 'day') return STATIC_WEATHER_CONFIGS.day;
    if (weatherMode === 'night') return STATIC_WEATHER_CONFIGS.night;
    
    // Apply time-based overrides for dynamic mode
    if (apiWeatherParams) {
      return timeFactors.applyTimeOverrides(apiWeatherParams);
    }
    
    return apiWeatherParams;
  }, [weatherMode, externalWeatherParams, apiWeatherParams]);

  // Load models when they change
  useEffect(() => {
    if (sceneInitialized && models.length > 0) {
      loadModels(models);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneInitialized, models.length]);

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

      {/* Loading indicator */}
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center ${themeConfig.loadingBg} bg-opacity-90`}>
          <div className="text-center">
            <div className={`inline-block w-8 h-8 border-3 ${themeConfig.loadingSpinnerColors.join(' ')} rounded-full animate-spin mb-2`}></div>
            <p className={`text-sm ${themeConfig.loadingTextColor}`} style={{ fontFamily: 'Georgia, serif' }}>
              Preparing stage...
            </p>
          </div>
        </div>
      )}

      <div className={`absolute bottom-4 right-4 text-xs ${weatherMode === 'night' ? 'text-gray-500' : 'text-gray-400'}`} style={{ fontFamily: 'Georgia, serif' }}>
        <div className="flex items-center gap-2">
          <span className="pointer-events-none">Atrium Stage</span>
          {weatherMode === 'dynamic' && <span className="text-blue-400 pointer-events-none">· 🤖 Dynamic</span>}
          {weatherMode === 'day' && <span className="text-amber-400 pointer-events-none">· ☀️ Day</span>}
          {weatherMode === 'night' && <span className="text-indigo-400 pointer-events-none">· 🌙 Night</span>}
          
          {/* Manual refresh button for dynamic mode */}
          {weatherMode === 'dynamic' && isDynamicMode && (
            <button
              onClick={() => refreshWeather()}
              disabled={weatherLoading}
              className={`ml-2 px-2 py-0.5 rounded text-[10px] transition-colors pointer-events-auto ${
                weatherLoading 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 cursor-pointer'
              }`}
              title="手動刷新天氣"
            >
              {weatherLoading ? '⏳' : '🔄'}
            </button>
          )}
        </div>
        {finalWeatherParams && (
          <div className="mt-1 flex items-center gap-2 pointer-events-none">
            <span>
              {finalWeatherParams.weatherType === 'sunny' && '☀️'}
              {finalWeatherParams.weatherType === 'cloudy' && '⛅'}
              {finalWeatherParams.weatherType === 'rainy' && '🌧️'}
              {finalWeatherParams.weatherType === 'stormy' && '⛈️'}
              {finalWeatherParams.weatherType === 'foggy' && '🌫️'}
              {finalWeatherParams.weatherType === 'snowy' && '❄️'}
              {finalWeatherParams.weatherType === 'clear' && '✨'}
            </span>
            <span className="capitalize">{finalWeatherParams.weatherType}</span>
            {weatherMode === 'dynamic' && chainData && (
              <span className="ml-2 opacity-60">
                SUI ${chainData.sui.price.toFixed(4)} 
                {chainData.sui.priceChange24h >= 0 ? ' ↑' : ' ↓'}
                {Math.abs(chainData.sui.priceChange24h).toFixed(1)}%
              </span>
            )}
          </div>
        )}
        {weatherMode === 'dynamic' && lastUpdate > 0 && (
          <div className="mt-1 opacity-50 pointer-events-none text-[10px]">
            更新於 {new Date(lastUpdate).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        {weatherMode === 'dynamic' && weatherLoading && (
          <div className="mt-1 text-blue-400 pointer-events-none">⏳ 正在獲取天氣數據...</div>
        )}
      </div>
    </div>
  );
});

ThreeScene.displayName = "ThreeScene";
