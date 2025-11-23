/**
 * Sui blockchain configuration
 * Unified management of Sui network and transaction settings
 */

export const SUI_CONFIG = {
  NETWORK: 'testnet' as const,
  CHAIN: 'sui:testnet' as const,
  CLOCK_ID: '0x6',
  MIST_PER_SUI: 1_000_000_000,
} as const;

export const SUI_NETWORK = SUI_CONFIG.NETWORK;
export const SUI_CHAIN = SUI_CONFIG.CHAIN;
export const SUI_CLOCK = SUI_CONFIG.CLOCK_ID;
export const MIST_PER_SUI = SUI_CONFIG.MIST_PER_SUI;

// Contract addresses - Testnet deployment (2025-11-23)
export const PACKAGE_ID = '0xc34fcde1cc554a65e7c553a8f61d9a1f97d085a05d1f58f0508b91597a393334';
export const IDENTITY_REGISTRY_ID = '0xad4d9d6fbd3357b2242788a945a12c2a4911f5ca2470ac6ef541e97a9a769839';
export const SPACE_REGISTRY_ID = '0x92689353cf597f8e9e7d0e0526f0a623bfb4aae2356a045325cd1be2bb5bab68';
export const FAN_REGISTRY_ID = '0xcf6da79c7bce84eba0dff10a55068a59a1496ab678877eb0ef65fb37bf58e09d';
export const SUBSCRIPTION_REGISTRY_ID = '0x936aaeb27de7427955ded20b452ddf2e0c1bf826786a40b25f30af99a1f715d3';

