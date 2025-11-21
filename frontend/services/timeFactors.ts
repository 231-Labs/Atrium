/**
 * Time factors service
 * Provides additional scene variation logic based on date and time
 */

export interface TimeBasedEvent {
  name: string;
  description: string;
  priority: number; // 1-10, higher is more important
  sceneEffect: {
    specialEvents?: string[];
    skyColorOverride?: string;
    moodOverride?: string;
    ambientEffects?: string[];
    effectIntensity?: number;
  };
}

/**
 * Special dates configuration
 */
const SPECIAL_DATES: Record<string, TimeBasedEvent> = {
  '01-01': {
    name: 'New Year',
    description: 'Happy New Year!',
    priority: 9,
    sceneEffect: {
      specialEvents: ['firework_show', 'aurora', 'sparkles'],
      skyColorOverride: '#1a1a2e',
      effectIntensity: 1.0,
      ambientEffects: ['sparkles', 'confetti'],
    },
  },
  
  '02-14': {
    name: "Valentine's Day",
    description: "Valentine's Day",
    priority: 7,
    sceneEffect: {
      specialEvents: ['heart_rain', 'pink_aurora'],
      skyColorOverride: '#FFB6C1',
      ambientEffects: ['hearts_floating', 'sparkles'],
      effectIntensity: 0.8,
    },
  },
  
  '10-31': {
    name: 'Halloween',
    description: 'Halloween',
    priority: 8,
    sceneEffect: {
      specialEvents: ['pumpkin_spawn', 'ghost_fog'],
      skyColorOverride: '#4B0082',
      moodOverride: 'mysterious',
      ambientEffects: ['bats_flying', 'fog'],
      effectIntensity: 0.9,
    },
  },
  
  '12-25': {
    name: 'Christmas',
    description: 'Merry Christmas!',
    priority: 10,
    sceneEffect: {
      specialEvents: ['snow_storm', 'northern_lights'],
      ambientEffects: ['snowfall', 'sparkles'],
      effectIntensity: 1.0,
    },
  },
  
  // 比特幣披薩日
  '05-22': {
    name: 'Bitcoin Pizza Day',
    description: '10,000 BTC for 2 pizzas!',
    priority: 6,
    sceneEffect: {
      specialEvents: ['pizza_rain', 'golden_shower'],
      ambientEffects: ['pizza_slices', 'coins_falling'],
      effectIntensity: 0.7,
    },
  },
  
  // 以太坊合併紀念日
  '09-15': {
    name: 'Ethereum Merge Anniversary',
    description: 'The Merge',
    priority: 7,
    sceneEffect: {
      specialEvents: ['aurora', 'energy_pulse'],
      skyColorOverride: '#627EEA',
      ambientEffects: ['sparkles', 'eth_logo'],
      effectIntensity: 0.8,
    },
  },
};

/**
 * Time factors service class
 */
class TimeFactorsService {
  /**
   * Get current hour (0-23)
   */
  getCurrentHour(): number {
    return new Date().getHours();
  }

  /**
   * Get current date (MM-DD format)
   */
  getCurrentDate(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  }

  /**
   * Get current day of week (0=Sunday, 1=Monday...)
   */
  getDayOfWeek(): number {
    return new Date().getDay();
  }

  /**
   * Get current month (1-12)
   */
  getCurrentMonth(): number {
    return new Date().getMonth() + 1;
  }

  /**
   * Check if current date is special
   */
  checkSpecialDate(): TimeBasedEvent | null {
    const currentDate = this.getCurrentDate();
    return SPECIAL_DATES[currentDate] || null;
  }

  /**
   * Get weather tendency based on time
   */
  getTimeBasedWeatherTendency(): {
    skyColorModifier?: string;
    lightingModifier?: number;
    moodTendency?: string;
    description: string;
  } {
    const hour = this.getCurrentHour();

    if (hour >= 0 && hour < 5) {
      return {
        skyColorModifier: '#191970',
        lightingModifier: 0.3,
        moodTendency: 'mysterious',
        description: 'Late night, stars twinkling',
      };
    }

    if (hour >= 5 && hour < 7) {
      return {
        skyColorModifier: '#FF6B6B',
        lightingModifier: 0.6,
        moodTendency: 'calm',
        description: 'Sunrise, awakening',
      };
    }

    if (hour >= 7 && hour < 12) {
      return {
        skyColorModifier: '#87CEEB',
        lightingModifier: 1.0,
        moodTendency: 'energetic',
        description: 'Morning, bright sunshine',
      };
    }

    if (hour >= 12 && hour < 14) {
      return {
        skyColorModifier: '#E6F2FF', // Light blue-white (避免黃色調，保持中性)
        lightingModifier: 1.2,
        moodTendency: 'energetic',
        description: 'Noon, blazing sun',
      };
    }

    if (hour >= 14 && hour < 18) {
      return {
        skyColorModifier: '#E8F0F7', // Soft blue-grey (更中性，不會太黃)
        lightingModifier: 0.9,
        moodTendency: 'calm',
        description: 'Afternoon, gentle breeze',
      };
    }

    if (hour >= 18 && hour < 20) {
      return {
        skyColorModifier: '#FF8C00',
        lightingModifier: 0.7,
        moodTendency: 'melancholic',
        description: 'Dusk, sunset',
      };
    }

    return {
      skyColorModifier: '#2F4F4F',
      lightingModifier: 0.5,
      moodTendency: 'mysterious',
      description: 'Nightfall',
    };
  }

  /**
   * Get special effects based on weekday
   */
  getWeekdayEffect(): {
    intensity: number;
    description: string;
  } {
    const day = this.getDayOfWeek();

    if (day === 1) {
      return {
        intensity: 0.6,
        description: 'Blue Monday, low mood',
      };
    }

    if (day === 5) {
      return {
        intensity: 1.2,
        description: 'Thank God It\'s Friday! Full of energy',
      };
    }

    if (day === 0 || day === 6) {
      return {
        intensity: 1.0,
        description: 'Weekend, relaxed and happy',
      };
    }

    return {
      intensity: 0.8,
      description: 'Regular day',
    };
  }

  /**
   * Get moon phase (simplified, for fun)
   */
  getMoonPhase(): {
    phase: 'new' | 'waxing' | 'full' | 'waning';
    intensity: number;
    description: string;
  } {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    
    const lunation = (day + month * 2.5) % 29.53;
    
    if (lunation < 7.38) {
      return {
        phase: 'new',
        intensity: 0.3,
        description: 'New moon, rebirth',
      };
    } else if (lunation < 14.77) {
      return {
        phase: 'waxing',
        intensity: 0.7,
        description: 'Waxing moon, growing power',
      };
    } else if (lunation < 22.15) {
      return {
        phase: 'full',
        intensity: 1.0,
        description: 'Full moon, maximum magic',
      };
    } else {
      return {
        phase: 'waning',
        intensity: 0.5,
        description: 'Waning moon, declining power',
      };
    }
  }

  /**
   * Generate random event (for calm days to add interest)
   */
  generateRandomEvent(probability: number = 0.1): TimeBasedEvent | null {
    if (Math.random() > probability) return null;

    const randomEvents: TimeBasedEvent[] = [
      {
        name: 'Meteor Shower',
        description: 'Unexpected meteor shower streaks across the sky',
        priority: 6,
        sceneEffect: {
          specialEvents: ['meteor_shower'],
          effectIntensity: 0.7,
        },
      },
      {
        name: 'Aurora Burst',
        description: 'Sudden appearance of northern lights',
        priority: 7,
        sceneEffect: {
          specialEvents: ['aurora'],
          ambientEffects: ['sparkles'],
          effectIntensity: 0.8,
        },
      },
      {
        name: 'Rainbow',
        description: 'Rainbow after rain',
        priority: 5,
        sceneEffect: {
          specialEvents: ['rainbow'],
          effectIntensity: 0.6,
        },
      },
      {
        name: 'Bird Migration',
        description: 'Large flock of birds flying by',
        priority: 4,
        sceneEffect: {
          ambientEffects: ['birds_flying', 'birds_singing'],
          effectIntensity: 0.5,
        },
      },
      {
        name: 'Mysterious Fog',
        description: 'Mysterious fog envelops the island',
        priority: 6,
        sceneEffect: {
          moodOverride: 'mysterious',
          ambientEffects: ['fog', 'dust_particles'],
          effectIntensity: 0.7,
        },
      },
    ];

    return randomEvents[Math.floor(Math.random() * randomEvents.length)];
  }

  /**
   * Get all time factors
   */
  getAllTimeFactors(): {
    specialDate: TimeBasedEvent | null;
    timeTendency: {
      skyColorModifier?: string;
      lightingModifier?: number;
      moodTendency?: string;
      description: string;
    };
    weekdayEffect: {
      intensity: number;
      description: string;
    };
    moonPhase: {
      phase: 'new' | 'waxing' | 'full' | 'waning';
      intensity: number;
      description: string;
    };
    randomEvent: TimeBasedEvent | null;
    timestamp: number;
  } {
    return {
      specialDate: this.checkSpecialDate(),
      timeTendency: this.getTimeBasedWeatherTendency(),
      weekdayEffect: this.getWeekdayEffect(),
      moonPhase: this.getMoonPhase(),
      randomEvent: this.generateRandomEvent(0.15), // 15% probability
      timestamp: Date.now(),
    };
  }

  /**
   * Apply time-based overrides to scene parameters to ensure they match user's local time
   * @param params Original weather params from AI
   */
  applyTimeOverrides(params: any): any {
    const hour = this.getCurrentHour();
    const timeTendency = this.getTimeBasedWeatherTendency();
    
    // Clone params
    const newParams = { ...params };
    
    // CRITICAL: Don't override colors for bad weather (rainy/stormy)
    // Market conditions should take precedence over time of day
    const isStrongWeather = ['rainy', 'stormy', 'foggy'].includes(params.weatherType);
    
    // 1. Apply Sky Color base on time (Override AI's choice to ensure Day/Night feel)
    // BUT: Only override if weather is neutral (sunny/cloudy)
    if (timeTendency.skyColorModifier && !isStrongWeather) {
      // Blend AI color with Time color? Or just replace?
      // Replacing ensures the day/night cycle is respected.
      newParams.skyColor = timeTendency.skyColorModifier;
    }
    
    // 2. Adjust intensities based on time
    // BUT: Preserve weather-driven lighting for rainy/stormy/foggy
    if (hour >= 20 || hour < 5) {
        // Deep Night
        newParams.sunIntensity = 0.1; // Moon light
        newParams.ambientIntensity = 0.2;
        newParams.fogColor = isStrongWeather ? newParams.fogColor : '#0a0a1a'; // Keep weather fog
        newParams.sunColor = '#E6E6FA'; // Lavender/Moon color
        
        // If it was sunny, make it clear night
        if (newParams.weatherType === 'sunny') {
          newParams.weatherType = 'clear'; 
        }
    } else if (hour >= 5 && hour < 7) {
        // Dawn
        if (!isStrongWeather) {
          newParams.sunIntensity = 0.6;
          newParams.ambientIntensity = 0.5;
          newParams.sunColor = '#FF7F50'; // Coral sun
        }
        // Keep weather lighting if it's rainy/stormy
    } else if (hour >= 18 && hour < 20) {
        // Dusk
        if (!isStrongWeather) {
          newParams.sunIntensity = 0.6;
          newParams.ambientIntensity = 0.5;
          newParams.sunColor = '#FF4500'; // Orange Red
        }
        // Keep weather lighting if it's rainy/stormy
    } else {
        // Day time (7-18)
        // ONLY brighten if weather is neutral (not rainy/stormy)
        if (!isStrongWeather) {
          // Ensure it's bright enough for sunny/cloudy days
          newParams.sunIntensity = Math.max(newParams.sunIntensity || 1, 1.0);
          newParams.ambientIntensity = Math.max(newParams.ambientIntensity || 0.5, 0.6);
        }
        // Keep dim lighting for rainy/stormy weather even during daytime
    }

    // 3. Special handling for particles/fog density during night
    if (hour >= 20 || hour < 5) {
       // Night usually has less fog unless specified
       if (newParams.weatherType === 'clear') {
         newParams.fogDensity = Math.min(newParams.fogDensity, 0.02);
       }
    }

    return newParams;
  }
}

export const timeFactors = new TimeFactorsService();

/**
 * Convenience function: Get all time factors
 */
export function getTimeFactors() {
  return timeFactors.getAllTimeFactors();
}

/**
 * Convenience function: Check if current date is special
 */
export function checkTodaySpecialEvent(): TimeBasedEvent | null {
  return timeFactors.checkSpecialDate();
}

