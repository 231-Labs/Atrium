"use client";

import { RetroButton } from "@/components/common/RetroButton";
import { RetroPanel } from "@/components/common/RetroPanel";
import { ContentList, ContentItemData } from "../content";
import { MerchList } from "../nft";
import { SubscribeButton } from "@/components/subscription/SubscribeButton";

interface SpaceDetailMobileNavProps {
  space: {
    id: string;
    kioskId: string;
    kioskCapId?: string;
    marketplaceKioskId?: string;
    creator: string;
    subscriptionPrice: string;
  };
  currentAccount: any;
  isSubscribed: boolean;
  identityId: string | null;
  isCreator: boolean;
  activeTab: "merch" | "video" | "essay" | "subscribe";
  isContentMenuOpen: boolean;
  displayItems: ContentItemData[];
  tabs: Array<{ id: string; label: string; icon: string }>;
  onTabClick: (tabId: "merch" | "video" | "essay" | "subscribe") => void;
  onSubscribed: () => void;
  onUnlock: (itemId: string) => void;
  onView: (itemId: string) => void;
  onViewIn3D?: (nftId: string) => void;
  onPurchase: (nftId: string, nftType: string, price: string) => Promise<void>;
  onJoinAtrium: () => void;
}

export function SpaceDetailMobileNav({
  space,
  currentAccount,
  isSubscribed,
  identityId,
  isCreator,
  activeTab,
  isContentMenuOpen,
  displayItems,
  tabs,
  onTabClick,
  onSubscribed,
  onUnlock,
  onView,
  onViewIn3D,
  onPurchase,
  onJoinAtrium,
}: SpaceDetailMobileNavProps) {
  return (
    <div className="lg:hidden flex-shrink-0" style={{ borderColor: '#d1d5db' }}>
      <RetroPanel variant="outset" className="rounded-none">
        {/* Expandable Content Panel */}
        {isContentMenuOpen && (
          <div 
            className="max-h-72 overflow-y-auto scrollbar-hidden border-b bg-white"
            style={{ borderColor: '#d1d5db' }}
          >
            <div className="p-2.5">
              {activeTab === "subscribe" ? (
                <div>
                  <div className="text-center mb-2">
                    <span className="text-xs text-gray-700 font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                      🔒 Subscribe to unlock premium content
                    </span>
                  </div>
                  <SubscribeButton
                    spaceId={space.id}
                    spaceKioskCapId={space.kioskCapId || space.kioskId}
                    creatorAddress={space.creator}
                    price={space.subscriptionPrice}
                    identityId={identityId}
                    onSubscribed={onSubscribed}
                  />
                </div>
              ) : !currentAccount ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">👀</div>
                  <p className="text-xs text-gray-700 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                    Join Atrium to subscribe and unlock content
                  </p>
                  <RetroButton
                    onClick={onJoinAtrium}
                    variant="primary"
                    size="sm"
                    className="w-full"
                  >
                    Join Atrium
                  </RetroButton>
                </div>
              ) : (
                <>
                  {activeTab === 'merch' ? (
                    space.marketplaceKioskId ? (
                      <MerchList
                        kioskId={space.marketplaceKioskId}
                        onViewIn3D={onViewIn3D}
                        onPurchase={onPurchase}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-3xl mb-2 opacity-30">🛍️</div>
                        <p className="text-xs text-gray-500 font-serif">No marketplace available</p>
                      </div>
                    )
                  ) : (
                    <ContentList
                      items={displayItems}
                      type={activeTab as "merch" | "video" | "essay"}
                      isSubscribed={isSubscribed}
                      isCreator={isCreator}
                      onUnlock={onUnlock}
                      onView={onView}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Fixed Button Row */}
        <div className="flex" style={{ borderColor: '#d1d5db' }}>
          {tabs.map((tab) => (
            <div 
              key={tab.id}
              className="flex-1 border-r last:border-r-0"
              style={{ borderColor: '#d1d5db' }}
            >
              <RetroButton
                onClick={() => onTabClick(tab.id as "merch" | "video" | "essay" | "subscribe")}
                variant={activeTab === tab.id ? "primary" : "secondary"}
                size="sm"
                className="w-full rounded-none"
              >
                <div className="flex flex-col items-center py-1">
                  <span className="text-base mb-0.5">{tab.icon}</span>
                  <span className="text-xs" style={{ fontFamily: 'Georgia, serif' }}>
                    {tab.label}
                  </span>
                </div>
              </RetroButton>
            </div>
          ))}
        </div>
      </RetroPanel>
    </div>
  );
}

