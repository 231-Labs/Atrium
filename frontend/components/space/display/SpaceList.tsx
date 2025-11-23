"use client";

import { useState } from "react";
import { useSpaces } from "../hooks/useSpaces";
import { SpaceCard } from "./SpaceCard";
import { SpaceCategoryFilter, SpaceCategory } from "../ui";
import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroHeading } from "@/components/common/RetroHeading";
import { StateContainer } from "@/components/common/StateContainer";

export function SpaceList() {
  const { spaces, loading, error, refetch } = useSpaces();
  const [filter, setFilter] = useState<SpaceCategory>("all");

  // Filter spaces based on selected category
  const filteredSpaces = filter === "all" 
    ? spaces 
    : spaces.filter(space => space.category === filter);

  return (
    <RetroPanel className="h-full flex flex-col">
      {/* Header */}
      <RetroHeading 
        title="Explore Spaces"
        subtitle="Discover creators' 3D worlds"
        className="mb-0"
      />

      {/* Filters */}
      <SpaceCategoryFilter
        selectedCategory={filter}
        onCategoryChange={setFilter}
        spaces={spaces.map(space => ({
          kioskId: space.id,
          name: space.name,
          description: space.description,
          coverImage: space.coverImage,
          subscriptionPrice: space.subscriptionPrice,
          creator: space.creator,
          category: (space.category || 'other') as SpaceCategory,
        }))}
      />

      {/* Space Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-3 md:px-6 pt-2 md:pt-4 pb-3 md:pb-6">
        <StateContainer 
          loading={loading}
          error={error}
          empty={filteredSpaces.length === 0}
          onRetry={refetch}
        >
          <StateContainer.Loading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {[...Array(6)].map((_, i) => (
                <RetroPanel 
                  key={i}
                  variant="inset"
                  className="h-64 animate-pulse"
                >
                  <div />
                </RetroPanel>
              ))}
            </div>
          </StateContainer.Loading>

          <StateContainer.Empty 
            icon="🏛️"
            title="No Spaces Found"
            message={filter === "all" 
              ? "Be the first creator to build a space!" 
              : `No spaces found in ${filter.charAt(0).toUpperCase() + filter.slice(1)} category.`}
          />

          <StateContainer.Content>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {filteredSpaces.map((space) => (
                <SpaceCard 
                  key={space.id} 
                  space={{
                    kioskId: space.id,
                    name: space.name,
                    description: space.description,
                    coverImage: space.coverImage,
                    subscriptionPrice: space.subscriptionPrice,
                    creator: space.creator,
                  }} 
                />
              ))}
            </div>
          </StateContainer.Content>
        </StateContainer>
      </div>
    </RetroPanel>
  );
}
