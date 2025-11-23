import { useState } from "react";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";
import { getWalrusBlobUrl } from "@/config/walrus";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface MerchCardProps {
  nft: {
    id: string;
    type: string;
    name: string;
    imageUrl: string;
    price: string;
    objectType: string;
  };
  onViewIn3D?: (nftId: string) => void;
  onPurchase: (nftId: string, nftType: string, price: string) => Promise<void>;
  onPurchaseSuccess?: () => void;
}

export function MerchCard({ nft, onViewIn3D, onPurchase, onPurchaseSuccess }: MerchCardProps) {
  const currentAccount = useCurrentAccount();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const priceInSui = (parseInt(nft.price) / 1000000000).toFixed(2);

  const handlePurchaseClick = async () => {
    if (!currentAccount) {
      setError('Please connect your wallet first');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setError(null);
    setIsPurchasing(true);
    setShowConfirm(false);
    
    try {
      await onPurchase(nft.id, nft.type, nft.price);
      setShowSuccess(true);
      
      setTimeout(() => {
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
      setIsPurchasing(false);
    }
  };

  if (showSuccess) {
    return (
      <RetroPanel variant="outset" className="overflow-hidden">
        <div className="p-6 text-center space-y-3 bg-green-50">
          <div className="text-4xl">✨</div>
          <div className="font-serif font-bold text-green-900">
            Purchase Successful!
          </div>
          <p className="text-xs text-green-700 font-serif">
            {nft.name} is now yours
          </p>
        </div>
      </RetroPanel>
    );
  }

  return (
    <RetroPanel variant="outset" className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative bg-gray-50">
        {nft.imageUrl ? (
          <img
            src={nft.imageUrl.startsWith('http') ? nft.imageUrl : getWalrusBlobUrl(nft.imageUrl)}
            alt={nft.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
            {nft.objectType === '3d' ? '📦' : '🖼️'}
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <h3 className="font-serif font-bold text-gray-900 text-sm truncate">
          {nft.name}
        </h3>

        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-gray-900 font-serif">
            {priceInSui} SUI
          </div>
          <span className="text-[9px] uppercase tracking-wider font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
            {nft.objectType}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <p className="text-xs text-red-700 font-serif">{error}</p>
            <RetroButton
              size="sm"
              variant="secondary"
              onClick={() => setError(null)}
              className="w-full mt-2 text-xs"
            >
              Dismiss
            </RetroButton>
          </div>
        )}

        {showConfirm && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <p className="text-xs text-gray-700 font-serif mb-2">
              Purchase for {priceInSui} SUI?
            </p>
            <div className="flex gap-2">
              <RetroButton
                size="sm"
                variant="primary"
                onClick={handleConfirm}
                className="flex-1 text-xs"
                disabled={isPurchasing}
              >
                Confirm
              </RetroButton>
              <RetroButton
                size="sm"
                variant="secondary"
                onClick={() => setShowConfirm(false)}
                className="flex-1 text-xs"
                disabled={isPurchasing}
              >
                Cancel
              </RetroButton>
            </div>
          </div>
        )}

        {!error && !showConfirm && (
          <div className="flex gap-2">
            {onViewIn3D && (
              <RetroButton
                size="sm"
                variant="secondary"
                onClick={() => onViewIn3D(nft.id)}
                className="flex-1 text-xs"
              >
                View in 3D
              </RetroButton>
            )}
            <RetroButton
              size="sm"
              variant="primary"
              onClick={handlePurchaseClick}
              className="flex-1 text-xs"
              disabled={isPurchasing}
            >
              {isPurchasing ? 'Purchasing...' : 'Purchase'}
            </RetroButton>
          </div>
        )}
      </div>
    </RetroPanel>
  );
}

