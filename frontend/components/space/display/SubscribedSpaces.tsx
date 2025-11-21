"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { SpaceCard } from "./SpaceCard";
import { SpaceCategoryFilter, SpaceCategory } from "../ui";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroHeading } from "@/components/common/RetroHeading";
import { RetroEmptyState } from "@/components/common/RetroEmptyState";

interface Space {
  kioskId: string;
  name: string;
  description: string;
  coverImage: string;
  subscriptionPrice: string;
  creator: string;
  category: SpaceCategory;
}

export function SubscribedSpaces() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [subscribedSpaces, setSubscribedSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SpaceCategory>("all");

  useEffect(() => {
    loadSubscribedSpaces();
  }, [currentAccount]);

  const loadSubscribedSpaces = async () => {
    try {
      setLoading(true);
      
      // TODO: Load subscribed spaces from chain
      // For now, use mock data
      if (currentAccount) {
        const mockSubscribed: Space[] = [
          {
            kioskId: "0x123",
            name: "Art Gallery",
            description: "Sharing my digital art creations",
            coverImage: "",
            subscriptionPrice: "1000000000",
            creator: "0xabc",
            category: "art",
          },
          {
            kioskId: "0x789",
            name: "Tech Workshop",
            description: "Tutorials and technical content",
            coverImage: "",
            subscriptionPrice: "1500000000",
            creator: "0xghi",
            category: "tech",
          },
          {
            kioskId: "0xccc",
            name: "Design Lab",
            description: "UI/UX designs and graphic art",
            coverImage: "",
            subscriptionPrice: "1800000000",
            creator: "0xpqr",
            category: "art",
          },
        ];
        setSubscribedSpaces(mockSubscribed);
      }
    } catch (error) {
      console.error("Failed to load subscribed spaces:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RetroPanel className="h-full flex flex-col">
      {/* Header */}
      <RetroHeading 
        title="My Subscriptions"
        subtitle="Spaces you're subscribed to"
        className="mb-0"
      />

      {/* Filters */}
      <SpaceCategoryFilter
        selectedCategory={filter}
        onCategoryChange={setFilter}
        spaces={subscribedSpaces}
      />

      {/* Space Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-3 md:px-6 pt-2 md:pt-4 pb-3 md:pb-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {[...Array(3)].map((_, i) => (
              <RetroPanel 
                key={i}
                variant="inset"
                className="h-64 animate-pulse"
              >
                <div />
              </RetroPanel>
            ))}
          </div>
        ) : (() => {
          // Filter spaces based on selected category
          const filteredSpaces = filter === "all" 
            ? subscribedSpaces 
            : subscribedSpaces.filter(space => space.category === filter);

          return filteredSpaces.length === 0 ? (
            <RetroEmptyState
              icon="📚"
              title="No Subscriptions Found"
              message={filter === "all" 
                ? "You haven't subscribed to any spaces yet. Explore spaces to find creators you love!" 
                : `No subscriptions found in ${filter.charAt(0).toUpperCase() + filter.slice(1)} category.`}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {filteredSpaces.map((space) => (
                <SpaceCard key={space.kioskId} space={space} />
              ))}
            </div>
          );
        })()}
      </div>
    </RetroPanel>
  );
}

