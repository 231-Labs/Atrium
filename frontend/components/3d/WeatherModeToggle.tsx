"use client";

import { WeatherMode } from '@/types/theme';
import { RetroButton } from '@/components/common/RetroButton';

interface WeatherModeToggleProps {
  currentMode: WeatherMode;
  onModeChange: (mode: WeatherMode) => void;
  showAi?: boolean;
}

export function WeatherModeToggle({ currentMode, onModeChange, showAi = true }: WeatherModeToggleProps) {
  return (
    <div className="flex gap-1">
      {showAi && (
        <RetroButton
          onClick={() => onModeChange('dynamic')}
          variant={currentMode === 'dynamic' ? 'primary' : 'secondary'}
          size="sm"
          title="AI Dynamic Weather Mode"
        >
          🤖
        </RetroButton>
      )}
      <RetroButton
        onClick={() => onModeChange('day')}
        variant={currentMode === 'day' ? 'primary' : 'secondary'}
        size="sm"
        title="Fixed Day Mode"
      >
        ☀️
      </RetroButton>
      <RetroButton
        onClick={() => onModeChange('night')}
        variant={currentMode === 'night' ? 'primary' : 'secondary'}
        size="sm"
        title="Fixed Night Mode"
      >
        🌙
      </RetroButton>
    </div>
  );
}

