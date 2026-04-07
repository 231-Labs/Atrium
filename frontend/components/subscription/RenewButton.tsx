"use client";

import { useState } from "react";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { renewSubscription } from "@/utils/transactions";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";

interface RenewButtonProps {
  subscriptionId: string;
  spaceId: string;
  currentExpiresAt: number | null; // ms timestamp
  priceInMist: number;
  creatorAddress: string;
  onRenewed: () => void;
}

type RenewStatus = "idle" | "loading" | "success" | "error";

const DURATION_OPTIONS = [
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "180 days", value: 180 },
  { label: "365 days", value: 365 },
];

function expiryLabel(currentExpiresAt: number | null): string {
  if (!currentExpiresAt) return "";
  const nowMs = Date.now();
  const diff = currentExpiresAt - nowMs;
  if (diff > 0) {
    const days = Math.ceil(diff / 86_400_000);
    return `Expires in ${days} day${days !== 1 ? "s" : ""}`;
  } else {
    const days = Math.floor(-diff / 86_400_000);
    return `Expired ${days} day${days !== 1 ? "s" : ""} ago`;
  }
}

export function RenewButton({
  subscriptionId,
  spaceId,
  currentExpiresAt,
  priceInMist,
  creatorAddress,
  onRenewed,
}: RenewButtonProps) {
  const currentAccount = useCurrentAccount();
  const dAppKit = useDAppKit();
  const [duration, setDuration] = useState(30);
  const [status, setStatus] = useState<RenewStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const totalCost = (priceInMist / 1_000_000_000) * duration;
  const isExpired = currentExpiresAt !== null && currentExpiresAt < Date.now();

  const handleRenew = async () => {
    if (!currentAccount) {
      setStatus("error");
      setErrorMessage("Please connect your wallet first");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage("");

      const tx = renewSubscription(
        subscriptionId,
        spaceId,
        priceInMist,
        duration,
        currentAccount.address,
        creatorAddress,
      );

      await dAppKit.signAndExecuteTransaction({ transaction: tx });
      setStatus("success");
      setTimeout(() => {
        onRenewed();
      }, 1500);
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Transaction failed. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <RetroPanel variant="inset" className="p-3 bg-green-50 border-green-200">
        <div className="flex items-center gap-2">
          <span className="text-xl">✅</span>
          <p className="text-sm font-bold text-green-800" style={{ fontFamily: "Georgia, serif" }}>
            Renewed! Access extended by {duration} days.
          </p>
        </div>
      </RetroPanel>
    );
  }

  return (
    <div className="space-y-2">
      {currentExpiresAt && (
        <p
          className={`text-xs font-medium ${isExpired ? "text-red-600" : "text-gray-600"}`}
          style={{ fontFamily: "Georgia, serif" }}
        >
          {expiryLabel(currentExpiresAt)}
        </p>
      )}

      {status === "error" && (
        <RetroPanel variant="inset" className="p-3 bg-red-50 border-red-200">
          <div className="flex items-start gap-2">
            <span className="text-lg">❌</span>
            <div>
              <p className="text-xs font-bold text-red-800" style={{ fontFamily: "Georgia, serif" }}>
                Renewal Failed
              </p>
              <p className="text-xs text-red-600 mt-0.5" style={{ fontFamily: "Georgia, serif" }}>
                {errorMessage}
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="text-xs text-red-700 underline mt-1 hover:text-red-900"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Try again
              </button>
            </div>
          </div>
        </RetroPanel>
      )}

      <RetroPanel variant="inset" className="p-2.5">
        <div className="space-y-2">
          <div>
            <label
              className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Extend by
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  className={`text-xs px-2.5 py-1 border transition-colors ${
                    duration === opt.value
                      ? "border-gray-700 bg-gray-800 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
                  }`}
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-300" />

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
              Total
            </span>
            <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
              {totalCost.toFixed(2)} SUI
            </span>
          </div>
        </div>
      </RetroPanel>

      <RetroButton
        onClick={handleRenew}
        disabled={status === "loading" || !currentAccount}
        variant="primary"
        className="w-full"
      >
        {status === "loading" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block animate-spin">⏳</span>
            Processing...
          </span>
        ) : isExpired ? (
          "Renew Subscription"
        ) : (
          "Extend Subscription"
        )}
      </RetroButton>
    </div>
  );
}
