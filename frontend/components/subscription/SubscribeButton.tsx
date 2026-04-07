"use client";

import { useState } from "react";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { subscribeToSpace, MIST_PER_SUI, SUI_CHAIN } from "@/utils/transactions";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";

interface SubscribeButtonProps {
  spaceId: string; // Space object ID (not kiosk ID)
  spaceKioskCapId: string; // Kept for backward compatibility but not used
  creatorAddress: string;  // Added for PTB - creator's wallet address
  price: string;
  identityId: string | null;
  onSubscribed: () => void;
}

type SubscriptionStatus = 'idle' | 'loading' | 'success' | 'error';

export function SubscribeButton({ spaceId, spaceKioskCapId, creatorAddress, price, identityId, onSubscribed }: SubscribeButtonProps) {
  const currentAccount = useCurrentAccount();
  const dAppKit = useDAppKit();
  const [status, setStatus] = useState<SubscriptionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [duration, setDuration] = useState(30); // Default 30 days

  const handleSubscribe = async () => {
    if (!currentAccount) {
      setStatus('error');
      setErrorMessage('Please connect your wallet first');
      return;
    }
    if (!identityId) {
      setStatus('error');
      setErrorMessage('You need an Atrium Identity to subscribe. Please register first.');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');

      const priceInMist = parseFloat(price);
      const tx = subscribeToSpace(
        identityId,
        spaceId, // Use Space ID, not Kiosk ID
        priceInMist,
        duration,
        currentAccount.address,  // Subscriber address for PTB
        creatorAddress           // Creator address for PTB
      );

      try {
        const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
        console.log('✅ Subscription successful:', result);
        setStatus('success');
        setTimeout(() => {
          onSubscribed();
        }, 2000);
      } catch (error: any) {
        console.error('❌ Subscription failed:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Transaction failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred');
    }
  };

  const totalCost = (parseInt(price) / 1_000_000_000) * duration;

  return (
    <div className="space-y-2">
      {/* Status Messages */}
      {status === 'success' && (
        <RetroPanel variant="inset" className="p-3 bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-green-800" style={{ fontFamily: 'Georgia, serif' }}>
                Subscription Successful!
              </p>
              <p className="text-xs text-green-600" style={{ fontFamily: 'Georgia, serif' }}>
                Welcome! You now have access to premium content.
              </p>
            </div>
          </div>
        </RetroPanel>
      )}

      {status === 'error' && (
        <RetroPanel variant="inset" className="p-3 bg-red-50 border-red-200">
          <div className="flex items-start gap-2">
            <span className="text-xl">❌</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                Subscription Failed
              </p>
              <p className="text-xs text-red-600 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                {errorMessage}
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="text-xs text-red-700 underline mt-2 hover:text-red-900"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Try again
              </button>
            </div>
          </div>
        </RetroPanel>
      )}

      {/* Subscription Form - Hide when success */}
      {status !== 'success' && (
        <>
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
                  disabled={status === 'loading'}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 outline-none focus:border-gray-400 transition-colors text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            disabled={status === 'loading' || !currentAccount || !identityId}
            variant="primary"
            className="w-full"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin">⏳</span>
                Processing...
              </span>
            ) : (
              'Subscribe Now'
            )}
          </RetroButton>
          
          {!identityId && currentAccount && (
            <p className="text-xs text-red-500 text-center">
              Identity required to subscribe
            </p>
          )}

          <p className="text-xs text-gray-500 text-center leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Your 3D avatar will appear in the creator's space after subscription
          </p>
        </>
      )}
    </div>
  );
}
