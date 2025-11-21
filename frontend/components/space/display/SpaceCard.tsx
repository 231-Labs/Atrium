"use client";

import { useRouter } from "next/navigation";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";
import { getWalrusBlobUrl } from "@/config/walrus";

interface Space {
  kioskId: string;
  name: string;
  description: string;
  coverImage: string;
  subscriptionPrice: string;
  creator: string;
}

interface SpaceCardProps {
  space: Space;
}

export function SpaceCard({ space }: SpaceCardProps) {
  const router = useRouter();

  const handleVisit = () => {
    router.push(`/space/${space.kioskId}`);
  };

  return (
    <div onClick={handleVisit} className="cursor-pointer">
      <RetroPanel 
        variant="outset"
        className="overflow-hidden transition-all hover:shadow-lg"
      >
      {/* Cover Image */}
      <div 
        className="relative h-40 flex items-center justify-center"
        style={{ 
          backgroundColor: '#f3f4f6',
          borderBottom: '2px solid #d1d5db',
        }}
      >
        {space.coverImage ? (
          <img
            src={getWalrusBlobUrl(space.coverImage)}
            alt={space.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-6xl">🏛️</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 
          className="text-lg font-bold text-gray-800 mb-2 line-clamp-1"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {space.name}
        </h3>
        <p 
          className="text-gray-600 text-sm mb-4 line-clamp-2"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {space.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#e5e7eb' }}>
          <div style={{ fontFamily: 'Georgia, serif' }}>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
              Creator
            </p>
            <p className="text-xs text-gray-700" style={{ fontFamily: 'Georgia, serif' }}>
              {space.creator.slice(0, 6)}...{space.creator.slice(-4)}
            </p>
          </div>
          <RetroButton
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleVisit();
            }}
          >
            Visit
          </RetroButton>
        </div>
      </div>
      </RetroPanel>
    </div>
  );
}

