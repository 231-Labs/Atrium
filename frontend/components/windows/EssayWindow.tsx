/**
 * Essay Window - Using SecureContentWindow with TextRenderer
 * Simplified implementation leveraging Template Method Pattern
 */

import React from 'react';
import { SecureContentWindow } from './SecureContentWindow';
import { TextRenderer } from './renderers/ContentRenderers';
import { useSecureContent } from '@/components/space/content/hooks/useSecureContent';

interface EssayWindowProps {
  blobId: string;
  spaceId: string;
  title: string;
  isLocked: boolean;
  isCreator?: boolean;
  authId?: string;
}

export const EssayWindow: React.FC<EssayWindowProps> = ({ 
      blobId,
      spaceId,
      title,
  isLocked,
  isCreator = false,
  authId,
}) => {
  const { content, loading, error } = useSecureContent({
        blobId,
    resourceId: spaceId,
    contentType: 'text/markdown',
        isLocked,
    isCreator,
    authId,
      });

  return (
    <SecureContentWindow
      content={content}
      loading={loading}
      error={error}
      loadingMessage={isLocked ? 'Decrypting Essay...' : 'Loading Essay...'}
      renderer={(content) => <TextRenderer content={content} title={title} />}
      className="bg-white"
    />
  );
};
