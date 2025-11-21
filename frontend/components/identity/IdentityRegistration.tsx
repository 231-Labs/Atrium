"use client";

import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useDisconnectWallet } from "@mysten/dapp-kit";
import { uploadBlobToWalrus } from "@/services/walrusApi";
import { mintIdentity } from "@/utils/transactions";
import { RetroButton } from "@/components/common/RetroButton";
import { RetroInput } from "@/components/common/RetroInput";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroHeading } from "@/components/common/RetroHeading";

interface IdentityRegistrationProps {
  onComplete: () => void;
}

export function IdentityRegistration({ onComplete }: IdentityRegistrationProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { mutate: disconnect } = useDisconnectWallet();

  const [step, setStep] = useState<"input" | "uploading" | "minting">("input");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  
  // Files
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // 3D GLB
  const [profileImage, setProfileImage] = useState<File | null>(null); // 2D Image
  
  // Previews
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const handleDisconnect = () => {
    disconnect();
  };

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfileImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.glb')) {
        setError("Please select a .glb file for your 3D avatar");
        return;
      }
      setAvatarFile(file);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!username || !currentAccount) {
      setError("Username is required");
      return;
    }
    
    if (!avatarFile) {
      setError("Please upload a 3D Avatar (.glb)");
      return;
    }

    try {
      setError("");
      setStep("uploading");
      
      // 1. Upload 3D Avatar
      setProgress("Uploading 3D Avatar to Walrus...");
      const avatarBlobId = await uploadBlobToWalrus(avatarFile);

      // 2. Upload Profile Image (Optional)
      let imageBlobId = "";
      if (profileImage) {
        setProgress("Uploading Profile Picture to Walrus...");
        imageBlobId = await uploadBlobToWalrus(profileImage);
      }

      // 3. Mint Identity
      setStep("minting");
      setProgress("Minting your Atrium Identity...");

      const tx = mintIdentity(
        username, 
        bio, 
        avatarBlobId, 
        imageBlobId,
        currentAccount.address  // Recipient address for PTB
      );

      signAndExecute(
        {
          transaction: tx as any,
          chain: 'sui:testnet',
        },
        {
          onSuccess: (result) => {
            console.log("Transaction successful:", result);
            setProgress("Identity minted successfully! Welcome to Atrium.");
            setTimeout(() => {
              onComplete();
            }, 2000);
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            setError(`Minting failed: ${error.message || 'Unknown error'}`);
            setStep("input");
          },
        }
      );
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      setStep("input");
    }
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <RetroPanel className="p-6 md:p-8">
          <RetroHeading 
            title="Join Atrium"
            subtitle="Create your decentralized identity"
            className="mb-6 md:mb-8"
          />

          {step === "input" && (
            <div className="space-y-6">

              {/* Profile Image Upload (Left) & Basic Info (Right) */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Image */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <label className="block text-xs font-serif uppercase tracking-wide text-gray-600 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    Profile Picture
                  </label>
                  <div className="relative group">
                    <div 
                      className="w-32 h-32 rounded-full bg-gray-200 border-2 border-gray-300 overflow-hidden flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                      onClick={() => document.getElementById('pfp-upload')?.click()}
                    >
                      {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl text-gray-400">👤</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageSelect}
                      className="hidden"
                      id="pfp-upload"
                    />
                    <div className="absolute bottom-0 right-0 bg-white border border-gray-300 rounded-full p-1.5 shadow-sm pointer-events-none">
                      <span className="text-xs block">📷</span>
                    </div>
                  </div>
                </div>

                {/* Info Fields */}
                <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wide text-gray-600 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  Username *
                </label>
                <RetroInput
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                      placeholder="Unique handle (e.g. neo_artist)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wide text-gray-600 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-gray-300 outline-none focus:border-gray-500 transition-colors text-sm"
                      style={{ fontFamily: 'Georgia, serif' }}
                    />
                  </div>
                </div>
              </div>

              {/* 3D Avatar Upload */}
              <div>
                <label className="block text-xs font-serif uppercase tracking-wide text-gray-600 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  3D Avatar (.glb) *
                </label>
                <RetroPanel variant="inset" className="p-6 border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".glb"
                    onChange={handleAvatarSelect}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload" className="cursor-pointer block w-full h-full">
                    <div className="text-center">
                      {avatarFile ? (
                        <div>
                          <div className="text-4xl mb-2">📦</div>
                          <p className="text-sm font-bold text-gray-800">{avatarFile.name}</p>
                          <p className="text-xs text-gray-500">{(avatarFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <div className="text-gray-400 text-4xl mb-3">
                            ⬇️
                          </div>
                          <p className="text-sm font-serif text-gray-600 mb-1">
                            Upload your 3D character model
                        </p>
                          <p className="text-xs font-serif text-gray-500">
                            Must be a .glb file. Used in 3D spaces.
                        </p>
                      </div>
                    )}
                    </div>
                  </label>
                </RetroPanel>
              </div>

              {error && (
                <RetroPanel variant="inset" className="p-4 bg-red-50 border-red-200">
                  <div className="text-xs font-serif text-red-600 text-center">
                    {error}
                  </div>
                </RetroPanel>
              )}

              <div className="space-y-3 pt-2">
                <RetroButton
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!username || !avatarFile}
                  className="w-full"
                >
                  Mint Identity
                </RetroButton>
                
                <div className="flex justify-center gap-4 text-xs text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
                  <button
                    onClick={handleDisconnect}
                    className="hover:text-gray-700 underline"
                  >
                    Disconnect Wallet
                  </button>
                  <span>|</span>
                <button
                  onClick={onComplete}
                    className="hover:text-gray-700 underline"
                >
                  Skip for now
                </button>
                </div>
              </div>

              <div className="text-center pt-2">
                 <p className="text-xs text-gray-400" style={{ fontFamily: 'Georgia, serif' }}>
                   Your data will be stored permanently on Walrus and Sui.
                 </p>
              </div>
            </div>
          )}

          {(step === "uploading" || step === "minting") && (
            <div className="py-16 text-center">
              <RetroPanel variant="inset" className="p-8 inline-block mb-6">
                <div 
                  className="inline-block animate-spin h-12 w-12 border-4 border-gray-300 border-t-gray-600 rounded-full"
                />
              </RetroPanel>
              <div className="text-lg font-bold text-gray-800 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                {step === "uploading" ? "Uploading to Walrus..." : "Minting Identity..."}
              </div>
              <div className="text-sm font-serif text-gray-600">{progress}</div>
            </div>
          )}
        </RetroPanel>
      </div>
    </div>
  );
}
