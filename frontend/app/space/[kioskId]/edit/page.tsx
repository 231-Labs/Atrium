"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";
import { ThreeScene } from "@/components/3d/ThreeScene";
import { RetroFrameCanvas } from "@/components/3d/RetroFrameCanvas";
import { NFTListPanel } from "@/components/space/nft";
import { ContentManager } from "@/components/space/content";
import { ScreenConfig } from "@/components/space/creation";
import { useSpace } from "@/hooks/useSpace";
import { useUserSpaces } from "@/hooks/useUserSpaces";
import { useSpaceEditor } from "@/hooks/useSpaceEditor";
import { useKioskManagement } from "@/hooks/useKioskManagement";
import { useWalletSignature } from "@/hooks/useWalletSignature";
import { serializeConfig, uploadConfigToWalrus, downloadConfigFromWalrus } from "@/utils/spaceConfig";
import { updateSpaceConfig, SUI_CHAIN } from "@/utils/transactions";
import { SceneObject, ObjectTransform } from "@/types/spaceEditor";
import { Model3DItem, ThreeSceneApi } from "@/types/three";
import { getWalrusBlobUrl } from "@/config/walrus";

// Temporary helper to normalize object type for UI display
const normalizeObjectType = (type: string) => {
  // The backend might return different casing or values
  const t = type.toLowerCase();
  if (t === '3d' || t === 'glb' || t === 'gltf') return '3d';
  return '2d';
};

export default function SpaceEditPage() {
  const params = useParams();
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const spaceId = params.kioskId as string;
  
  const { space, loading, error } = useSpace(spaceId);
  const { spaces: userSpaces } = useUserSpaces();
  const { verifyOwnership, isVerifying } = useWalletSignature();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [activeTab, setActiveTab] = useState<'scene' | 'nfts' | 'content' | 'settings'>('scene');
  const [isSaving, setSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [visibleNFTs, setVisibleNFTs] = useState<Set<string>>(new Set());
  const [objectTransforms, setObjectTransforms] = useState(new Map());
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  
  const threeSceneRef = useRef<ThreeSceneApi>(null);

  const ownershipNFT = userSpaces.find(s => s.spaceId === spaceId);

  const {
    state: editorState,
    setEditMode,
    toggleObjectVisibility,
    updateObjectTransform,
    updateObjectScale,
    getAllObjects,
    setObjects,
    addObject,
  } = useSpaceEditor();

  // 獲取 Kiosk 中的 NFT 列表
  const { nfts } = useKioskManagement({
    kioskId: space?.marketplaceKioskId || null,
    enabled: !!space?.marketplaceKioskId,
  });

  useEffect(() => {
    if (spaceId && currentAccount) {
      checkOwnership();
    }
  }, [spaceId, currentAccount]);

  useEffect(() => {
    if (space?.configQuilt) {
      loadConfig();
    }
  }, [space?.configQuilt]);

  // Ensure all visible NFTs have transform data initialized
  useEffect(() => {
    if (visibleNFTs.size === 0) return;
    
    let needsUpdate = false;
    const updates = new Map(objectTransforms);
    
    visibleNFTs.forEach(nftId => {
      if (!updates.has(nftId)) {
        updates.set(nftId, {
          position: [0, 1, 0],
          rotation: [0, 0, 0],
          scale: 1,
        });
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      setObjectTransforms(updates);
    }
  }, [visibleNFTs, objectTransforms]);

  // 將可見的 NFT 轉換成 3D 模型列表
  const visibleModels = useMemo<Model3DItem[]>(() => {
    return nfts
      .filter(nft => visibleNFTs.has(nft.id))
      .map(nft => {
        const transform = objectTransforms.get(nft.id);
        
        return {
          id: nft.id,
          name: nft.id, // Use ID for reliable picking
          modelUrl: nft.glbFile ? getWalrusBlobUrl(nft.glbFile) : (nft.imageUrl || ''), // Use image URL for 2D items if needed
          is2D: normalizeObjectType(nft.objectType) === '2d', // Pass 2D flag
          position: transform ? {
            x: transform.position[0],
            y: transform.position[1],
            z: transform.position[2],
          } : { x: 0, y: 1, z: 0 },
          rotation: transform ? {
            x: transform.rotation[0],
            y: transform.rotation[1],
            z: transform.rotation[2],
          } : { x: 0, y: 0, z: 0 },
          scale: transform ? {
            x: transform.scale,
            y: transform.scale,
            z: transform.scale,
          } : { x: 1, y: 1, z: 1 },
        };
      });
  }, [nfts, visibleNFTs, objectTransforms]);

  const checkOwnership = async () => {
    const verified = await verifyOwnership(spaceId);
    setIsVerified(verified);
    if (!verified) {
      router.push(`/space/${spaceId}`);
    }
  };

  const loadConfig = async () => {
    if (!space?.configQuilt) return;
    
    try {
      const config = await downloadConfigFromWalrus(space.configQuilt);
      const objects = config.objects.map(obj => ({
        id: obj.nftId,
        nftId: obj.nftId,
        objectType: obj.objectType,
        name: `NFT ${obj.nftId.slice(0, 8)}`,
        transform: {
          position: obj.position,
          rotation: obj.rotation,
          scale: obj.scale,
        },
        visible: obj.visible,
      } as SceneObject));
      
      setObjects(objects);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const handleSaveConfig = async () => {
    if (!ownershipNFT) {
      alert('Ownership NFT not found');
      return;
    }

    try {
      setSaving(true);
      
      const config = serializeConfig(getAllObjects());
      const blobId = await uploadConfigToWalrus(config);

      const tx = updateSpaceConfig(
        spaceId,
        ownershipNFT.ownershipId,
        {
          newConfigQuilt: blobId,
        }
      );

      signAndExecute(
        {
          transaction: tx,
          chain: SUI_CHAIN,
        },
        {
          onSuccess: () => {
            alert('Configuration saved successfully!');
          },
          onError: (err) => {
            console.error('Failed to save config:', err);
            alert('Failed to save configuration');
          },
        }
      );
    } catch (err: any) {
      console.error('Save failed:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit button click from NFT panel
  const handleEditTransform = useCallback((nftId: string) => {
    if (!threeSceneRef.current) return;
    
    // Toggle selection
    if (selectedModelId === nftId) {
      setSelectedModelId(null);
      threeSceneRef.current.detachTransformControls();
    } else {
      setSelectedModelId(nftId);
      
      // Attach transform controls to the model
      const success = threeSceneRef.current.attachTransformControlsById(nftId);
      
      if (!success) {
        console.warn('Could not find model:', nftId);
      }
    }
  }, [selectedModelId]);

  // Handle transform changes from SceneManager (drag/gizmo)
  const handleTransformChange = useCallback(() => {
    if (!threeSceneRef.current || !selectedModelId) return;
      
      const sceneState = threeSceneRef.current.getSceneState();
      const selectedModel = sceneState.find(m => m.id === selectedModelId);
      
      if (selectedModel && selectedModel.position) {
        setObjectTransforms(prev => {
          const next = new Map(prev);
          const current = next.get(selectedModelId) || { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 };
          
          const newPos = [selectedModel.position.x, selectedModel.position.y, selectedModel.position.z];
        const newRot = [selectedModel.rotation.x, selectedModel.rotation.y, selectedModel.rotation.z];
        const newScale = selectedModel.scale.x; // Assuming uniform scale for now, or take x

        // Check if anything changed
        if (
          JSON.stringify(current.position) !== JSON.stringify(newPos) ||
          JSON.stringify(current.rotation) !== JSON.stringify(newRot) ||
          current.scale !== newScale
        ) {
            next.set(selectedModelId, {
              ...current,
              position: newPos as [number, number, number],
            rotation: newRot as [number, number, number],
            scale: newScale,
            });
            return next;
          }
          return prev;
        });
      }
  }, [selectedModelId]);

  // Register callbacks
  useEffect(() => {
    if (threeSceneRef.current) {
      threeSceneRef.current.setTransformCallbacks(
        undefined, // onDraggingChanged
        handleTransformChange
      );
    }
  }, [handleTransformChange]);

  // Handle transform changes from UI (NFT Panel)
  const handleTransformUpdate = useCallback((nftId: string, transform: ObjectTransform) => {
    // Update local transform state
    setObjectTransforms(prev => {
      const next = new Map(prev);
      next.set(nftId, transform);
      return next;
    });
    
    // Update useSpaceEditor state (this triggers 3D model re-render)
    updateObjectTransform(nftId, transform);
    
    // Also update 3D scene directly for immediate visual feedback
    if (threeSceneRef.current) {
      threeSceneRef.current.updateModelPosition(nftId, {
        x: transform.position[0],
        y: transform.position[1],
        z: transform.position[2],
      });
      threeSceneRef.current.updateModelRotation(nftId, {
        x: transform.rotation[0],
        y: transform.rotation[1],
        z: transform.rotation[2],
      });
      threeSceneRef.current.updateModelScale(nftId, {
        x: transform.scale,
        y: transform.scale,
        z: transform.scale,
      });
    }
  }, [updateObjectTransform]);

  const selectedTransform = useMemo(() => {
    if (!selectedModelId) return {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    };
    
    const t = objectTransforms.get(selectedModelId) || { position: [0, 1, 0], rotation: [0, 0, 0], scale: 1 };
    return {
      position: { x: t.position[0], y: t.position[1], z: t.position[2] },
      rotation: { x: t.rotation[0], y: t.rotation[1], z: t.rotation[2] },
      scale: { x: t.scale, y: t.scale, z: t.scale }
    };
  }, [selectedModelId, objectTransforms]);

  const handleClosePanel = () => {
    setSelectedModelId(null);
    threeSceneRef.current?.detachTransformControls();
  };

  if (loading || isVerifying) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <RetroPanel className="p-8">
          <div className="text-center" style={{ fontFamily: 'Georgia, serif' }}>
            <div className="inline-block animate-spin text-4xl text-gray-400 mb-4">⟳</div>
            <p className="text-gray-600">Loading space editor...</p>
          </div>
        </RetroPanel>
      </div>
    );
  }

  if (error || !space || !isVerified) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <RetroPanel className="p-8 text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-sm text-gray-600 mb-4">
            {error?.message || "You don't have permission to edit this space."}
          </p>
          <div className="flex gap-3 justify-center">
            <RetroButton onClick={() => router.push(`/space/${spaceId}`)} variant="secondary">
              View Space
            </RetroButton>
            <RetroButton onClick={() => router.push("/")} variant="primary">
              Back to Home
            </RetroButton>
          </div>
        </RetroPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <RetroPanel className="mb-0 rounded-none p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RetroButton
              onClick={() => router.push(`/space/${spaceId}`)}
              variant="secondary"
              size="sm"
            >
              ← Back
            </RetroButton>
            <div>
              <h1 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                Edit: {space.name}
              </h1>
              <p className="text-xs text-gray-500">Space Editor</p>
            </div>
          </div>
          
          <RetroButton
            onClick={handleSaveConfig}
            variant="primary"
            size="sm"
            disabled={isSaving || !editorState.pendingChanges}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </RetroButton>
        </div>
      </RetroPanel>

      {/* Mobile Tabs */}
      <div className="md:hidden border-b" style={{ borderColor: '#d1d5db' }}>
        <div className="flex overflow-x-auto scrollbar-hidden">
          {[
            { id: 'scene', label: 'Scene', icon: '🎭' },
            { id: 'nfts', label: 'NFTs', icon: '🎨' },
            { id: 'content', label: 'Content', icon: '📚' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex-1 min-w-fit px-4 py-3 text-sm transition-colors
                ${activeTab === tab.id ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600'}
              `}
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: Sidebar */}
        <div className="hidden md:block w-80 border-r overflow-y-auto" style={{ borderColor: '#d1d5db' }}>
          <div className="p-4 space-y-4">
            <NFTListPanel
              kioskId={space.marketplaceKioskId}
              visibleNFTs={visibleNFTs}
              objectTransforms={objectTransforms}
              selectedNFTId={selectedModelId}
              onEditTransform={handleEditTransform}
              onTransformChange={handleTransformUpdate}
              onToggleVisibility={(nftId) => {
                const isCurrentlyVisible = visibleNFTs.has(nftId);
                
                setVisibleNFTs(prev => {
                  const next = new Set(prev);
                  if (next.has(nftId)) {
                    next.delete(nftId);
                  } else {
                    next.add(nftId);
                  }
                  return next;
                });

                // 如果是首次顯示，將 NFT 添加到 editor state 並初始化 transform
                if (!isCurrentlyVisible) {
                  const nft = nfts.find(n => n.id === nftId);
                  if (nft) {
                    const initialTransform = {
                      position: [0, 1, 0] as [number, number, number],
                      rotation: [0, 0, 0] as [number, number, number],
                      scale: 1,
                    };
                    
                    // Initialize transform data (force set even if exists)
                    setObjectTransforms(prev => {
                      const next = new Map(prev);
                      // Only initialize if not already set
                      if (!next.has(nftId)) {
                        next.set(nftId, initialTransform);
                      }
                      return next;
                    });
                    
                    addObject({
                      id: nftId,
                      nftId: nftId,
                      objectType: nft.objectType,
                      name: nft.name,
                      thumbnail: nft.imageUrl,
                      transform: initialTransform,
                      visible: true,
                    });
                  }
                } else {
                  // When hiding, just toggle visibility
                  toggleObjectVisibility(nftId);
                }
              }}
              onScaleChange={(nftId, scale) => {
                updateObjectScale(nftId, scale);
              }}
              onList={(nftId) => console.log('List NFT:', nftId)}
              onDelist={(nftId) => console.log('Delist NFT:', nftId)}
            />
          </div>
        </div>

        {/* Mobile: Tabbed Content */}
        <div className="md:hidden flex-1 overflow-hidden">
          {activeTab === 'scene' && (
            <RetroFrameCanvas className="h-full">
              <ThreeScene 
                ref={threeSceneRef}
                spaceId={spaceId} 
                models={visibleModels}
                enableGallery={true} 
              />
            </RetroFrameCanvas>
          )}
          {activeTab === 'nfts' && (
            <div className="h-full overflow-y-auto p-4">
              <NFTListPanel
                kioskId={space.marketplaceKioskId}
                visibleNFTs={visibleNFTs}
                objectTransforms={objectTransforms}
                selectedNFTId={selectedModelId}
                onEditTransform={handleEditTransform}
                onTransformChange={handleTransformUpdate}
                onToggleVisibility={(nftId) => {
                  const isCurrentlyVisible = visibleNFTs.has(nftId);
                  
                  setVisibleNFTs(prev => {
                    const next = new Set(prev);
                    if (next.has(nftId)) {
                      next.delete(nftId);
                    } else {
                      next.add(nftId);
                    }
                    return next;
                  });

                  // 如果是首次顯示，將 NFT 添加到 editor state 並初始化 transform
                  if (!isCurrentlyVisible) {
                    const nft = nfts.find(n => n.id === nftId);
                    if (nft) {
                      const initialTransform = {
                        position: [0, 1, 0] as [number, number, number],
                        rotation: [0, 0, 0] as [number, number, number],
                        scale: 1,
                      };
                      
                      // Initialize transform data
                      setObjectTransforms(prev => {
                        const next = new Map(prev);
                        next.set(nftId, initialTransform);
                        return next;
                      });
                      
                      addObject({
                        id: nftId,
                        nftId: nftId,
                        objectType: nft.objectType,
                        name: nft.name,
                        thumbnail: nft.imageUrl,
                        transform: initialTransform,
                        visible: true,
                      });
                    }
                  } else {
                    toggleObjectVisibility(nftId);
                  }
                }}
                onScaleChange={(nftId, scale) => updateObjectScale(nftId, scale)}
                onList={(nftId) => console.log('List NFT:', nftId)}
                onDelist={(nftId) => console.log('Delist NFT:', nftId)}
              />
            </div>
          )}
          {activeTab === 'content' && (
            <ContentManager spaceId={spaceId} />
          )}
          {activeTab === 'settings' && (
            <div className="h-full overflow-y-auto p-4">
              <ScreenConfig
                config={{ contentType: 'none', blobId: '', autoplay: false }}
                onChange={(config) => console.log('Screen config:', config)}
                availableContent={[]}
              />
            </div>
          )}
        </div>

        {/* Desktop: 3D Scene */}
        <div className="hidden md:flex flex-1 flex-col">
          <RetroFrameCanvas className="flex-1">
            <ThreeScene 
              ref={threeSceneRef}
              spaceId={spaceId} 
              models={visibleModels}
              enableGallery={true} 
            />
          </RetroFrameCanvas>

          <RetroPanel className="p-4 rounded-none border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RetroButton
                  onClick={() => setEditMode(!editorState.isEditMode)}
                  variant={editorState.isEditMode ? "primary" : "secondary"}
                  size="sm"
                >
                  {editorState.isEditMode ? '✏️ Editing' : '👁️ Preview'}
                </RetroButton>
              </div>
              <div className="text-sm text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
                {editorState.pendingChanges && '• Unsaved changes'}
              </div>
            </div>
          </RetroPanel>
        </div>

        {/* Desktop: Right Panel */}
        <div className="hidden lg:block w-80 border-l overflow-y-auto" style={{ borderColor: '#d1d5db' }}>
          <div className="p-4 space-y-4">
            <ScreenConfig
              config={{ contentType: 'none', blobId: '', autoplay: false }}
              onChange={(config) => console.log('Screen config:', config)}
              availableContent={[]}
            />
            
            <ContentManager spaceId={spaceId} />
          </div>
        </div>
      </div>
    </div>
  );
}
