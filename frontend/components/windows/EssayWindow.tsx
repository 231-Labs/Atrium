import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RetroPanel } from '@/components/common/RetroPanel';
import { downloadAndDecryptContent } from '@/services/sealContent';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';

interface EssayWindowProps {
  blobId: string;
  spaceId: string; // Space ID for access control
  title: string;
  isLocked: boolean;
}

export const EssayWindow: React.FC<EssayWindowProps> = ({ blobId, spaceId, title, isLocked }) => {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  // 使用 useCallback 穩定簽名函數引用
  const handleSign = useCallback(
    (msg: Uint8Array) => signPersonalMessage({ message: msg }),
    [signPersonalMessage]
  );

  useEffect(() => {
    // 防止並發執行（在任何 async 操作前檢查並設置）
    if (isLoadingRef.current) {
      console.log('🚫 Already loading, skipping duplicate request');
      return;
    }
    
    // 立即標記為執行中，防止並發
    isLoadingRef.current = true;
    console.log('✅ Starting load, isLoadingRef set to true');
    
    const loadContent = async () => {
      if (!blobId) {
        setError('No blob ID provided');
        return;
      }

      // 公開內容：直接從 Walrus 下載
      if (!isLocked) {
        try {
          setLoading(true);
          const aggregatorUrl = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || "https://aggregator.walrus-testnet.walrus.space";
          const res = await fetch(`${aggregatorUrl}/v1/blobs/${blobId}`);
          
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
          const text = await res.text();
          setContent(text);
        } catch (e: any) {
          setError(`Failed to load: ${e.message}`);
        } finally {
          setLoading(false);
        }
        return;
      }

      // 加密內容：需要解密
      if (!currentAccount) {
        setError("Please connect wallet to view this content");
        return;
      }

      if (!spaceId || spaceId === '' || spaceId === '0x') {
        setError('Invalid spaceId');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const text = await downloadAndDecryptContent(
          blobId,
          spaceId,
          currentAccount.address,
          handleSign,
          'text/markdown'
        );

        setContent(text);
      } catch (e: any) {
        setError(e.message || "Failed to decrypt essay");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [blobId, spaceId, isLocked, currentAccount?.address, handleSign]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin text-3xl text-gray-400 mb-2">⟳</div>
          <div className="text-gray-600">
            {isLocked ? 'Decrypting Essay...' : 'Loading Essay...'}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white p-8">
        <div className="text-center text-red-500">
          <div className="text-3xl mb-2">⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white overflow-y-auto scrollbar-hidden p-8 font-serif">
      <article className="prose prose-slate max-w-none">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">{title}</h1>
        <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-gray-800">
          {content}
        </div>
      </article>
    </div>
  );
};

