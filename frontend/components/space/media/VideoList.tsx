"use client";

import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";

interface VideoListProps {
  videos: string[];
  isSubscribed: boolean;
}

export function VideoList({ videos, isSubscribed }: VideoListProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-2">🎬</div>
        <p className="text-sm text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
          No videos available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hidden">
      {videos.map((blobId, index) => (
        <RetroPanel
          key={blobId}
          variant="outset"
          className="p-3 cursor-pointer hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <RetroPanel variant="inset" className="w-10 h-10 flex items-center justify-center">
                  <span className="text-lg">🎥</span>
                </RetroPanel>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate" style={{ fontFamily: 'Georgia, serif' }}>
                  Video {index + 1}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {blobId.slice(0, 8)}...{blobId.slice(-6)}
                </p>
              </div>
            </div>
            {isSubscribed ? (
              <RetroButton variant="primary" size="sm">
                Play
              </RetroButton>
            ) : (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                🔒 <span style={{ fontFamily: 'Georgia, serif' }}>Subscribe</span>
              </span>
            )}
          </div>
        </RetroPanel>
      ))}
    </div>
  );
}

