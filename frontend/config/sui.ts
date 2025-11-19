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

// Contract addresses - Testnet deployment
export const PACKAGE_ID = '0x186f53bf9b5d5364261ce462a19ee0f8b0be2b6a3756dba4bee7ef14c5f674eb';
export const IDENTITY_REGISTRY_ID = '0x2ba780a065cf23a76a6eff837b434f1b59230b975c57e1ecaab98c9ad991dcd9';
export const SPACE_REGISTRY_ID = '0xeef22b14e389bb6dc664e7d71293fbd2301a3acf8e46542db8f3f4ac46c602e2';
export const FAN_REGISTRY_ID = '0x33222a2d9b494e6983f478edcb450d305fd06a2cfae79a197d425353a5a08ca6';
export const SUBSCRIPTION_REGISTRY_ID = '0x7ff6ffbac3baf74b438a2a68c0c8bdb4e842ef568daeb2a79976043c5a416478';

