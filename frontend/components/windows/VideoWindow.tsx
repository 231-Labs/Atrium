/**
 * Video Window - Using SecureContentWindow with VideoRenderer
 * Simplified implementation leveraging Template Method Pattern
 */

import React, { useEffect } from 'react';
import { SecureContentWindow } from './SecureContentWindow';
import { VideoRenderer } from './renderers/ContentRenderers';
import { useSecureContent } from '@/components/space/content/hooks/useSecureContent';

interface VideoWindowProps {
  blobId: string;
  resourceId: string;
  title: string;
  isLocked: boolean;
  isCreator?: boolean;
  authId?: string;
}

export const VideoWindow: React.FC<VideoWindowProps> = ({ 
  blobId, 
  resourceId, 
  title, 
  isLocked,
  isCreator = false,
  authId,
}) => {
  const { content, loading, error } = useSecureContent({
    blobId,
    resourceId,
    contentType: 'video/mp4',
    isLocked,
    isCreator,
    authId,
  });

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (content && content.startsWith('blob:')) {
        URL.revokeObjectURL(content);
      }
    };
  }, [content]);

  return (
    <SecureContentWindow
      content={content}
      loading={loading}
      error={error}
      loadingMessage={isLocked ? 'Decrypting Video...' : 'Loading Video...'}
      renderer={(content) => <VideoRenderer content={content} />}
      className="bg-black"
    />
  );
};
