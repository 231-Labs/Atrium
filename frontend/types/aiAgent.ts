/**
 * AI Agent types for co-creation platform
 */

import { DataFeed } from './spaceState';

/**
 * AIAgent - Core AI entity definition
 */
export interface AIAgent {
  agentId: string;
  name: string;
  type: AgentType;
  personality: AgentPersonality;
  dataSourceStrategy: DataSourceStrategy;
  permissions: AgentPermissions;
  status: AgentStatus;
  createdAt: number;
  createdBy: string;             // Creator's wallet address
  spaceId: string;               // Associated space ID

  // Performance metrics
  metrics?: AgentMetrics;
}

/**
 * Agent types
 */
export type AgentType = 'semi_auto' | 'full_auto' | 'advisory';

/**
 * Agent personality configuration
 */
export interface AgentPersonality {
  creativity: number;            // Creativity level (0-1)
  conservatism: number;          // Conservatism degree (0-1)
  responsiveness: number;        // Response speed (0-1)
  explorationBias: number;       // Tendency to explore new data sources (0-1)

  // Stylistic preferences
  preferredTraits?: string[];
  avoidedTraits?: string[];

  // Decision-making style
  riskTolerance: number;         // Risk tolerance (0=cautious, 1=bold)
  changeRate: number;            // Preferred rate of change (0=slow, 1=fast)
}

/**
 * Data source strategy - Core innovation: AI autonomous source selection
 */
export interface DataSourceStrategy {
  autonomousSelection: boolean;  // AI can choose data sources independently
  availableSources: DataSourceCatalog;
  currentSubscriptions: DataFeed[];
  optimizationInterval: number;  // ms between optimization runs
  budget?: {
    maxCostPerDay?: number;
    maxSources?: number;
  };
}

/**
 * Data source catalog
 */
export interface DataSourceCatalog {
  [sourceId: string]: DataSourceDefinition;
}

export interface DataSourceDefinition {
  id: string;
  name: string;
  type: DataSourceType;
  endpoint: string;
  cost: number;                  // Cost per query
  reliability: number;           // Historical reliability (0-1)
  latency: number;               // Average latency (ms)
  description: string;
  requiredParams?: string[];

  // AI can discover and add more sources
  discoveredBy?: 'human' | 'ai_agent';
  addedAt?: number;
}

export type DataSourceType =
  | 'crypto'                     // Crypto market data
  | 'social'                     // Social media metrics
  | 'weather'                    // Real weather data
  | 'community'                  // Community activity
  | 'blockchain'                 // On-chain metrics
  | 'custom';                    // Custom data source

/**
 * Agent permissions
 */
export interface AgentPermissions {
  canModifyAllParams: boolean;
  maxChangeRate: number;         // Max parameter change per proposal (0-1)
  requiresApproval: boolean;     // Semi-autonomous mode requirement
  allowedTraits?: string[];      // Restricted trait set (if any)

  // Data source permissions
  canAddDataSources: boolean;
  canRemoveDataSources: boolean;
  maxDataSourceCost: number;
}

/**
 * Agent status
 */
export type AgentStatus =
  | 'active'                     // Actively making proposals
  | 'paused'                     // Temporarily paused
  | 'inactive'                   // Deactivated
  | 'pending_approval';          // Awaiting initial approval

/**
 * Agent performance metrics
 */
export interface AgentMetrics {
  totalProposals: number;
  approvedProposals: number;
  rejectedProposals: number;
  averageConfidence: number;
  averageApprovalTime: number;   // ms

  // Data source optimization metrics
  dataSourceChanges: number;
  successfulOptimizations: number;

  // Quality metrics
  visualDiversityScore: number;  // How diverse are the generated states
  userSatisfactionScore?: number;
}

/**
 * AI Decision Context - Input for decision-making
 */
export interface AIDecisionContext {
  currentState: import('./spaceState').SpaceState;
  recentHistory: import('./spaceState').SpaceStateHistoryEntry[];
  agent: AIAgent;
  collectedData: CollectedData;
  timestamp: number;
}

/**
 * Collected data from various sources
 */
export interface CollectedData {
  [sourceId: string]: {
    data: any;
    timestamp: number;
    source: string;
    quality: number;             // Data quality score (0-1)
  };
}

/**
 * Data source optimization decision
 */
export interface DataSourceOptimization {
  action: 'adjust_weights' | 'add_source' | 'remove_source' | 'no_change';
  changes: {
    sourceId: string;
    oldWeight?: number;
    newWeight?: number;
    action: 'add' | 'remove' | 'modify';
  }[];
  reasoning: string;
  expectedImprovement: number;   // Expected improvement score
}

/**
 * Agent activity log
 */
export interface AgentActivity {
  activityId: string;
  agentId: string;
  type: ActivityType;
  timestamp: number;
  details: any;
  success: boolean;
  error?: string;
}

export type ActivityType =
  | 'proposal_created'
  | 'proposal_approved'
  | 'proposal_rejected'
  | 'data_source_added'
  | 'data_source_removed'
  | 'weights_adjusted'
  | 'optimization_run'
  | 'status_changed';

/**
 * AI Agent registration request
 */
export interface RegisterAgentRequest {
  name: string;
  spaceId: string;
  personality: Partial<AgentPersonality>;
  permissions?: Partial<AgentPermissions>;
  enableAutonomousDataSelection?: boolean;
}

/**
 * Default configurations
 */
export const DEFAULT_AGENT_PERSONALITY: AgentPersonality = {
  creativity: 0.7,
  conservatism: 0.3,
  responsiveness: 0.5,
  explorationBias: 0.4,
  riskTolerance: 0.5,
  changeRate: 0.3,
};

export const DEFAULT_AGENT_PERMISSIONS: AgentPermissions = {
  canModifyAllParams: true,
  maxChangeRate: 0.3,
  requiresApproval: true,
  canAddDataSources: true,
  canRemoveDataSources: true,
  maxDataSourceCost: 1000,
};

/**
 * Built-in data source catalog
 */
export const BUILTIN_DATA_SOURCES: DataSourceCatalog = {
  'crypto-market': {
    id: 'crypto-market',
    name: 'Cryptocurrency Market Data',
    type: 'crypto',
    endpoint: '/api/data/crypto',
    cost: 1,
    reliability: 0.95,
    latency: 200,
    description: 'Real-time crypto market data (BTC, ETH, SUI, WAL)',
    discoveredBy: 'human',
  },
  'on-chain-metrics': {
    id: 'on-chain-metrics',
    name: 'On-chain Metrics',
    type: 'blockchain',
    endpoint: '/api/data/blockchain',
    cost: 2,
    reliability: 0.9,
    latency: 500,
    description: 'Blockchain activity metrics',
    discoveredBy: 'human',
  },
  'community-activity': {
    id: 'community-activity',
    name: 'Community Activity',
    type: 'community',
    endpoint: '/api/data/community',
    cost: 1,
    reliability: 0.85,
    latency: 300,
    description: 'Community engagement metrics',
    discoveredBy: 'human',
  },
};
