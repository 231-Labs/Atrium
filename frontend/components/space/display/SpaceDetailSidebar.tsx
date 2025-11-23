"use client";

import { RetroButton } from "@/components/common/RetroButton";
import { SpaceInfoCard } from "./SpaceInfoCard";
import { SpaceTabNavigation } from "../ui";
import { ContentList, ContentItemData } from "../content";
import { SubscribeButton } from "@/components/subscription/SubscribeButton";
import { MerchList } from "../nft";

interface SpaceDetailSidebarProps {
  space: {
    id: string;
    kioskId: string;
    kioskCapId?: string;
    marketplaceKioskId?: string;
    name: string;
    description: string;
    coverImage: string;
    creator: string;
    subscriptionPrice: string;
  };
  isLoading: boolean;
  currentAccount: any;
  isSubscribed: boolean;
  identityId: string | null;
  isCreator: boolean;
  activeTab: "merch" | "video" | "essay";
  showSubscribeForm: boolean;
  displayItems: ContentItemData[];
  contentTabs: Array<{ id: string; label: string; icon: string }>;
  onTabChange: (tabId: string) => void;
  onSubscribed: () => void;
  onShowSubscribeForm: (show: boolean) => void;
  onUnlock: (itemId: string) => void;
  onView: (itemId: string) => void;
  onViewIn3D?: (nftId: string) => void;
  onPurchase: (nftId: string, nftType: string, price: string) => Promise<void>;
  onJoinAtrium: () => void;
}

export function SpaceDetailSidebar({
  space,
  isLoading,
  currentAccount,
  isSubscribed,
  identityId,
  isCreator,
  activeTab,
  showSubscribeForm,
  displayItems,
  contentTabs,
  onTabChange,
  onSubscribed,
  onShowSubscribeForm,
  onUnlock,
  onView,
  onViewIn3D,
  onPurchase,
  onJoinAtrium,
}: SpaceDetailSidebarProps) {
  return (
    <div className="hidden lg:flex w-80 flex-shrink-0 border-r h-full" style={{ borderColor: '#d1d5db' }}>
      <div className="h-full flex flex-col bg-white w-full">
        {/* Space Info Header */}
        <div className="p-3 md:p-4 border-b flex-shrink-0" style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb' }}>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-40 bg-gray-200 rounded w-full"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : (
            <SpaceInfoCard space={space} />
          )}
        </div>

        {/* Content Tabs */}
        <div className="px-3 py-2 border-b flex-shrink-0" style={{ borderColor: '#d1d5db' }}>
          <SpaceTabNavigation 
            tabs={contentTabs}
            activeTab={showSubscribeForm ? "" : activeTab}
            onTabChange={(tabId) => {
              if (isLoading) return;
              onShowSubscribeForm(false);
              onTabChange(tabId);
            }}
          />
        </div>

        {/* Content List */}
        <div className="flex-1 min-w-0 overflow-y-auto scrollbar-hidden p-2 md:p-3 bg-white">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="border p-3 animate-pulse" />
              ))}
            </div>
          ) : !currentAccount ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-8">
                <div className="text-5xl mb-4">👀</div>
                <p className="text-sm text-gray-700 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                  Join Atrium to subscribe and unlock content
                </p>
                <RetroButton onClick={onJoinAtrium} variant="primary" size="md">
                  Join Atrium
                </RetroButton>
              </div>
            </div>
          ) : showSubscribeForm ? (
            <div className="space-y-3">
              <RetroButton
                onClick={() => onShowSubscribeForm(false)}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                ← Back to Content
              </RetroButton>
              <SubscribeButton
                spaceId={space.id}
                spaceKioskCapId={space.kioskCapId || space.kioskId}
                creatorAddress={space.creator}
                price={space.subscriptionPrice}
                identityId={identityId}
                onSubscribed={onSubscribed}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {!isSubscribed && !isCreator && (
                <RetroButton
                  onClick={() => onShowSubscribeForm(true)}
                  variant="primary"
                  size="sm"
                  className="w-full"
                >
                  🔒 Subscribe to Unlock Premium Content
                </RetroButton>
              )}
              
              {activeTab === 'merch' ? (
                space.marketplaceKioskId ? (
                  <MerchList
                    kioskId={space.marketplaceKioskId}
                    onViewIn3D={onViewIn3D}
                    onPurchase={onPurchase}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3 opacity-30">🛍️</div>
                    <p className="text-sm text-gray-500 font-serif">No marketplace available</p>
                  </div>
                )
              ) : (
                <ContentList
                  items={displayItems}
                  type={activeTab}
                  isSubscribed={isSubscribed}
                  isCreator={isCreator}
                  onUnlock={onUnlock}
                  onView={onView}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

