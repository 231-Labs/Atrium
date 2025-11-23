import { walrusApi } from '@/services/walrusApi';

interface SpaceConfig {
  scene_version?: string;
  objects?: any[];
  lighting?: any;
  metadata?: {
    category?: string;
    tags?: string[];
    isPublic?: boolean;
    subscriptionType?: string;
  };
}

export async function fetchCategoryFromConfig(configQuilt: string): Promise<string> {
  if (!configQuilt) return 'other';
  
  try {
    const response = await walrusApi.readBlob(configQuilt);
    const text = await response.text();
    const config: SpaceConfig = JSON.parse(text);
    return config.metadata?.category || 'other';
  } catch (error) {
    console.warn('Failed to fetch category from config:', error);
    return 'other';
  }
}

export async function fetchConfigFromWalrus(configQuilt: string): Promise<SpaceConfig | null> {
  if (!configQuilt) return null;
  
  try {
    const response = await walrusApi.readBlob(configQuilt);
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to fetch config:', error);
    return null;
  }
}

