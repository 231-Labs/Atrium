import { useState, useEffect, useCallback, useRef } from 'react';
import { chainDataApi, ChainDataSnapshot } from '@/services/chainDataApi';
import { poeApi, SceneWeatherParams } from '@/services/poeApi';

export interface AIWeatherState {
  chainData: ChainDataSnapshot | null;
  weatherParams: SceneWeatherParams | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
}

export interface UseAIWeatherOptions {
  autoUpdate?: boolean;
  updateInterval?: number;
  onWeatherChange?: (params: SceneWeatherParams) => void;
  fetchOnMount?: boolean;
}

export function useAIWeather(options: UseAIWeatherOptions = {}) {
  const {
    autoUpdate = true,
    updateInterval = 5 * 60 * 1000,
    onWeatherChange,
    fetchOnMount = true,
  } = options;

  const [state, setState] = useState<AIWeatherState>({
    chainData: null,
    weatherParams: null,
    isLoading: false,
    error: null,
    lastUpdate: 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  const fetchWeather = useCallback(async () => {
    if (isUnmountedRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/ai-weather', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (isUnmountedRef.current) return;

      const weatherParams: SceneWeatherParams = {
        skyColor: data.skyColor,
        fogDensity: data.fogDensity,
        fogColor: data.fogColor,
        sunIntensity: data.sunIntensity,
        sunColor: data.sunColor,
        ambientIntensity: data.ambientIntensity,
        weatherType: data.weatherType,
        particleIntensity: data.particleIntensity,
        windSpeed: data.windSpeed,
        cloudSpeed: data.cloudSpeed,
        mood: data.mood,
        waterEffect: data.waterEffect,
        waterColor: data.waterColor,
        specialEvents: data.specialEvents,
        islandState: data.islandState,
        ambientEffects: data.ambientEffects,
        effectIntensity: data.effectIntensity,
        fishCount: data.fishCount,
        floatingOrbCount: data.floatingOrbCount,
        energyBeamIntensity: data.energyBeamIntensity,
        reasoning: data.reasoning,
        timestamp: data.timestamp,
      };

      const chainDataResponse = await chainDataApi.getChainDataSnapshot(false);

      setState({
        chainData: chainDataResponse,
        weatherParams,
        isLoading: false,
        error: null,
        lastUpdate: Date.now(),
      });

      if (onWeatherChange) {
        onWeatherChange(weatherParams);
      }
    } catch (error) {
      if (isUnmountedRef.current) return;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [onWeatherChange]);

  const refreshWeather = useCallback(() => {
    return fetchWeather();
  }, [fetchWeather]);

  useEffect(() => {
    isUnmountedRef.current = false;

    if (fetchOnMount) {
      fetchWeather();
    }

    if (autoUpdate && updateInterval > 0) {
      const scheduleNextUpdate = () => {
        timeoutRef.current = setTimeout(() => {
          fetchWeather().then(() => {
            if (!isUnmountedRef.current) {
              scheduleNextUpdate();
            }
          });
        }, updateInterval);
      };

      scheduleNextUpdate();
    }

    return () => {
      isUnmountedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoUpdate, updateInterval, fetchWeather, fetchOnMount]);

  return {
    chainData: state.chainData,
    weatherParams: state.weatherParams,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    refreshWeather,
    state,
  };
}

export function useAIWeatherOnce() {
  return useAIWeather({
    autoUpdate: false,
    fetchOnMount: true,
  });
}

export async function fetchAIWeather(): Promise<{
  chainData: ChainDataSnapshot;
  weatherParams: SceneWeatherParams;
}> {
  const chainData = await chainDataApi.getChainDataSnapshot(true);
  const weatherParams = await poeApi.generateSceneParams(chainData);
  return { chainData, weatherParams };
}

