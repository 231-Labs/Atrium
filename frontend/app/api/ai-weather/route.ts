/**
 * AI Weather API Route
 * Backend unified POE API calls, controls usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { chainDataApi } from '@/services/chainDataApi';
import { buildSceneGenerationPrompt } from '@/config/aiPrompts';
import { getTimeFactors } from '@/services/timeFactors';
import type { SceneWeatherParams } from '@/services/poeApi';

// Cache config
// Reduced cache duration for debugging (was 5 * 60 * 1000)
const CACHE_DURATION = 10 * 1000; // 10 seconds
let cachedWeatherData: {
  data: SceneWeatherParams;
  timestamp: number;
} | null = null;

// Rate limiting (simple version)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 60 * 1000; // Max 1 request per minute

/**
 * GET /api/ai-weather
 * Get current weather parameters
 */
export async function GET(request: NextRequest) {
  try {
    const now = Date.now();

    // 1. Check cache
    if (cachedWeatherData && (now - cachedWeatherData.timestamp) < CACHE_DURATION) {
      console.log('📦 Returning cached weather data');
      return NextResponse.json({
        ...cachedWeatherData.data,
        cached: true,
        cacheAge: Math.floor((now - cachedWeatherData.timestamp) / 1000),
      });
    }

    // 2. Rate limiting
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - (now - lastRequestTime)) / 1000);
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: `Please wait ${waitTime} seconds before requesting again`,
          waitSeconds: waitTime,
        },
        { status: 429 }
      );
    }

    lastRequestTime = now;

    // 3. Get chain data (use cache if available)
    console.log('🔍 Fetching crypto data...');
    const chainData = await chainDataApi.getChainDataSnapshot(false);

    // 4. Call POE API (if configured)
    const POE_API_KEY = process.env.POE_API_KEY || process.env.NEXT_PUBLIC_POE_API_KEY;
    let weatherParams: SceneWeatherParams;

    if (POE_API_KEY) {
      console.log('🤖 Calling POE API from backend...');
      
      const timeFactors = getTimeFactors();
      console.log('⏰ Time factors:', {
        specialDate: timeFactors.specialDate?.name,
        timeTendency: timeFactors.timeTendency.description,
        randomEvent: timeFactors.randomEvent?.name,
      });
      
      const prompt = buildSceneGenerationPrompt(chainData, timeFactors);
      
      const response = await fetch('https://api.poe.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${POE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'Claude-3-Haiku',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`POE API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';
      
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        weatherParams = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }

      console.log('✅ AI weather generated successfully');
    } else {
      console.log('📦 Using fallback logic (no API key)');
      weatherParams = generateFallbackWeather(chainData);
    }

    // 5. Update cache
    cachedWeatherData = {
      data: weatherParams,
      timestamp: now,
    };

    return NextResponse.json({
      ...weatherParams,
      cached: false,
    });

  } catch (error) {
    console.error('❌ AI Weather API error:', error);
    
    // Return cached data if available
    if (cachedWeatherData) {
      return NextResponse.json({
        ...cachedWeatherData.data,
        cached: true,
        stale: true,
        cacheAge: Math.floor((Date.now() - cachedWeatherData.timestamp) / 1000),
      });
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate weather',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-weather/refresh
 * Force refresh weather data (requires auth)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';
    
    if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Clear cache
    cachedWeatherData = null;
    lastRequestTime = 0;

    return NextResponse.json({
      message: 'Cache cleared, next request will fetch fresh data',
      success: true,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to refresh' },
      { status: 500 }
    );
  }
}

/**
 * Fallback weather generation logic (using weighted calculation)
 */
function generateFallbackWeather(chainData: any): SceneWeatherParams {
  const change = chainData.aggregatedMetrics.averageChange; // Already weighted average
  const volatility = chainData.aggregatedMetrics.volatility;
  
  // Calculate parametric elements based on market data
  const totalVolume = (
    (chainData.sui?.volume24h || 0) +
    (chainData.wal?.volume24h || 0) +
    (chainData.btc?.volume24h || 0) +
    (chainData.eth?.volume24h || 0)
  ) / 1e9; // Convert to billions
  
  const fishCount = Math.min(100, Math.floor(totalVolume / 2)); // Fish based on volume
  const floatingOrbCount = Math.min(30, Math.max(5, Math.floor(chainData.aggregatedMetrics.trendingStrength * 3))); // Orbs based on trending
  const energyBeamIntensity = Math.min(1, Math.abs(change) / 10); // Beams based on price change
  
  let weatherType: SceneWeatherParams['weatherType'] = 'cloudy';
  let mood: SceneWeatherParams['mood'] = 'calm';
  let skyColor = '#F0F8FF'; // Alice Blue - soft sky color
  let specialEvents: SceneWeatherParams['specialEvents'] = ['none'];
  let waterEffect: SceneWeatherParams['waterEffect'] = 'ripples';
  let waterColor = '#4DA6FF';
  let islandState: SceneWeatherParams['islandState'] = 'normal';
  let ambientEffects: SceneWeatherParams['ambientEffects'] = ['birds_flying'];
  
  if (volatility > 8) {
    weatherType = 'foggy';
    mood = 'mysterious';
    skyColor = '#D4DCE8'; // Soft gray-blue
    specialEvents = ['lightning'];
    waterEffect = 'turbulent';
    ambientEffects = ['dust_particles'];
  } else if (change > 5) {
    weatherType = 'sunny';
    mood = 'energetic';
    skyColor = '#FFF8DC'; // Cornsilk - soft cream color
    specialEvents = ['meteor_shower', 'aurora'];
    waterEffect = 'ripples';
    waterColor = '#87CEFA'; // Light Sky Blue
    islandState = 'glowing';
    ambientEffects = ['birds_flying', 'sparkles'];
  } else if (change > 0) {
    weatherType = 'cloudy';
    mood = 'calm';
    skyColor = '#F0F8FF'; // Alice Blue
    waterEffect = 'ripples';
    ambientEffects = ['birds_flying'];
  } else if (change > -5) {
    weatherType = 'rainy';
    mood = 'melancholic';
    skyColor = '#556B7A'; // 稍微調亮的冷灰藍色，保持陰冷但不過暗
    specialEvents = ['shooting_star'];
    waterEffect = 'waves';
    waterColor = '#3B4F5E'; // 稍微調亮的深藍灰色
    ambientEffects = ['dust_particles'];
  } else {
    weatherType = 'stormy';
    mood = 'chaotic';
    skyColor = '#2F4F4F'; // Dark Slate Gray
    specialEvents = ['fireball', 'lightning'];
    waterEffect = 'turbulent';
    waterColor = '#1C2841';
    islandState = 'smoking';
    ambientEffects = ['embers'];
  }
  
  console.log(`🐟 Fallback: Creating ${fishCount} fish from $${totalVolume.toFixed(1)}B volume, ${floatingOrbCount} orbs, ${energyBeamIntensity.toFixed(2)} beam intensity`);
  
  // Weather-specific adjustments for atmosphere
  let fogDensity = Math.min(0.8, volatility / 15);
  let fogColor = '#CCCCCC';
  let sunIntensity = change > 0 ? 1.5 : 0.8;
  let sunColor = '#FFE4B5';
  let ambientIntensity = 0.5;
  let particleIntensity = Math.min(1, Math.abs(change) / 20);
  
  // Apply weather-specific overrides for stronger atmosphere
  if (weatherType === 'rainy' || weatherType === 'stormy') {
    // Rainy/Stormy: Cold, but slightly brighter for visibility
    fogDensity = Math.max(0.4, Math.min(0.75, volatility / 12)); // 稍微降低霧密度
    fogColor = weatherType === 'rainy' ? '#5A6B7A' : '#3D4854'; // 稍微調亮的冷灰色霧
    sunIntensity = weatherType === 'rainy' ? 0.55 : 0.3; // 提高一點光照（從 0.4 到 0.55）
    sunColor = '#9AABB8'; // 稍微亮一點的冷色光
    ambientIntensity = weatherType === 'rainy' ? 0.4 : 0.3; // 提高環境光（從 0.3 到 0.4）
    particleIntensity = Math.max(0.5, Math.min(1, Math.abs(change) / 15)); // More rain particles
  } else if (weatherType === 'foggy') {
    // Foggy: Dense, mysterious
    fogDensity = Math.max(0.6, Math.min(0.9, volatility / 10));
    fogColor = '#B0BEC5';
    sunIntensity = 0.5;
    ambientIntensity = 0.35;
  }
  
  return {
    skyColor,
    fogDensity,
    fogColor,
    sunIntensity,
    sunColor,
    ambientIntensity,
    weatherType,
    particleIntensity,
    windSpeed: Math.min(10, volatility),
    cloudSpeed: Math.min(5, volatility / 2),
    mood,
    waterEffect,
    waterColor,
    specialEvents,
    islandState,
    ambientEffects,
    effectIntensity: Math.min(1, Math.abs(change) / 10 + volatility / 20),
    fishCount,
    floatingOrbCount,
    energyBeamIntensity,
    reasoning: `Fallback (SUI weight 40%): ${change.toFixed(2)}% weighted avg, ${volatility.toFixed(2)} volatility, ${fishCount} fish from $${totalVolume.toFixed(1)}B volume`,
    timestamp: Date.now(),
  };
}

