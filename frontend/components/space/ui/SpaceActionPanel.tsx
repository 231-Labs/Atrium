"use client";

import { RetroButton } from "@/components/common/RetroButton";
import { AccessStatus } from "./AccessStatusIndicator";

interface SpaceActionPanelProps {
  status: AccessStatus;
  spaceId: string;
  onEditSpace?: () => void;
  onUploadVideo?: () => void;
  onManageSettings?: () => void;
  onViewVideos?: () => void;
}

export function SpaceActionPanel({ 
  status, 
  spaceId, 
  onEditSpace, 
  onUploadVideo, 
  onManageSettings, 
  onViewVideos 
}: SpaceActionPanelProps) {
  
  if (status === "creator") {
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          Creator Actions
        </h4>
        <RetroButton
          onClick={onEditSpace}
          variant="primary"
          className="w-full"
        >
          🎨 Edit 3D Space
        </RetroButton>
        <RetroButton
          onClick={onUploadVideo}
          variant="secondary"
          className="w-full"
        >
          🎬 Upload Video
        </RetroButton>
        <RetroButton
          onClick={onManageSettings}
          variant="secondary"
          className="w-full"
        >
          ⚙️ Space Settings
        </RetroButton>
        <RetroButton
          onClick={onViewVideos}
          variant="secondary"
          className="w-full"
        >
          📺 View All Videos
        </RetroButton>
      </div>
    );
  }

  if (status === "subscribed") {
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          Subscriber Actions
        </h4>
        <RetroButton
          onClick={onViewVideos}
          variant="primary"
          className="w-full"
        >
          🎥 Watch Videos
        </RetroButton>
        <RetroButton
          variant="secondary"
          className="w-full"
        >
          💌 Message Creator
        </RetroButton>
        <RetroButton
          variant="secondary"
          className="w-full"
        >
          📤 Share Space
        </RetroButton>
      </div>
    );
  }

  // Guest or unsubscribed user actions
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3" style={{ fontFamily: 'Georgia, serif' }}>
        Quick Actions
      </h4>
      <RetroButton
        onClick={() => navigator.share?.({ 
          title: 'Check out this 3D Space on Atrium',
          url: window.location.href 
        }) || navigator.clipboard.writeText(window.location.href)}
        variant="secondary"
        className="w-full"
      >
        📤 Share Space
      </RetroButton>
      <RetroButton
        variant="secondary"
        className="w-full"
      >
        🔗 Copy Link
      </RetroButton>
      <RetroButton
        variant="secondary"
        className="w-full"
      >
        ❤️ Add to Favorites
      </RetroButton>
    </div>
  );
}
