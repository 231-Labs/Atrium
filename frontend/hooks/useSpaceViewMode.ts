import { useState } from 'react';
import { WeatherMode } from '@/types/theme';

type ViewMode = '3d' | 'landing';

/**
 * useSpaceViewMode - Unified view mode management (3D vs Landing)
 * Manages both view mode and weather mode for 3D scenes
 */
export function useSpaceViewMode(defaultMode: ViewMode = '3d', defaultWeather: WeatherMode = 'dynamic') {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);
  const [weatherMode, setWeatherMode] = useState<WeatherMode>(defaultWeather);

  const toggleViewMode = () => {
    setViewMode(prev => prev === '3d' ? 'landing' : '3d');
  };

  const set3DView = () => setViewMode('3d');
  const setLandingView = () => setViewMode('landing');

  return {
    viewMode,
    setViewMode,
    toggleViewMode,
    set3DView,
    setLandingView,
    weatherMode,
    setWeatherMode,
    is3DView: viewMode === '3d',
    isLandingView: viewMode === 'landing',
  };
}

