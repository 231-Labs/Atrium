/**
 * Seal content service
 * Using Atrium's subscription::seal_approve for access control
 * - Only Space creator or subscriber can decrypt content
 */

import { SealClient, SessionKey } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex } from '@mysten/sui/utils';
import { getSealKeyServers } from '../config/seal';
import { getWalrusAggregatorUrl } from '../config/walrus';
import { PACKAGE_ID } from '../config/sui';

let sealClientInstance: SealClient | null = null;

// Global decryption lock to prevent duplicate decryption of the same content
const decryptionLocks = new Map<string, Promise<Uint8Array>>();

function getSealClient(): SealClient {
  if (!sealClientInstance) {
    const keyServers = getSealKeyServers('testnet');
    const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

    sealClientInstance = new SealClient({
      suiClient,
      serverConfigs: keyServers.map(s => ({ objectId: s.objectId, weight: 1 })),
      verifyKeyServers: false,
    });
  }
  return sealClientInstance;
}

/**
 * Encrypt content
 */
export async function encryptContent(
  file: File | Blob,
  spaceId: string,
): Promise<{ encryptedBlob: Blob; resourceId: string }> {
  const fileData = new Uint8Array(await file.arrayBuffer());
  const resourceId = spaceId.replace('0x', '');

  const sealClient = getSealClient();
  const { encryptedObject } = await sealClient.encrypt({
    threshold: 2,
    packageId: PACKAGE_ID,
    id: resourceId,
    data: fileData,
  });

  return {
    encryptedBlob: new Blob([encryptedObject], { type: 'application/octet-stream' }),
    resourceId,
  };
}

/**
 * Decrypt content as creator using SpaceOwnership NFT
 */
export async function decryptContentAsCreator(
  encryptedData: Uint8Array,
  spaceId: string,
  ownershipId: string,
  userAddress: string,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>,
): Promise<Uint8Array> {
  const lockKey = `${spaceId}-${userAddress}-creator`;
  
  if (decryptionLocks.has(lockKey)) {
    console.log('🔒 Reusing existing decryption request for creator', lockKey);
    return decryptionLocks.get(lockKey)!;
  }

  console.log('🆕 Starting new decryption request for creator', lockKey);
  
  const decryptPromise = (async () => {
    try {
      const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

      // 1. Create SessionKey
      const sessionKey = await SessionKey.create({
        address: userAddress,
        packageId: PACKAGE_ID,
        ttlMin: 30,
        suiClient,
      });

      // 2. Sign
      const message = sessionKey.getPersonalMessage();
      console.log('🔑 Requesting signature (as creator)...');
      const { signature } = await signPersonalMessage(message);
      console.log('✅ Signature obtained');
      sessionKey.setPersonalMessageSignature(signature);

      // 3. Build seal_approve_as_creator transaction
      const resourceIdBytes = fromHex(spaceId.replace('0x', ''));
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::subscription::seal_approve_as_creator`,
        arguments: [
          tx.pure.vector('u8', Array.from(resourceIdBytes)),
          tx.object(spaceId),
          tx.object(ownershipId),  // SpaceOwnership NFT
        ],
      });

      const txBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: true,
      });

      // 4. Decrypt
      const sealClient = getSealClient();
      const decryptedData = await sealClient.decrypt({
        data: encryptedData,
        sessionKey,
        txBytes,
      });

      return decryptedData;
    } finally {
      decryptionLocks.delete(lockKey);
      console.log('🔓 Decryption request completed (creator), lock released');
    }
  })();

  decryptionLocks.set(lockKey, decryptPromise);
  return decryptPromise;
}

/**
 * Decrypt content as subscriber using Subscription NFT
 */
export async function decryptContentAsSubscriber(
  encryptedData: Uint8Array,
  spaceId: string,
  subscriptionId: string,
  userAddress: string,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>,
): Promise<Uint8Array> {
  const lockKey = `${spaceId}-${userAddress}-subscriber`;
  
  if (decryptionLocks.has(lockKey)) {
    console.log('🔒 Reusing existing decryption request for subscriber', lockKey);
    return decryptionLocks.get(lockKey)!;
  }

  console.log('🆕 Starting new decryption request for subscriber', lockKey);
  
  const decryptPromise = (async () => {
    try {
      const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

      // 1. Create SessionKey
      const sessionKey = await SessionKey.create({
        address: userAddress,
        packageId: PACKAGE_ID,
        ttlMin: 30,
        suiClient,
      });

      // 2. Sign
      const message = sessionKey.getPersonalMessage();
      console.log('🔑 Requesting signature (as subscriber)...');
      const { signature } = await signPersonalMessage(message);
      console.log('✅ Signature obtained');
      sessionKey.setPersonalMessageSignature(signature);

      // 3. Build seal_approve_as_subscriber transaction
      const resourceIdBytes = fromHex(spaceId.replace('0x', ''));
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::subscription::seal_approve_as_subscriber`,
        arguments: [
          tx.pure.vector('u8', Array.from(resourceIdBytes)),
          tx.object(spaceId),
          tx.object(subscriptionId),  // Subscription NFT
          tx.object('0x6'),            // Clock
        ],
      });

      const txBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: true,
      });

      // 4. Decrypt
      const sealClient = getSealClient();
      const decryptedData = await sealClient.decrypt({
        data: encryptedData,
        sessionKey,
        txBytes,
      });

      return decryptedData;
    } finally {
      decryptionLocks.delete(lockKey);
      console.log('🔓 Decryption request completed (subscriber), lock released');
    }
  })();

  decryptionLocks.set(lockKey, decryptPromise);
  return decryptPromise;
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use decryptContentAsCreator or decryptContentAsSubscriber instead
 */
export async function decryptContent(
  encryptedData: Uint8Array,
  spaceId: string,
  subscriptionId: string,
  userAddress: string,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>,
): Promise<Uint8Array> {
  // Create unique lock key based on spaceId + userAddress
  const lockKey = `${spaceId}-${userAddress}`;
  
  // If there is a duplicate decryption request in progress, return the Promise directly
  if (decryptionLocks.has(lockKey)) {
    console.log('🔒 Reusing existing decryption request for', lockKey);
    return decryptionLocks.get(lockKey)!;
  }

  console.log('🆕 Starting new decryption request for', lockKey);
  
  // Create decryption Promise and store it
  const decryptPromise = (async () => {
    try {
      const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

      // 1. Create SessionKey
      const sessionKey = await SessionKey.create({
        address: userAddress,
        packageId: PACKAGE_ID,
        ttlMin: 30,
        suiClient,
      });

      // 2. Sign (only once!)
      const message = sessionKey.getPersonalMessage();
      console.log('🔑 Requesting signature...');
      const { signature } = await signPersonalMessage(message);
      console.log('✅ Signature obtained');
      sessionKey.setPersonalMessageSignature(signature);

      // 3. Build seal_approve_as_subscriber transaction
      const resourceIdBytes = fromHex(spaceId.replace('0x', ''));
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::subscription::seal_approve_as_subscriber`,
        arguments: [
          tx.pure.vector('u8', Array.from(resourceIdBytes)),
          tx.object(spaceId),
          tx.object(subscriptionId),           // Subscription NFT
          tx.object('0x6'),                    // Clock object
        ],
      });

      const txBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: true,
      });

      // 4. Decrypt
      const sealClient = getSealClient();
      const decryptedData = await sealClient.decrypt({
        data: encryptedData,
        sessionKey,
        txBytes,
      });

      return decryptedData;
    } finally {
      // Clear lock whether successful or not
      decryptionLocks.delete(lockKey);
      console.log('🔓 Decryption request completed, lock released for', lockKey);
    }
  })();

  // Store Promise
  decryptionLocks.set(lockKey, decryptPromise);

  return decryptPromise;
}

/**
 * Download and decrypt content from Walrus - Creator version
 */
export async function downloadAndDecryptContentAsCreator(
  blobId: string,
  spaceId: string,
  ownershipId: string,
  userAddress: string,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>,
  contentType: string,
): Promise<string> {
  // 1. Download encrypted content from Walrus
  const aggregatorUrl = getWalrusAggregatorUrl();
  const response = await fetch(`${aggregatorUrl}/v1/blobs/${blobId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to download: HTTP ${response.status}`);
  }

  const encryptedData = new Uint8Array(await response.arrayBuffer());

  // 2. Decrypt as creator
  const decryptedData = await decryptContentAsCreator(
    encryptedData,
    spaceId,
    ownershipId,
    userAddress,
    signPersonalMessage,
  );

  // 3. Return result
  const blob = new Blob([new Uint8Array(decryptedData)], { type: contentType });
  
  if (contentType === 'text/markdown' || contentType === 'text/plain') {
    return await blob.text();
  }

  return URL.createObjectURL(blob);
}

/**
 * Download and decrypt content from Walrus - Subscriber version
 */
export async function downloadAndDecryptContentAsSubscriber(
  blobId: string,
  spaceId: string,
  subscriptionId: string,
  userAddress: string,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>,
  contentType: string,
): Promise<string> {
  // 1. Download encrypted content from Walrus
  const aggregatorUrl = getWalrusAggregatorUrl();
  const response = await fetch(`${aggregatorUrl}/v1/blobs/${blobId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to download: HTTP ${response.status}`);
  }

  const encryptedData = new Uint8Array(await response.arrayBuffer());

  // 2. Decrypt as subscriber
  const decryptedData = await decryptContentAsSubscriber(
    encryptedData,
    spaceId,
    subscriptionId,
    userAddress,
    signPersonalMessage,
  );

  // 3. Return result
  const blob = new Blob([new Uint8Array(decryptedData)], { type: contentType });
  
  if (contentType === 'text/markdown' || contentType === 'text/plain') {
    return await blob.text();
  }

  return URL.createObjectURL(blob);
}

/**
 * Legacy function - Download and decrypt content from Walrus
 * @deprecated Use downloadAndDecryptContentAsCreator or downloadAndDecryptContentAsSubscriber
 */
export async function downloadAndDecryptContent(
  blobId: string,
  spaceId: string,
  subscriptionId: string,
  userAddress: string,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>,
  contentType: string,
): Promise<string> {
  // Default to subscriber version for backward compatibility
  return downloadAndDecryptContentAsSubscriber(
    blobId,
    spaceId,
    subscriptionId,
    userAddress,
    signPersonalMessage,
    contentType,
  );
}
