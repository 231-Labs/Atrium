"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";
import { SpaceCategory } from "@/components/space/SpaceCategoryFilter";
import { uploadToWalrus } from "@/services/walrusApi";
import { initializeSpace, MIST_PER_SUI, SUI_CHAIN } from "@/utils/transactions";
import { PACKAGE_ID } from "@/config/sui";

interface CreateSpaceFormData {
  name: string;
  description: string;
  category: SpaceCategory;
  tags: string;
  coverImage: File | null;
}

interface CreateSpaceFormProps {
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateSpaceForm({ onClose, onCreated }: CreateSpaceFormProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);
  const [identityId, setIdentityId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateSpaceFormData>({
    name: "",
    description: "",
    category: "art",
    tags: "",
    coverImage: null,
  });

  useEffect(() => {
    async function fetchIdentity() {
      if (!currentAccount) return;
      try {
        const { data } = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: { StructType: `${PACKAGE_ID}::identity::Identity` },
          options: { showContent: true }
        });
        
        if (data.length > 0) {
          setIdentityId(data[0].data?.objectId || null);
        }
      } catch (e) {
        console.error("Failed to fetch identity", e);
      }
    }
    fetchIdentity();
  }, [currentAccount, suiClient]);

  // Category options
  const categoryOptions = [
    { value: "art", label: "Art & Creative" },
    { value: "gaming", label: "Gaming" },
    { value: "music", label: "Music" },
    { value: "tech", label: "Technology" },
    { value: "crypto", label: "Crypto" },
    { value: "social", label: "Social" },
    { value: "portfolio", label: "Portfolio" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async () => {
    if (!currentAccount || !formData.name) return;

    try {
      setLoading(true);

      // Upload cover image to Walrus
      let coverImageBlobId = "";
      if (formData.coverImage) {
        coverImageBlobId = await uploadToWalrus(formData.coverImage);
      }

      // Create empty 3D config
      const emptyConfig = {
        scene_version: "1.0",
        objects: [],
        lighting: { ambient: "#ffffff" },
        metadata: {
          category: formData.category,
          tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
          isPublic: true,
          subscriptionType: "free",
        }
      };
      
      const configBlob = new Blob([JSON.stringify(emptyConfig)], {
        type: "application/json",
      });
      const configQuilt = await uploadToWalrus(configBlob);

      // Default to free subscription
      const subscriptionPriceInMist = 0;
      const initPriceInMist = 0.1 * MIST_PER_SUI;
      
      const tx = initializeSpace(
        formData.name,
        formData.description,
        coverImageBlobId,
        configQuilt,
        subscriptionPriceInMist,
        initPriceInMist,
        currentAccount.address
      );

      signAndExecute(
        { 
          transaction: tx,
          chain: SUI_CHAIN,
        },
        {
          onSuccess: () => {
            handleClose();
            onCreated?.();
          },
          onError: (error) => {
            console.error("Failed to create space:", error);
            alert(`Creation failed: ${error.message}`);
          },
        }
      );
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      category: "art",
      tags: "",
      coverImage: null,
    });
    onClose();
  };

  const updateFormData = (updates: Partial<CreateSpaceFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Form Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-3 md:px-6 pt-4 md:pt-6 pb-3 md:pb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              Space Name *
            </label>
            <RetroPanel variant="inset" className="p-0">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                className="w-full px-3 py-2 bg-transparent border-0 outline-none"
                style={{ fontFamily: 'Georgia, serif' }}
                placeholder="Enter your space name"
              />
            </RetroPanel>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              Description
            </label>
            <RetroPanel variant="inset" className="p-0">
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                className="w-full px-3 py-2 bg-transparent border-0 outline-none resize-none"
                style={{ fontFamily: 'Georgia, serif' }}
                rows={3}
                placeholder="Describe your creative space..."
              />
            </RetroPanel>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              Category
            </label>
            <RetroPanel variant="inset" className="p-0">
              <select
                value={formData.category}
                onChange={(e) => updateFormData({ category: e.target.value as SpaceCategory })}
                className="w-full px-3 py-2 bg-transparent border-0 outline-none"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </RetroPanel>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.filter(opt => opt.value !== formData.category).map(option => {
                const isSelected = formData.tags.split(',').map(t => t.trim()).includes(option.value);
                return (
                  <RetroButton
                    key={option.value}
                    variant={isSelected ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => {
                      const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
                      if (isSelected) {
                        // Remove tag
                        const newTags = currentTags.filter(t => t !== option.value);
                        updateFormData({ tags: newTags.join(', ') });
                      } else {
                        // Add tag
                        const newTags = [...currentTags, option.value];
                        updateFormData({ tags: newTags.join(', ') });
                      }
                    }}
                  >
                    {option.label}
                  </RetroButton>
                );
              })}
            </div>
            {formData.tags && (
              <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: 'Georgia, serif' }}>
                Selected: {formData.tags}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              Upload Cover Image
            </label>
            <RetroPanel variant="inset" className="p-0">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => updateFormData({ coverImage: e.target.files?.[0] || null })}
                className="w-full px-3 py-2 bg-transparent border-0 outline-none"
                style={{ fontFamily: 'Georgia, serif' }}
              />
            </RetroPanel>
            {formData.coverImage && (
              <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
                Selected: {formData.coverImage.name}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-3 pt-4 border-t" style={{ borderColor: '#d1d5db' }}>
            <RetroButton
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </RetroButton>
            <RetroButton
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || !formData.name || !identityId}
            >
              {loading ? "Creating..." : "Create Space"}
            </RetroButton>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
              Creating a space requires 0.1 SUI initialization fee
            </p>
            {!identityId && (
              <p className="text-xs text-red-500 mt-1">
                Identity NFT required. Please register first.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
