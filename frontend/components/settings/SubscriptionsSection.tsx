"use client";

import { useSubscribedSpaces } from "@/components/space/hooks/useSubscribedSpaces";
import { RenewButton } from "@/components/subscription/RenewButton";
import { RetroPanel } from "@/components/common/RetroPanel";
import { ExplorerLink } from "@/components/common/ExplorerLink";
import Link from "next/link";

function expiryLabel(expiresAt: number | null): { text: string; expired: boolean } {
  if (!expiresAt) return { text: "No expiry info", expired: false };
  const nowMs = Date.now();
  const diff = expiresAt - nowMs;
  if (diff > 0) {
    const days = Math.ceil(diff / 86_400_000);
    return { text: `Expires in ${days} day${days !== 1 ? "s" : ""}`, expired: false };
  } else {
    const days = Math.floor(-diff / 86_400_000);
    return { text: `Expired ${days} day${days !== 1 ? "s" : ""} ago`, expired: true };
  }
}

export function SubscriptionsSection() {
  const { spaces, loading, refetch } = useSubscribedSpaces();

  if (loading) {
    return (
      <div className="text-xs text-gray-500" style={{ fontFamily: "Georgia, serif" }}>
        Loading subscriptions...
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <RetroPanel variant="inset" className="p-4 text-center">
        <p className="text-xs text-gray-500" style={{ fontFamily: "Georgia, serif" }}>
          You haven't subscribed to any space yet.
        </p>
      </RetroPanel>
    );
  }

  return (
    <div className="space-y-3">
      {spaces.map((space) => {
        const { text, expired } = expiryLabel(space.expiresAt);

        return (
          <RetroPanel key={space.subscriptionId} variant="inset" className="p-3">
            <div className="flex items-start gap-3">
              {/* Cover thumbnail */}
              {space.coverImage ? (
                <img
                  src={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${space.coverImage}`}
                  alt={space.name}
                  className="w-12 h-12 object-cover flex-shrink-0 border border-gray-200"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                  <span className="text-xl">🏛️</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Link
                    href={`/space/${space.id}`}
                    className="text-sm font-bold text-gray-800 hover:underline truncate"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {space.name}
                  </Link>
                  <ExplorerLink objectId={space.subscriptionId} className="text-xs flex-shrink-0">
                    NFT
                  </ExplorerLink>
                </div>

                <p
                  className={`text-xs mb-2 ${expired ? "text-red-600 font-medium" : "text-gray-500"}`}
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {text}
                </p>

                <RenewButton
                  subscriptionId={space.subscriptionId}
                  spaceId={space.id}
                  currentExpiresAt={space.expiresAt}
                  priceInMist={Number(space.subscriptionPrice)}
                  creatorAddress={space.creator}
                  onRenewed={refetch}
                />
              </div>
            </div>
          </RetroPanel>
        );
      })}
    </div>
  );
}
