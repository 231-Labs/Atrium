import { useState, useEffect, useCallback } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { 
  getContentBySpace, 
  getAllContent, 
  StoredContent, 
  saveContent,
  saveMultipleContents,
} from '@/utils/contentStorage';
import { ContentIndexer } from '@/services/contentIndexer';

interface UseContentManagementOptions {
  spaceId: string;
}

interface UseContentManagementReturn {
  contents: StoredContent[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  handleUpload: (content: StoredContent) => void;
  handleDelete: (id: string) => void;
}

export function useContentManagement({ 
  spaceId 
}: UseContentManagementOptions): UseContentManagementReturn {
  const suiClient = useSuiClient();
  const [contents, setContents] = useState<StoredContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadContents = useCallback(async () => {
    if (!spaceId) return;

    try {
      setLoading(true);
      setError(null);

      const cached = getContentBySpace(spaceId);
      if (cached.length > 0) {
        setContents(cached);
      }

      const indexer = new ContentIndexer(suiClient);
      const chainContents = await indexer.querySpaceContents(spaceId);

      setContents(chainContents);

      const allContents = getAllContent();
      const otherSpaceContents = allContents.filter(c => c.spaceId !== spaceId);
      const newAllContents = [...otherSpaceContents, ...chainContents];
      saveMultipleContents(newAllContents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load contents'));
    } finally {
      setLoading(false);
    }
  }, [spaceId, suiClient]);

  useEffect(() => {
    loadContents();

    const handleContentUpdate = (event: CustomEvent) => {
      const { spaceId: updatedSpaceId } = event.detail || {};
      if (updatedSpaceId === spaceId) {
        loadContents();
      }
    };

    window.addEventListener('atrium-content-updated', handleContentUpdate as EventListener);

    return () => {
      window.removeEventListener('atrium-content-updated', handleContentUpdate as EventListener);
    };
  }, [loadContents, spaceId]);

  const handleUpload = useCallback((content: StoredContent) => {
    setContents(prev => [...prev, content]);
    saveContent(content);
  }, []);

  const handleDelete = useCallback((id: string) => {
    alert('Delete functionality is not yet implemented.');
  }, []);

  return {
    contents,
    loading,
    error,
    refetch: loadContents,
    handleUpload,
    handleDelete,
  };
}

