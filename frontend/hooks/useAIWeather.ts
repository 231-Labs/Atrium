/**
 * AI Weather System Hook
 * Integrates chain data -> LLM generation -> 3D scene weather updates
 */

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
  /**
   * Enable auto-update
   */
  autoUpdate?: boolean;
  
  /**
   * Update interval (milliseconds), default 5 minutes
   */
  updateInterval?: number;
  
  /**
   * Weather change callback
   */
  onWeatherChange?: (params: SceneWeatherParams) => void;
  
  /**
   * Fetch immediately on mount
   */
  fetchOnMount?: boolean;
}

/**
 * AI Weather System Hook
 * 
 * Usage example:
 * ```tsx
 * const { weatherParams, chainData, refreshWeather } = useAIWeather({
 *   autoUpdate: true,
 *   updateInterval: 5 * 60 * 1000, // 5 minutes
 *   onWeatherChange: (params) => {
 *     console.log('Weather updated:', params);
 *   }
 * });
 * ```
 */
export function useAIWeather(options: UseAIWeatherOptions = {}) {
  const {
    autoUpdate = true,
    updateInterval = 5 * 60 * 1000, // 5 minutes
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

  /**
   * Fetch and generate new weather data (via backend API)
   */
  const fetchWeather = useCallback(async () => {
    if (isUnmountedRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🌤️ Fetching AI weather data from backend...');

      // Call backend API, which handles CoinGecko and POE API calls
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

      // Backend returns weather parameters and cache info
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
        // Parametric visual elements (NEW!)
        fishCount: data.fishCount,
        floatingOrbCount: data.floatingOrbCount,
        energyBeamIntensity: data.energyBeamIntensity,
        reasoning: data.reasoning,
        timestamp: data.timestamp,
      };

      // Get chain data from backend (optional, for display)
      const chainDataResponse = await chainDataApi.getChainDataSnapshot(false);

      setState({
        chainData: chainDataResponse,
        weatherParams,
        isLoading: false,
        error: null,
        lastUpdate: Date.now(),
      });

      // Notify callback
      if (onWeatherChange) {
        onWeatherChange(weatherParams);
      }

      console.log('✅ AI weather updated successfully', {
        weatherType: weatherParams.weatherType,
        mood: weatherParams.mood,
        skyColor: weatherParams.skyColor, // Added log for sky color
        reasoning: weatherParams.reasoning,
        cached: data.cached,
      });

    } catch (error) {
      console.error('❌ Failed to fetch AI weather:', error);
      
      if (isUnmountedRef.current) return;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [onWeatherChange]);

  /**
   * Manual weather refresh
   */
  const refreshWeather = useCallback(() => {
    return fetchWeather();
  }, [fetchWeather]);

  /**
   * Initialization and auto-update
   */
  useEffect(() => {
    isUnmountedRef.current = false;

    // Fetch on mount
    if (fetchOnMount) {
      fetchWeather();
    }

    // Setup auto-update
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

    // Cleanup
    return () => {
      isUnmountedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoUpdate, updateInterval, fetchWeather, fetchOnMount]);

  return {
    /**
     * Current chain data
     */
    chainData: state.chainData,
    
    /**
     * Current weather parameters
     */
    weatherParams: state.weatherParams,
    
    /**
     * Loading state
     */
    isLoading: state.isLoading,
    
    /**
     * Error message
     */
    error: state.error,
    
    /**
     * Last update timestamp
     */
    lastUpdate: state.lastUpdate,
    
    /**
     * Manual weather refresh
     */
    refreshWeather,
    
    /**
     * Weather system state
     */
    state,
  };
}

/**
 * Simplified Hook - fetch weather data only once
 */
export function useAIWeatherOnce() {
  return useAIWeather({
    autoUpdate: false,
    fetchOnMount: true,
  });
}

/**
 * Static utility function - fetch weather without using Hook
 */
export async function fetchAIWeather(): Promise<{
  chainData: ChainDataSnapshot;
  weatherParams: SceneWeatherParams;
}> {
  const chainData = await chainDataApi.getChainDataSnapshot(true);
  const weatherParams = await poeApi.generateSceneParams(chainData);
  return { chainData, weatherParams };
}

