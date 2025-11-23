/**
 * AI 天氣指示器組件
 * 顯示當前天氣狀況和鏈上數據
 */

"use client";

import { useAIWeather } from './hooks/useAIWeather';
import { RetroPanel } from '../common/RetroPanel';

interface AIWeatherIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function AIWeatherIndicator({ className = '', showDetails = false }: AIWeatherIndicatorProps) {
  const { weatherParams, chainData, isLoading, lastUpdate } = useAIWeather({
    autoUpdate: true,
    updateInterval: 5 * 60 * 1000,
  });

  if (isLoading && !weatherParams) {
    return (
      <RetroPanel className={`p-3 ${className}`}>
        <div className="text-xs text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
          Loading weather...
        </div>
      </RetroPanel>
    );
  }

  if (!weatherParams || !chainData) {
    return null;
  }

  const getWeatherEmoji = () => {
    switch (weatherParams.weatherType) {
      case 'sunny': return '☀️';
      case 'cloudy': return '⛅';
      case 'rainy': return '🌧️';
      case 'stormy': return '⛈️';
      case 'foggy': return '🌫️';
      case 'snowy': return '❄️';
      default: return '🌤️';
    }
  };

  const getMoodEmoji = () => {
    switch (weatherParams.mood) {
      case 'energetic': return '⚡';
      case 'melancholic': return '😔';
      case 'mysterious': return '🔮';
      case 'chaotic': return '🌀';
      case 'calm': return '😌';
      default: return '';
    }
  };

  const timeSinceUpdate = Math.floor((Date.now() - lastUpdate) / 1000 / 60); // minutes

  return (
    <RetroPanel className={`${className}`}>
      <div className="p-3 space-y-2" style={{ fontFamily: 'Georgia, serif' }}>
        {/* 天氣狀態 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getWeatherEmoji()}</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 capitalize">
                {weatherParams.weatherType}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>{getMoodEmoji()}</span>
                <span className="capitalize">{weatherParams.mood}</span>
              </div>
            </div>
          </div>
          {timeSinceUpdate < 60 && (
            <div className="text-xs text-gray-400">
              {timeSinceUpdate}m ago
            </div>
          )}
        </div>

        {/* 市場數據 */}
        {showDetails && (
          <div className="border-t border-gray-200 pt-2 space-y-1">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Market Data
            </div>
            {[
              { name: 'BTC', data: chainData.btc },
              { name: 'ETH', data: chainData.eth },
              { name: 'SUI', data: chainData.sui },
            ].map(({ name, data }) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 font-mono">
                    ${data.price.toFixed(name === 'SUI' ? 4 : 0)}
                  </span>
                  <span className={`font-mono ${data.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.priceChange24h >= 0 ? '↑' : '↓'}
                    {Math.abs(data.priceChange24h).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
            
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Sentiment:</span>{' '}
                <span className="capitalize">{chainData.aggregatedMetrics.marketSentiment}</span>
              </div>
            </div>
          </div>
        )}

        {/* AI 推理 */}
        {showDetails && weatherParams.reasoning && (
          <div className="border-t border-gray-200 pt-2">
            <div className="text-xs text-gray-500 italic">
              "{weatherParams.reasoning}"
            </div>
          </div>
        )}
      </div>
    </RetroPanel>
  );
}

