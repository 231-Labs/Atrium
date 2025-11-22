/**
 * Hook for loading secure (encrypted) content with Seal
 * Provides unified state management and concurrency control
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  downloadAndDecryptContent,
  downloadAndDecryptContentAsCreator,
  downloadAndDecryptContentAsSubscriber,
} from '@/services/sealContent';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { getWalrusAggregatorUrl } from '@/config/walrus';

interface UseSecureContentOptions {
  blobId: string;
  resourceId: string;
  contentType: string;
  isLocked: boolean;
  isCreator?: boolean;
  authId?: string;
}

interface UseSecureContentReturn {
  content: string | null;
  loading: boolean;
  error: string | null;
}

export function useSecureContent({
  blobId,
  resourceId,
  contentType,
  isLocked,
  isCreator = false,
  authId,
}: UseSecureContentOptions): UseSecureContentReturn {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const handleSign = useCallback(
    (msg: Uint8Array) => signPersonalMessage({ message: msg }),
    [signPersonalMessage]
  );

  useEffect(() => {
    // Prevent concurrent execution
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    
    const loadContent = async () => {
      if (!blobId) {
        setError('No blob ID provided');
        return;
      }

      // Public content: download directly from Walrus
      if (!isLocked) {
        try {
          setLoading(true);
          console.log('📥 Downloading public content from Walrus:', blobId);
          const aggregatorUrl = getWalrusAggregatorUrl();
          const res = await fetch(`${aggregatorUrl}/v1/blobs/${blobId}`);
          
          if (!res.ok) {
            console.error('❌ Walrus download failed:', res.status, res.statusText);
            throw new Error(`HTTP ${res.status}`);
          }
          
          // Handle different content types
          if (contentType === 'text/markdown' || contentType === 'text/plain') {
            const data = await res.text();
            setContent(data);
            console.log('✅ Loaded text content');
          } else {
            // For binary content (video, image, etc.), create a blob URL
            const arrayBuffer = await res.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: contentType });
            const blobUrl = URL.createObjectURL(blob);
            setContent(blobUrl);
            console.log('✅ Created blob URL for video:', blobUrl);
          }
        } catch (e: any) {
          console.error('❌ Failed to load public content:', e);
          setError(`Failed to load: ${e.message}`);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Encrypted content: requires decryption
      if (!currentAccount) {
        setError("Please connect wallet to view this content");
        return;
      }

      if (!resourceId || resourceId === '' || resourceId === '0x') {
        setError('Invalid resource ID');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let data: string;

        // Choose decryption method based on user role
        if (isCreator) {
          // Creator mode: use SpaceOwnership NFT
          if (!authId) {
            setError('Ownership ID is required for creator access');
            return;
          }
          
          console.log('🎨 Decrypting as creator with ownershipId:', authId);
          data = await downloadAndDecryptContentAsCreator(
          blobId,
          resourceId,
            authId,
          currentAccount.address,
          handleSign,
          contentType
        );
        } else {
          // Subscriber mode: use Subscription NFT
          if (!authId) {
            setError('Subscription ID is required for subscriber access');
            return;
          }
          
          console.log('👥 Decrypting as subscriber with subscriptionId:', authId);
          data = await downloadAndDecryptContentAsSubscriber(
            blobId,
            resourceId,
            authId,
            currentAccount.address,
            handleSign,
            contentType
          );
        }

        setContent(data);
      } catch (e: any) {
        console.error('❌ Decryption failed:', e);
        setError(e.message || "Failed to decrypt content");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [blobId, resourceId, isLocked, currentAccount?.address, contentType, handleSign, isCreator, authId]);

  return { content, loading, error };
}

