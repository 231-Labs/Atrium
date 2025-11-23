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
// Use 5 minutes cache, but time factors will still vary based on hour/day
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
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
      console.log('📋 Prompt sent to AI (first 500 chars):', prompt.substring(0, 500) + '...');
      console.log('📋 Full prompt length:', prompt.length, 'characters');
      
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
        const errorText = await response.text();
        console.error('❌ POE API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`POE API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';
      
      console.log('📝 POE AI Raw Response:', aiResponse);
      console.log('📊 POE API Response Data:', JSON.stringify(data, null, 2));
      
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          weatherParams = JSON.parse(jsonMatch[0]);
          console.log('✅ AI weather generated successfully');
          console.log('🌤️ Parsed Weather Params:', JSON.stringify(weatherParams, null, 2));
        } catch (parseError) {
          console.error('❌ Failed to parse AI JSON response:', parseError);
          console.error('📄 JSON Match:', jsonMatch[0]);
          throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      } else {
        console.error('❌ No JSON found in AI response');
        console.error('📄 Full AI Response:', aiResponse);
        throw new Error('Failed to parse AI response - no JSON found');
      }
    } else {
      console.log('📦 Using fallback logic (no API key)');
      const timeFactors = getTimeFactors();
      weatherParams = generateFallbackWeather(chainData, timeFactors);
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
 * Fallback weather generation logic (using weighted calculation + time factors)
 */
function generateFallbackWeather(chainData: any, timeFactors?: any): SceneWeatherParams {
  const change = chainData.aggregatedMetrics.averageChange; // Already weighted average
  const volatility = chainData.aggregatedMetrics.volatility;
  const fearGreedValue = chainData.aggregatedMetrics.fearGreedValue; // Fear & Greed Index (0-100)
  const fearGreedIndex = chainData.fearGreedIndex;
  
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
  
  // Apply time factors for variety (even when market is stable)
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Time-based variation: add randomness based on hour and day
  const timeVariation = (hour % 6) * 0.5; // Changes every 6 hours
  const dayVariation = dayOfWeek * 0.3; // Changes by day
  const combinedVariation = timeVariation + dayVariation;
  
  // Adjust market change with time variation for more dynamic weather
  const adjustedChange = change + combinedVariation;
  
  // Apply Fear & Greed Index influence (if available)
  let fearGreedAdjustment = 0;
  if (fearGreedValue !== undefined) {
    // Map Fear & Greed (0-100) to weather adjustment (-5 to +5)
    fearGreedAdjustment = (fearGreedValue - 50) / 10; // -5 to +5
  }
  
  const finalAdjustedChange = adjustedChange + fearGreedAdjustment;
  
  let weatherType: SceneWeatherParams['weatherType'] = 'cloudy';
  let mood: SceneWeatherParams['mood'] = 'calm';
  let skyColor = '#F0F8FF'; // Alice Blue - soft sky color
  let specialEvents: SceneWeatherParams['specialEvents'] = ['none'];
  let waterEffect: SceneWeatherParams['waterEffect'] = 'ripples';
  let waterColor = '#4DA6FF';
  let islandState: SceneWeatherParams['islandState'] = 'normal';
  let ambientEffects: SceneWeatherParams['ambientEffects'] = ['birds_flying'];
  
  // Override based on Fear & Greed Index if available
  if (fearGreedValue !== undefined) {
    if (fearGreedValue <= 24) {
      // Extreme Fear: Dark, stormy
      weatherType = 'stormy';
      mood = 'chaotic';
      skyColor = '#1C1C1C'; // Very dark
      waterColor = '#0F1419';
      specialEvents = ['lightning', 'fireball'];
      waterEffect = 'turbulent';
      islandState = 'smoking';
      ambientEffects = ['embers', 'dust_particles'];
    } else if (fearGreedValue <= 44) {
      // Fear: Cloudy, rainy
      weatherType = 'rainy';
      mood = 'melancholic';
      skyColor = '#556B7A';
      waterColor = '#3B4F5E';
      specialEvents = ['shooting_star'];
      waterEffect = 'waves';
      ambientEffects = ['dust_particles'];
    } else if (fearGreedValue >= 76) {
      // Extreme Greed: Very bright, celebratory
      weatherType = 'sunny';
      mood = 'energetic';
      skyColor = '#FFF8DC'; // Bright cream
      waterColor = '#87CEEB'; // Light sky blue
      specialEvents = ['meteor_shower', 'aurora', 'rainbow'];
      waterEffect = 'ripples';
      islandState = 'glowing';
      ambientEffects = ['confetti', 'sparkles', 'birds_flying'];
    } else if (fearGreedValue >= 56) {
      // Greed: Bright, sunny
      weatherType = 'sunny';
      mood = 'energetic';
      skyColor = '#F0F8FF';
      waterColor = '#4DA6FF';
      specialEvents = ['meteor_shower', 'aurora'];
      waterEffect = 'ripples';
      islandState = 'glowing';
      ambientEffects = ['sparkles', 'birds_flying'];
    }
    // Neutral (45-55) uses default market-based logic below
  }
  
  // Apply special date events if available
  if (timeFactors?.specialDate) {
    const specialDate = timeFactors.specialDate;
    if (specialDate.sceneEffect.specialEvents && Array.isArray(specialDate.sceneEffect.specialEvents)) {
      specialEvents = specialDate.sceneEffect.specialEvents as any;
    }
    if (specialDate.sceneEffect.skyColorOverride) {
      skyColor = specialDate.sceneEffect.skyColorOverride;
    }
    if (specialDate.sceneEffect.ambientEffects && Array.isArray(specialDate.sceneEffect.ambientEffects)) {
      ambientEffects = specialDate.sceneEffect.ambientEffects as any;
    }
  }
  
  // Apply random events for variety
  if (timeFactors?.randomEvent) {
    const randomEvent = timeFactors.randomEvent;
    if (randomEvent.sceneEffect.specialEvents && Array.isArray(randomEvent.sceneEffect.specialEvents) && specialEvents && specialEvents[0] === 'none') {
      specialEvents = randomEvent.sceneEffect.specialEvents as any;
    }
    if (randomEvent.sceneEffect.ambientEffects && Array.isArray(randomEvent.sceneEffect.ambientEffects)) {
      ambientEffects = [...(ambientEffects || []), ...(randomEvent.sceneEffect.ambientEffects as any)];
    }
  }
  
  // Apply time-based mood and effects
  if (timeFactors?.timeTendency) {
    const timeTendency = timeFactors.timeTendency;
    if (timeTendency.moodTendency && Math.abs(change) < 2) {
      // Only override mood if market is relatively stable
      mood = timeTendency.moodTendency as any;
    }
  }
  
  // Weekend effect: more positive vibes
  if (isWeekend && Math.abs(change) < 3) {
    if (specialEvents && specialEvents[0] === 'none') {
      specialEvents = ['shooting_star'];
    }
    if (!ambientEffects || ambientEffects.length === 0) {
      ambientEffects = ['birds_flying', 'sparkles'];
    } else {
      ambientEffects = [...ambientEffects, 'birds_flying', 'sparkles'];
    }
  }
  
  // Only apply market-based logic if Fear & Greed didn't override (neutral range or not available)
  const shouldUseMarketLogic = fearGreedValue === undefined || (fearGreedValue >= 45 && fearGreedValue <= 55);
  
  if (shouldUseMarketLogic) {
    if (volatility > 8) {
      weatherType = 'foggy';
      mood = 'mysterious';
      skyColor = '#D4DCE8'; // Soft gray-blue
      specialEvents = ['lightning'];
      waterEffect = 'turbulent';
      ambientEffects = ['dust_particles'];
    } else if (finalAdjustedChange > 5) {
    weatherType = 'sunny';
    mood = 'energetic';
    skyColor = '#FFF8DC'; // Cornsilk - soft cream color
    specialEvents = ['meteor_shower', 'aurora'];
    waterEffect = 'ripples';
    waterColor = '#87CEFA'; // Light Sky Blue
    islandState = 'glowing';
    ambientEffects = ['birds_flying', 'sparkles'];
    } else if (finalAdjustedChange > 0) {
      weatherType = 'cloudy';
      mood = 'calm';
      skyColor = '#F0F8FF'; // Alice Blue
      waterEffect = 'ripples';
      // Keep ambient effects from time factors if set
      if (!ambientEffects || ambientEffects.length === 0 || ambientEffects[0] === 'none') {
        ambientEffects = ['birds_flying'];
      }
    } else if (finalAdjustedChange > -5) {
      weatherType = 'rainy';
      mood = 'melancholic';
      skyColor = '#556B7A';
      specialEvents = ['shooting_star'];
      waterEffect = 'waves';
      waterColor = '#3B4F5E';
      ambientEffects = ['dust_particles'];
    } else {
      weatherType = 'stormy';
      mood = 'chaotic';
      skyColor = '#2F4F4F';
      specialEvents = ['fireball', 'lightning'];
      waterEffect = 'turbulent';
      waterColor = '#1C2841';
      islandState = 'smoking';
      ambientEffects = ['embers'];
    }
  }
  
  console.log(`🐟 Fallback: Creating ${fishCount} fish from $${totalVolume.toFixed(1)}B volume, ${floatingOrbCount} orbs, ${energyBeamIntensity.toFixed(2)} beam intensity`);
  
  // Weather-specific adjustments for atmosphere
  let fogDensity = Math.min(0.8, volatility / 15);
  let fogColor = '#CCCCCC';
  let sunIntensity = change > 0 ? 1.5 : 0.8;
  let sunColor = '#FFE4B5';
  let ambientIntensity = 0.5;
  let particleIntensity = Math.min(1, Math.abs(change) / 20);
  
  // Apply time-based sky color override (if not already overridden by special date)
  if (timeFactors?.timeTendency?.skyColorModifier && !timeFactors?.specialDate) {
    // Blend time-based color with market-based color for smooth transitions
    const timeColor = timeFactors.timeTendency.skyColorModifier;
    if (hour >= 20 || hour < 5) {
      // Night: use time color directly
      skyColor = timeColor;
    } else if (hour >= 5 && hour < 7) {
      // Dawn: blend
      skyColor = timeColor;
    } else if (hour >= 18 && hour < 20) {
      // Dusk: blend
      skyColor = timeColor;
    }
  }
  
  // Apply weather-specific overrides for stronger atmosphere
  if (weatherType === 'rainy' || weatherType === 'stormy') {
    // Rainy/Stormy: Cold, but slightly brighter for visibility
    fogDensity = Math.max(0.4, Math.min(0.75, volatility / 12));
    fogColor = weatherType === 'rainy' ? '#5A6B7A' : '#3D4854';
    sunIntensity = weatherType === 'rainy' ? 0.55 : 0.3;
    sunColor = '#9AABB8';
    ambientIntensity = weatherType === 'rainy' ? 0.4 : 0.3;
    particleIntensity = Math.max(0.5, Math.min(1, Math.abs(adjustedChange) / 15));
  } else if (weatherType === 'foggy') {
    // Foggy: Dense, mysterious
    fogDensity = Math.max(0.6, Math.min(0.9, volatility / 10));
    fogColor = '#B0BEC5';
    sunIntensity = 0.5;
    ambientIntensity = 0.35;
  } else {
    // Apply time-based lighting adjustments for sunny/cloudy days
    if (timeFactors?.timeTendency?.lightingModifier) {
      sunIntensity *= timeFactors.timeTendency.lightingModifier;
      ambientIntensity *= timeFactors.timeTendency.lightingModifier;
    }
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
    reasoning: `Fallback (SUI weight 40%): ${change.toFixed(2)}% weighted avg (adjusted: ${finalAdjustedChange.toFixed(2)}%), ${volatility.toFixed(2)} volatility, ${fishCount} fish from $${totalVolume.toFixed(1)}B volume${fearGreedIndex ? `, Fear & Greed: ${fearGreedIndex.value} (${fearGreedIndex.valueClassification})` : ''}${timeFactors?.specialDate ? `, Special: ${timeFactors.specialDate.name}` : ''}${timeFactors?.randomEvent ? `, Random: ${timeFactors.randomEvent.name}` : ''}`,
    timestamp: Date.now(),
  };
}

