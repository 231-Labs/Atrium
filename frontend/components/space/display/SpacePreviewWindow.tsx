'use client';

import React, { useState, useMemo } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useUserSpaces } from '@/hooks/useUserSpaces';
import { RetroPanel } from '@/components/common/RetroPanel';
import { RetroButton } from '@/components/common/RetroButton';
import { RetroHeading } from '@/components/common/RetroHeading';
import { ThreeScene } from '@/components/3d/ThreeScene';
import { RetroFrameCanvas } from '@/components/3d/RetroFrameCanvas';
import { CreateSpaceForm, ScreenConfig } from '../creation';
import { NFTListPanel } from '../nft';
import { ContentManager, ContentUploadWindow } from '../content';
import { LandingPageView } from './LandingPageView';
import { ExplorerLink } from '@/components/common/ExplorerLink';
import { UpdateSubscriptionPriceForm } from '../settings/UpdateSubscriptionPriceForm';
import { useRouter } from 'next/navigation';
import { UserSpaceData } from '@/hooks/useUserSpaces';
import { useSpaceEditor } from '@/hooks/useSpaceEditor';
import { useSpace } from '@/hooks/useSpace';
import { useKioskManagement } from '@/hooks/useKioskManagement';
import { serializeConfig, uploadConfigToWalrus, SpaceScreenConfig } from '@/utils/spaceConfig';
import { updateSpaceConfig, SUI_CHAIN } from '@/utils/transactions';
import { ObjectTransform } from '@/types/spaceEditor';
import { Model3DItem } from '@/types/three';
import { getWalrusBlobUrl } from '@/config/walrus';

// Custom Hooks
import { useContentWindows } from '@/hooks/useContentWindows';
import { useSpaceViewMode } from '@/hooks/useSpaceViewMode';
import { useSpaceContent } from '@/hooks/useSpaceContent';

export function SpacePreviewWindow() {
  const currentAccount = useCurrentAccount();
  const router = useRouter();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { spaces: userSpaces, loading, refetch } = useUserSpaces();
  
  // Custom Hooks
  const { openEssay, openVideo, renderWindows } = useContentWindows();
  const { viewMode, setViewMode } = useSpaceViewMode('landing'); // Creator defaults to landing
  
  // UI State
  const [selectedSpace, setSelectedSpace] = useState<UserSpaceData | null>(
    userSpaces.length > 0 ? userSpaces[0] : null
  );
  const [isSpaceListOpen, setIsSpaceListOpen] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'nfts' | 'content' | 'settings'>('nfts');
  const [showUploadWindow, setShowUploadWindow] = useState(false);
  
  // Content data from custom hook
  const { contentItems } = useSpaceContent(selectedSpace?.spaceId || null);
  
  // Derived states from editorState are calculated below
  const [screenConfig, setScreenConfig] = useState<SpaceScreenConfig>({ 
    contentType: 'none', 
    blobId: '', 
    autoplay: false 
  });

  const { space: spaceDetail } = useSpace(selectedSpace?.spaceId || null);
  
  const [editingNFTId, setEditingNFTId] = useState<string | null>(null);

  const {
    state: editorState,
    toggleObjectVisibility,
    updateObjectScale,
    updateObjectTransform,
    getAllObjects,
    addObject,
    setObjects,
  } = useSpaceEditor();

  // Derived states for UI compatibility
  const objectTransforms = useMemo(() => {
    const map = new Map<string, ObjectTransform>();
    editorState.objects.forEach((obj) => {
      map.set(obj.id, obj.transform);
    });
    return map;
  }, [editorState.objects]);

  const visibleNFTs = useMemo(() => {
    const set = new Set<string>();
    editorState.objects.forEach((obj) => {
      if (obj.visible) set.add(obj.id);
    });
    return set;
  }, [editorState.objects]);

  // Get NFT list from Kiosk
  const { nfts } = useKioskManagement({
    kioskId: spaceDetail?.marketplaceKioskId || null,
    enabled: !!spaceDetail?.marketplaceKioskId && isEditMode,
  });

  React.useEffect(() => {
    if (userSpaces.length > 0 && !selectedSpace) {
      setSelectedSpace(userSpaces[0]);
    }
  }, [userSpaces, selectedSpace]);

  // Auto-switch to content tab when in landing mode and current tab is not available
  React.useEffect(() => {
    if (viewMode === 'landing' && activeEditTab === 'nfts') {
      setActiveEditTab('content');
    }
  }, [viewMode, activeEditTab]);

  const handleCreateSpace = () => {
    setIsCreatingSpace(true);
  };

  const handleSpaceCreated = async () => {
    setIsCreatingSpace(false);
    // Wait for blockchain to finalize the transaction before refetching
    setTimeout(() => {
      refetch();
    }, 1500);
  };

  const handleCancelCreate = () => {
    setIsCreatingSpace(false);
  };

  const handleEnterSpace = () => {
    if (selectedSpace) {
      router.push(`/space/${selectedSpace.spaceId}`);
    }
  };

  const handleSelectSpace = (space: UserSpaceData) => {
    setSelectedSpace(space);
    setIsEditMode(false);
    setObjects([]); 
    setEditingNFTId(null);
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      setActiveEditTab('nfts');
    } else {
      setEditingNFTId(null);
    }
  };

  const handleViewContent = (itemId: string) => {
    const content = contentItems.find(c => c.id === itemId);
    if (!content) {
      console.error('Content not found:', itemId);
      return;
    }

    const spaceId = selectedSpace?.spaceId || '';
    const ownershipId = selectedSpace?.ownershipId || '';
    
    if (!spaceId || spaceId === '') {
      alert('Cannot open content: Space ID is missing');
      return;
    }

    if (!ownershipId || ownershipId === '') {
      alert('Cannot open content: Ownership ID is missing');
      return;
    }

    console.log('📺 Opening content:', {
      id: itemId,
      type: content.type,
      blobId: content.blobId,
      sealResourceId: content.sealResourceId,
      isLocked: content.isLocked,
    });

    // Open appropriate window based on content type
    // As creator (isCreator = true), use SpaceOwnership for authentication
    if (content.type === 'video' && content.blobId) {
      // FIXED: Pass sealResourceId (not spaceId) as the resourceId parameter
      const resourceId = content.sealResourceId || content.blobId;
      openVideo(content.blobId, resourceId, content.title, content.isLocked || false, true, ownershipId);
    } else if (content.type === 'essay' && content.blobId) {
      openEssay(content.blobId, spaceId, content.title, content.isLocked || false, true, ownershipId);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedSpace) return;

    try {
      setIsSaving(true);
      
      const config = serializeConfig(getAllObjects());
      const blobId = await uploadConfigToWalrus(config);

      const tx = updateSpaceConfig(
        selectedSpace.spaceId,
        selectedSpace.ownershipId,
        { newConfigQuilt: blobId }
      );

      signAndExecute(
        { transaction: tx, chain: SUI_CHAIN },
        {
          onSuccess: () => {
            alert('Configuration saved!');
            refetch();
          },
          onError: (err) => {
            console.error('Save failed:', err);
            alert('Failed to save configuration');
          },
        }
      );
    } catch (err: any) {
      console.error('Save error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNFTVisibilityToggle = (nftId: string) => {
    const existingObject = editorState.objects.get(nftId);

    // 如果是首次顯示，將 NFT 添加到 editor state
    if (!existingObject) {
      const nft = nfts.find(n => n.id === nftId);
      if (nft) {
        addObject({
          id: nftId,
          nftId: nftId,
          objectType: nft.objectType,
          name: nft.name,
          thumbnail: nft.imageUrl,
          transform: {
            position: [0, 1, 0],
            rotation: [0, 0, 0],
            scale: 1,
          },
          visible: true,
        });
      }
    } else {
      toggleObjectVisibility(nftId);
    }
  };

  const handleNFTScaleChange = (nftId: string, scale: number) => {
    updateObjectScale(nftId, scale);
  };

  const handleNFTTransformChange = (nftId: string, transform: ObjectTransform) => {
    updateObjectTransform(nftId, transform);
  };

  // Convert visible NFTs to 3D model list
  const visibleModels = useMemo<Model3DItem[]>(() => {
    // 只顯示已添加到 editor state 且 visible 為 true 的 3D 物件
    return Array.from(editorState.objects.values())
      .filter(obj => obj.visible)
      .map((obj): Model3DItem | null => {
        const nft = nfts.find(n => n.id === obj.id);
        // 確保該物件是 3D 類型 (這裡的檢查依賴 nfts 列表或 obj 自身的數據)
        if (!nft || nft.objectType !== '3d') return null;

        return {
          id: obj.id,
          name: obj.name,
          modelUrl: nft.glbFile ? getWalrusBlobUrl(nft.glbFile) : '', // Use full Walrus URL
          position: {
            x: obj.transform.position[0],
            y: obj.transform.position[1],
            z: obj.transform.position[2],
          },
          rotation: {
            x: obj.transform.rotation[0],
            y: obj.transform.rotation[1],
            z: obj.transform.rotation[2],
          },
          scale: {
            x: obj.transform.scale,
            y: obj.transform.scale,
            z: obj.transform.scale,
          },
        };
      })
      .filter((item): item is Model3DItem => item !== null);
  }, [editorState.objects, nfts]);

  if (loading) {
    return (
      <RetroPanel className="h-full flex items-center justify-center p-4">
        <div className="text-center" style={{ fontFamily: 'Georgia, serif' }}>
          <div className="inline-block animate-spin text-3xl md:text-4xl text-gray-400 mb-4">⟳</div>
          <p className="text-xs md:text-sm text-gray-600">Loading spaces...</p>
        </div>
      </RetroPanel>
    );
  }

  if (userSpaces.length === 0 && !isCreatingSpace) {
    return (
      <RetroPanel className="h-full flex flex-col">
        <RetroHeading 
          title="My Spaces"
          subtitle="Manage your creative 3D worlds"
          className="mb-0"
        />
        <div className="flex-1 flex items-center justify-center px-3 md:px-6 py-6 md:py-8">
          <div className="text-center max-w-md" style={{ fontFamily: 'Georgia, serif' }}>
            <div className="text-4xl md:text-6xl mb-4 md:mb-6">🏛️</div>
            <h3 className="text-lg md:text-xl text-gray-800 mb-2 md:mb-3">No Spaces Found</h3>
            <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
              You haven't created your space yet. Create one to start sharing your content with the world.
            </p>
            <RetroButton variant="primary" size="md" onClick={handleCreateSpace}>
              Create Your Space
            </RetroButton>
          </div>
        </div>
      </RetroPanel>
    );
  }
  
  if (userSpaces.length === 0 && isCreatingSpace) {
    return (
      <RetroPanel className="h-full">
        <CreateSpaceForm onClose={handleCancelCreate} onCreated={handleSpaceCreated} />
      </RetroPanel>
    );
  }

  return (
    <RetroPanel className="h-full flex flex-col">
      <RetroHeading 
        title={selectedSpace ? selectedSpace.name : "My Spaces"}
        subtitle={selectedSpace ? (isEditMode ? "Editing Mode" : "Space Overview") : "Manage your creative 3D worlds"}
        className="mb-0"
      />

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Mobile Header / Space Selector (Hidden in Edit Mode) */}
        {!isEditMode && (
          <div className="md:hidden border-b relative" style={{ borderColor: '#d1d5db' }}>
            <div className="flex relative z-20">
              <div 
                className="flex-1 p-2 bg-gray-50 cursor-pointer flex items-center justify-between transition-colors duration-200"
                onClick={() => setIsSpaceListOpen(!isSpaceListOpen)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Georgia, serif' }}>
                    {selectedSpace ? selectedSpace.name : 'Select Space'}
                  </span>
                </div>
                <span 
                  className="text-sm text-gray-400 transition-transform duration-300 ease-in-out"
                  style={{ transform: isSpaceListOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  ▼
                </span>
              </div>
              <div 
                className="border-l p-1" 
                style={{ 
                  borderColor: '#d1d5db',
                  background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)',
                }}
              >
                <RetroButton variant="primary" size="sm" onClick={handleCreateSpace}>+</RetroButton>
              </div>
            </div>
            
            {selectedSpace && (
              <div 
                className="p-2 border-t flex gap-2" 
                style={{ 
                  borderColor: '#d1d5db',
                  background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)',
                }}
              >
                <RetroButton variant="secondary" size="sm" className="flex-1" onClick={handleToggleEditMode}>
                  Edit
                </RetroButton>
                <RetroButton variant="primary" size="sm" className="flex-1" onClick={handleEnterSpace}>
                  Visit
                </RetroButton>
              </div>
            )}
            
            <div 
              className={`absolute left-0 right-0 bg-white border shadow-lg transition-all duration-300 ease-in-out overflow-hidden z-50 ${
                isSpaceListOpen ? 'max-h-60 opacity-100 visible' : 'max-h-0 opacity-0 invisible'
              }`}
              style={{ 
                top: '100%',
                borderColor: '#d1d5db',
                transform: isSpaceListOpen ? 'translateY(0)' : 'translateY(-10px)'
              }}
            >
              <div className="max-h-60 overflow-y-auto scrollbar-hidden">
                <div className="p-2 space-y-1.5">
                  {userSpaces.map((space) => (
                    <div 
                      key={space.spaceId}
                      className="cursor-pointer relative"
                      onClick={() => {
                        handleSelectSpace(space);
                        setIsSpaceListOpen(false);
                      }}
                    >
                      <RetroPanel 
                        variant={selectedSpace?.spaceId === space.spaceId ? "inset" : "outset"}
                        className={`p-3 transition-all hover:shadow-sm ${
                          selectedSpace?.spaceId === space.spaceId ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Georgia, serif' }}>
                          <h4 className="text-xs font-medium text-gray-800 mb-1 relative z-10">{space.name}</h4>
                          <p className="text-xs text-gray-600 relative z-10">{space.description}</p>
                        </div>
                      </RetroPanel>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Left Sidebar Area (Shared for Spaces List and Edit Tools) */}
        <div 
          className={`
            flex-shrink-0 border-r border-gray-200 flex flex-col bg-white transition-all duration-300 ease-in-out
            ${isEditMode 
              ? 'fixed bottom-0 left-0 right-0 h-[45vh] md:static md:h-auto md:w-80 z-30 border-t md:border-t-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none' 
              : 'hidden md:flex md:w-80'}
          `}
        >
          {isEditMode ? (
            // Edit Tools Sidebar
            <div className="flex-1 flex flex-col min-h-0">
               {/* Edit Mode Header with Done Button */}
               <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 shrink-0">
                 <span className="text-xs font-medium uppercase tracking-wider text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
                   Editing Tools
                 </span>
                 <RetroButton variant="secondary" size="sm" onClick={handleToggleEditMode}>
                   Done
                 </RetroButton>
               </div>

              <div className="flex border-b border-gray-200 shrink-0">
                {[
                  { id: 'nfts', label: 'NFTs' },
                  { id: 'content', label: 'Content' },
                  { id: 'settings', label: 'Settings' },
                ].filter(tab => {
                  // In landing mode, show Content and Settings tabs only
                  if (viewMode === 'landing') {
                    return tab.id === 'content' || tab.id === 'settings';
                  }
                  // In 3D mode, show all tabs
                  return true;
                }).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveEditTab(tab.id as any)}
                    className={`flex-1 px-4 py-3 text-xs font-medium uppercase tracking-wider transition-all ${
                      activeEditTab === tab.id 
                        ? 'text-gray-900 bg-white border-b-2 border-gray-900' 
                        : 'text-gray-500 hover:text-gray-700 bg-gray-50'
                    }`}
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-white">
                {activeEditTab === 'nfts' && (
                  <>
                    {spaceDetail && spaceDetail.marketplaceKioskId ? (
                      <NFTListPanel
                        kioskId={spaceDetail.marketplaceKioskId}
                        visibleNFTs={visibleNFTs}
                        objectTransforms={objectTransforms}
                        selectedNFTId={editingNFTId}
                        onToggleVisibility={handleNFTVisibilityToggle}
                        onScaleChange={handleNFTScaleChange}
                        onTransformChange={handleNFTTransformChange}
                        onSelect={(id) => setEditingNFTId(id === editingNFTId ? null : id)}
                        onList={() => {}}
                        onDelist={() => {}}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-3xl mb-3">⏳</div>
                        <p className="text-sm text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>Loading...</p>
                      </div>
                    )}
                  </>
                )}
                {activeEditTab === 'content' && selectedSpace && (
                  <ContentManager 
                    spaceId={selectedSpace.spaceId}
                    ownershipId={selectedSpace.ownershipId}
                  />
                )}
                {activeEditTab === 'settings' && selectedSpace && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                        💰 Subscription Settings
                      </h3>
                      <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                        Manage your space subscription pricing
                      </p>
                    </div>
                    <UpdateSubscriptionPriceForm
                      spaceId={selectedSpace.spaceId}
                      ownershipId={selectedSpace.ownershipId}
                      currentPrice={selectedSpace.subscriptionPrice || "0"}
                      onUpdated={(newPriceInMist: string) => {
                        // Update local state immediately without refetching
                        setSelectedSpace(prev => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            subscriptionPrice: newPriceInMist
                          };
                        });
                      }}
                    />
                    
                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                        📺 Big Screen Configuration
                      </h3>
                      <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                        Configure content displayed on the big screen in your space
                      </p>
                      <ScreenConfig
                        config={screenConfig}
                        onChange={setScreenConfig}
                        availableContent={[]}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-gray-200 bg-gray-50 shrink-0 pb-6 md:pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
                    {editorState.pendingChanges ? '• Unsaved changes' : 'All saved'}
                  </span>
                </div>
                <RetroButton
                  onClick={handleSaveConfig}
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={isSaving || !editorState.pendingChanges}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </RetroButton>
              </div>
            </div>
          ) : (
            // Spaces List Sidebar
            <div className="w-full flex flex-col h-full">
              <div className="p-3 md:p-4 border-b bg-gray-50 border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                  Your Spaces ({userSpaces.length})
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hidden">
                <div className="p-2 md:p-3 space-y-2">
                  {userSpaces.map((space) => (
                    <div 
                      key={space.spaceId}
                      className="cursor-pointer"
                      onClick={() => handleSelectSpace(space)}
                    >
                      <RetroPanel 
                        variant={selectedSpace?.spaceId === space.spaceId ? "inset" : "outset"}
                        className={`p-3 transition-all hover:shadow-sm ${
                          selectedSpace?.spaceId === space.spaceId ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Georgia, serif' }}>
                          <div className="flex items-center mb-1" onClick={(e) => e.stopPropagation()}>
                            <ExplorerLink 
                              objectId={space.spaceId} 
                              showIcon={false}
                              className="text-sm font-medium text-gray-800 hover:text-gray-600 underline decoration-dotted hover:decoration-solid underline-offset-2"
                            >
                              {space.name}
                            </ExplorerLink>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{space.description}</p>
                          
                          {selectedSpace?.spaceId === space.spaceId && (
                            <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                              <RetroButton 
                                variant="primary" 
                                size="sm" 
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleEditMode();
                                }}
                              >
                                Edit
                              </RetroButton>
                              <RetroButton 
                                variant="secondary" 
                                size="sm" 
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEnterSpace();
                                }}
                              >
                                Visit
                              </RetroButton>
                            </div>
                          )}
                        </div>
                      </RetroPanel>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 md:p-4 border-t border-gray-200">
                <RetroButton variant="primary" size="sm" className="w-full" onClick={handleCreateSpace}>
                  + Create New Space
                </RetroButton>
              </div>
            </div>
          )}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col relative bg-gray-100 min-h-0">
          {isCreatingSpace ? (
            <CreateSpaceForm onClose={handleCancelCreate} onCreated={handleSpaceCreated} />
          ) : selectedSpace ? (
            <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
              {viewMode === '3d' ? (
                <RetroFrameCanvas className="flex-1 w-full h-full">
                  <ThreeScene 
                    spaceId={selectedSpace.spaceId} 
                    models={visibleModels}
                    enableGallery={true} 
                    isPreview={true}
                    enableSubscriberAvatars={true}
                  />
                </RetroFrameCanvas>
              ) : (
                /* Landing Page View - needs flex-1 to take full height */
                <div className="flex-1 min-h-0 overflow-hidden">
                  <LandingPageView 
                    space={selectedSpace}
                    contentItems={contentItems}
                    isSubscribed={true} // Creator is always subscribed
                    isCreator={true}
                    onUnlock={() => {}}
                    onView={handleViewContent}
                    onUpload={() => {
                      setShowUploadWindow(true);
                      setIsEditMode(true);
                      setActiveEditTab('content');
                    }}
                  />
                </div>
              )}
              
              {/* Overlays */}
              <div className="absolute top-4 left-4 z-10">
                {isEditMode && (
                  <div className="px-3 py-1.5 bg-white border border-gray-300 shadow-sm">
                    <span className="text-xs font-medium text-gray-800 uppercase tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                      Editing
                    </span>
                  </div>
                )}
              </div>

              <div className="absolute top-4 right-4 z-10">
                {!isEditMode && (
                   <RetroButton 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setViewMode(viewMode === '3d' ? 'landing' : '3d')}
                   >
                     {viewMode === '3d' ? '📖 Landing View' : '🏛️ 3D View'}
                   </RetroButton>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center" style={{ fontFamily: 'Georgia, serif' }}>
                <div className="text-4xl mb-4">🏛️</div>
                <p className="text-sm text-gray-600">Select a space to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Upload Window */}
      {selectedSpace && (
        <>
          <ContentUploadWindow
            isOpen={showUploadWindow}
            onClose={() => setShowUploadWindow(false)}
            spaceId={selectedSpace.spaceId}
            ownershipId={selectedSpace.ownershipId}
            onUploadComplete={(content) => {
              console.log("Upload complete:", content);
              setShowUploadWindow(false);
              // Content is automatically saved to localStorage in ContentUploadWindow
              // ContentManager will auto-reload from localStorage
            }}
          />
        </>
      )}

      {/* Floating Windows for Content Viewing */}
      {renderWindows()}
    </RetroPanel>
  );
}
