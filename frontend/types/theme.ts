/**
 * Weather Mode System for Atrium Stage
 * - dynamic: AI-generated weather based on crypto data (default)
 * - day: Static sunny day mode
 * - night: Static night mode
 */
export type WeatherMode = 'dynamic' | 'day' | 'night';

// Legacy type for backward compatibility
export type StageTheme = 'light' | 'dark';

export interface StageThemeConfig {
  // Background
  backgroundColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;

  // Platform
  platformColor: number;
  platformRoughness: number;
  platformMetalness: number;
  platformOpacity: number;
  rimColor: number;
  rimOpacity: number;

  // Grid
  gridColor1: number;
  gridColor2: number;
  gridOpacity: number;

  // Lights
  mainLightColor: number;
  mainLightIntensity: number;
  sideLightColor: number;
  sideLightIntensity: number;
  backLightColor: number;
  backLightIntensity: number;
  ambientLightColor: number;
  ambientLightIntensity: number;
  hemisphereSkyColor: number;
  hemisphereGroundColor: number;
  hemisphereIntensity: number;

  // Particles
  particleCount: number;
  particleColors: Array<[number, number, number]>;
  particleOpacity: number;
  particleBlending: 'normal' | 'additive';

  // UI
  loadingBg: string;
  loadingTextColor: string;
  loadingSpinnerColors: string[];
}

/**
 * Static weather configurations for day/night modes
 */
export const STATIC_WEATHER_CONFIGS = {
  day: {
    skyColor: '#f0f8ff', // Alice Blue (Cooler, clearer day)
    fogDensity: 0.15,
    fogColor: '#f0f8ff',
    sunIntensity: 1.2,
    sunColor: '#ffffff', // Pure white sunlight
    ambientIntensity: 0.6,
    weatherType: 'sunny' as const,
    particleIntensity: 0.2,
    windSpeed: 2,
    cloudSpeed: 1,
    mood: 'calm' as const,
    waterEffect: 'calm' as const,
    waterColor: '#4A90E2',
    specialEvents: [] as string[],
    islandState: 'normal' as const,
    ambientEffects: ['birds_flying'] as string[],
    effectIntensity: 0.3,
    // Parametric elements - set to 0 to remove them in static modes
    fishCount: 0,
    floatingOrbCount: 0,
    energyBeamIntensity: 0,
    reasoning: 'Static day mode - calm and bright',
    timestamp: Date.now(),
  },
  night: {
    skyColor: '#0B1929',
    fogDensity: 0.3,
    fogColor: '#1a1a2e',
    sunIntensity: 0.3,
    sunColor: '#4A5B8C',
    ambientIntensity: 0.3,
    weatherType: 'clear' as const,
    particleIntensity: 0.4,
    windSpeed: 1,
    cloudSpeed: 0.5,
    mood: 'mysterious' as const,
    waterEffect: 'calm' as const,
    waterColor: '#1a2332',
    specialEvents: [] as string[],
    islandState: 'normal' as const,
    ambientEffects: ['sparkles'] as string[],
    effectIntensity: 0.4,
    // Parametric elements - set to 0 to remove them in static modes
    fishCount: 0,
    floatingOrbCount: 0,
    energyBeamIntensity: 0,
    reasoning: 'Static night mode - peaceful and starry',
    timestamp: Date.now(),
  },
};

export const STAGE_THEMES: Record<StageTheme, StageThemeConfig> = {
  light: {
    // Background - cooler clear day (Architectural clarity)
    backgroundColor: 0xf0f8ff, // Alice Blue
    fogColor: 0xf0f8ff,
    fogNear: 25,
    fogFar: 70,

    // Platform - smooth reflective surface
    platformColor: 0xf0f8ff,
    platformRoughness: 0.15,
    platformMetalness: 0.4,
    platformOpacity: 0.98,
    rimColor: 0xff8844, // Vibrant Orange (Daytime Accent - unchanged)
    rimOpacity: 0.35,

    // Grid - cool grey
    gridColor1: 0xd4d8e0,
    gridColor2: 0xe8eaf0,
    gridOpacity: 0.3,

    // Lights - Clean studio lighting
    mainLightColor: 0xffffff,
    mainLightIntensity: 1.2,
    sideLightColor: 0xffeebb,
    sideLightIntensity: 0.8,
    backLightColor: 0xffdca3,
    backLightIntensity: 0.5,
    ambientLightColor: 0xffffff,
    ambientLightIntensity: 0.45,
    hemisphereSkyColor: 0xffffff,
    hemisphereGroundColor: 0xf0e6d2,
    hemisphereIntensity: 0.35,

    // Particles - Warm & Soft spectrum
    particleCount: 180,
    particleColors: [
      [0.95, 0.6, 0.45],   // Soft coral
      [0.85, 0.55, 0.75],  // Soft pink
      [0.90, 0.75, 0.40],  // Soft golden
      [0.50, 0.70, 0.90],  // Soft blue (Balance)
      [0.75, 0.55, 0.85],  // Soft purple
      [0.95, 0.65, 0.35],  // Soft orange
    ],
    particleOpacity: 0.7,
    particleBlending: 'normal',

    // UI
    loadingBg: 'bg-white',
    loadingTextColor: 'text-gray-600',
    loadingSpinnerColors: ['border-orange-300', 'border-t-orange-600'],
  },

  dark: {
    // Background - deep space blue (more natural night)
    backgroundColor: 0x0f172a, // Slate-900 (Deep midnight blue)
    fogColor: 0x0f172a,
    fogNear: 15,
    fogFar: 80,

    // Platform - dark metallic with subtle reflection
    platformColor: 0x1e293b, // Slate-800 (Lighter dark)
    platformRoughness: 0.4, 
    platformMetalness: 0.8,
    platformOpacity: 0.9,
    rimColor: 0x38bdf8, // Sky-400 (Bright Cyan accent)
    rimOpacity: 0.6,

    // Grid - subtle tech grid
    gridColor1: 0x3b82f6, // Blue-500
    gridColor2: 0x1e293b, // Slate-800
    gridOpacity: 0.3,

    // Lights - Moonlight & Cyber atmosphere
    mainLightColor: 0xdbeafe, // Pale blue moonlight
    mainLightIntensity: 1.8, // Softened intensity
    sideLightColor: 0x0ea5e9, // Cyan fill
    sideLightIntensity: 1.2,
    backLightColor: 0x6366f1, // Indigo rim
    backLightIntensity: 1.0,
    ambientLightColor: 0x334155, // Slate-700 (Brighter shadows)
    ambientLightIntensity: 0.8, // Less pitch black shadows
    hemisphereSkyColor: 0x334155, // Lighter sky
    hemisphereGroundColor: 0x0f172a, // Darker ground
    hemisphereIntensity: 0.6, // Better overall visibility

    // Particles - cosmic dust
    particleCount: 150,
    particleColors: [
      [0.3, 0.5, 0.9],
      [0.5, 0.3, 0.8],
      [0.6, 0.6, 0.7],
    ],
    particleOpacity: 0.45,
    particleBlending: 'additive',

    // UI
    loadingBg: 'bg-black',
    loadingTextColor: 'text-gray-300',
    loadingSpinnerColors: ['border-blue-400', 'border-t-purple-500'],
  },
};

