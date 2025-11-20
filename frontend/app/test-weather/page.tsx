'use client';

import { useState } from 'react';
import { ThreeScene } from '@/components/3d/ThreeScene';
import type { SceneWeatherParams } from '@/services/poeApi';

const TEST_SCENARIOS: Record<string, SceneWeatherParams> = {
  '🐟 High Volume Market': {
    skyColor: '#87CEEB',
    fogDensity: 0.15,
    fogColor: '#FFFFFF',
    sunIntensity: 1.2,
    sunColor: '#FFE4B5',
    ambientIntensity: 0.7,
    weatherType: 'sunny',
    particleIntensity: 0.3,
    windSpeed: 3,
    cloudSpeed: 1.5,
    mood: 'energetic',
    waterEffect: 'ripples',
    waterColor: '#4DA6FF',
    specialEvents: ['none'],
    islandState: 'glowing',
    ambientEffects: ['birds_flying', 'sparkles'],
    effectIntensity: 0.7,
    // Parametric elements - High activity
    fishCount: 80,
    floatingOrbCount: 25,
    energyBeamIntensity: 0.8,
    reasoning: 'Test: High trading volume with many fish',
    timestamp: Date.now(),
  },
  
  '⚡ Bull Run Energy': {
    skyColor: '#F4C430', // Saffron/Gold (Darker than cornsilk)
    fogDensity: 0.15,
    fogColor: '#FFD700', // Gold fog
    sunIntensity: 1.8, // Higher sun intensity for high energy
    sunColor: '#FFA500', // Orange sun
    ambientIntensity: 0.4, // Lower ambient for better contrast
    weatherType: 'sunny',
    particleIntensity: 0.6, // More golden dust
    windSpeed: 6,
    cloudSpeed: 3,
    mood: 'energetic',
    waterEffect: 'waves',
    waterColor: '#00BFFF', // Deep Sky Blue for contrast with gold sky
    specialEvents: ['meteor_shower', 'aurora'],
    islandState: 'glowing',
    ambientEffects: ['sparkles', 'dust_particles'], // Use valid particle type
    effectIntensity: 1.2,
    // Parametric elements - Max energy
    fishCount: 60,
    floatingOrbCount: 35,
    energyBeamIntensity: 1.0,
    reasoning: 'Test: Maximum energy beams and activity with Golden Bull theme',
    timestamp: Date.now(),
  },
  
  '🌊 Low Activity Market': {
    skyColor: '#F0F8FF',
    fogDensity: 0.2,
    fogColor: '#F5F5F5',
    sunIntensity: 0.9,
    sunColor: '#FFF5E0',
    ambientIntensity: 0.5,
    weatherType: 'cloudy',
    particleIntensity: 0.15,
    windSpeed: 1.5,
    cloudSpeed: 0.5,
    mood: 'calm',
    waterEffect: 'calm',
    waterColor: '#B0D4E3',
    specialEvents: ['none'],
    islandState: 'normal',
    ambientEffects: ['birds_flying'],
    effectIntensity: 0.3,
    // Parametric elements - Low activity
    fishCount: 10,
    floatingOrbCount: 5,
    energyBeamIntensity: 0.2,
    reasoning: 'Test: Low volume with few fish',
    timestamp: Date.now(),
  },
  
  'Meteor Shower + Aurora': {
    skyColor: '#1a1a2e',
    fogDensity: 0.2,
    fogColor: '#2F4F4F',
    sunIntensity: 0.8,
    sunColor: '#FFD700',
    ambientIntensity: 0.6,
    weatherType: 'sunny',
    particleIntensity: 0.3,
    windSpeed: 8,
    cloudSpeed: 4,
    mood: 'energetic',
    waterEffect: 'waves',
    waterColor: '#FFD700',
    specialEvents: ['meteor_shower', 'aurora'],
    islandState: 'glowing',
    ambientEffects: ['sparkles', 'birds_flying'],
    effectIntensity: 0.9,
    fishCount: 35,
    floatingOrbCount: 15,
    energyBeamIntensity: 0.6,
    reasoning: 'Test: High wind/cloud speed with waves',
    timestamp: Date.now(),
  },
  
  'Storm + Fireball': {
    skyColor: '#2F4F4F',
    fogDensity: 0.7,
    fogColor: '#1C1C1C',
    sunIntensity: 0.4,
    sunColor: '#708090',
    ambientIntensity: 0.3,
    weatherType: 'stormy',
    particleIntensity: 0.9,
    windSpeed: 10,
    cloudSpeed: 5,
    mood: 'chaotic',
    waterEffect: 'turbulent',
    waterColor: '#1C2841',
    specialEvents: ['fireball', 'lightning'],
    islandState: 'smoking',
    ambientEffects: ['embers'],
    effectIntensity: 1.0,
    fishCount: 20,
    floatingOrbCount: 8,
    energyBeamIntensity: 0.3,
    reasoning: 'Test: Max wind/cloud with turbulent water',
    timestamp: Date.now(),
  },
  
  'Ice World': {
    skyColor: '#B0E0E6',
    fogDensity: 0.5,
    fogColor: '#E0F7FF',
    sunIntensity: 0.6,
    sunColor: '#B0E0E6',
    ambientIntensity: 0.5,
    weatherType: 'snowy',
    particleIntensity: 0.7,
    windSpeed: 4,
    cloudSpeed: 2,
    mood: 'calm',
    waterEffect: 'frozen',
    waterColor: '#B0E0E6',
    specialEvents: ['none'],
    islandState: 'frozen',
    ambientEffects: ['snowfall'],
    effectIntensity: 0.8,
    fishCount: 0, // No fish in frozen water
    floatingOrbCount: 12,
    energyBeamIntensity: 0.1,
    reasoning: 'Test: Ice world with frozen water',
    timestamp: Date.now(),
  },
  
  '🔥 Fire Ring Market Crash': {
    skyColor: '#FF4500',
    fogDensity: 0.4,
    fogColor: '#FFA500',
    sunIntensity: 1.5,
    sunColor: '#FF6347',
    ambientIntensity: 0.7,
    weatherType: 'sunny',
    particleIntensity: 0.6,
    windSpeed: 5,
    cloudSpeed: 3,
    mood: 'chaotic',
    waterEffect: 'waves',
    waterColor: '#FF8C00',
    specialEvents: ['fire_ring'],
    islandState: 'burning',
    ambientEffects: ['embers'],
    effectIntensity: 1.0,
    fishCount: 15,
    floatingOrbCount: 20,
    energyBeamIntensity: 0.5,
    reasoning: 'Test: Fire ring effect with moderate activity',
    timestamp: Date.now(),
  },
  
  '🌅 Calm Day (No Effects)': {
    skyColor: '#87CEEB',
    fogDensity: 0.1,
    fogColor: '#FFFFFF',
    sunIntensity: 1.0,
    sunColor: '#FFE4B5',
    ambientIntensity: 0.6,
    weatherType: 'cloudy',
    particleIntensity: 0.2,
    windSpeed: 2,
    cloudSpeed: 1,
    mood: 'calm',
    waterEffect: 'ripples',
    waterColor: '#4DA6FF',
    specialEvents: ['shooting_star'],
    islandState: 'normal',
    ambientEffects: ['birds_flying'],
    effectIntensity: 0.5,
    fishCount: 0, // Test with no parametric elements
    floatingOrbCount: 0,
    energyBeamIntensity: 0,
    reasoning: 'Test: Static day mode equivalent',
    timestamp: Date.now(),
  },
  
  '🌊 Turbulent Bear Market': {
    skyColor: '#2F4F4F',
    fogDensity: 0.6,
    fogColor: '#696969',
    sunIntensity: 0.5,
    sunColor: '#708090',
    ambientIntensity: 0.4,
    weatherType: 'rainy',
    particleIntensity: 0.8,
    windSpeed: 8,
    cloudSpeed: 4,
    mood: 'melancholic',
    waterEffect: 'turbulent',
    waterColor: '#4682B4',
    specialEvents: ['lightning'],
    islandState: 'normal',
    ambientEffects: ['dust_particles'],
    effectIntensity: 0.9,
    fishCount: 25,
    floatingOrbCount: 8,
    energyBeamIntensity: 0.2,
    reasoning: 'Test: Turbulent ocean with low energy',
    timestamp: Date.now(),
  },

  '❄️ Snowfall + Birds': {
    skyColor: '#E0F7FF',
    fogDensity: 0.3,
    fogColor: '#FFFFFF',
    sunIntensity: 0.8,
    sunColor: '#FFFFFF',
    ambientIntensity: 0.6,
    weatherType: 'snowy',
    particleIntensity: 0.5,
    windSpeed: 2,
    cloudSpeed: 1,
    mood: 'calm',
    waterEffect: 'calm',
    waterColor: '#B0E0E6',
    specialEvents: ['none'],
    islandState: 'frozen',
    ambientEffects: ['snowfall', 'birds_flying'],
    effectIntensity: 0.6,
    fishCount: 15,
    floatingOrbCount: 10,
    energyBeamIntensity: 0.3,
    reasoning: 'Test: Peaceful winter scene with birds',
    timestamp: Date.now(),
  },

  '🌫️ Mystical Fog + Dust': {
    skyColor: '#D4DCE8',
    fogDensity: 0.8, // Heavy fog
    fogColor: '#B0C4DE',
    sunIntensity: 0.3,
    sunColor: '#B0C4DE',
    ambientIntensity: 0.4,
    weatherType: 'foggy',
    particleIntensity: 0.4,
    windSpeed: 1,
    cloudSpeed: 0.5,
    mood: 'mysterious',
    waterEffect: 'calm',
    waterColor: '#708090',
    specialEvents: ['none'],
    islandState: 'normal',
    ambientEffects: ['dust_particles', 'sparkles'],
    effectIntensity: 0.5,
    fishCount: 5,
    floatingOrbCount: 20,
    energyBeamIntensity: 0.1,
    reasoning: 'Test: Heavy fog with floating dust and sparkles',
    timestamp: Date.now(),
  },

  '🎉 Celebration / All Time High': {
    skyColor: '#87CEFA', // Light Sky Blue
    fogDensity: 0.05,
    fogColor: '#FFFFFF',
    sunIntensity: 1.5,
    sunColor: '#FFD700',
    ambientIntensity: 0.8,
    weatherType: 'sunny',
    particleIntensity: 0.2,
    windSpeed: 2,
    cloudSpeed: 1,
    mood: 'energetic',
    waterEffect: 'ripples',
    waterColor: '#00BFFF',
    specialEvents: ['rainbow'],
    islandState: 'glowing',
    ambientEffects: ['confetti', 'sparkles'],
    effectIntensity: 1.0,
    fishCount: 100,
    floatingOrbCount: 30,
    energyBeamIntensity: 1.0,
    reasoning: 'Test: All Time High celebration!',
    timestamp: Date.now(),
  },
};

export default function TestWeatherPage() {
  const [selectedScenario, setSelectedScenario] = useState<string>('🐟 High Volume Market');
  const [testParams, setTestParams] = useState<SceneWeatherParams>(TEST_SCENARIOS['🐟 High Volume Market']);
  const [showInfo, setShowInfo] = useState(true);
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  const handleScenarioChange = (scenario: string) => {
    setSelectedScenario(scenario);
    setTestParams({
      ...TEST_SCENARIOS[scenario],
      timestamp: Date.now(),
    });
  };

  return (
    <div className="relative w-full h-screen">
      <div className="absolute inset-0">
        <ThreeScene
          spaceId="test-weather"
          enableGallery={true}
          weatherParams={testParams}
        />
      </div>

      {isPanelVisible ? (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg max-w-md z-50 transition-all">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🌤️ Weather Test Panel</h2>
            <button 
              onClick={() => setIsPanelVisible(false)}
              className="text-gray-400 hover:text-white text-xl font-bold px-2"
              title="Minimize Panel"
            >
              −
            </button>
          </div>
          
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium">Select Scenario:</label>
            <select
              value={selectedScenario}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
            >
              {Object.keys(TEST_SCENARIOS).map((scenario) => (
                <option key={scenario} value={scenario}>
                  {scenario}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mb-4"
          >
            {showInfo ? 'Hide' : 'Show'} Details
          </button>

          {showInfo && (
            <div className="space-y-2 text-sm">
              <div className="border-t border-gray-600 pt-2">
                <p><strong>Weather Type:</strong> {testParams.weatherType}</p>
                <p><strong>Mood:</strong> {testParams.mood}</p>
                <p><strong>Water Effect:</strong> {testParams.waterEffect}</p>
                <p><strong>Island State:</strong> {testParams.islandState}</p>
                <p><strong>Special Events:</strong> {testParams.specialEvents?.join(', ') || 'none'}</p>
                <p><strong>Ambient Effects:</strong> {testParams.ambientEffects?.join(', ') || 'none'}</p>
              </div>
              
              <div className="border-t border-gray-600 pt-2 bg-blue-900/20 p-2 rounded">
                <p className="font-bold text-blue-300 mb-1">🎯 Parametric Elements:</p>
                <p><strong>🐟 Fish Count:</strong> {testParams.fishCount ?? 0}</p>
                <p><strong>💫 Floating Orbs:</strong> {testParams.floatingOrbCount ?? 0}</p>
                <p><strong>⚡ Energy Beams:</strong> {((testParams.energyBeamIntensity ?? 0) * 100).toFixed(0)}%</p>
              </div>
              
              <div className="border-t border-gray-600 pt-2">
                <p><strong>Sky Color:</strong> <span style={{color: testParams.skyColor}}>{testParams.skyColor}</span></p>
                <p><strong>Fog Density:</strong> {testParams.fogDensity}</p>
                <p><strong>Wind Speed:</strong> {testParams.windSpeed}/10</p>
                <p><strong>Effect Intensity:</strong> {testParams.effectIntensity}</p>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-400 border-t border-gray-600 pt-2">
            <p>💡 Tip: Select different scenarios to test weather + market effects</p>
            <p>🐟 Fish count represents trading volume (0-100)</p>
            <p>💫 Orbs represent market activity (5-30)</p>
            <p>⚡ Beams represent price momentum (0-100%)</p>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsPanelVisible(true)}
          className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50 transition-all flex items-center justify-center"
          title="Open Config Panel"
        >
          <span className="text-xl">⚙️</span>
        </button>
      )}

      <div className="absolute top-4 right-4 space-y-2 z-50">
        <button
          onClick={async () => {
            const res = await fetch('/api/ai-weather');
            const data = await res.json();
            console.log('🌤️ API response:', data);
            setTestParams({...data, timestamp: Date.now()});
            alert('Loaded real API data! Check Console for details.');
          }}
          className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          📡 Load Real API Data
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          🔄 Refresh Page
        </button>
      </div>
    </div>
  );
}

