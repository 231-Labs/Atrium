/**
 * Seal Video Service
 * Wrapper for video-specific content encryption/decryption
 */

import { encryptContent, downloadAndDecryptContent, ContentEncryptionOptions } from './sealContent';

export async function encryptVideo(
  file: File | Blob,
  options: ContentEncryptionOptions,
  userAddress: string,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>,
  network: 'testnet' | 'mainnet' = 'testnet'
) {
  return encryptContent(
    file,
    { ...options, contentType: 'video/mp4' },
    userAddress,
    signPersonalMessage,
    network
  );
}

export async function downloadAndDecryptVideo(
  blobId: string,
  resourceId: string,
  userAddress: string,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<string> {
  return downloadAndDecryptContent(
    blobId,
    resourceId,
    userAddress,
    signPersonalMessage,
    'video/mp4',
    network
  );
}

