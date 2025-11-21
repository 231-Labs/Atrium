"use client";

import { useState, useRef, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { downloadAndDecryptVideo } from "@/services/sealVideo";

interface VideoPlayerProps {
  blobId: string;
  resourceId: string;
  isSubscribed: boolean;
  subscriptionProof?: any;
}

export function VideoPlayer({ blobId, resourceId, isSubscribed, subscriptionProof }: VideoPlayerProps) {
  const currentAccount = useCurrentAccount();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Cleanup video URL on unmount
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handlePlay = async () => {
    if (!isSubscribed) {
      setError("請先訂閱才能觀看影片");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // TODO: Get user address and sign function from wallet
      // Placeholder implementation
      const userAddress = currentAccount?.address || "";
      const signFn = async (msg: Uint8Array) => ({ signature: "" });
      
      // Download and decrypt video
      const decryptedUrl = await downloadAndDecryptVideo(
        blobId,
        resourceId,
        userAddress,
        signFn
      );

      setVideoUrl(decryptedUrl);

      // Auto play
      setTimeout(() => {
        videoRef.current?.play();
      }, 100);
    } catch (err: any) {
      console.error("Failed to load video:", err);
      setError(err.message || "載入影片失敗");
    } finally {
      setLoading(false);
    }
  };

  if (!videoUrl) {
    return (
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {loading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-400 border-t-white mb-4"></div>
              <p className="text-white">解密影片中...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-400">
              <p className="mb-4">{error}</p>
              <button
                onClick={handlePlay}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-200 transition-all"
              >
                重試
              </button>
            </div>
          ) : (
            <button
              onClick={handlePlay}
              disabled={!isSubscribed}
              className="px-8 py-4 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubscribed ? "▶️ 播放影片" : "🔒 需要訂閱"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full h-full"
      />
    </div>
  );
}

