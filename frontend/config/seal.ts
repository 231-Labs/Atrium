export interface SealKeyServer {
  objectId: string;
  weight: number;
  provider: string;
  url: string;
}

export const TESTNET_KEY_SERVERS: SealKeyServer[] = [
  {
    objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
    weight: 1,
    provider: 'Mysten Labs 1',
    url: 'https://seal-key-server-testnet-1.mystenlabs.com',
  },
  {
    objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
    weight: 1,
    provider: 'Mysten Labs 2',
    url: 'https://seal-key-server-testnet-2.mystenlabs.com',
  },
  {
    objectId: '0x4cded1abeb52a22b6becb42a91d3686a4c901cf52eee16234214d0b5b2da4c46',
    weight: 1,
    provider: 'Triton One',
    url: 'https://seal.testnet.sui.rpcpool.com',
  },
] as const;

export const MAINNET_KEY_SERVERS: SealKeyServer[] = [] as const;

export const SEAL_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_SEAL_ENABLED !== 'false',
  
  supportedTypes: ['mp4', 'webm', 'mov', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'md'] as const,
  
  timeout: 30000,
  
  verifyKeyServers: true,
  
  threshold: 2,
  
  subscriptionRegistryId: process.env.NEXT_PUBLIC_SUBSCRIPTION_REGISTRY_ID || '',
  
  getKeyServers: (network: 'testnet' | 'mainnet' = 'testnet'): SealKeyServer[] => {
    return network === 'testnet' ? TESTNET_KEY_SERVERS : MAINNET_KEY_SERVERS;
  },
  
  isTypeSupported: (fileType: string): boolean => {
    const ext = fileType.toLowerCase().replace('.', '');
    return SEAL_CONFIG.supportedTypes.includes(ext as any);
  },
} as const;

export type SealConfig = typeof SEAL_CONFIG;

export const getSealKeyServers = SEAL_CONFIG.getKeyServers;
export const isSealTypeSupported = SEAL_CONFIG.isTypeSupported;
