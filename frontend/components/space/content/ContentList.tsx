"use client";

import { ContentItem, ContentItemData } from "./ContentItem";

interface ContentListProps {
  items: ContentItemData[];
  type: "merch" | "video" | "essay";
  isSubscribed: boolean;
  isCreator: boolean;
  onUnlock?: (itemId: string) => void;
  onView?: (itemId: string) => void;
}

export function ContentList({ items, type, isSubscribed, isCreator, onUnlock, onView }: ContentListProps) {
  const filteredItems = items.filter(item => item.type === type);

  const getEmptyStateInfo = () => {
    switch (type) {
      case "merch":
        return {
          icon: "🛍️",
          title: "No Merchandise Available",
          message: "This creator hasn't added any merchandise yet."
        };
      case "video":
        return {
          icon: "🎥",
          title: "No Videos Available", 
          message: "This creator hasn't uploaded any videos yet."
        };
      case "essay":
        return {
          icon: "📝",
          title: "No Essays Available",
          message: "This creator hasn't published any essays yet."
        };
      default:
        return {
          icon: "📄",
          title: "No Content Available",
          message: "No content found for this section."
        };
    }
  };

  if (filteredItems.length === 0) {
    const emptyState = getEmptyStateInfo();
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">{emptyState.icon}</div>
        <h3 className="text-sm font-medium text-gray-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          {emptyState.title}
        </h3>
        <p className="text-xs text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
          {emptyState.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredItems.map((item) => (
        <ContentItem
          key={item.id}
          item={item}
          isSubscribed={isSubscribed}
          isCreator={isCreator}
          onUnlock={onUnlock}
          onView={onView}
        />
      ))}
    </div>
  );
}
