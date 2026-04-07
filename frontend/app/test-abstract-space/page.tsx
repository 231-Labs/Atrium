'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { SpaceState } from '@/types/spaceState';
import { SpaceStateInterpreter } from '@/lib/SpaceStateInterpreter';

// Dynamically import the 3D scene component (client-side only)
const AbstractSpaceRenderer = dynamic(
  () => import('@/components/3d/AbstractSpaceRenderer'),
  { ssr: false }
);

// Test scenarios - various abstract space states
const TEST_SCENARIOS: Record<string, SpaceState> = {
  '✨ Ethereal Dreams': {
    version: '2.0.0',
    timestamp: Date.now(),
    stateId: 'ethereal-1',
    energy: 0.3,
    mood: 0.6,
    density: 0.2,
    temperature: 0,
    flow: 0.4,
    luminosity: 0.8,
    traits: ['ethereal', 'serene'],
    contributors: [],
  },

  '⚡ Electric Storm': {
    version: '2.0.0',
    timestamp: Date.now(),
    stateId: 'electric-1',
    energy: 0.95,
    mood: 0.2,
    density: 0.7,
    temperature: 0.8,
    flow: 0.9,
    luminosity: 0.9,
    traits: ['electric', 'chaotic', 'volatile'],
    contributors: [],
  },

  '🌊 Calm Waters': {
    version: '2.0.0',
    timestamp: Date.now(),
    stateId: 'calm-1',
    energy: 0.2,
    mood: 0.4,
    density: 0.4,
    temperature: -0.2,
    flow: 0.2,
    luminosity: 0.6,
    traits: ['serene', 'meditative'],
    contributors: [],
  },

  '🌀 Vortex Chaos': {
    version: '2.0.0',
    timestamp: Date.now(),
    stateId: 'vortex-1',
    energy: 0.8,
    mood: -0.3,
    density: 0.9,
    temperature: 0.5,
    flow: 0.95,
    luminosity: 0.4,
    traits: ['chaotic', 'volatile'],
    contributors: [],
  },

  '❄️ Frozen Void': {
    version: '2.0.0',
    timestamp: Date.now(),
    stateId: 'void-1',
    energy: 0.1,
    mood: -0.5,
    density: 0.1,
    temperature: -0.9,
    flow: 0.1,
    luminosity: 0.2,
    traits: ['void', 'crystalline'],
    contributors: [],
  },

  '🔮 Crystalline Matrix': {
    version: '2.0.0',
    timestamp: Date.now(),
    stateId: 'crystal-1',
    energy: 0.6,
    mood: 0.3,
    density: 0.8,
    temperature: -0.3,
    flow: 0.3,
    luminosity: 0.7,
    traits: ['crystalline', 'pulsating'],
    contributors: [],
  },

  '🌺 Organic Flow': {
    version: '2.0.0',
    timestamp: Date.now(),
    stateId: 'organic-1',
    energy: 0.5,
    mood: 0.7,
    density: 0.6,
    temperature: 0.4,
    flow: 0.6,
    luminosity: 0.8,
    traits: ['organic', 'ethereal'],
    contributors: [],
  },

  '🌙 Meditative Night': {
    version: '2.0.0',
    timestamp: Date.now(),
    stateId: 'meditate-1',
    energy: 0.15,
    mood: 0.2,
    density: 0.3,
    temperature: -0.1,
    flow: 0.15,
    luminosity: 0.3,
    traits: ['meditative', 'serene'],
    contributors: [],
  },

  '🌟 Joyful Celebration': {
    version: '2.0.0',
    timestamp: Date.now(),
    stateId: 'joy-1',
    energy: 0.85,
    mood: 0.95,
    density: 0.5,
    temperature: 0.6,
    flow: 0.7,
    luminosity: 0.95,
    traits: ['electric', 'organic', 'pulsating'],
    contributors: [],
  },

  '🔥 Intense Heat': {
    version: '2.0.0',
    timestamp: Date.now(),
    stateId: 'heat-1',
    energy: 0.9,
    mood: 0.3,
    density: 0.7,
    temperature: 1.0,
    flow: 0.8,
    luminosity: 0.85,
    traits: ['volatile', 'electric'],
    contributors: [],
  },
};

export default function TestAbstractSpacePage() {
  const [selectedScenario, setSelectedScenario] = useState<string>('✨ Ethereal Dreams');
  const [currentState, setCurrentState] = useState<SpaceState>(TEST_SCENARIOS['✨ Ethereal Dreams']);
  const [showInfo, setShowInfo] = useState(true);
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');

  // Manual parameter controls
  const [manualMode, setManualMode] = useState(false);
  const [energy, setEnergy] = useState(0.5);
  const [mood, setMood] = useState(0);
  const [density, setDensity] = useState(0.5);
  const [temperature, setTemperature] = useState(0);
  const [flow, setFlow] = useState(0.5);
  const [luminosity, setLuminosity] = useState(0.5);

  const interpreterRef = useRef(new SpaceStateInterpreter(0.1));

  const handleScenarioChange = (scenario: string) => {
    setSelectedScenario(scenario);
    setManualMode(false);
    const newState = {
      ...TEST_SCENARIOS[scenario],
      timestamp: Date.now(),
    };
    setCurrentState(newState);

    // Update manual controls
    setEnergy(newState.energy);
    setMood(newState.mood);
    setDensity(newState.density);
    setTemperature(newState.temperature);
    setFlow(newState.flow);
    setLuminosity(newState.luminosity);
  };

  const handleManualUpdate = () => {
    const newState: SpaceState = {
      version: '2.0.0',
      timestamp: Date.now(),
      stateId: `manual-${Date.now()}`,
      energy,
      mood,
      density,
      temperature,
      flow,
      luminosity,
      traits: interpreterRef.current.suggestTraits({
        version: '2.0.0',
        timestamp: Date.now(),
        stateId: 'temp',
        energy,
        mood,
        density,
        temperature,
        flow,
        luminosity,
        traits: [],
        contributors: [],
      }),
      contributors: [],
    };

    const validatedState = interpreterRef.current.interpret(newState, currentState);
    setCurrentState(validatedState);
  };

  useEffect(() => {
    if (manualMode) {
      handleManualUpdate();
    }
  }, [energy, mood, density, temperature, flow, luminosity, manualMode]);

  return (
    <div className="relative w-full h-screen bg-black">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <AbstractSpaceRenderer
          state={currentState}
          performanceMode={performanceMode}
        />
      </div>

      {/* Control Panel */}
      {isPanelVisible ? (
        <div className="absolute top-4 left-4 bg-black/90 text-white p-4 rounded-lg max-w-md z-50 transition-all max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🎨 Abstract Space Test</h2>
            <button
              onClick={() => setIsPanelVisible(false)}
              className="text-gray-400 hover:text-white text-xl font-bold px-2"
              title="Minimize Panel"
            >
              −
            </button>
          </div>

          {/* Performance Mode */}
          <div className="space-y-2 mb-4 pb-4 border-b border-gray-700">
            <label className="block text-sm font-medium">Performance Mode:</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPerformanceMode(mode)}
                  className={`flex-1 px-3 py-2 rounded text-xs uppercase ${
                    performanceMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="space-y-2 mb-4 pb-4 border-b border-gray-700">
            <div className="flex gap-2">
              <button
                onClick={() => setManualMode(false)}
                className={`flex-1 px-3 py-2 rounded ${
                  !manualMode ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Scenarios
              </button>
              <button
                onClick={() => setManualMode(true)}
                className={`flex-1 px-3 py-2 rounded ${
                  manualMode ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Manual
              </button>
            </div>
          </div>

          {!manualMode ? (
            <>
              {/* Scenario Selector */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium">Select Scenario:</label>
                <select
                  value={selectedScenario}
                  onChange={(e) => handleScenarioChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  {Object.keys(TEST_SCENARIOS).map((scenario) => (
                    <option key={scenario} value={scenario}>
                      {scenario}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Manual Controls */}
              <div className="space-y-3 mb-4">
                {[
                  { label: 'Energy', value: energy, setValue: setEnergy, min: 0, max: 1, step: 0.01 },
                  { label: 'Mood', value: mood, setValue: setMood, min: -1, max: 1, step: 0.01 },
                  { label: 'Density', value: density, setValue: setDensity, min: 0, max: 1, step: 0.01 },
                  { label: 'Temperature', value: temperature, setValue: setTemperature, min: -1, max: 1, step: 0.01 },
                  { label: 'Flow', value: flow, setValue: setFlow, min: 0, max: 1, step: 0.01 },
                  { label: 'Luminosity', value: luminosity, setValue: setLuminosity, min: 0, max: 1, step: 0.01 },
                ].map(({ label, value, setValue, min, max, step }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium">{label}:</label>
                      <span className="text-xs text-gray-400">{value.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      onChange={(e) => setValue(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Info Toggle */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mb-4"
          >
            {showInfo ? 'Hide' : 'Show'} Details
          </button>

          {/* State Details */}
          {showInfo && (
            <div className="space-y-2 text-sm">
              <div className="border-t border-gray-700 pt-2">
                <p className="font-bold text-blue-300 mb-2">📊 Current Parameters</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p><strong>Energy:</strong> {currentState.energy.toFixed(2)}</p>
                  <p><strong>Mood:</strong> {currentState.mood.toFixed(2)}</p>
                  <p><strong>Density:</strong> {currentState.density.toFixed(2)}</p>
                  <p><strong>Temp:</strong> {currentState.temperature.toFixed(2)}</p>
                  <p><strong>Flow:</strong> {currentState.flow.toFixed(2)}</p>
                  <p><strong>Light:</strong> {currentState.luminosity.toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-2">
                <p className="font-bold text-purple-300 mb-1">🎭 Active Traits</p>
                <div className="flex flex-wrap gap-1">
                  {currentState.traits.map((trait) => (
                    <span
                      key={trait}
                      className="px-2 py-1 bg-purple-900/50 rounded text-xs"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-700 pt-2">
                <p className="font-bold text-green-300 mb-1">🎯 Visual Elements</p>
                <div className="text-xs space-y-1">
                  <p>• Line Grid with distortions</p>
                  <p>• Vortex gravitational field</p>
                  <p>• {performanceMode === 'high' ? '2000' : performanceMode === 'medium' ? '1000' : '500'} flowing particles</p>
                  <p>• Topology morphing effects</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-400 border-t border-gray-700 pt-2">
            <p>💡 Abstract space responds to 6 core parameters</p>
            <p>🎨 Visual effects adapt based on traits</p>
            <p>⚡ Try different scenarios or manual mode</p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsPanelVisible(true)}
          className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50 transition-all flex items-center justify-center"
          title="Open Control Panel"
        >
          <span className="text-xl">⚙️</span>
        </button>
      )}

      {/* Quick Actions */}
      <div className="absolute top-4 right-4 space-y-2 z-50">
        <button
          onClick={() => window.location.reload()}
          className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          🔄 Refresh
        </button>
      </div>

      {/* FPS Counter (optional) */}
      <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded text-xs z-50">
        Mode: {performanceMode.toUpperCase()}
      </div>
    </div>
  );
}
