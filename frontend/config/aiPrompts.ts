/**
 * AI Prompts Configuration
 * Manages all AI-related prompts for scene generation
 */

import { ChainDataSnapshot } from '@/services/chainDataApi';
import type { TimeBasedEvent } from '@/services/timeFactors';

/**
 * Build the main scene generation prompt with extended data
 */
export function buildSceneGenerationPrompt(
  chainData: ChainDataSnapshot,
  timeFactors?: {
    specialDate: TimeBasedEvent | null;
    timeTendency: any;
    weekdayEffect: any;
    moonPhase: any;
    randomEvent: TimeBasedEvent | null;
  }
): string {
  const { btc, eth, sui, wal, aggregatedMetrics, globalMarket, trending } = chainData;
  
  let marketDataSection = `**Current Market Data (Weather Influence Weight: SUI 40% > WAL 30% > BTC 20% > ETH 10%):**
- SUI (Primary): $${sui.price.toFixed(4)}, 24h change: ${sui.priceChange24h.toFixed(2)}%, volume: $${(sui.volume24h / 1e9).toFixed(2)}B
- WAL/Walrus (Secondary): $${wal.price.toFixed(4)}, 24h change: ${wal.priceChange24h.toFixed(2)}%, volume: $${(wal.volume24h / 1e9).toFixed(2)}B
- BTC (Reference): $${btc.price.toFixed(2)}, 24h change: ${btc.priceChange24h.toFixed(2)}%, volume: $${(btc.volume24h / 1e9).toFixed(2)}B
- ETH (Reference): $${eth.price.toFixed(2)}, 24h change: ${eth.priceChange24h.toFixed(2)}%, volume: $${(eth.volume24h / 1e9).toFixed(2)}B
- Market sentiment: ${aggregatedMetrics.marketSentiment}
- **Weighted average change**: ${aggregatedMetrics.averageChange.toFixed(2)}% (SUI weighted highest, WAL second)
- Volatility: ${aggregatedMetrics.volatility.toFixed(2)}
- Market activity: ${aggregatedMetrics.marketActivity} (volume-based)
- Trending strength: ${aggregatedMetrics.trendingStrength.toFixed(1)}/10`;

  if (globalMarket) {
    marketDataSection += `
- Total market cap: $${(globalMarket.totalMarketCap / 1e12).toFixed(2)}T
- Total 24h volume: $${(globalMarket.totalVolume24h / 1e9).toFixed(2)}B
- Market cap change: ${globalMarket.marketCapChangePercentage24h.toFixed(2)}%
- BTC dominance: ${globalMarket.btcDominance.toFixed(1)}%`;
  }

  if (trending && trending.length > 0) {
    marketDataSection += `\n- Trending coins: ${trending.map(c => `${c.symbol} (${c.priceChangePercentage24h.toFixed(1)}%)`).join(', ')}`;
  }
  
  // Calculate total volume for fish count suggestion
  const totalVolume = (sui.volume24h + wal.volume24h + btc.volume24h + eth.volume24h) / 1e9;
  const volumeLevel = totalVolume > 100 ? 'very high' : totalVolume > 50 ? 'high' : totalVolume > 20 ? 'medium' : 'low';
  marketDataSection += `\n- **Total 24h Volume**: $${totalVolume.toFixed(2)}B (${volumeLevel})`;

  let timeFactorsSection = '';
  if (timeFactors) {
    timeFactorsSection = `\n**Time & Context Factors:**`;
    
    if (timeFactors.specialDate) {
      timeFactorsSection += `\n- SPECIAL DATE: ${timeFactors.specialDate.name} - ${timeFactors.specialDate.description}`;
      timeFactorsSection += `\n  Priority: ${timeFactors.specialDate.priority}/10`;
      timeFactorsSection += `\n  Suggested effects: ${JSON.stringify(timeFactors.specialDate.sceneEffect)}`;
    }
    
    if (timeFactors.timeTendency) {
      timeFactorsSection += `\n- Time of day: ${timeFactors.timeTendency.description}`;
      timeFactorsSection += `\n  Sky color reference (OPTIONAL, ignore for bad weather): ${timeFactors.timeTendency.skyColorModifier || 'N/A'}`;
      timeFactorsSection += `\n  Mood tendency: ${timeFactors.timeTendency.moodTendency || 'N/A'}`;
      timeFactorsSection += `\n  ⚠️ CRITICAL: If weather is rainy/stormy/foggy, IGNORE time colors and use dark/cold colors!`;
    }
    
    if (timeFactors.weekdayEffect) {
      timeFactorsSection += `\n- Weekday effect: ${timeFactors.weekdayEffect.description}`;
      timeFactorsSection += `\n  Energy intensity: ${timeFactors.weekdayEffect.intensity}`;
    }
    
    if (timeFactors.moonPhase) {
      timeFactorsSection += `\n- Moon phase: ${timeFactors.moonPhase.description}`;
      timeFactorsSection += `\n  Mystical intensity: ${timeFactors.moonPhase.intensity}`;
    }
    
    if (timeFactors.randomEvent) {
      timeFactorsSection += `\n- Random event: ${timeFactors.randomEvent.name}`;
      timeFactorsSection += `\n  ${timeFactors.randomEvent.description}`;
    }
  }

  return `You are an AI that generates 3D scene parameters based on cryptocurrency market data, time factors, and special events.

${marketDataSection}
${timeFactorsSection}

**Generation Rules:**

1. **Weather Type (weatherType)**:
   - Strong Bull (>5%): sunny
   - Mild Bull (0-5%): cloudy
   - Mild Bear (0 to -5%): rainy (MUST use very dark, cold colors: sky #3D4451, water #2C3E50, high fog)
   - Strong Bear (<-5%): stormy (MUST use extremely dark colors: sky #2F4F4F or darker, water #1C2841)
   - High Volatility (>8): foggy
   - Special conditions: snowy (rare, extreme cold market)
   - **OVERRIDE**: If special date event suggests specific weather, prioritize it!

2. **Market Activity Influence**:
   - High activity (high volume) → More intense effects, more particles, stronger visual impact
   - Medium activity → Balanced effects
   - Low activity → Subtle effects, BUT consider adding random events to keep scene interesting!
   
3. **Trending Strength Influence (0-10)**:
   - High (>7): Add celebration effects like meteor_shower, sparkles, aurora
   - Medium (4-7): Moderate special events
   - Low (<4): Focus on ambient effects, consider time-based events to add interest

   4. **Colors & Lighting** (CRITICAL RULES):
   - **Primary Rule**: Match colors to market mood - bright for bullish, darker for bearish!
   - Bullish: Soft warm tones (cream #FFFAF0, light peach #FFDAB9). Avoid strong yellow!
   - **Bearish (RAINY)**: Cool, moody tones! Sky: #556B7A to #4A5F6E (cool slate blue), Water: #3B4F5E, Fog: #5A6B7A
     * sunIntensity: 0.5-0.6, ambientIntensity: 0.35-0.45, fogDensity: 0.4-0.7
   - **Bearish (STORMY)**: Very dark! Sky: #3D4854 to #2F4F4F, Water: #2A3B47, Fog: #3D4854
     * sunIntensity: 0.3-0.4, ambientIntensity: 0.25-0.35, fogDensity: 0.6-0.8
   - Neutral: Balanced light tones (off-white #F5F5F5, pearl gray #E8E8E8, soft azure #F0F8FF).
   - **Time-based colors are REFERENCE ONLY**: Feel free to blend market conditions with time atmosphere
   - **Bad examples for rainy/stormy**: #708090 (too bright!), #B0C4DE (way too bright!), #C0C0C0 (too light!)
   - **Good examples for rainy**: #556B7A, #4A5F6E, #3B4F5E (moody, cool, visible)

5. **Dynamic Effects**:
   - Higher volatility = stronger wind and faster clouds
   - Larger price changes = more intense particle effects
   - Market activity affects overall scene energy

6. **Mood**:
   - calm: Stable market
   - energetic: Strong rally, high trending strength
   - melancholic: Sustained decline
   - mysterious: High uncertainty, nighttime
   - chaotic: Extreme volatility

7. **Water Surface Effects (waterEffect)**:
   - calm: Smooth, reflective surface (low activity)
   - ripples: Gentle waves (mild conditions)
   - waves: Medium waves (moderate activity)
   - turbulent: Violent waves and whitecaps (high volatility/activity)
   - frozen: Ice surface (extreme bear market)

   8. **Special Events (specialEvents)** - Array of events (0-3 events):
   - meteor_shower: Falling stars (positive momentum, high trending)
   - shooting_star: Single shooting star (hope, random event)
   - fireball: Large fireball falling (market crash, strong bear)
   - fire_ring: Ring of fire around island (heated market, high activity)
   - aurora: Northern lights (magical bull run, nighttime)
   - lightning: Lightning strikes (high volatility, stormy)
   - rainbow: Rainbow arch (recovery, celebration, hope)
   - **Priority rule**: Special date events take precedence!
   - none: No special events (use for calm days)
   
   **NEW OPTIONAL PARAMS:**
   - **rainbowColors**: Array of 3-5 hex strings (e.g. ["#FF0000", "#00FF00"]) for custom rainbow palette. Use trendy/pastel colors!

9. **Island State (islandState)**:
   - normal: Regular appearance
   - glowing: Emitting light (very bullish + high trending)
   - smoking: Smoke rising (overheated market)
   - frozen: Ice covered (frozen market, extreme bear)
   - burning: On fire (crash/extreme pump)

10. **Ambient Effects (ambientEffects)** - Array of effects:
   - birds_flying: Birds circling (positive vibes, daytime)
   - dust_particles: Dust in air (uncertainty)
   - sparkles: Magical sparkles (excitement, high trending)
   - embers: Floating embers (danger, bearish)
   - snowfall: Snow falling (cold market)
   - confetti: Colorful paper confetti (celebration, ATH)

11. **Parametric Visual Elements (NEW - for demo impact!)**:
   - **fishCount** (number, 0-100): Swimming fish in the water
     * Formula: fishCount = (Total 24h Volume in Billions) / 2
     * Example: $50B volume = 25 fish
     * High volume = more fish, more activity
   - **floatingOrbCount** (number, 5-30): Glowing orbs around island
     * Based on market cap or trending strength
     * More orbs = more market activity
   - **energyBeamIntensity** (number, 0-1): Light pillars intensity
     * Based on price momentum
     * Higher momentum = brighter beams

**IMPORTANT RULE FOR CALM/BORING DAYS:**
When market is calm (low volatility, small changes, low activity), DO NOT make scene boring!
Instead:
- Use time-based effects (dawn colors, sunset, night mystery)
- Add subtle random events (birds, sparkles, gentle ripples)
- Consider moon phase for mystical touches
- Focus on ambient beauty rather than market drama
- Trending strength can still drive celebratory effects even if prices are stable

**Priority Hierarchy (highest to lowest):**
1. Special date events (e.g., holidays, crypto anniversaries)
2. Time-based context (dawn, dusk, midnight)
3. Market extreme conditions (crash, moon)
4. Market activity & trending strength
5. Default market-based weather

**IMPORTANT: Return ONLY a JSON object matching this TypeScript interface:**

\`\`\`typescript
interface SceneWeatherParams {
  // Basic weather
  skyColor: string;           // hex color
  fogDensity: number;         // 0-1
  fogColor: string;           // hex color
  sunIntensity: number;       // 0-2
  sunColor: string;           // hex color
  ambientIntensity: number;   // 0-1
  weatherType: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'snowy';
  particleIntensity: number;  // 0-1
  windSpeed: number;          // 0-10
  cloudSpeed: number;         // 0-5
  mood: 'calm' | 'energetic' | 'melancholic' | 'mysterious' | 'chaotic';
  
  // Water effects
  waterEffect: 'calm' | 'ripples' | 'waves' | 'turbulent' | 'frozen';
  waterColor: string;         // hex color
  
  // Special events (can be multiple)
  specialEvents: Array<'meteor_shower' | 'shooting_star' | 'fireball' | 'fire_ring' | 'aurora' | 'lightning' | 'rainbow' | 'none'>;
  rainbowColors?: string[];   // Custom colors for rainbow (3-5 hex strings)
  
  // Island state
  islandState: 'normal' | 'glowing' | 'smoking' | 'frozen' | 'burning';
  
  // Ambient effects
  ambientEffects: Array<'birds_flying' | 'dust_particles' | 'sparkles' | 'embers' | 'snowfall' | 'confetti' | 'none'>;
  
  // Intensity modifiers
  effectIntensity: number;    // 0-1, overall effect strength
  
  // Parametric elements (NEW!)
  fishCount: number;          // 0-100, swimming fish based on volume
  floatingOrbCount: number;   // 5-30, glowing orbs based on activity
  energyBeamIntensity: number; // 0-1, light pillar intensity
  
  // AI reasoning
  reasoning: string;          // Your analysis in 1-2 sentences
  timestamp: number;          // Use ${Date.now()}
}
\`\`\`

**Rules for Special Events:**
- Choose 0-2 special events based on market conditions
- More dramatic for extreme market moves (>5% change)
- Consider volatility for event intensity
- Use 'none' only if no special events fit

**Output Format:**
Return ONLY the JSON object. No markdown, no explanation, no extra text.`;
}

/**
 * Build a simplified prompt for faster responses
 */
export function buildQuickPrompt(chainData: ChainDataSnapshot): string {
  const { aggregatedMetrics } = chainData;
  
  return `Generate 3D scene parameters for crypto market: ${aggregatedMetrics.marketSentiment}, ${aggregatedMetrics.averageChange.toFixed(1)}% change, ${aggregatedMetrics.volatility.toFixed(1)} volatility. Return only JSON matching the SceneWeatherParams interface with weatherType, skyColor, mood, waterEffect, specialEvents array, and reasoning fields. Be creative with visual effects.`;
}

/**
 * Build a prompt for specific market conditions
 */
export function buildContextualPrompt(
  chainData: ChainDataSnapshot,
  context: 'bull_run' | 'bear_market' | 'sideways' | 'volatile'
): string {
  const basePrompt = buildSceneGenerationPrompt(chainData);
  
  const contextHints = {
    bull_run: 'Focus on celebratory effects: aurora, meteor showers, glowing island, warm colors.',
    bear_market: 'Focus on somber effects: rain/snow, dark colors, turbulent water, embers.',
    sideways: 'Focus on calm effects: gentle ripples, birds flying, balanced colors.',
    volatile: 'Focus on chaotic effects: lightning, turbulent water, mixed weather, rapid changes.',
  };
  
  return `${basePrompt}\n\n**Context Hint:** ${contextHints[context]}`;
}

/**
 * System prompt for AI assistant
 */
export const SYSTEM_PROMPT = `You are a creative 3D scene designer specializing in cryptocurrency-themed virtual environments. Your responses must be valid JSON only.`;

/**
 * Example responses for few-shot learning
 */
export const EXAMPLE_RESPONSES = {
  bullish: {
    skyColor: '#FFD700',
    fogDensity: 0.1,
    fogColor: '#FFF5E6',
    sunIntensity: 1.8,
    sunColor: '#FFA500',
    ambientIntensity: 0.7,
    weatherType: 'sunny',
    particleIntensity: 0.2,
    windSpeed: 3,
    cloudSpeed: 2,
    mood: 'energetic',
    waterEffect: 'ripples',
    waterColor: '#4DA6FF',
    specialEvents: ['meteor_shower', 'aurora'],
    islandState: 'glowing',
    ambientEffects: ['birds_flying', 'sparkles'],
    effectIntensity: 0.8,
    reasoning: 'Strong bullish momentum with BTC up 6.5% suggests celebration and energy.',
    timestamp: Date.now(),
  },
  bearish: {
    skyColor: '#3D4854',
    fogDensity: 0.65,
    fogColor: '#3D4854',
    sunIntensity: 0.35,
    sunColor: '#7B8C99',
    ambientIntensity: 0.3,
    weatherType: 'stormy',
    particleIntensity: 0.8,
    windSpeed: 8,
    cloudSpeed: 4,
    mood: 'melancholic',
    waterEffect: 'turbulent',
    waterColor: '#2A3B47',
    specialEvents: ['lightning', 'fireball'],
    islandState: 'smoking',
    ambientEffects: ['embers', 'dust_particles'],
    effectIntensity: 0.9,
    fishCount: 15,
    floatingOrbCount: 8,
    energyBeamIntensity: 0.3,
    reasoning: 'Severe market decline of -7.2% indicates panic and uncertainty.',
    timestamp: Date.now(),
  },
};

