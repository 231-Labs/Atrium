"use client";

import { useParams, useRouter } from "next/navigation";
import { useSpace } from "@/hooks/useSpace";
import { SpaceDetail } from "@/components/space/SpaceDetail";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";

export default function SpacePage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.kioskId as string;
  const { space, loading, error } = useSpace(spaceId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" style={{ fontFamily: 'Georgia, serif' }}>
        <RetroPanel className="p-8">
          <div className="text-center">
            <div className="inline-block animate-spin text-3xl text-gray-400 mb-4">
              ⟳
            </div>
            <p className="text-sm text-gray-600">Loading space...</p>
          </div>
        </RetroPanel>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" style={{ fontFamily: 'Georgia, serif' }}>
        <RetroPanel className="p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🏛️</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Space Not Found</h2>
          <p className="text-sm text-gray-600 mb-6">
            {error?.message || "The space you're looking for doesn't exist or has been removed."}
          </p>
          <RetroButton 
            onClick={() => router.push("/")} 
            variant="primary"
          >
            Back to Atrium
          </RetroButton>
        </RetroPanel>
      </div>
    );
  }

  return <SpaceDetail space={{
    id: space.id,
    kioskId: space.marketplaceKioskId,
    name: space.name,
    description: space.description,
    coverImage: space.coverImage,
    configQuilt: space.configQuilt,
    subscriptionPrice: space.subscriptionPrice,
    creator: space.creator,
    videoBlobs: space.videoBlobs,
  }} />;
}

