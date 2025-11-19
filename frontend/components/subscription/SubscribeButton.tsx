"use client";

import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { subscribeToSpace, MIST_PER_SUI, SUI_CHAIN } from "@/utils/transactions";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";

interface SubscribeButtonProps {
  spaceKioskId: string;
  spaceKioskCapId: string; // Added this
  price: string;
  identityId: string | null;
  onSubscribed: () => void;
}

export function SubscribeButton({ spaceKioskId, spaceKioskCapId, price, identityId, onSubscribed }: SubscribeButtonProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(30); // Default 30 days

  const handleSubscribe = async () => {
    if (!currentAccount) {
      alert("Please connect your wallet first");
      return;
    }
    if (!identityId) {
      alert("You need an Atrium Identity to subscribe. Please register first.");
      return;
    }

    try {
      setLoading(true);

      const priceInMist = parseFloat(price);
      const tx = subscribeToSpace(
        identityId,
        spaceKioskId,
        priceInMist,
        duration
      );

      signAndExecute(
        { 
          transaction: tx,
          chain: SUI_CHAIN,
        },
        {
          onSuccess: () => {
            alert("Subscription successful!");
            onSubscribed();
          },
          onError: (error) => {
            console.error("Subscription failed:", error);
            alert(`Subscription failed: ${error.message}`);
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

  const totalCost = (parseInt(price) / 1_000_000_000) * duration;

  return (
    <div className="space-y-2">
      {/* Single Unified Panel */}
      <RetroPanel variant="inset" className="p-2.5">
        <div className="space-y-2">
          {/* Duration Input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              Subscription Duration (Days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 outline-none focus:border-gray-400 transition-colors text-sm"
              style={{ fontFamily: 'Georgia, serif' }}
            />
          </div>

          <div className="h-px bg-gray-300" />

          {/* Calculation Summary */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                Daily Price
              </span>
              <span className="text-xs font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                {(parseInt(price) / 1_000_000_000).toFixed(2)} SUI
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                Duration
              </span>
              <span className="text-xs font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                {duration} days
              </span>
            </div>
            
            <div className="h-px bg-gray-300" />
            
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                Total
              </span>
              <span className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                {totalCost.toFixed(2)} SUI
              </span>
            </div>
          </div>
        </div>
      </RetroPanel>

      <RetroButton
        onClick={handleSubscribe}
        disabled={loading || !currentAccount || !identityId}
        variant="primary"
        className="w-full"
      >
        {loading ? "Subscribing..." : "Subscribe Now"}
      </RetroButton>
      
      {!identityId && currentAccount && (
        <p className="text-xs text-red-500 text-center">
          Identity required to subscribe
        </p>
      )}

      <p className="text-xs text-gray-500 text-center leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
        Your 3D avatar will appear in the creator's space after subscription
      </p>
    </div>
  );
}
