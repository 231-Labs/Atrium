import { useState, useEffect } from 'react';
import { getWalrusAggregatorUrl } from '@/config/walrus';

interface UseWalrusContentOptions {
  blobId: string;
  enabled?: boolean;
}

interface UseWalrusContentReturn {
  data: Uint8Array | null;
  loading: boolean;
  error: string | null;
}

export function useWalrusContent({
  blobId,
  enabled = true,
}: UseWalrusContentOptions): UseWalrusContentReturn {
  const [data, setData] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !blobId) return;

    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const aggregatorUrl = getWalrusAggregatorUrl();
        const response = await fetch(`${aggregatorUrl}/v1/blobs/${blobId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        setData(new Uint8Array(arrayBuffer));
      } catch (err: any) {
        setError(err.message || 'Failed to fetch content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [blobId, enabled]);

  return { data, loading, error };
}

