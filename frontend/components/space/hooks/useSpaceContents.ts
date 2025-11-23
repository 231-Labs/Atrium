import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { ContentIndexer } from '@/services/contentIndexer';
import { 
  getContentBySpace, 
  getAllContent,
  StoredContent, 
  saveMultipleContents 
} from '@/utils/contentStorage';

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
        const cached = getContentBySpace(spaceId);
        if (cached.length > 0 && isMounted) {
          setContents(cached);
        }
        
        const indexer = new ContentIndexer(suiClient);
        const chainContents = await indexer.querySpaceContents(spaceId);
        
        if (!isMounted) return;
        
        const mergedContents = chainContents.map(chainContent => {
          const cachedContent = cached.find(c => c.id === chainContent.id);
          return {
            ...chainContent,
            sealResourceId: cachedContent?.sealResourceId || chainContent.sealResourceId,
          };
        });
        
        setContents(mergedContents);
        
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

  return { contents, loading, error, refetch };
}

