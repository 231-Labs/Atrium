/**
 * POE API service
 * Uses POE API to call LLM for generating 3D scene weather parameters
 * Docs: https://creator.poe.com/docs/api-bots
 */

import { ChainDataSnapshot } from './chainDataApi';
import { buildSceneGenerationPrompt } from '@/config/aiPrompts';
import { getTimeFactors } from './timeFactors';

/**
 * 3D scene weather parameters (extended)
 */
export interface SceneWeatherParams {
  // Sky params
  skyColor: string; // hex
  fogDensity: number; // 0-1
  fogColor: string; // hex
  
  // Lighting params
  sunIntensity: number; // 0-2
  sunColor: string; // hex
  ambientIntensity: number; // 0-1
  
  // Weather effects
  weatherType: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'snowy';
  particleIntensity: number; // 0-1 (rain, snow, etc.)
  
  // Dynamic effects
  windSpeed: number; // 0-10
  cloudSpeed: number; // 0-5
  
  // Mood
  mood: 'calm' | 'energetic' | 'melancholic' | 'mysterious' | 'chaotic';
  
  // Water effects
  waterEffect?: 'calm' | 'ripples' | 'waves' | 'turbulent' | 'frozen';
  waterColor?: string; // hex
  
  // Special events (multiple)
  specialEvents?: Array<'meteor_shower' | 'shooting_star' | 'fireball' | 'fire_ring' | 'aurora' | 'lightning' | 'rainbow' | 'none'>;
  rainbowColors?: string[]; // Custom colors for rainbow effect (hex strings)
  
  // Island state
  islandState?: 'normal' | 'glowing' | 'smoking' | 'frozen' | 'burning';
  
  // Ambient effects
  ambientEffects?: Array<'birds_flying' | 'dust_particles' | 'sparkles' | 'embers' | 'snowfall' | 'confetti' | 'none'>;
  
  // Effect intensity
  effectIntensity?: number; // 0-1
  
  // Parametric visual elements
  fishCount?: number; // 0-100, swimming fish based on trading volume
  floatingOrbCount?: number; // 5-30, glowing orbs based on market activity
  energyBeamIntensity?: number; // 0-1, light pillar intensity based on momentum
  
  // Metadata
  reasoning: string; // AI reasoning
  timestamp: number;
}

/**
 * POE API request config
 */
interface PoeApiConfig {
  apiKey: string;
  botName?: string; // POE bot name, defaults to Claude
}

class PoeApiService {
  private apiKey: string;
  private modelName: string;
  private apiUrl = 'https://api.poe.com/v1/chat/completions'; // OpenAI-compatible endpoint

  constructor(config?: PoeApiConfig) {
    this.apiKey = config?.apiKey || process.env.NEXT_PUBLIC_POE_API_KEY || '';
    // 使用更便宜的模型：Claude-3-Haiku (比 Sonnet 便宜約 10 倍)
    this.modelName = config?.botName || 'Claude-3-Haiku';
    
    if (!this.apiKey) {
      console.warn('⚠️ POE API Key not configured, AI weather system will use fallback logic');
    }
  }

  /**
   * Build prompt for LLM (uses centralized config)
   */
  private buildPrompt(chainData: ChainDataSnapshot): string {
    const timeFactors = getTimeFactors();
    console.log('⏰ Time factors:', {
      specialDate: timeFactors.specialDate?.name,
      timeTendency: timeFactors.timeTendency.description,
      randomEvent: timeFactors.randomEvent?.name,
    });
    
    return buildSceneGenerationPrompt(chainData, timeFactors);
  }

  /**
   * Legacy prompt (kept as backup)
   */
  private buildPromptLegacy(chainData: ChainDataSnapshot): string {
    const { btc, eth, sui, wal, aggregatedMetrics } = chainData;
    
    return `You are an AI for a 3D scene weather system. Generate 3D scene weather parameters based on current cryptocurrency market data.

Current market data (權重: SUI 40% > WAL 30% > BTC 20% > ETH 10%):
- SUI (主要影響): $${sui.price.toFixed(4)}, 24h change: ${sui.priceChange24h.toFixed(2)}%
- WAL (次要影響): $${wal.price.toFixed(4)}, 24h change: ${wal.priceChange24h.toFixed(2)}%
- BTC (參考): $${btc.price.toFixed(2)}, 24h change: ${btc.priceChange24h.toFixed(2)}%
- ETH (參考): $${eth.price.toFixed(2)}, 24h change: ${eth.priceChange24h.toFixed(2)}%
- Market sentiment: ${aggregatedMetrics.marketSentiment}
- Weighted average change: ${aggregatedMetrics.averageChange.toFixed(2)}% (based on above weights)
- Volatility: ${aggregatedMetrics.volatility.toFixed(2)}

Generate scene parameters based on these rules:

1. **Weather Type (weatherType)**:
   - Strong rise (>5%): sunny
   - Mild rise (0-5%): cloudy
   - Mild drop (0 to -5%): rainy
   - Strong drop (<-5%): stormy
   - High volatility (>8): foggy

2. **Colors & Lighting**:
   - Bullish market: warm tones (orange/yellow)
   - Bearish market: cool tones (blue/gray)
   - Neutral market: neutral tones (white/gray)

3. **Dynamic Effects**:
   - Higher volatility = faster wind and clouds
   - Larger price changes = stronger particle effects

4. **Mood**:
   - calm: stable market
   - energetic: strong rally
   - melancholic: sustained decline
   - mysterious: high uncertainty
   - chaotic: extreme volatility

Return ONLY a JSON object matching this TypeScript interface, no other text:

\`\`\`typescript
interface SceneWeatherParams {
  skyColor: string;        // hex color
  fogDensity: number;      // 0-1
  fogColor: string;        // hex color
  sunIntensity: number;    // 0-2
  sunColor: string;        // hex color
  ambientIntensity: number; // 0-1
  weatherType: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'snowy';
  particleIntensity: number; // 0-1
  windSpeed: number;       // 0-10
  cloudSpeed: number;      // 0-5
  mood: 'calm' | 'energetic' | 'melancholic' | 'mysterious' | 'chaotic';
  reasoning: string;       // Brief reasoning
  timestamp: number;       // Use ${Date.now()}
}
\`\`\`

Important: Return ONLY the JSON object, no other text or markdown.`;
  }

  /**
   * Call POE API to generate scene parameters
   */
  async generateSceneParams(chainData: ChainDataSnapshot): Promise<SceneWeatherParams> {
    if (!this.apiKey) {
      console.log('📦 Using fallback weather generation logic');
      return this.fallbackGeneration(chainData);
    }

    try {
      console.log('🤖 Calling POE API to generate scene parameters...');
      
      const prompt = this.buildPrompt(chainData);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`POE API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const aiResponse = data.choices?.[0]?.message?.content || '';
      
      if (!aiResponse) {
        throw new Error('No response content from POE API');
      }
      
      const sceneParams = this.parseAiResponse(aiResponse);
      
      console.log('✅ AI generated scene parameters:', sceneParams);
      return sceneParams;
      
    } catch (error) {
      console.error('❌ Error calling POE API:', error);
      console.log('📦 Falling back to rule-based generation');
      return this.fallbackGeneration(chainData);
    }
  }

  /**
   * Parse AI response
   */
  private parseAiResponse(response: string): SceneWeatherParams {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.skyColor && parsed.weatherType && parsed.mood) {
          parsed.timestamp = Date.now();
          return parsed as SceneWeatherParams;
        }
      }
      
      throw new Error('Invalid AI response format');
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw error;
    }
  }

  /**
   * Fallback: Rule-based scene generation (supports new params)
   */
  private fallbackGeneration(chainData: ChainDataSnapshot): SceneWeatherParams {
    const { aggregatedMetrics } = chainData;
    const change = aggregatedMetrics.averageChange;
    const volatility = aggregatedMetrics.volatility;
    
    let weatherType: SceneWeatherParams['weatherType'] = 'cloudy';
    let mood: SceneWeatherParams['mood'] = 'calm';
    let skyColor = '#87CEEB';
    let fogColor = '#CCCCCC';
    let sunColor = '#FFE4B5';
    let waterEffect: SceneWeatherParams['waterEffect'] = 'calm';
    let waterColor = '#4DA6FF';
    let specialEvents: SceneWeatherParams['specialEvents'] = ['none'];
    let islandState: SceneWeatherParams['islandState'] = 'normal';
    let ambientEffects: SceneWeatherParams['ambientEffects'] = ['none'];
    
    if (volatility > 8) {
      weatherType = 'foggy';
      mood = 'mysterious';
      skyColor = '#D4DCE8'; // Softer blue-gray
      fogColor = '#B0C4DE';
      waterEffect = 'turbulent';
      specialEvents = ['lightning'];
      ambientEffects = ['dust_particles'];
    } 
    else if (change > 5) {
      weatherType = 'sunny';
      mood = 'energetic';
      skyColor = '#FFF8DC'; // Cornsilk (very light yellow/cream)
      sunColor = '#FFDAB9'; // Peach Puff
      waterEffect = 'ripples';
      waterColor = '#87CEFA'; // Light Sky Blue (instead of Gold water)
      specialEvents = ['meteor_shower', 'aurora'];
      islandState = 'glowing';
      ambientEffects = ['birds_flying', 'sparkles'];
    } 
    else if (change > 0) {
      weatherType = 'cloudy';
      mood = 'calm';
      skyColor = '#F0F8FF'; // Alice Blue
      waterEffect = 'ripples';
      ambientEffects = ['birds_flying'];
    } 
    else if (change > -5) {
      weatherType = 'rainy';
      mood = 'melancholic';
      skyColor = '#708090';
      fogColor = '#696969';
      waterEffect = 'waves';
      waterColor = '#4682B4';
      specialEvents = ['shooting_star'];
      ambientEffects = ['dust_particles'];
    } 
    else {
      weatherType = 'stormy';
      mood = 'chaotic';
      skyColor = '#2F4F4F';
      fogColor = '#1C1C1C';
      waterEffect = 'turbulent';
      waterColor = '#1C2841';
      specialEvents = ['fireball', 'lightning'];
      islandState = 'smoking';
      ambientEffects = ['embers'];
    }

    const windSpeed = Math.min(10, volatility);
    const cloudSpeed = Math.min(5, volatility / 2);
    const particleIntensity = Math.abs(change) / 20;
    const fogDensity = Math.min(0.8, volatility / 15);
    const effectIntensity = Math.min(1, Math.abs(change) / 10 + volatility / 20);
    
    // Calculate parametric elements based on market data
    const totalVolume = (
      (chainData.sui?.volume24h || 0) +
      (chainData.wal?.volume24h || 0) +
      (chainData.btc?.volume24h || 0) +
      (chainData.eth?.volume24h || 0)
    ) / 1e9; // Convert to billions
    
    const fishCount = Math.min(100, Math.floor(totalVolume / 2)); // Fish based on volume
    const floatingOrbCount = Math.min(30, Math.max(5, Math.floor(aggregatedMetrics.trendingStrength * 3))); // Orbs based on trending
    const energyBeamIntensity = Math.min(1, Math.abs(change) / 10); // Beams based on price change
    
    return {
      skyColor,
      fogDensity,
      fogColor,
      sunIntensity: change > 0 ? 1.5 : 0.8,
      sunColor,
      ambientIntensity: 0.5,
      weatherType,
      particleIntensity: Math.min(1, particleIntensity),
      windSpeed,
      cloudSpeed,
      mood,
      waterEffect,
      waterColor,
      specialEvents,
      islandState,
      ambientEffects,
      effectIntensity,
      fishCount,
      floatingOrbCount,
      energyBeamIntensity,
      reasoning: `Based on ${change.toFixed(2)}% market change, ${volatility.toFixed(2)} volatility, ${fishCount} fish from $${totalVolume.toFixed(1)}B volume`,
      timestamp: Date.now(),
    };
  }

  /**
   * Use streaming API (if supported)
   */
  async *generateSceneParamsStream(
    chainData: ChainDataSnapshot
  ): AsyncGenerator<Partial<SceneWeatherParams>, void, unknown> {
    yield this.fallbackGeneration(chainData);
    
    // TODO: Implement streaming API call
    // POE API may not support streaming, keeping interface for future expansion
  }
}

// Export singleton
export const poeApi = new PoeApiService();

/**
 * Convenience function: Generate scene params from chain data
 */
export async function generateWeatherFromChainData(
  chainData: ChainDataSnapshot
): Promise<SceneWeatherParams> {
  return poeApi.generateSceneParams(chainData);
}

