"use client";

import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroHeading } from "@/components/common/RetroHeading";
import { getWalrusBlobUrl } from "@/config/walrus";

interface SpaceInfoCardProps {
  space: {
    kioskId: string;
    name: string;
    description: string;
    coverImage: string;
    subscriptionPrice: string;
    creator: string;
  };
}

export function SpaceInfoCard({ space }: SpaceInfoCardProps) {
  return (
    <div className="space-y-3">
      {/* Cover Image */}
      {space.coverImage && (
        <RetroPanel variant="inset" className="p-1">
          <img
            src={getWalrusBlobUrl(space.coverImage)}
            alt={space.name}
            className="w-full h-32 object-cover"
          />
        </RetroPanel>
      )}

      {/* Space Description */}
      <div>
        <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
          {space.description}
        </p>
      </div>

      {/* Space Stats - Simple List */}
      <RetroPanel variant="inset" className="p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              Creator
            </span>
            <span className="text-xs text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
              {space.creator.slice(0, 6)}...{space.creator.slice(-4)}
            </span>
          </div>
          
          <div className="h-px bg-gray-200" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              Space ID
            </span>
            <span className="text-xs text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
              {space.kioskId.slice(0, 8)}...{space.kioskId.slice(-6)}
            </span>
          </div>
        </div>
      </RetroPanel>
    </div>
  );
}
