import { ObjectTransform, SceneObject } from '@/types/spaceEditor';

export interface SpaceConfigObject {
  nftId: string;
  objectType: '2d' | '3d';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  visible: boolean;
}

export interface SpaceScreenConfig {
  contentType: 'video' | 'image' | 'none';
  blobId: string;
  autoplay: boolean;
}

export interface SpaceSubscriptionConfig {
  pricePerDay: number;
  currency: 'SUI';
}

export interface SpaceConfig {
  version: string;
  objects: SpaceConfigObject[];
  screen: SpaceScreenConfig;
  subscription: SpaceSubscriptionConfig;
}

export const DEFAULT_CONFIG: SpaceConfig = {
  version: '1.0.0',
  objects: [],
  screen: {
    contentType: 'none',
    blobId: '',
    autoplay: false,
  },
  subscription: {
    pricePerDay: 0,
    currency: 'SUI',
  },
};

export function serializeConfig(
  objects: SceneObject[],
  screenConfig?: Partial<SpaceScreenConfig>,
  subscriptionConfig?: Partial<SpaceSubscriptionConfig>
): SpaceConfig {
  return {
    version: '1.0.0',
    objects: objects.map(obj => ({
      nftId: obj.nftId,
      objectType: obj.objectType,
      position: obj.transform.position,
      rotation: obj.transform.rotation,
      scale: obj.transform.scale,
      visible: obj.visible,
    })),
    screen: {
      ...DEFAULT_CONFIG.screen,
      ...screenConfig,
    },
    subscription: {
      ...DEFAULT_CONFIG.subscription,
      ...subscriptionConfig,
    },
  };
}

export function parseConfig(configJson: string): SpaceConfig {
  try {
    const config = JSON.parse(configJson) as SpaceConfig;
    
    if (!config.version) {
      throw new Error('Invalid config: missing version');
    }

    return {
      ...DEFAULT_CONFIG,
      ...config,
      objects: config.objects || [],
      screen: { ...DEFAULT_CONFIG.screen, ...config.screen },
      subscription: { ...DEFAULT_CONFIG.subscription, ...config.subscription },
    };
  } catch (error) {
    console.error('Failed to parse config:', error);
    return DEFAULT_CONFIG;
  }
}

export function configToSceneObjects(config: SpaceConfig): Partial<SceneObject>[] {
  return config.objects.map(obj => ({
    nftId: obj.nftId,
    objectType: obj.objectType,
    transform: {
      position: obj.position,
      rotation: obj.rotation,
      scale: obj.scale,
    },
    visible: obj.visible,
  }));
}

export async function downloadConfigFromWalrus(blobId: string): Promise<SpaceConfig> {
  if (!blobId) {
    return DEFAULT_CONFIG;
  }

  try {
    const response = await fetch(
      `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to download config: ${response.statusText}`);
    }

    const configText = await response.text();
    return parseConfig(configText);
  } catch (error) {
    console.error('Failed to download config from Walrus:', error);
    return DEFAULT_CONFIG;
  }
}

export async function uploadConfigToWalrus(config: SpaceConfig): Promise<string> {
  const configJson = JSON.stringify(config, null, 2);
  const blob = new Blob([configJson], { type: 'application/json' });

  const formData = new FormData();
  formData.append('file', blob, 'config.json');

  try {
    const response = await fetch(
      'https://publisher.walrus-testnet.walrus.space/v1/store',
      {
        method: 'PUT',
        body: blob,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to upload config: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.newlyCreated?.blobObject?.blobId) {
      return result.newlyCreated.blobObject.blobId;
    } else if (result.alreadyCertified?.blobId) {
      return result.alreadyCertified.blobId;
    }

    throw new Error('Failed to get blob ID from response');
  } catch (error) {
    console.error('Failed to upload config to Walrus:', error);
    throw error;
  }
}

export function validateConfig(config: SpaceConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.version) {
    errors.push('Missing version');
  }

  if (!Array.isArray(config.objects)) {
    errors.push('Objects must be an array');
  }

  config.objects.forEach((obj, index) => {
    if (!obj.nftId) {
      errors.push(`Object ${index}: missing nftId`);
    }
    if (!obj.objectType || !['2d', '3d'].includes(obj.objectType)) {
      errors.push(`Object ${index}: invalid objectType`);
    }
    if (!Array.isArray(obj.position) || obj.position.length !== 3) {
      errors.push(`Object ${index}: invalid position`);
    }
    if (!Array.isArray(obj.rotation) || obj.rotation.length !== 3) {
      errors.push(`Object ${index}: invalid rotation`);
    }
    if (typeof obj.scale !== 'number' || obj.scale <= 0) {
      errors.push(`Object ${index}: invalid scale`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

