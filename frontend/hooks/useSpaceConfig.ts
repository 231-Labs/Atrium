import { useState, useEffect } from 'react';
import { downloadConfigFromWalrus, SpaceConfig, DEFAULT_CONFIG } from '@/utils/spaceConfig';

export function useSpaceConfig(configQuilt: string | null) {
  const [config, setConfig] = useState<SpaceConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!configQuilt) {
      setConfig(DEFAULT_CONFIG);
      return;
    }

    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const loadedConfig = await downloadConfigFromWalrus(configQuilt);
        setConfig(loadedConfig);
      } catch (err) {
        console.error('Failed to load space config:', err);
        setError(err as Error);
        setConfig(DEFAULT_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [configQuilt]);

  return { config, loading, error };
}

