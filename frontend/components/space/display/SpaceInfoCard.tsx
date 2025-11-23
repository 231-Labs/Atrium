"use client";

import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroHeading } from "@/components/common/RetroHeading";
import { getWalrusBlobUrl } from "@/config/walrus";
import { useCreatorIdentity } from "@/components/identity/hooks/useCreatorIdentity";
import { getIdentityImageBlobId } from "@/utils/identity-helpers";

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
  const { identity } = useCreatorIdentity(space.creator);
  const avatarBlobId = identity ? getIdentityImageBlobId((identity.content as any)?.fields) : undefined;
  const avatarUrl = avatarBlobId ? getWalrusBlobUrl(avatarBlobId) : undefined;
  const creatorName = identity?.display?.name || `${space.creator.slice(0, 6)}...${space.creator.slice(-4)}`;

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

      {/* Creator Info with Avatar */}
      <RetroPanel variant="inset" className="p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {avatarUrl && (
              <div className="flex-shrink-0">
                <img
                  src={avatarUrl}
                  alt={creatorName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                Creator
              </div>
              <div className="text-xs text-gray-800 font-medium truncate" style={{ fontFamily: 'Georgia, serif' }}>
                {creatorName}
              </div>
            </div>
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
