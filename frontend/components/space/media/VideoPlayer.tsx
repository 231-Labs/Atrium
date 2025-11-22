"use client";

import { useState, useRef, useEffect } from "react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { downloadAndDecryptContentAsSubscriber } from "@/services/sealContent";

interface VideoPlayerProps {
  blobId: string;
  resourceId: string;
  isSubscribed: boolean;
  subscriptionId?: string;
  subscriptionProof?: any;
}

export function VideoPlayer({ blobId, resourceId, isSubscribed, subscriptionId, subscriptionProof }: VideoPlayerProps) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
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
      setError("Please subscribe to watch the video");
      return;
    }

    if (!subscriptionId) {
      setError("Missing subscription ID, cannot decrypt video");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const userAddress = currentAccount?.address || "";
      if (!userAddress) {
        setError("Please connect your wallet");
        return;
      }

      const signFn = async (msg: Uint8Array) => {
        const result = await signPersonalMessage({ message: msg });
        return { signature: result.signature };
      };
      
      // Download and decrypt video
      // Parameters: blobId, spaceId, subscriptionId, userAddress, signPersonalMessage, contentType
      const decryptedUrl = await downloadAndDecryptContentAsSubscriber(
        blobId,
        resourceId, // spaceId
        subscriptionId,
        userAddress,
        signFn,
        'video/mp4'
      );

      setVideoUrl(decryptedUrl);

      // Auto play
      setTimeout(() => {
        videoRef.current?.play();
      }, 100);
    } catch (err: any) {
      console.error("Failed to load video:", err);
        setError(err.message || "Failed to load video");
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
              <p className="text-white">Decrypting video...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-400">
              <p className="mb-4">{error}</p>
              <button
                onClick={handlePlay}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-200 transition-all"
              >
                Retry
              </button>
            </div>
          ) : (
            <button
              onClick={handlePlay}
              disabled={!isSubscribed}
              className="px-8 py-4 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubscribed ? "▶️ Play Video" : "🔒 Subscribe"}
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

