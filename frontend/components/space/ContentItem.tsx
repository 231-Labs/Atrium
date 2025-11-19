"use client";

import { RetroPanel } from "@/components/common/RetroPanel";

export interface ContentItemData {
  id: string;
  title: string;
  description?: string;
  price?: number; // 0 for free, > 0 for paid
  type: "merch" | "video" | "essay";
  thumbnail?: string;
  isLocked?: boolean;
}

interface ContentItemProps {
  item: ContentItemData;
  isSubscribed: boolean;
  isCreator: boolean;
  onUnlock?: (itemId: string) => void;
  onView?: (itemId: string) => void;
}

export function ContentItem({ item, isSubscribed, isCreator, onUnlock, onView }: ContentItemProps) {
  const canAccess = isCreator || isSubscribed || !item.isLocked;
  
  const getIcon = () => {
    switch (item.type) {
      case "merch": return "🛍️";
      case "video": return "🎥";
      case "essay": return "📝";
      default: return "📄";
    }
  };

  const getPriceDisplay = () => {
    if (item.price === 0 || !item.price) return "Free";
    return `${item.price} SUI`;
  };

  return (
    <div className="relative">
      <RetroPanel 
        variant="outset" 
        className={`p-3 transition-all ${canAccess ? 'cursor-pointer hover:shadow-sm' : ''}`}
        onClick={() => canAccess && onView?.(item.id)}
      >
        <div className="flex items-start gap-3">
          {/* Thumbnail/Icon */}
          <div className="flex-shrink-0">
            <RetroPanel 
              variant="inset" 
              className={`w-12 h-12 flex items-center justify-center ${!canAccess ? 'bg-gray-100' : ''}`}
            >
              {item.thumbnail ? (
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className={`w-full h-full object-cover ${!canAccess ? 'opacity-40 grayscale' : ''}`}
                />
              ) : (
                <span className={`text-xl ${!canAccess ? 'opacity-40' : ''}`}>
                  {!canAccess ? '🔒' : getIcon()}
                </span>
              )}
            </RetroPanel>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 
                  className={`text-sm font-medium truncate ${!canAccess ? 'text-gray-500' : 'text-gray-800'}`}
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {item.title}
                </h4>
                {item.description && (
                  <p 
                    className={`text-xs mt-1 line-clamp-2 ${!canAccess ? 'text-gray-400' : 'text-gray-600'}`}
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {item.description}
                  </p>
                )}
              </div>
              
              {/* Price/Status */}
              <div className="flex-shrink-0">
                {!canAccess && item.isLocked ? (
                  <RetroPanel variant="inset" className="px-2 py-1 bg-yellow-50">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">🔒</span>
                      <span className="text-xs font-medium text-yellow-700 uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: 'Georgia, serif' }}>
                        Premium
                      </span>
                    </div>
                  </RetroPanel>
                ) : (
                  <div className="text-xs text-gray-500 uppercase tracking-wide px-2" style={{ fontFamily: 'Georgia, serif' }}>
                    {getPriceDisplay()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </RetroPanel>
    </div>
  );
}
