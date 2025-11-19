"use client";

import { useState } from 'react';
import { RetroPanel } from '@/components/common/RetroPanel';
import { RetroButton } from '@/components/common/RetroButton';
import { RetroHeading } from '@/components/common/RetroHeading';
import { useKioskManagement, KioskNFT } from '@/hooks/useKioskManagement';
import { ObjectTransform } from '@/types/spaceEditor';

interface NFTListPanelProps {
  kioskId: string;
  visibleNFTs: Set<string>;
  objectTransforms: Map<string, ObjectTransform>;
  onToggleVisibility: (nftId: string) => void;
  onScaleChange: (nftId: string, scale: number) => void;
  onList: (nftId: string) => void;
  onDelist: (nftId: string) => void;
}

interface NFTItemProps {
  nft: KioskNFT;
  isVisible: boolean;
  transform?: ObjectTransform;
  onToggleVisibility: () => void;
  onScaleChange: (scale: number) => void;
  onList: () => void;
  onDelist: () => void;
}

function NFTItem({
  nft,
  isVisible,
  transform,
  onToggleVisibility,
  onScaleChange,
  onList,
  onDelist,
}: NFTItemProps) {
  const [scale, setScale] = useState(transform?.scale || 1.0);

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    if (!isNaN(newScale) && newScale >= 0.1 && newScale <= 10.0) {
      setScale(newScale);
      onScaleChange(newScale);
    }
  };

  return (
    <RetroPanel variant="outset" className="p-3 mb-2">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
          {nft.imageUrl ? (
            <img
              src={nft.imageUrl}
              alt={nft.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {nft.objectType === '3d' ? '🎭' : '🖼️'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-800 truncate" style={{ fontFamily: 'Georgia, serif' }}>
            {nft.name}
          </h4>
          <p className="text-xs text-gray-500 mb-2">
            {nft.objectType.toUpperCase()} NFT
          </p>

          {/* Scale Input */}
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
              Scale:
            </label>
            <RetroPanel variant="inset" className="p-0 flex-1">
              <input
                type="number"
                min="0.1"
                max="10.0"
                step="0.1"
                value={scale}
                onChange={handleScaleChange}
                className="w-full px-2 py-1 bg-transparent border-0 outline-none text-xs"
                style={{ fontFamily: 'Georgia, serif' }}
                disabled={!isVisible}
              />
            </RetroPanel>
          </div>

          {/* Position Display */}
          {transform && isVisible && (
            <div className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              Pos: X:{transform.position[0].toFixed(1)} Y:{transform.position[1].toFixed(1)} Z:{transform.position[2].toFixed(1)}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <RetroButton
              variant={isVisible ? "primary" : "secondary"}
              size="sm"
              onClick={onToggleVisibility}
              className="flex-1"
            >
              {isVisible ? 'Hide' : 'Show'}
            </RetroButton>
            {nft.isListed ? (
              <RetroButton
                variant="secondary"
                size="sm"
                onClick={onDelist}
                className="flex-1"
              >
                Delist
              </RetroButton>
            ) : (
              <RetroButton
                variant="secondary"
                size="sm"
                onClick={onList}
                className="flex-1"
              >
                List
              </RetroButton>
            )}
          </div>

          {nft.isListed && nft.price && (
            <div className="mt-2 text-xs text-green-600" style={{ fontFamily: 'Georgia, serif' }}>
              Listed: {(parseInt(nft.price) / 1_000_000_000).toFixed(2)} SUI
            </div>
          )}
        </div>
      </div>
    </RetroPanel>
  );
}

export function NFTListPanel({
  kioskId,
  visibleNFTs,
  objectTransforms,
  onToggleVisibility,
  onScaleChange,
  onList,
  onDelist,
}: NFTListPanelProps) {
  const { nfts, loading, error, refetch } = useKioskManagement({
    kioskId,
    enabled: !!kioskId && kioskId.length > 0,
  });

  if (!kioskId || kioskId.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
          No Kiosk ID available
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin text-3xl text-gray-400 mb-3">
          ⟳
        </div>
        <p className="text-sm text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
          Loading...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-3">⚠️</div>
        <p className="text-sm text-red-600 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          {error.message}
        </p>
        <RetroButton onClick={refetch} variant="primary" size="sm">
          Retry
        </RetroButton>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col -mx-4 -mt-4">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b" style={{ borderColor: '#e5e7eb' }}>
        <div>
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            {nfts.length} NFTs
          </h3>
        </div>
        <button
          onClick={refetch}
          className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-3 space-y-2">
        {nfts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎨</div>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
              No NFTs yet
            </p>
            <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
              Add NFTs to display in your space
            </p>
          </div>
        ) : (
          nfts.map(nft => (
            <NFTItem
              key={nft.id}
              nft={nft}
              isVisible={visibleNFTs.has(nft.id)}
              transform={objectTransforms.get(nft.id)}
              onToggleVisibility={() => onToggleVisibility(nft.id)}
              onScaleChange={(scale) => onScaleChange(nft.id, scale)}
              onList={() => onList(nft.id)}
              onDelist={() => onDelist(nft.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

