"use client";

import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { encryptVideo } from "@/services/sealVideo";
import { uploadToWalrus } from "@/services/walrusApi";
import { addVideo, SUI_CHAIN } from "@/utils/transactions";

interface VideoUploadProps {
  spaceKioskId: string;
  kioskCapId: string;
  onUploaded: (blobId: string) => void;
}

export function VideoUpload({ spaceKioskId, kioskCapId, onUploaded }: VideoUploadProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);

      // Step 1: Encrypt video with Seal
      setProgress("使用 Seal 加密影片...");
      
      // TODO: Get user address and sign function from wallet
      const userAddress = useCurrentAccount()?.address || "";
      const signFn = async (msg: Uint8Array) => ({ signature: "" });
      
      const encrypted = await encryptVideo(
        file,
        {
          spaceKioskId,
          title,
        },
        userAddress,
        signFn
      );

      // Step 2: Upload to Walrus
      setProgress("上傳到 Walrus...");
      const blobId = await uploadToWalrus(encrypted.encryptedBlob);

      // Step 3: Add video to space contract
      setProgress("更新空間配置...");
      const tx = addVideo(
        spaceKioskId,
        kioskCapId,
        blobId
      );

      signAndExecute(
        { 
          transaction: tx,
          chain: SUI_CHAIN,
        },
        {
          onSuccess: () => {
            setProgress("上傳成功！");
            onUploaded(blobId);
            setFile(null);
            setTitle("");
            setTimeout(() => setProgress(""), 3000);
          },
          onError: (error) => {
            console.error("Failed to add video:", error);
            setProgress("");
            alert(`上傳失敗: ${error.message}`);
          },
        }
      );
    } catch (error: any) {
      console.error("Error uploading video:", error);
      setProgress("");
      alert(`錯誤: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          影片標題
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="輸入影片標題"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-purple focus:ring-2 focus:ring-primary-purple/20 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          影片檔案
        </label>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-purple"
        />
        {file && (
          <p className="text-xs text-text-secondary mt-2">
            檔案大小: {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </div>

      {progress && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          {progress}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full py-3 px-6 rounded-lg font-medium transition-all
          bg-gradient-header text-white shadow-lg
          hover:shadow-xl hover:scale-105
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {uploading ? "上傳中..." : "加密並上傳"}
      </button>

      <p className="text-xs text-text-secondary text-center">
        影片將使用 Seal 加密，只有訂閱者可以觀看
      </p>
    </div>
  );
}

