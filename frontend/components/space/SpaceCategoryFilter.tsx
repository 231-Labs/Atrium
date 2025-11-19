"use client";

import { RetroButton } from "@/components/common/RetroButton";

export type SpaceCategory = "all" | "art" | "gaming" | "music" | "tech" | "crypto" | "social" | "portfolio" | "other";

interface SpaceData {
  category: SpaceCategory;
}

interface SpaceCategoryFilterProps {
  selectedCategory: SpaceCategory;
  onCategoryChange: (category: SpaceCategory) => void;
  spaces: SpaceData[];
}

export function SpaceCategoryFilter({ selectedCategory, onCategoryChange, spaces }: SpaceCategoryFilterProps) {
  // Category labels for UI
  const categoryLabels: Record<SpaceCategory, string> = {
    all: "All",
    art: "Art",
    gaming: "Gaming",
    music: "Music",
    tech: "Tech",
    crypto: "Crypto",
    social: "Social",
    portfolio: "Portfolio",
    other: "Other",
  };

  // Calculate category counts
  const categoryCounts = spaces.reduce((counts, space) => {
    counts[space.category] = (counts[space.category] || 0) + 1;
    return counts;
  }, {} as Record<SpaceCategory, number>);

  // All categories except "all"
  const allFilterCategories: SpaceCategory[] = ["art", "gaming", "music", "tech", "crypto", "social", "portfolio", "other"];
  
  // Only show categories that have items
  const availableCategories = allFilterCategories.filter(category => 
    (categoryCounts[category] || 0) > 0
  );

  return (
    <div className="flex gap-2 px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4 overflow-x-auto">
      <RetroButton
        variant={selectedCategory === "all" ? "primary" : "secondary"}
        size="sm"
        onClick={() => onCategoryChange("all")}
      >
        {categoryLabels.all}
      </RetroButton>
      {availableCategories.map((category) => (
        <RetroButton
          key={category}
          variant={selectedCategory === category ? "primary" : "secondary"}
          size="sm"
          onClick={() => onCategoryChange(category)}
        >
          {categoryLabels[category]}
        </RetroButton>
      ))}
    </div>
  );
}
