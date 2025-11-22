"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { ThreeScene } from "@/components/3d/ThreeScene";
import { WeatherModeToggle } from "@/components/3d/WeatherModeToggle";
import { RetroFrameCanvas } from "@/components/3d/RetroFrameCanvas";
import { RetroButton } from "@/components/common/RetroButton";
import { LandingPageView } from "./LandingPageView";
import { SpaceDetailSidebar } from "./SpaceDetailSidebar";
import { SpaceDetailMobileNav } from "./SpaceDetailMobileNav";
import { getAccessStatus } from "../ui";

// Hooks
import { useContentWindows } from "@/hooks/useContentWindows";
import { useResponsive } from "@/hooks/useResponsive";
import { useSpaceSubscription } from "@/hooks/useSpaceSubscription";
import { useSpaceViewMode } from "@/hooks/useSpaceViewMode";
import { useSpaceContent } from "@/hooks/useSpaceContent";
import { useSpaceAuthToken } from "@/hooks/useSpaceAuthToken";

interface SpaceDetailProps {
  space?: {
    id: string;
    kioskId: string;
    kioskCapId?: string;
    ownershipId?: string;  // SpaceOwnership NFT ID for PTB
    name: string;
    description: string;
    coverImage: string;
    configQuilt: string;
    subscriptionPrice: string;
    creator: string;
    videoBlobs: string[];
  };
  isLoading?: boolean;
  spaceId?: string;
}

export function SpaceDetail({ space, isLoading = false, spaceId }: SpaceDetailProps) {
  const router = useRouter();
  const currentAccount = useCurrentAccount();

  // Safety check for missing data when not loading
  if (!isLoading && !space) return null;

  // Create safe space object with defaults or loaded data
  const safeSpace = space || {
    id: spaceId || "",
    kioskId: spaceId || "",
    name: "Loading Space...",
    description: "Please wait while we load the space content.",
    coverImage: "",
    configQuilt: "",
    subscriptionPrice: "0",
    creator: "",
    videoBlobs: []
  };

  // UI State
  const [activeTab, setActiveTab] = useState<"merch" | "video" | "essay" | "subscribe">("merch");
  const [isContentMenuOpen, setIsContentMenuOpen] = useState(false);
  const [showSubscribeForm, setShowSubscribeForm] = useState(false);

  // Custom Hooks
  const { isMobile } = useResponsive();
  const { isSubscribed, identityId, setIsSubscribed } = useSpaceSubscription(safeSpace.kioskId);
  
  // Check if current user is the space creator
  const isCreator = currentAccount?.address 
    ? currentAccount.address.toLowerCase() === safeSpace.creator?.toLowerCase()
    : false;
  
  // Query user's authentication token (SpaceOwnership or Subscription)
  const { id: authId, loading: authLoading, error: authError, refetch: refetchAuthToken } = useSpaceAuthToken(
    safeSpace.id,
    currentAccount?.address,
    isCreator
  );
  
  // Determine actual subscription status based on authId
  // User has access if they are creator OR have valid authId (subscription/ownership)
  const hasAccess = isCreator || !!authId;
  
  // Update isSubscribed based on authId for backward compatibility
  React.useEffect(() => {
    if (authId && !isCreator) {
      // User has subscription NFT
      setIsSubscribed(true);
    }
  }, [authId, isCreator, setIsSubscribed]);
  
  const { viewMode, weatherMode, setViewMode, setWeatherMode } = useSpaceViewMode(isCreator ? 'landing' : '3d');
  const { openEssay, openVideo, renderWindows } = useContentWindows();
  const { contentItems: displayItems } = useSpaceContent(safeSpace.id);

  const accessStatus = getAccessStatus(currentAccount, hasAccess, isCreator);

  const handleEditSpace = () => {
    router.push(`/space/${safeSpace.id}/edit`);
  };

  // Define tabs based on user status
  const contentTabs = [
    { id: "merch", label: "Merch", icon: "🛍️" },
    { id: "video", label: "Video", icon: "🎥" },
    { id: "essay", label: "Essay", icon: "📝" },
  ];
  
  const subscribeTab = { id: "subscribe", label: "Subscribe", icon: "🔒" };
  
  // Add subscribe tab for non-subscribers on mobile
  const tabs = (currentAccount && !hasAccess && !isCreator) 
    ? [...contentTabs, subscribeTab]
    : contentTabs;

  const handleJoinAtrium = () => {
    router.push("/");
  };

  const handleUnlockContent = (itemId: string) => {
    // Show subscribe form
    setShowSubscribeForm(true);
  };

  const handleViewContent = (itemId: string) => {
    console.log("📖 [SpaceDetail] View content:", itemId);
    const item = displayItems.find(i => i.id === itemId);
    if (!item) {
      console.error('Content not found:', itemId);
      return;
    }

    console.log('📖 [SpaceDetail] Opening content:', {
      id: item.id,
      blobId: item.blobId,
      title: item.title,
      isLocked: item.isLocked,
      spaceId: safeSpace.id,
      kioskId: safeSpace.kioskId,
      fullSafeSpace: safeSpace,
    });

    // Use blobId if available, otherwise fallback to id (for mock data)
    const actualBlobId = item.blobId || item.id;
    const spaceId = safeSpace.id;
    
    if (!spaceId || spaceId === '') {
      console.error('❌ [SpaceDetail] No valid Space ID available!');
      alert('Cannot open content: Space ID is missing');
      return;
    }
    
    // Check if authentication token is available
    if (item.isLocked && !authId) {
      if (authLoading) {
        alert('Please wait, loading authentication...');
        return;
      }
      if (authError) {
        alert(`Cannot access content: ${authError}`);
        return;
      }
      alert('Cannot access content: Authentication token not found');
      return;
    }
    
    console.log('📖 [SpaceDetail] Opening content:', {
      contentId: item.id,
      contentLocked: item.isLocked,
      spaceId,
      blobId: actualBlobId,
      isCreator,
      isSubscribed,
      authId,
    });

    // Open appropriate window with item data
    if (item.type === 'video') {
      openVideo(actualBlobId, spaceId, item.title, item.isLocked || false, isCreator, authId || undefined);
    } else if (item.type === 'essay') {
      openEssay(actualBlobId, spaceId, item.title, item.isLocked || false, isCreator, authId || undefined);
    }
    
    setIsContentMenuOpen(false);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/space/${safeSpace.kioskId}`;
    const shareText = `✨ ${safeSpace.name}\n\n${safeSpace.description}\n\n🔗 ${shareUrl}`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Link and description copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy to clipboard");
    }
  };


  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden" style={{ fontFamily: 'Georgia, serif' }}>
      
      {/* Windows Layer - Only relevant in 3D mode or overlaying Landing Page */}
      {renderWindows({ isMobile })}

      {/* Main Content Area */}
      <div className="flex flex-col-reverse lg:flex-row flex-1 overflow-hidden">
        
        {/* Mobile: Bottom Navigation Bar - Only in 3D mode */}
        {viewMode === '3d' && (
          <SpaceDetailMobileNav
            space={safeSpace}
            currentAccount={currentAccount}
            isSubscribed={hasAccess}
            identityId={identityId}
            isCreator={isCreator}
            activeTab={activeTab}
            isContentMenuOpen={isContentMenuOpen}
            displayItems={displayItems}
            tabs={tabs}
            onTabClick={(tabId) => {
              if (activeTab === tabId) {
                setIsContentMenuOpen(!isContentMenuOpen);
              } else {
                setActiveTab(tabId);
                setIsContentMenuOpen(true);
              }
            }}
            onSubscribed={() => {
              setIsSubscribed(true);
              setActiveTab("merch");
              setIsContentMenuOpen(false);
              // Refetch auth token to get subscription NFT
              refetchAuthToken();
            }}
            onUnlock={(itemId) => {
              handleUnlockContent(itemId);
              setIsContentMenuOpen(false);
            }}
            onView={(itemId) => {
              handleViewContent(itemId);
              setIsContentMenuOpen(false);
            }}
            onJoinAtrium={() => {
              handleJoinAtrium();
              setIsContentMenuOpen(false);
            }}
          />
        )}

        {/* Desktop: Sidebar - Hidden in Landing Mode */}
        {viewMode === '3d' && (
          <SpaceDetailSidebar
            space={safeSpace}
            isLoading={isLoading}
            currentAccount={currentAccount}
            isSubscribed={hasAccess}
            identityId={identityId}
            isCreator={isCreator}
            activeTab={activeTab === "subscribe" ? "merch" : activeTab}
            showSubscribeForm={showSubscribeForm}
            displayItems={displayItems}
            contentTabs={contentTabs}
            onTabChange={(tabId) => setActiveTab(tabId as "merch" | "video" | "essay")}
            onSubscribed={() => {
              setIsSubscribed(true);
              setShowSubscribeForm(false);
              // Refetch auth token to get subscription NFT
              refetchAuthToken();
            }}
            onShowSubscribeForm={setShowSubscribeForm}
            onUnlock={handleUnlockContent}
            onView={handleViewContent}
            onJoinAtrium={handleJoinAtrium}
          />
        )}

        {/* Right Area: 3D Scene OR Landing Page */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="px-2 py-1.5 lg:px-3 lg:py-2 border-b flex-shrink-0" style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb' }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <RetroButton
                  onClick={() => router.push("/")}
                  variant="secondary"
                  size="sm"
                  className="flex-shrink-0"
                >
                  ←
                </RetroButton>
                <div className="min-w-0">
                  {isLoading ? (
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <h1 className="text-sm lg:text-base font-bold text-gray-800 truncate" style={{ fontFamily: 'Georgia, serif' }}>
                      {safeSpace.name}
                    </h1>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* View Toggle */}
                <RetroButton
                   onClick={() => setViewMode(viewMode === '3d' ? 'landing' : '3d')}
                   variant="secondary"
                   size="sm"
                 >
                   {viewMode === '3d' ? '📖 Landing View' : '🏛️ 3D View'}
                 </RetroButton>
              
                {viewMode === '3d' && (
                  <>
                    <WeatherModeToggle currentMode={weatherMode} onModeChange={setWeatherMode} />
                    <div className="h-6 w-px bg-gray-300" />
                  </>
                )}
                
                <RetroButton
                  onClick={handleShare}
                  variant="secondary"
                  size="sm"
                  title="Share this space"
                  disabled={isLoading}
                >
                  📤
                </RetroButton>
              </div>
            </div>
          </div>
          
          {/* Content */}
          {viewMode === '3d' ? (
            <RetroFrameCanvas className="bg-gray-100">
              <ThreeScene
                spaceId={safeSpace.id}
                enableGallery={true}
                weatherMode={weatherMode}
                onWeatherModeChange={setWeatherMode}
                enableSubscriberAvatars={true}
              />
            </RetroFrameCanvas>
          ) : (
            <LandingPageView 
              space={safeSpace}
              contentItems={displayItems}
              isSubscribed={hasAccess}
              isCreator={isCreator}
              identityId={identityId}
              onUnlock={handleUnlockContent}
              onView={handleViewContent}
              onSubscribed={() => {
                setIsSubscribed(true);
                // Refetch auth token to get subscription NFT
                refetchAuthToken();
              }}
              // onUpload is intentionally not passed - SpaceDetail is read-only view for all users
              // Upload functionality is only available in SpacePreviewWindow (creator's edit mode)
            />
          )}

        </div>
      </div>

      {/* Content Upload is not available in SpaceDetail - only in SpacePreviewWindow */}
    </div>
  );
}
