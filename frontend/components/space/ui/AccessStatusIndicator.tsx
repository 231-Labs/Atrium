"use client";

import { RetroPanel } from "@/components/common/RetroPanel";
import { RetroButton } from "@/components/common/RetroButton";

export type AccessStatus = "guest" | "user_unsubscribed" | "subscribed" | "creator";

interface AccessStatusIndicatorProps {
  status: AccessStatus;
  onJoinClick?: () => void;
  onSubscribeClick?: () => void;
}

export function AccessStatusIndicator({ status, onJoinClick, onSubscribeClick }: AccessStatusIndicatorProps) {
  switch (status) {
    case "guest":
      return (
        <RetroPanel className="p-4 border-blue-300 bg-blue-50">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">👀</span>
              <span className="text-sm font-medium text-blue-700" style={{ fontFamily: 'Georgia, serif' }}>
                Guest Preview Mode
              </span>
            </div>
            <p className="text-xs text-blue-600" style={{ fontFamily: 'Georgia, serif' }}>
              Join Atrium to subscribe and access premium content
            </p>
            {onJoinClick && (
              <RetroButton
                onClick={onJoinClick}
                variant="primary"
                size="sm"
                className="w-full"
              >
                Join Atrium Now
              </RetroButton>
            )}
          </div>
        </RetroPanel>
      );

    case "user_unsubscribed":
      return (
        <RetroPanel className="p-4 border-yellow-300 bg-yellow-50">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">🔒</span>
              <span className="text-sm font-medium text-yellow-700" style={{ fontFamily: 'Georgia, serif' }}>
                Subscribe Required
              </span>
            </div>
            <p className="text-xs text-yellow-600" style={{ fontFamily: 'Georgia, serif' }}>
              Subscribe to unlock premium videos and exclusive content
            </p>
            {onSubscribeClick && (
              <RetroButton
                onClick={onSubscribeClick}
                variant="primary"
                size="sm"
                className="w-full"
              >
                Subscribe Now
              </RetroButton>
            )}
          </div>
        </RetroPanel>
      );

    case "subscribed":
      return (
        <RetroPanel className="p-4 border-green-300 bg-green-50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">✅</span>
              <span className="text-sm font-medium text-green-700" style={{ fontFamily: 'Georgia, serif' }}>
                Active Subscriber
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
              You have full access to all content
            </p>
          </div>
        </RetroPanel>
      );

    case "creator":
      return (
        <RetroPanel className="p-4 border-purple-300 bg-purple-50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">👑</span>
              <span className="text-sm font-medium text-purple-700" style={{ fontFamily: 'Georgia, serif' }}>
                Space Creator
              </span>
            </div>
            <p className="text-xs text-purple-600 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
              You own this space and have full control
            </p>
          </div>
        </RetroPanel>
      );

    default:
      return null;
  }
}

// Helper function to determine access status
export function getAccessStatus(currentAccount: any, isSubscribed: boolean, isCreator: boolean): AccessStatus {
  if (isCreator) return "creator";
  if (!currentAccount) return "guest";
  if (isSubscribed) return "subscribed";
  return "user_unsubscribed";
}
