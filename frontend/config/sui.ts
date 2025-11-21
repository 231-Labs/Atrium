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

// Contract addresses - Testnet deployment (Fixed kiosk creation bug)
export const PACKAGE_ID = '0xb0d9bd004530fa892b4c81962a147c40acf72922e51f9553230436d139252f78';
export const IDENTITY_REGISTRY_ID = '0xd510be674fcbf7b8562a6ef4f0cfc05270a58a28c20777003ee1fbebb42b0902';
export const SPACE_REGISTRY_ID = '0x9634d442d929cd082406c78ba64a24a5d81bc807e8fd4d22fc054b4fe226a2ef';
export const FAN_REGISTRY_ID = '0x4b75f4d63aafc14879d398ca007e6c7abf1dbf9949846b3806356d55f9fa9bd9';
export const SUBSCRIPTION_REGISTRY_ID = '0x382d03c8d0da7ee53b2b37f41ae2f5efb31dfaeef75e94d4e1ad4bc7d9723bf0';

