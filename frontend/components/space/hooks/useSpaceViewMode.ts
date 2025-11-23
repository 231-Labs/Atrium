import { useState } from 'react';
import { WeatherMode } from '@/types/theme';

type ViewMode = '3d' | 'landing';

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

