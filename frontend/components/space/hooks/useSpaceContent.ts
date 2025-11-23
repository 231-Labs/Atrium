import { useMemo } from 'react';
import { useSpaceContents } from './useSpaceContents';
import { ContentItemData } from '@/components/space/content';

export function useSpaceContent(spaceId: string | null) {
  const { contents: spaceContents, loading, error, refetch } = useSpaceContents(spaceId);

  const contentItems: ContentItemData[] = useMemo(() => {
    return spaceContents
      .filter(c => c.type !== 'image')
      .map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        type: c.type as 'video' | 'essay' | 'merch',
        blobId: c.blobId,
        isLocked: c.encrypted,
        price: c.price,
        sealResourceId: c.sealResourceId,
      }));
  }, [spaceContents]);

  const getContentByType = (type: 'video' | 'essay' | 'merch') => {
    return contentItems.filter(item => item.type === type);
  };

  const lockedContent = useMemo(() => contentItems.filter(item => item.isLocked), [contentItems]);
  const freeContent = useMemo(() => contentItems.filter(item => !item.isLocked), [contentItems]);

  return {
    contentItems,
    loading,
    error,
    refetch,
    getContentByType,
    lockedContent,
    freeContent,
    hasContent: contentItems.length > 0,
  };
}

