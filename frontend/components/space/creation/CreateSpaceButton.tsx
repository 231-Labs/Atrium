"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { uploadBlobToWalrus } from "@/services/walrusApi";
import { initializeSpace, MIST_PER_SUI, SUI_CHAIN } from "@/utils/transactions";
import { PACKAGE_ID } from "@/config/sui";

interface CreateSpaceButtonProps {
  onCreated: () => void;
}

export function CreateSpaceButton({ onCreated }: CreateSpaceButtonProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [identityId, setIdentityId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subscriptionPrice: "1",
    coverImage: null as File | null,
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
        console.error("無法獲取 Identity", e);
      }
    }
    fetchIdentity();
  }, [currentAccount, suiClient]);

  const handleSubmit = async () => {
    if (!currentAccount || !formData.name) return;
    if (!identityId) {
      alert("需要 Identity NFT 才能創建空間。請先註冊。");
      return;
    }

    try {
      setLoading(true);

      // Upload cover image to Walrus
      let coverImageBlobId = "";
      if (formData.coverImage) {
        coverImageBlobId = await uploadBlobToWalrus(formData.coverImage);
      }

      // Create empty config
      const emptyConfig = {
        scene_version: "1.0",
        objects: [],
        lighting: { ambient: "#ffffff" },
      };
      const configBlob = new Blob([JSON.stringify(emptyConfig)], {
        type: "application/json",
      });
      const configQuilt = await uploadBlobToWalrus(configBlob);

      // Create kiosk and initialize space
      const subscriptionPriceInMist = parseFloat(formData.subscriptionPrice) * MIST_PER_SUI;
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
          onSuccess: (result) => {
            console.log('✅ Space created successfully:', result);
            setLoading(false);
            setIsOpen(false);
            
            // Dispatch global event for space creation
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('atrium-space-created', { 
                detail: { result } 
              }));
            }
            
            onCreated();
            setFormData({
              name: "",
              description: "",
              subscriptionPrice: "1",
              coverImage: null,
            });
          },
          onError: (error) => {
            console.error("❌ Failed to create space:", error);
            setLoading(false);
            
            // Extract detailed error message
            let errorMsg = 'Unknown error';
            if (error instanceof Error) {
              errorMsg = error.message;
            } else if (typeof error === 'string') {
              errorMsg = error;
            } else if (error && typeof error === 'object') {
              errorMsg = JSON.stringify(error, null, 2);
            }
            
            alert(`Space creation failed:\n\n${errorMsg}\n\nPlease check:\n- Gas balance (need ~0.15 SUI)\n- Network connection\n- Console for details`);
          },
        }
      );
    } catch (error: any) {
      console.error("❌ Error during space creation:", error);
      setLoading(false);
      alert(`Error: ${error.message || error}\n\nCheck console for details.`);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 rounded-lg bg-gradient-header text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
      >
        + Create Space
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hidden">
        <h2 className="text-3xl font-bold bg-gradient-header bg-clip-text text-transparent mb-6">
          Create Your Space
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Space Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-purple focus:ring-2 focus:ring-primary-purple/20 outline-none"
              placeholder="Enter space name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-purple focus:ring-2 focus:ring-primary-purple/20 outline-none"
              rows={3}
              placeholder="Describe your space..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Subscription Price (SUI/day)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.subscriptionPrice}
              onChange={(e) =>
                setFormData({ ...formData, subscriptionPrice: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-purple focus:ring-2 focus:ring-primary-purple/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Cover Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData({ ...formData, coverImage: e.target.files?.[0] || null })
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-purple"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name || !identityId}
              className="flex-1 py-3 px-6 rounded-lg font-medium transition-all
                bg-gradient-header text-white shadow-lg
                hover:shadow-xl hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Space"}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-6 py-3 rounded-lg font-medium border-2 border-gray-300 text-text-primary hover:border-primary-purple transition-all"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-text-secondary">
            * Creating a space requires a 0.1 SUI initialization fee
          </p>
          {!identityId && (
            <p className="text-xs text-red-500 text-center">
              Identity NFT required. Please register first.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

