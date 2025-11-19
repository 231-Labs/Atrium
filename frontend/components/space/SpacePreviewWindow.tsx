'use client';

import React, { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useUserSpaces } from '@/hooks/useUserSpaces';
import { RetroPanel } from '@/components/common/RetroPanel';
import { RetroButton } from '@/components/common/RetroButton';
import { RetroHeading } from '@/components/common/RetroHeading';
import { ThreeScene } from '@/components/3d/ThreeScene';
import { RetroFrameCanvas } from '@/components/3d/RetroFrameCanvas';
import { CreateSpaceForm } from '@/components/space/CreateSpaceForm';
import { NFTListPanel } from '@/components/space/NFTListPanel';
import { ContentManager } from '@/components/space/ContentManager';
import { ScreenConfig } from '@/components/space/ScreenConfig';
import { useRouter } from 'next/navigation';
import { UserSpaceData } from '@/hooks/useUserSpaces';
import { useSpaceEditor } from '@/hooks/useSpaceEditor';
import { useSpace } from '@/hooks/useSpace';
import { serializeConfig, uploadConfigToWalrus, SpaceScreenConfig } from '@/utils/spaceConfig';
import { updateSpaceConfig, SUI_CHAIN } from '@/utils/transactions';
import { ObjectTransform } from '@/types/spaceEditor';

export function SpacePreviewWindow() {
  const currentAccount = useCurrentAccount();
  const router = useRouter();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { spaces: userSpaces, loading, refetch } = useUserSpaces();
  
  const [selectedSpace, setSelectedSpace] = useState<UserSpaceData | null>(
    userSpaces.length > 0 ? userSpaces[0] : null
  );
  const [isSpaceListOpen, setIsSpaceListOpen] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'nfts' | 'content' | 'screen'>('nfts');
  
  const [visibleNFTs, setVisibleNFTs] = useState<Set<string>>(new Set());
  const [objectTransforms, setObjectTransforms] = useState<Map<string, ObjectTransform>>(new Map());
  const [screenConfig, setScreenConfig] = useState<SpaceScreenConfig>({ 
    contentType: 'none', 
    blobId: '', 
    autoplay: false 
  });

  const { space: spaceDetail } = useSpace(selectedSpace?.spaceId || null);
  
  const {
    state: editorState,
    toggleObjectVisibility,
    updateObjectScale,
    updateObjectTransform,
    getAllObjects,
  } = useSpaceEditor();

  React.useEffect(() => {
    if (userSpaces.length > 0 && !selectedSpace) {
      setSelectedSpace(userSpaces[0]);
    }
  }, [userSpaces, selectedSpace]);

  const handleCreateSpace = () => {
    setIsCreatingSpace(true);
  };

  const handleSpaceCreated = () => {
    setIsCreatingSpace(false);
    refetch();
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
    setVisibleNFTs(new Set());
    setObjectTransforms(new Map());
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      setActiveEditTab('nfts');
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
    setVisibleNFTs(prev => {
      const next = new Set(prev);
      if (next.has(nftId)) {
        next.delete(nftId);
      } else {
        next.add(nftId);
      }
      return next;
    });
    toggleObjectVisibility(nftId);
  };

  const handleNFTScaleChange = (nftId: string, scale: number) => {
    updateObjectScale(nftId, scale);
    setObjectTransforms(prev => {
      const next = new Map(prev);
      const current = next.get(nftId) || { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 };
      next.set(nftId, { ...current, scale });
      return next;
    });
  };

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
        <div className={`${isEditMode ? 'w-full md:w-80' : 'hidden md:flex w-80'} flex-shrink-0 border-r border-gray-200 flex flex-col bg-white`}>
          {isEditMode ? (
            // Edit Tools Sidebar
            <div className="flex-1 flex flex-col min-h-0">
               {/* Edit Mode Header with Done Button */}
               <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                 <span className="text-xs font-medium uppercase tracking-wider text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
                   Editing Tools
                 </span>
                 <RetroButton variant="secondary" size="sm" onClick={handleToggleEditMode}>
                   Done
                 </RetroButton>
               </div>

              <div className="flex border-b border-gray-200">
                {[
                  { id: 'nfts', label: 'NFTs' },
                  { id: 'content', label: 'Content' },
                  { id: 'screen', label: 'Screen' },
                ].map(tab => (
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

              <div className="flex-1 overflow-y-auto p-4">
                {activeEditTab === 'nfts' && (
                  <>
                    {spaceDetail && spaceDetail.marketplaceKioskId ? (
                      <NFTListPanel
                        kioskId={spaceDetail.marketplaceKioskId}
                        visibleNFTs={visibleNFTs}
                        objectTransforms={objectTransforms}
                        onToggleVisibility={handleNFTVisibilityToggle}
                        onScaleChange={handleNFTScaleChange}
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
                  <ContentManager spaceId={selectedSpace.spaceId} />
                )}
                {activeEditTab === 'screen' && (
                  <ScreenConfig
                    config={screenConfig}
                    onChange={setScreenConfig}
                    availableContent={[]}
                  />
                )}
              </div>

              <div className="p-3 border-t border-gray-200">
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
                          <h4 className="text-sm font-medium text-gray-800 mb-1">{space.name}</h4>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{space.description}</p>
                          <p className="text-xs text-gray-500">
                            ID: {space.spaceId.slice(0, 8)}...{space.spaceId.slice(-4)}
                          </p>
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
            <div className={`flex-1 relative flex flex-col ${isEditMode ? 'hidden md:flex' : 'flex'}`}>
              <RetroFrameCanvas className="flex-1 w-full h-full">
                <ThreeScene spaceId={selectedSpace.spaceId} enableGallery={true} />
              </RetroFrameCanvas>
              
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
                   <RetroButton variant="secondary" size="sm" onClick={handleEnterSpace}>
                     Enter Full View
                   </RetroButton>
                )}
              </div>

              {/* Desktop Footer */}
              {!isEditMode && (
                <div 
                  className="hidden md:flex px-3 md:px-4 py-3 border-t flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-gray-50 border-gray-200"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Space ID</p>
                    <p className="text-xs text-gray-800">
                      {selectedSpace.spaceId.slice(0, 10)}...{selectedSpace.spaceId.slice(-8)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    <RetroButton variant="primary" size="sm" onClick={handleToggleEditMode}>
                      Edit Space
                    </RetroButton>
                    <RetroButton variant="secondary" size="sm" onClick={handleEnterSpace}>
                      Visit
                    </RetroButton>
                  </div>
                </div>
              )}
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
    </RetroPanel>
  );
}
