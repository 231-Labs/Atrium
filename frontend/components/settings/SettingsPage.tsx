'use client';

import { useCurrentAccount, ConnectButton, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { RetroPanel } from '@/components/common/RetroPanel';
import { RetroHeading } from '@/components/common/RetroHeading';
import { RetroSelect } from '@/components/common/RetroSelect';
import { ExplorerLink } from '@/components/common/ExplorerLink';
import { useState, useEffect } from 'react';
import { bindAvatar, updateImage, updateBio } from '@/utils/transactions';
import { uploadBlobToWalrus } from '@/services/walrusApi';
import { useKioskData } from '@/hooks/useKioskData';
import { useIdentity } from '@/hooks/useIdentity';
import { getIdentityImageBlobId } from '@/utils/identity-helpers';
import dynamic from 'next/dynamic';

const GLBViewer = dynamic(() => import('@/components/3d/GLBViewer'), { ssr: false });

export function SettingsPage() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { ownedKiosks, fetchingKiosks, selectedKioskId, setSelectedKioskId } = useKioskData();
  const { identity, loading: loadingIdentity, refetch: refetchIdentity } = useIdentity();
  
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploadStatus, setImageUploadStatus] = useState("");

  const [isUpdatingGlb, setIsUpdatingGlb] = useState(false);
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [glbUploadStatus, setGlbUploadStatus] = useState("");

  const [isUpdatingBio, setIsUpdatingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [bioUpdateStatus, setBioUpdateStatus] = useState("");

  useEffect(() => {
    const savedKioskId = localStorage.getItem('atrium_default_kiosk_id');
    if (savedKioskId && !selectedKioskId) {
      setSelectedKioskId(savedKioskId);
    }
  }, [selectedKioskId, setSelectedKioskId]);

  const handleKioskChange = (kioskId: string) => {
    setSelectedKioskId(kioskId);
    if (kioskId) {
      localStorage.setItem('atrium_default_kiosk_id', kioskId);
    } else {
      localStorage.removeItem('atrium_default_kiosk_id');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGlbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.glb')) {
        setGlbUploadStatus("Error: Please select a .glb file");
        return;
      }
      setGlbFile(file);
      setGlbUploadStatus("");
    }
  };

  const handleUpdateImage = async () => {
    if (!imageFile || !identity) return;
    
    try {
      setImageUploadStatus("Uploading to Walrus...");
      const blobId = await uploadBlobToWalrus(imageFile);

      setImageUploadStatus("Updating Identity...");
      const tx = updateImage(identity.id, blobId);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
             setImageUploadStatus("Profile Image Updated!");
             setTimeout(() => {
               setIsUpdatingImage(false);
               setImageFile(null);
               setImagePreview(null);
               setImageUploadStatus("");
               refetchIdentity();
             }, 1500);
          },
          onError: (e) => {
             setImageUploadStatus("Error: " + e.message);
          }
        }
      );

    } catch (e: any) {
      setImageUploadStatus("Error: " + e.message);
    }
  };

  const handleUpdateGlb = async () => {
    if (!glbFile || !identity) return;
    
    try {
      setGlbUploadStatus("Uploading to Walrus...");
      const blobId = await uploadBlobToWalrus(glbFile);

      setGlbUploadStatus("Updating Identity...");
      const tx = bindAvatar(identity.id, blobId);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
             setGlbUploadStatus("3D Avatar Updated!");
             setTimeout(() => {
               setIsUpdatingGlb(false);
               setGlbFile(null);
               setGlbUploadStatus("");
               refetchIdentity();
             }, 1500);
          },
          onError: (e) => {
             setGlbUploadStatus("Error: " + e.message);
          }
        }
      );

    } catch (e: any) {
      setGlbUploadStatus("Error: " + e.message);
    }
  };

  const handleUpdateBio = async () => {
    if (!identity) return;
    
    try {
      setBioUpdateStatus("Updating bio...");
      const tx = updateBio(identity.id, bioText);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            setBioUpdateStatus("Bio Updated!");
            setTimeout(() => {
              setIsUpdatingBio(false);
              setBioUpdateStatus("");
              refetchIdentity();
            }, 1500);
          },
          onError: (e) => {
            setBioUpdateStatus("Error: " + e.message);
          }
        }
      );

    } catch (e: any) {
      setBioUpdateStatus("Error: " + e.message);
    }
  };

  const avatarBlobId = identity?.content?.fields?.avatar_blob_id?.vec?.[0] || 
                       identity?.content?.fields?.avatar_blob_id;

  return (
    <RetroPanel className="h-full flex flex-col">
      <RetroHeading 
        title="Settings"
        subtitle="Manage your account and preferences"
        className="mb-0"
      />

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 md:px-6 pt-4 pb-4 space-y-5">
        
        {/* Identity & Avatar Section */}
        <div>
          <h3 className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            Profile
           </h3>
           <RetroPanel variant="inset" className="p-4">
             {loadingIdentity ? (
              <div className="text-gray-500 text-sm" style={{ fontFamily: 'Georgia, serif' }}>Loading...</div>
             ) : identity ? (
               <div className="space-y-4">
                
                {/* Avatar Preview Area */}
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  
                  {/* 2D Photo */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2 text-center" style={{ fontFamily: 'Georgia, serif' }}>
                      Photo
                    </h4>
                    <RetroPanel 
                      variant="inset" 
                      className="relative overflow-hidden aspect-square"
                    >
                      {getIdentityImageBlobId((identity.content as any)?.fields) ? (
                        <img 
                          src={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${getIdentityImageBlobId((identity.content as any)?.fields)}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full flex items-center justify-center text-4xl bg-gray-50';
                              fallback.style.fontFamily = 'Georgia, serif';
                              fallback.textContent = (identity.content as any)?.fields?.username?.charAt(0)?.toUpperCase() || '👤';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-50" style={{ fontFamily: 'Georgia, serif' }}>
                          {(identity.content as any)?.fields?.username?.charAt(0)?.toUpperCase() || '👤'}
                        </div>
                      )}
                    </RetroPanel>
                    {!isUpdatingImage && (
                      <div className="mt-2 text-center">
                        <button
                          onClick={() => setIsUpdatingImage(true)}
                          className="text-xs text-gray-700 hover:text-gray-900 underline"
                          style={{ fontFamily: 'Georgia, serif' }}
                        >
                          Update
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3D Avatar */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2 text-center" style={{ fontFamily: 'Georgia, serif' }}>
                      3D Model
                    </h4>
                    <RetroPanel 
                      variant="inset" 
                      className="relative overflow-hidden aspect-square"
                    >
                      {avatarBlobId ? (
                        <GLBViewer blobId={avatarBlobId} className="w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <div className="text-center">
                            <span className="text-3xl block">🤖</span>
                            <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'Georgia, serif' }}>
                              None
                            </p>
                          </div>
                        </div>
                      )}
                    </RetroPanel>
                    {!isUpdatingGlb && (
                      <div className="mt-2 text-center">
                        <button
                          onClick={() => setIsUpdatingGlb(true)}
                          className="text-xs text-gray-700 hover:text-gray-900 underline"
                          style={{ fontFamily: 'Georgia, serif' }}
                        >
                          Update
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity Info */}
                <div className="text-center pt-3 border-t" style={{ borderColor: '#e5e7eb' }}>
                  <div className="text-xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    {(identity.content as any)?.fields?.username || "User"}
                  </div>
                  
                  {/* Bio */}
                  <p className="text-sm text-gray-600 mb-2 px-4" style={{ fontFamily: 'Georgia, serif' }}>
                    {(identity.content as any)?.fields?.bio || "No bio yet"}
                  </p>
                  
                  <div className="flex items-center justify-center gap-3">
                    <ExplorerLink objectId={identity.id} className="text-xs">
                      View on Explorer
                    </ExplorerLink>
                    {!isUpdatingBio && (
                      <>
                        <span className="text-gray-400">·</span>
                        <button
                          onClick={() => {
                            setIsUpdatingBio(true);
                            setBioText((identity.content as any)?.fields?.bio || "");
                          }}
                          className="text-xs text-gray-700 hover:text-gray-900 underline"
                          style={{ fontFamily: 'Georgia, serif' }}
                        >
                          Edit Bio
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Upload Image Form */}
                {isUpdatingImage && (
                  <RetroPanel variant="inset" className="p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-bold mb-2 uppercase tracking-wide text-gray-700" style={{ fontFamily: 'Georgia, serif' }}>
                        Upload New Photo
                      </label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageSelect} 
                        className="w-full text-xs"
                        style={{ fontFamily: 'Georgia, serif' }}
                      />
                    </div>

                    {imagePreview && (
                      <RetroPanel variant="inset" className="flex justify-center p-3">
                        <img src={imagePreview} alt="Preview" className="max-h-40 object-contain" />
                      </RetroPanel>
                    )}

                    {imageUploadStatus && (
                      <p className="text-xs text-center" style={{ 
                        fontFamily: 'Georgia, serif',
                        color: imageUploadStatus.includes('Error') ? '#dc2626' : '#059669'
                      }}>
                        {imageUploadStatus}
                      </p>
                    )}

                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={handleUpdateImage}
                        disabled={!imageFile || !!imageUploadStatus}
                        className="text-xs text-gray-700 hover:text-gray-900 underline disabled:text-gray-400 disabled:no-underline"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        Upload
                      </button>
                      <button
                        onClick={() => { 
                          setIsUpdatingImage(false); 
                          setImageUploadStatus(""); 
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="text-xs text-gray-700 hover:text-gray-900 underline"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        Cancel
                      </button>
                  </div>
                  </RetroPanel>
                )}

                {/* Upload GLB Form */}
                {isUpdatingGlb && (
                  <RetroPanel variant="inset" className="p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-bold mb-2 uppercase tracking-wide text-gray-700" style={{ fontFamily: 'Georgia, serif' }}>
                        Upload New 3D Model (.glb)
                      </label>
                       <input 
                         type="file" 
                        accept=".glb" 
                        onChange={handleGlbSelect} 
                        className="w-full text-xs"
                         style={{ fontFamily: 'Georgia, serif' }}
                       />
                    </div>

                    {glbFile && (
                      <RetroPanel variant="inset" className="p-2">
                        <p className="text-xs text-gray-600 text-center" style={{ fontFamily: 'Georgia, serif' }}>
                          📦 {glbFile.name}
                        </p>
                      </RetroPanel>
                    )}

                    {glbUploadStatus && (
                      <p className="text-xs text-center" style={{ 
                        fontFamily: 'Georgia, serif',
                        color: glbUploadStatus.includes('Error') ? '#dc2626' : '#059669'
                      }}>
                        {glbUploadStatus}
                      </p>
                    )}

                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={handleUpdateGlb}
                        disabled={!glbFile || !!glbUploadStatus}
                        className="text-xs text-gray-700 hover:text-gray-900 underline disabled:text-gray-400 disabled:no-underline"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        Upload
                      </button>
                      <button
                        onClick={() => { 
                          setIsUpdatingGlb(false); 
                          setGlbUploadStatus(""); 
                          setGlbFile(null);
                        }}
                        className="text-xs text-gray-700 hover:text-gray-900 underline"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </RetroPanel>
                )}

                {/* Update Bio Form */}
                {isUpdatingBio && (
                  <div className="pt-3 space-y-3 border-t" style={{ borderColor: '#e5e7eb' }}>
                    <div>
                      <textarea 
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        rows={3}
                        maxLength={200}
                        placeholder="Tell us about yourself..."
                        className="w-full text-sm p-3 border border-gray-300 focus:border-gray-400 focus:outline-none resize-none bg-white"
                        style={{ fontFamily: 'Georgia, serif' }}
                      />
                      <p className="text-xs text-gray-500 text-right mt-1" style={{ fontFamily: 'Georgia, serif' }}>
                        {bioText.length}/200
                      </p>
                      <div className="flex gap-4 justify-center mt-2">
                        <button
                          onClick={handleUpdateBio}
                          disabled={!!bioUpdateStatus}
                          className="text-xs text-gray-700 hover:text-gray-900 underline disabled:text-gray-400 disabled:no-underline"
                          style={{ fontFamily: 'Georgia, serif' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { 
                            setIsUpdatingBio(false); 
                            setBioUpdateStatus(""); 
                            setBioText("");
                          }}
                          className="text-xs text-gray-700 hover:text-gray-900 underline"
                          style={{ fontFamily: 'Georgia, serif' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    {bioUpdateStatus && (
                      <p className="text-xs text-center" style={{ 
                        fontFamily: 'Georgia, serif',
                        color: bioUpdateStatus.includes('Error') ? '#dc2626' : '#059669'
                      }}>
                        {bioUpdateStatus}
                      </p>
                    )}
                  </div>
                  )}
               </div>
             ) : (
              <div className="text-gray-500 text-sm text-center py-8" style={{ fontFamily: 'Georgia, serif' }}>
                  No identity found. Please register on the home page.
               </div>
             )}
           </RetroPanel>
        </div>

        {/* Default Kiosk Section */}
        <div>
          <h3 className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            Default Kiosk
          </h3>
          <RetroPanel variant="inset" className="p-4">
            {fetchingKiosks ? (
              <div className="text-xs text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
                Loading kiosks...
              </div>
            ) : ownedKiosks && ownedKiosks.length > 0 ? (
              <div className="space-y-3">
                <RetroSelect
                  options={[
                    { value: '', label: 'Select a kiosk...' },
                    ...ownedKiosks.map(k => ({
                      value: k.kioskId,
                      label: `${k.kioskId.slice(0, 8)}...${k.kioskId.slice(-6)}`
                    }))
                  ]}
                  value={selectedKioskId || ''}
                  onChange={handleKioskChange}
                  placeholder="Select a kiosk..."
                />
                {selectedKioskId && (
                  <ExplorerLink objectId={selectedKioskId} className="text-xs">
                    View on Explorer
                  </ExplorerLink>
                )}
               </div>
            ) : (
              <div className="text-xs text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
                No kiosks found. Create a space to get started.
             </div>
            )}
          </RetroPanel>
        </div>

        {/* Wallet Section */}
        <div>
          <h3 className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            Wallet
          </h3>
          <RetroPanel variant="inset" className="p-4">
            {currentAccount ? (
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                    Connected
                  </p>
                  <p className="text-xs text-gray-800 break-all" style={{ fontFamily: 'Georgia, serif' }}>
                    {currentAccount.address}
                  </p>
                </div>
                  <ConnectButton
                  connectText="Connect"
                    style={{ fontFamily: 'Georgia, serif' }}
                  />
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                  No wallet connected
                </p>
                <ConnectButton
                  connectText="Connect Wallet"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
              </div>
            )}
          </RetroPanel>
        </div>

      </div>
    </RetroPanel>
  );
}
