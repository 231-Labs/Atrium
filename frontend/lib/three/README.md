# Abstract Space Visualization System

A 3D visualization system that transforms abstract space state parameters into immersive geometric experiences.

## Overview

The Abstract Space system replaces concrete weather metaphors with abstract dimensional values, enabling AI agents to co-create dynamic visual experiences without being constrained by real-world weather data.

## Architecture

```
AbstractSpaceScene (Main Controller)
├── LineGrid        - Dynamic line grid with distortions
├── VortexField     - Black hole-like gravitational effects
├── ParticleFlow    - Dynamic light particle system
└── TopologyMorph   - Space curvature and topology distortion
```

## Quick Start

### 1. Initialize the Scene

```typescript
import { AbstractSpaceScene } from '@/lib/three/AbstractSpaceScene';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const scene = new AbstractSpaceScene(canvas, {
  enableLineGrid: true,
  enableVortex: true,
  enableParticles: true,
  enableTopology: true,
  performanceMode: 'high', // 'high' | 'medium' | 'low'
});
```

### 2. Update from SpaceState

```typescript
import { SpaceState } from '@/types/spaceState';

const state: SpaceState = {
  version: '2.0.0',
  timestamp: Date.now(),
  stateId: 'state-123',

  // Core parameters (all 0-1 normalized, except mood/temperature -1 to 1)
  energy: 0.7,        // Space energy (0=still, 1=highly active)
  mood: 0.5,          // Emotional tone (-1=sad, 1=joyful)
  density: 0.6,       // Space density (0=sparse, 1=dense)
  temperature: -0.3,  // Temperature (-1=cold, 1=hot)
  flow: 0.8,          // Fluidity (0=static, 1=rapid flow)
  luminosity: 0.5,    // Light intensity (0=dark, 1=bright)

  traits: ['ethereal', 'chaotic'],
  contributors: [],
};

scene.updateFromSpaceState(state);
```

### 3. Handle Resize

```typescript
window.addEventListener('resize', () => {
  scene.resize(window.innerWidth, window.innerHeight);
});
```

### 4. Cleanup

```typescript
scene.dispose();
```

## SpaceState Parameters

### Core Parameters

| Parameter | Range | Description | Visual Effect |
|-----------|-------|-------------|---------------|
| `energy` | 0-1 | Space energy level | Line curvature, particle speed |
| `mood` | -1 to 1 | Emotional tone | Color hue, topology curvature |
| `density` | 0-1 | Space density | Opacity, particle count |
| `temperature` | -1 to 1 | Temperature perception | Color shift, expansion/contraction |
| `flow` | 0-1 | Fluidity | Line flow speed, particle motion |
| `luminosity` | 0-1 | Light intensity | Brightness, opacity |

### Traits

Special visual effects triggered by trait keywords:

- `ethereal` - Light, translucent appearance
- `chaotic` - Turbulent, unpredictable motion
- `serene` - Calm, smooth atmosphere
- `pulsating` - Rhythmic expansion/contraction
- `crystalline` - Sharp, geometric forms
- `organic` - Curved, flowing shapes
- `volatile` - Rapid, intense changes
- `meditative` - Slow, contemplative movement
- `electric` - Energetic, charged atmosphere
- `void` - Empty, minimalist, sparse

## Visual Elements

### LineGrid

Dynamic line grid that forms the primary structure.

**Effects:**
- Curvature distortion based on energy
- Flow animation based on flow parameter
- Color shifts based on mood/temperature
- Opacity based on luminosity/density

### VortexField

Black hole-like gravitational field that pulls and rotates vertices.

**Effects:**
- Gravitational pull towards center
- Spiral rotation
- Turbulence (from 'chaotic' trait)

### ParticleFlow

Dynamic particle system simulating flowing light.

**Effects:**
- Particle speed based on flow
- Density based on energy
- Color based on mood/temperature
- Glow effects (from 'ethereal', 'electric' traits)

### TopologyMorph

Space curvature and topology distortion.

**Effects:**
- Curvature warping based on mood
- Thermal expansion based on temperature
- Ripple wave propagation

## Performance Modes

### High (Default)
- Full anti-aliasing
- High device pixel ratio
- 150 grid lines
- 2000 particles

### Medium
- Anti-aliasing enabled
- Standard pixel ratio
- 100 grid lines
- 1000 particles

### Low
- No anti-aliasing
- Standard pixel ratio
- 50 grid lines
- 500 particles

## Integration with AI Agents

AI agents can generate `SpaceState` proposals based on various data sources:

```typescript
import { AIAgent, DataSourceStrategy } from '@/types/aiAgent';
import { SpaceStateInterpreter } from '@/lib/SpaceStateInterpreter';

// Initialize interpreter
const interpreter = new SpaceStateInterpreter(0.1); // smoothing alpha

// AI generates proposed state
const proposedState: SpaceState = aiAgent.generateProposal(dataFeeds);

// Validate and smooth transition
const validatedState = interpreter.interpret(proposedState, currentState);

// Update visualization
scene.updateFromSpaceState(validatedState);
```

## Example: Weather-Inspired Space

```typescript
// Transform weather data into abstract parameters
const weatherToSpace = (weather: WeatherData): SpaceState => {
  return {
    version: '2.0.0',
    timestamp: Date.now(),
    stateId: generateId(),

    energy: weather.windSpeed / 100,
    mood: weather.cloudCover > 0.7 ? -0.3 : 0.5,
    density: weather.humidity,
    temperature: (weather.temp - 273) / 30, // Normalized
    flow: weather.windSpeed / 50,
    luminosity: 1 - weather.cloudCover,

    traits: deriveTraits(weather),
    contributors: [],
  };
};
```

## Example: Crypto Market Space

```typescript
// Transform market data into abstract parameters
const cryptoToSpace = (market: MarketData): SpaceState => {
  return {
    version: '2.0.0',
    timestamp: Date.now(),
    stateId: generateId(),

    energy: market.volatility,
    mood: market.priceChange24h > 0 ? 0.7 : -0.5,
    density: market.volume / market.avgVolume,
    temperature: market.momentum,
    flow: market.tradeFrequency,
    luminosity: market.marketCap / market.maxMarketCap,

    traits: ['electric', 'volatile'],
    contributors: [],
  };
};
```

## Advanced Usage

### Custom Visual Hints

AI agents can provide visual suggestions:

```typescript
const state: SpaceState = {
  // ... parameters
  interpretation: {
    visualSuggestions: {
      colorPalette: ['#00ffff', '#ff00ff', '#ffff00'],
      particleDensity: 1.5,
      motionPatterns: ['spiral', 'wave'],
      specialEffects: ['bloom', 'glow'],
    },
    reasoning: 'High energy market with positive sentiment',
    confidence: 0.85,
  },
};
```

### Trait Consistency

The `SpaceStateInterpreter` automatically filters contradictory traits:

```typescript
const interpreter = new SpaceStateInterpreter();

// This will automatically remove 'serene' if energy is too high
const consistent = interpreter.interpret(state);
```

### State Difference Calculation

```typescript
const difference = interpreter.calculateStateDifference(state1, state2);
console.log(`States differ by ${difference * 100}%`);
```

## API Reference

### AbstractSpaceScene

#### Constructor
```typescript
constructor(canvas: HTMLCanvasElement, config?: AbstractSpaceSceneConfig)
```

#### Methods
- `updateFromSpaceState(state: SpaceState): void` - Update visualization from state
- `resize(width: number, height: number): void` - Handle window resize
- `getFPS(): number` - Get current FPS
- `getCurrentState(): SpaceState | null` - Get current state
- `dispose(): void` - Cleanup and dispose resources

### SpaceStateInterpreter

#### Constructor
```typescript
constructor(smoothingAlpha?: number = 0.1)
```

#### Methods
- `interpret(state: SpaceState, previousState?: SpaceState): SpaceState` - Validate and smooth
- `calculateStateDifference(state1: SpaceState, state2: SpaceState): number` - Calculate difference
- `suggestTraits(state: SpaceState): SpaceTrait[]` - Suggest traits based on parameters
- `static createDefault(): SpaceState` - Create default state

## Development

### Type Safety

All components are fully typed with TypeScript:

```typescript
import type {
  SpaceState,
  SpaceStateParameters,
  SpaceTrait,
  VisualHints,
} from '@/types/spaceState';

import type {
  LineGridConfig,
  VortexFieldConfig,
  ParticleFlowConfig,
  TopologyMorphConfig,
} from '@/lib/three/elements';
```

### Testing

```bash
# Type check
npm run type-check

# Build
npm run build

# Dev mode
npm run dev
```

## Future Enhancements

- [ ] Shader-based effects for better performance
- [ ] Audio-reactive parameters
- [ ] VR/AR support
- [ ] More advanced particle systems
- [ ] Neural network-based state generation
- [ ] Real-time collaborative editing
- [ ] State interpolation/tweening library
- [ ] Visual preset library

## License

Part of the Atrium co-creation platform.
