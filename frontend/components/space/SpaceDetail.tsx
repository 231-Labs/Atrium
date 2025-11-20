"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { ThreeScene } from "@/components/3d/ThreeScene";
import { WeatherModeToggle } from "@/components/3d/WeatherModeToggle";
import { RetroFrameCanvas } from "@/components/3d/RetroFrameCanvas";
import { WeatherMode } from "@/types/theme";
import { SubscribeButton } from "@/components/subscription/SubscribeButton";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";
import { SpaceInfoCard } from "./SpaceInfoCard";
import { SpaceTabNavigation } from "./SpaceTabNavigation";
import { getAccessStatus } from "./AccessStatusIndicator";
import { ContentList } from "./ContentList";
import { ContentItemData } from "./ContentItem";
import { PACKAGE_ID } from "@/config/sui";
import { LandingPageView } from "@/components/space/LandingPageView";

// Window Manager
import { useWindowManager } from "@/components/features/window-manager";
import Window from "@/components/features/window-manager/components/Window";
import { VideoWindow } from "@/components/windows/VideoWindow";
import { EssayWindow } from "@/components/windows/EssayWindow";

interface SpaceDetailProps {
  space?: {
    id: string;
    kioskId: string;
    kioskCapId?: string;
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
  const suiClient = useSuiClient();

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

  const [activeTab, setActiveTab] = useState<"merch" | "video" | "essay" | "subscribe">("merch");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [isContentMenuOpen, setIsContentMenuOpen] = useState(false);
  const [showSubscribeForm, setShowSubscribeForm] = useState(false);
  const [weatherMode, setWeatherMode] = useState<WeatherMode>('dynamic');
  const [viewMode, setViewMode] = useState<'3d' | 'landing'>('3d');

  // Window Manager
  const {
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    activateWindow,
    startDragging,
    resizeWindow,
  } = useWindowManager();

  // 檢測手機版
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isCreator = currentAccount?.address === safeSpace.creator;
  const accessStatus = getAccessStatus(currentAccount, isSubscribed, isCreator);

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
  const tabs = (currentAccount && !isSubscribed && !isCreator) 
    ? [...contentTabs, subscribeTab]
    : contentTabs;

  // Fetch Identity and Subscription Status
  useEffect(() => {
    async function checkStatus() {
      if (!currentAccount || !safeSpace.kioskId) return;

      try {
        // 1. Get Identity
        const { data: identityData } = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: { StructType: `${PACKAGE_ID}::identity::Identity` },
        });
        
        if (identityData.length > 0) {
          setIdentityId(identityData[0].data?.objectId || null);
        }

        // 2. Check Subscription
        const { data: subscriptionData } = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: { StructType: `${PACKAGE_ID}::subscription::Subscription` },
          options: { showContent: true }
        });

        // Filter for subscription to this specific space kiosk
        const hasSubscription = subscriptionData.some(sub => {
          const content = sub.data?.content as any;
          return content?.fields?.space_kiosk_id === safeSpace.kioskId;
        });

        setIsSubscribed(hasSubscription);

      } catch (e) {
        console.error("Failed to check status", e);
      }
    }

    checkStatus();
  }, [currentAccount, suiClient, safeSpace.kioskId]);

  const handleJoinAtrium = () => {
    router.push("/");
  };

  const handleSubscribe = () => {
    setActiveTab("merch");
  };

  // Mock content data - TODO: Load from chain
  const contentItems: ContentItemData[] = [
    // Merch items
    {
      id: "merch-1",
      title: "Limited Edition Art Print",
      description: "High-quality print of the featured artwork, signed by the artist",
      price: 5,
      type: "merch",
      isLocked: false,
    },
    {
      id: "merch-2", 
      title: "Exclusive Digital Assets Pack",
      description: "Collection of 3D models and textures used in this space",
      price: 10,
      type: "merch",
      isLocked: true,
    },
    // Video items
    {
      id: "video-1",
      title: "Behind the Scenes",
      description: "Free introduction to the creative process",
      price: 0,
      type: "video",
      isLocked: false,
      // Mock blobId
      // blobId: "..."
    },
    {
      id: "video-2",
      title: "Advanced Tutorial Series",
      description: "Complete step-by-step guide to creating similar artwork",
      price: 0,
      type: "video", 
      isLocked: true,
    },
    {
      id: "video-3",
      title: "Live Workshop Recording",
      description: "2-hour live session with Q&A",
      price: 0,
      type: "video",
      isLocked: true,
    },
    // Essay items
    {
      id: "essay-1",
      title: "The Philosophy of Digital Art",
      description: "My thoughts on the intersection of technology and creativity",
      price: 0,
      type: "essay",
      isLocked: false,
    },
    {
      id: "essay-2",
      title: "Technical Deep Dive",
      description: "Detailed explanation of the techniques used in this project",
      price: 0,
      type: "essay",
      isLocked: true,
    },
  ];

  const handleUnlockContent = (itemId: string) => {
    // Show subscribe form
    setShowSubscribeForm(true);
  };

  const handleViewContent = (itemId: string) => {
    console.log("View content:", itemId);
    const item = contentItems.find(i => i.id === itemId);
    if (!item) return;

    // Open appropriate window with item data
    if (item.type === 'video') {
      openWindow('video-player', {
        title: item.title,
        data: {
          blobId: item.id,
          resourceId: item.id,
          title: item.title,
          isLocked: item.isLocked,
        }
      });
    } else if (item.type === 'essay') {
      openWindow('essay-reader', {
        title: item.title,
        data: {
          blobId: item.id,
          resourceId: item.id,
          title: item.title,
          isLocked: item.isLocked,
        }
      });
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
      {Object.values(windows)
        .filter(window => {
          if (isMobile) {
            return window.id === activeWindowId;
          }
          return true;
        })
        .map(window => {
          let content = null;
          if (window.type === 'video-player') {
            content = (
              <VideoWindow 
                blobId={window.data?.blobId}
                resourceId={window.data?.resourceId}
                title={window.data?.title}
                isLocked={window.data?.isLocked}
              />
            );
          } else if (window.type === 'essay-reader') {
            content = (
              <EssayWindow
                blobId={window.data?.blobId}
                resourceId={window.data?.resourceId}
                title={window.data?.title}
                isLocked={window.data?.isLocked}
              />
            );
          }

          if (!content) return null;

          return (
            <Window
              key={window.id}
              id={window.id}
              title={window.title}
              position={window.position}
              size={window.size}
              isActive={activeWindowId === window.id}
              zIndex={window.zIndex}
              onClose={closeWindow}
              onDragStart={startDragging}
              onResize={resizeWindow}
              onClick={() => activateWindow(window.id)}
              resizable={window.resizable}
            >
              {content}
            </Window>
          );
        })
      }

      {/* Main Content Area */}
      <div className="flex flex-col-reverse lg:flex-row flex-1 overflow-hidden">
        
        {/* Mobile: Bottom Navigation Bar - Only in 3D mode */}
        {viewMode === '3d' && (
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
                          spaceKioskId={safeSpace.kioskId}
                          spaceKioskCapId={safeSpace.kioskCapId || safeSpace.kioskId}
                          price={safeSpace.subscriptionPrice}
                          identityId={identityId}
                          onSubscribed={() => {
                            setIsSubscribed(true);
                            setActiveTab("merch");
                            setIsContentMenuOpen(false);
                          }}
                        />
                      </div>
                    ) : !currentAccount ? (
                      <div className="text-center py-4">
                        <div className="text-3xl mb-2">👀</div>
                        <p className="text-xs text-gray-700 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                          Join Atrium to subscribe and unlock content
                        </p>
                        <RetroButton
                          onClick={() => {
                            handleJoinAtrium();
                            setIsContentMenuOpen(false);
                          }}
                          variant="primary"
                          size="sm"
                          className="w-full"
                        >
                          Join Atrium
                        </RetroButton>
                      </div>
                    ) : (
                      <ContentList
                        items={contentItems}
                        type={activeTab as "merch" | "video" | "essay"}
                        isSubscribed={isSubscribed}
                        isCreator={isCreator}
                        onUnlock={(itemId) => {
                          handleUnlockContent(itemId);
                          setIsContentMenuOpen(false);
                        }}
                        onView={(itemId) => {
                          handleViewContent(itemId);
                          setIsContentMenuOpen(false);
                        }}
                      />
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
                      onClick={() => {
                        if (activeTab === tab.id) {
                          setIsContentMenuOpen(!isContentMenuOpen);
                        } else {
                          setActiveTab(tab.id as "merch" | "video" | "essay" | "subscribe");
                          setIsContentMenuOpen(true);
                        }
                      }}
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
        )}

        {/* Desktop: Sidebar - Hidden in Landing Mode */}
        {viewMode === '3d' && (
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
                  <>
                    <SpaceInfoCard space={safeSpace} />
                  </>
                )}
              </div>

              {/* Content Tabs */}
              <div className="px-3 py-2 border-b flex-shrink-0" style={{ borderColor: '#d1d5db' }}>
                <SpaceTabNavigation 
                  tabs={contentTabs}
                  activeTab={showSubscribeForm ? "" : (activeTab === "subscribe" ? "merch" : activeTab)}
                  onTabChange={(tabId) => {
                    if (isLoading) return;
                    setShowSubscribeForm(false);
                    setActiveTab(tabId as "merch" | "video" | "essay");
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
                      <RetroButton onClick={handleJoinAtrium} variant="primary" size="md">
                        Join Atrium
                      </RetroButton>
                    </div>
                  </div>
                ) : showSubscribeForm ? (
                  <div className="space-y-3">
                    <RetroButton
                      onClick={() => setShowSubscribeForm(false)}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      ← Back to Content
                    </RetroButton>
                    <SubscribeButton
                      spaceKioskId={safeSpace.kioskId}
                      spaceKioskCapId={safeSpace.kioskCapId || safeSpace.kioskId}
                      price={safeSpace.subscriptionPrice}
                      identityId={identityId}
                      onSubscribed={() => {
                        setIsSubscribed(true);
                        setShowSubscribeForm(false);
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!isSubscribed && !isCreator && (
                      <RetroButton
                        onClick={() => setShowSubscribeForm(true)}
                        variant="primary"
                        size="sm"
                        className="w-full"
                      >
                        🔒 Subscribe to Unlock Premium Content
                      </RetroButton>
                    )}
                    
                    <ContentList
                      items={contentItems}
                      type={activeTab === "subscribe" ? "merch" : (activeTab as "merch" | "video" | "essay")}
                      isSubscribed={isSubscribed}
                      isCreator={isCreator}
                      onUnlock={handleUnlockContent}
                      onView={handleViewContent}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
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
              />
            </RetroFrameCanvas>
          ) : (
            <LandingPageView 
              space={safeSpace}
              contentItems={contentItems}
              isSubscribed={isSubscribed}
              isCreator={isCreator}
              onUnlock={handleUnlockContent}
              onView={handleViewContent}
              onUpload={isCreator ? handleEditSpace : undefined}
            />
          )}

        </div>
      </div>
    </div>
  );
}
