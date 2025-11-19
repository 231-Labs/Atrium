"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";
import { RetroHeading } from "@/components/common/RetroHeading";
import { ThreeScene } from "@/components/3d/ThreeScene";
import { RetroFrameCanvas } from "@/components/3d/RetroFrameCanvas";
import { NFTListPanel } from "@/components/space/NFTListPanel";
import { ContentManager } from "@/components/space/ContentManager";
import { ScreenConfig } from "@/components/space/ScreenConfig";
import { useSpace } from "@/hooks/useSpace";
import { useUserSpaces } from "@/hooks/useUserSpaces";
import { useSpaceEditor } from "@/hooks/useSpaceEditor";
import { useWalletSignature } from "@/hooks/useWalletSignature";
import { serializeConfig, uploadConfigToWalrus, downloadConfigFromWalrus } from "@/utils/spaceConfig";
import { updateSpaceConfig, SUI_CHAIN } from "@/utils/transactions";
import { SceneObject } from "@/types/spaceEditor";

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

  const ownershipNFT = userSpaces.find(s => s.spaceId === spaceId);

  const {
    state: editorState,
    setEditMode,
    toggleObjectVisibility,
    updateObjectScale,
    getAllObjects,
    setObjects,
  } = useSpaceEditor();

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
              onToggleVisibility={(nftId) => {
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
              <ThreeScene spaceId={spaceId} enableGallery={true} />
            </RetroFrameCanvas>
          )}
          {activeTab === 'nfts' && (
            <div className="h-full overflow-y-auto p-4">
              <NFTListPanel
                kioskId={space.marketplaceKioskId}
                visibleNFTs={visibleNFTs}
                objectTransforms={objectTransforms}
                onToggleVisibility={(nftId) => {
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
            <ThreeScene spaceId={spaceId} enableGallery={true} />
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
