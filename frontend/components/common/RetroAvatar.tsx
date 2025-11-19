'use client';

import { useState, useEffect } from 'react';

interface RetroAvatarProps {
  blobId?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space/v1/blobs';

const sizeStyles = {
  sm: 'w-12 h-12 text-lg',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-24 h-24 text-4xl',
};

export function RetroAvatar({ 
  blobId, 
  fallbackText = '👤',
  size = 'md',
  className = '' 
}: RetroAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (blobId && !imageError) {
      const url = `${WALRUS_AGGREGATOR}/${blobId}`;
      setImageUrl(url);
    } else {
      setImageUrl(null);
    }
  }, [blobId, imageError]);

  const handleImageError = () => {
    setImageError(true);
    setImageUrl(null);
  };

  return (
    <div 
      className={`
        ${sizeStyles[size]}
        rounded-full overflow-hidden 
        flex items-center justify-center
        ${className}
      `}
      style={{
        backgroundColor: '#f3f4f6',
        borderTop: '2px solid #d1d5db',
        borderLeft: '2px solid #d1d5db',
        borderBottom: '2px solid #9ca3af',
        borderRight: '2px solid #9ca3af',
        boxShadow: `
          inset 2px 2px 3px rgba(0, 0, 0, 0.06),
          inset -1px -1px 2px rgba(255, 255, 255, 0.9),
          0 1px 3px rgba(0, 0, 0, 0.1)
        `,
      }}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Avatar" 
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <span style={{ fontFamily: 'Georgia, serif' }}>
          {fallbackText}
        </span>
      )}
    </div>
  );
}

