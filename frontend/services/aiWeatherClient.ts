/**
 * AI Weather Client Service
 * 從後端 API 獲取天氣數據（替代直接調用 POE API）
 */

import type { SceneWeatherParams } from './poeApi';

export interface WeatherAPIResponse extends SceneWeatherParams {
  cached: boolean;
  cacheAge?: number;
  stale?: boolean;
}

/**
 * 從後端 API 獲取天氣數據
 */
export async function fetchWeatherFromAPI(): Promise<WeatherAPIResponse> {
  try {
    const response = await fetch('/api/ai-weather', {
      method: 'GET',
      cache: 'no-store', // 不使用瀏覽器緩存
    });

    if (!response.ok) {
      if (response.status === 429) {
        const data = await response.json();
        throw new Error(`Rate limit: ${data.message}`);
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch weather from API:', error);
    throw error;
  }
}

/**
 * 強制刷新天氣數據（需要管理員權限）
 */
export async function refreshWeatherCache(adminToken: string): Promise<void> {
  try {
    const response = await fetch('/api/ai-weather/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh cache');
    }
  } catch (error) {
    console.error('❌ Failed to refresh weather cache:', error);
    throw error;
  }
}

/**
 * 訂閱天氣更新（輪詢）
 */
export function subscribeToWeatherUpdates(
  callback: (weather: WeatherAPIResponse) => void,
  intervalMs: number = 5 * 60 * 1000
): () => void {
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const weather = await fetchWeatherFromAPI();
      callback(weather);
    } catch (error) {
      console.error('Weather update failed:', error);
    }

    if (isActive) {
      setTimeout(poll, intervalMs);
    }
  };

  // 立即執行第一次
  poll();

  // 返回取消訂閱函數
  return () => {
    isActive = false;
  };
}

