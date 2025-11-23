import { useState } from 'react';
import { encryptContent } from '@/services/sealContent';
import { uploadToWalrus } from '@/services/walrusApi';

export interface UploadOptions {
  spaceId: string;
  requiresEncryption: boolean;
}

export interface UploadResult {
  blobId: string;
  resourceId?: string;
  objectId?: string;
  storage?: any;
}

export interface UseContentUploadReturn {
  upload: (file: File | Blob, options: UploadOptions) => Promise<UploadResult>;
  uploading: boolean;
  progress: string;
  error: string | null;
}

export function useContentUpload(): UseContentUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const upload = async (
    file: File | Blob,
    options: UploadOptions
  ): Promise<UploadResult> => {
    try {
      setUploading(true);
      setError(null);

      let fileToUpload: Blob = file;
      let resourceId: string | undefined;

      if (options.requiresEncryption) {
        setProgress('Encrypting content with Seal...');
        const encrypted = await encryptContent(file, options.spaceId);
        fileToUpload = encrypted.encryptedBlob;
        resourceId = encrypted.resourceId;
        setProgress('Encryption complete');
      }

      setProgress('Uploading to Walrus...');
      const walrusResponse = await uploadToWalrus(fileToUpload);
      setProgress('Upload complete');

      return {
        blobId: walrusResponse.blobId,
        resourceId,
        objectId: walrusResponse.objectId,
        storage: walrusResponse.storage,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(''), 2000);
    }
  };

  return { upload, uploading, progress, error };
}

