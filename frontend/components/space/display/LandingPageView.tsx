import { useState } from "react";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";
import { ContentItemData } from "../content";
import { getWalrusBlobUrl } from "@/config/walrus";
import { useCreatorIdentity } from "@/components/identity/hooks/useCreatorIdentity";
import { getIdentityImageBlobId } from "@/utils/identity-helpers";
import { SubscribeButton } from "@/components/subscription/SubscribeButton";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface LandingPageViewProps {
  space: any;
  contentItems: ContentItemData[];
  onUnlock: (itemId: string) => void;
  onView: (itemId: string) => void;
  isSubscribed: boolean;
  isCreator: boolean;
  onUpload?: () => void;
  identityId?: string | null;
  onSubscribed?: () => void;
}

export function LandingPageView({ 
  space, 
  contentItems, 
  onUnlock, 
  onView,
  isSubscribed,
  isCreator,
  onUpload,
  identityId,
  onSubscribed,
}: LandingPageViewProps) {
  const currentAccount = useCurrentAccount();
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  
  // Get the space creator's identity to display their avatar
  const { identity: creatorIdentity } = useCreatorIdentity(space.creator);
  const avatarBlobId = creatorIdentity ? getIdentityImageBlobId((creatorIdentity.content as any)?.fields) : undefined;
  const avatarUrl = avatarBlobId ? getWalrusBlobUrl(avatarBlobId) : undefined;

  // Group content by type
  const merchItems = contentItems.filter(i => i.type === 'merch');
  const videoItems = contentItems.filter(i => i.type === 'video');
  const essayItems = contentItems.filter(i => i.type === 'essay');

  const renderSection = (title: string, items: ContentItemData[], icon: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
            {title}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <RetroPanel key={item.id} variant="outset" className="h-full flex flex-col">
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800 text-lg" style={{ fontFamily: 'Georgia, serif' }}>
                    {item.title}
                  </h4>
                  {item.isLocked && !isSubscribed && !isCreator && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200">
                      🔒
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4 flex-1" style={{ fontFamily: 'Georgia, serif' }}>
                  {item.description}
                </p>
                <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
                    {item.isLocked ? (
                      <span className="flex items-center gap-1">
                        <span>🔒</span>
                        <span>Subscribers Only</span>
                      </span>
                    ) : (
                      'FREE'
                    )}
                  </span>
                  <RetroButton
                    onClick={() => item.isLocked && !isSubscribed && !isCreator ? onUnlock(item.id) : onView(item.id)}
                    variant={item.isLocked && !isSubscribed && !isCreator ? "primary" : "secondary"}
                    size="sm"
                    disabled={item.isLocked && !isSubscribed && !isCreator}
                    className={item.isLocked && !isSubscribed && !isCreator ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {item.isLocked && !isSubscribed && !isCreator ? "Subscribe to Read" : "Read"}
                  </RetroButton>
                </div>
              </div>
            </RetroPanel>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hidden bg-white">
      {/* Banner Section - Full width relative to container */}
      <div className="relative w-full">
        {/* Cover Image */}
        <div className="w-full h-48 md:h-64 bg-gray-100 relative overflow-hidden border-b border-gray-200">
           {space.coverImage ? (
             <img 
               src={getWalrusBlobUrl(space.coverImage)} 
               alt={space.name} 
               className="w-full h-full object-cover"
             />
           ) : (
             <div className="w-full h-full flex items-center justify-center bg-gray-50" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
               <span className="text-6xl opacity-20">🏛️</span>
             </div>
           )}
        </div>

        {/* Avatar Overlay */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
             {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Creator Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl md:text-5xl">
                👤
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 pt-16 md:pt-20">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            {space.name}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            {space.description}
          </p>
          <div className="mt-4 flex justify-center gap-4 text-sm text-gray-500">
            <span>Created by {space.creator ? `${space.creator.slice(0,6)}...${space.creator.slice(-4)}` : 'Unknown'}</span>
            <span>•</span>
            <span>Subscription: {(parseInt(space.subscriptionPrice) / 1_000_000_000).toFixed(2)} SUI/day</span>
          </div>

          {/* Subscribe Button - Only shown for non-creators in Explore mode */}
          {!isCreator && !isSubscribed && currentAccount && (
            <div className="mt-6 flex justify-center">
              <RetroButton
                onClick={() => setShowSubscribeModal(!showSubscribeModal)}
                variant="primary"
                size="lg"
                className="shadow-lg px-8"
              >
                🔒 Subscribe to Unlock Premium Content
              </RetroButton>
            </div>
          )}

          {/* Subscribed Badge */}
          {!isCreator && isSubscribed && (
            <div className="mt-6">
              <RetroPanel variant="inset" className="inline-block">
                <div className="px-4 bg-gray-50 flex items-center gap-2">
                  <span className="text-lg" style={{ color: '#8B6914' }}>✓</span>
                  <span className="text-sm font-medium" style={{ fontFamily: 'Georgia, serif', color: '#8B6914' }}>
                    Subscribed
                  </span>
                </div>
              </RetroPanel>
            </div>
          )}

          {/* Upload Button - Only shown for creators */}
          {onUpload && (
            <div className="mt-6">
              <RetroButton
                onClick={onUpload}
                variant="primary"
                size="md"
                className="shadow-sm"
              >
                + Upload New Content
              </RetroButton>
            </div>
          )}
        </div>

        {/* Subscribe Modal/Panel */}
        {showSubscribeModal && !isCreator && !isSubscribed && (
          <div className="mb-8 max-w-md mx-auto">
            <RetroPanel variant="outset" className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                  Subscribe to {space.name}
                </h3>
                <RetroButton
                  onClick={() => setShowSubscribeModal(false)}
                  variant="secondary"
                  size="sm"
                >
                  ✕
                </RetroButton>
              </div>
              <SubscribeButton
                spaceId={space.id}
                spaceKioskCapId={space.kioskCapId || space.kioskId}
                creatorAddress={space.creator}
                price={space.subscriptionPrice}
                identityId={identityId || null}
                onSubscribed={() => {
                  setShowSubscribeModal(false);
                  onSubscribed?.();
                }}
              />
            </RetroPanel>
          </div>
        )}

        {/* Content Sections */}
        {contentItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded border border-gray-200 border-dashed">
            <p className="text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>No content available yet.</p>
          </div>
        ) : (
          <>
            {renderSection("Essays & Thoughts", essayItems, "📝")}
            {renderSection("Videos & Streams", videoItems, "🎥")}
            {renderSection("Digital Merch", merchItems, "🛍️")}
          </>
        )}
      </div>
    </div>
  );
}
