/**
 * SpaceState - Core abstraction for space visualization
 * Replaces concrete weather parameters with abstract dimensional values
 */

export interface SpaceState {
  // Metadata
  version: string;              // "2.0.0"
  timestamp: number;
  stateId: string;

  // Core abstract parameters (0-1 normalized)
  energy: number;               // Space energy (0=still, 1=highly active)
  mood: number;                 // Emotional tone (-1=sad, 0=neutral, 1=joyful)
  density: number;              // Space density (0=sparse, 1=dense)
  temperature: number;          // Temperature perception (-1=cold, 0=neutral, 1=hot)
  flow: number;                 // Fluidity (0=static, 1=rapid flow)
  luminosity: number;           // Light intensity (0=dark, 1=bright)

  // Feature tags (extensible)
  traits: string[];             // ["ethereal", "chaotic", "serene", "pulsating", "crystalline", "organic"]

  // AI interpretation layer (for semi-autonomous mode suggestions)
  interpretation?: {
    visualSuggestions: VisualHints;
    reasoning: string;          // AI reasoning process
    confidence: number;         // Confidence score (0-1)
  };

  // Co-creation metadata
  contributors: Contributor[];
  proposedBy?: {                // Semi-autonomous mode: who proposed
    type: 'human' | 'ai_agent';
    id: string;
    timestamp: number;
  };
  approvedBy?: {                // Semi-autonomous mode: who approved
    address: string;
    timestamp: number;
  };
}

export interface VisualHints {
  colorPalette?: string[];      // Suggested color palette
  particleDensity?: number;
  motionPatterns?: string[];
  specialEffects?: string[];
}

export interface Contributor {
  type: 'human' | 'ai_agent';
  id: string;
  address?: string;             // On-chain address (for humans)
  agentId?: string;             // Agent ID (for AI)
  contributionType: 'created' | 'modified' | 'proposed' | 'approved';
  timestamp: number;
}

/**
 * StateProposal - AI-generated suggestion for state change
 */
export interface StateProposal {
  proposalId: string;
  spaceId: string;
  proposedState: SpaceState;
  reasoning: string;
  confidence: number;
  dataSourcesUsed: DataFeed[];
  status: 'pending' | 'approved' | 'rejected';
  proposedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

/**
 * DataFeed - Data source used by AI
 */
export interface DataFeed {
  source: string;               // Data source name
  weight: number;               // AI-determined weight
  lastUsed: number;
  effectiveness: number;        // AI-tracked effectiveness score
  cost?: number;                // Optional cost tracking
}

/**
 * SpaceStateHistory - Timeline of state changes
 */
export interface SpaceStateHistory {
  spaceId: string;
  states: SpaceStateHistoryEntry[];
}

export interface SpaceStateHistoryEntry {
  state: SpaceState;
  appliedAt: number;
  proposalId?: string;
  transitionDuration?: number;  // ms for smooth transition
}

/**
 * Helper type for state parameter validation
 */
export type SpaceStateParameters = Pick<
  SpaceState,
  'energy' | 'mood' | 'density' | 'temperature' | 'flow' | 'luminosity'
>;

/**
 * Validation constraints
 */
export const SPACE_STATE_CONSTRAINTS = {
  energy: { min: 0, max: 1 },
  mood: { min: -1, max: 1 },
  density: { min: 0, max: 1 },
  temperature: { min: -1, max: 1 },
  flow: { min: 0, max: 1 },
  luminosity: { min: 0, max: 1 },
} as const;

/**
 * Predefined trait definitions
 */
export const SPACE_TRAITS = {
  ethereal: 'Light, translucent, otherworldly appearance',
  chaotic: 'Turbulent, unpredictable motion and patterns',
  serene: 'Calm, smooth, peaceful atmosphere',
  pulsating: 'Rhythmic expansion and contraction',
  crystalline: 'Sharp, geometric, structured forms',
  organic: 'Curved, flowing, natural shapes',
  volatile: 'Rapid, intense changes',
  meditative: 'Slow, contemplative movement',
  electric: 'Energetic, charged atmosphere',
  void: 'Empty, minimalist, sparse',
} as const;

export type SpaceTrait = keyof typeof SPACE_TRAITS;
