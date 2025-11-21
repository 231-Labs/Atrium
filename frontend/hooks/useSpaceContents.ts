import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { ContentIndexer } from '@/services/contentIndexer';
import { 
  getContentBySpace, 
  getAllContent,
  StoredContent, 
  saveMultipleContents 
} from '@/utils/contentStorage';

/**
 * Hook to load and manage space contents
 * Combines localStorage cache with blockchain data
 */
export function useSpaceContents(spaceId: string | null) {
  const suiClient = useSuiClient();
  const [contents, setContents] = useState<StoredContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!spaceId) {
      setContents([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadContents = async () => {
      setLoading(true);
      
      try {
        // Step 1: Load from cache (instant display)
        const cached = getContentBySpace(spaceId);
        if (cached.length > 0 && isMounted) {
          setContents(cached);
        }
        
        // Step 2: Query from blockchain (authoritative)
        const indexer = new ContentIndexer(suiClient);
        const chainContents = await indexer.querySpaceContents(spaceId);
        
        if (!isMounted) return;
        
        // Step 3: Merge with cached data to preserve sealResourceId
        // Blockchain data doesn't contain sealResourceId, so we need to preserve it from cache
        const mergedContents = chainContents.map(chainContent => {
          const cachedContent = cached.find(c => c.id === chainContent.id);
          return {
            ...chainContent,
            sealResourceId: cachedContent?.sealResourceId || chainContent.sealResourceId,
          };
        });
        
        setContents(mergedContents);
        
        // Step 4: Sync to localStorage (replace for this space, keep others)
        const allContents = getAllContent();
        const otherSpaceContents = allContents.filter(c => c.spaceId !== spaceId);
        const newAllContents = [...otherSpaceContents, ...mergedContents];
        saveMultipleContents(newAllContents);
        
        setError(null);
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadContents();

    // Listen for content updates
    const handleContentUpdate = (event: CustomEvent) => {
      const { spaceId: updatedSpaceId } = event.detail || {};
      if (updatedSpaceId === spaceId) {
        loadContents();
      }
    };

    window.addEventListener('atrium-content-updated', handleContentUpdate as EventListener);

    return () => {
      isMounted = false;
      window.removeEventListener('atrium-content-updated', handleContentUpdate as EventListener);
    };
  }, [spaceId, suiClient]);

  const refetch = () => {
    if (spaceId) {
      window.dispatchEvent(new CustomEvent('atrium-content-updated', { 
        detail: { spaceId } 
      }));
    }
  };

  return {
    contents,
    loading,
    error,
    refetch,
  };
}

