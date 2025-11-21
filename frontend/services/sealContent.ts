/**
 * Seal 加解密服務 - 簡化版，對照 test-seal-simple.js
 */

import { SealClient, SessionKey } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex } from '@mysten/sui/utils';
import { SEAL_CONFIG, getSealKeyServers } from '../config/seal';

// 測試用 package ID (來自 test-seal-simple.js)
const TEST_PACKAGE_ID = '0x0a3cafc5e183fd49d4b4bc0a737ebd3a3f8b20701c3e0ff32ea01a3c40b14ab0';

let sealClientInstance: SealClient | null = null;

// 全局解密鎖，防止重複解密相同內容
const decryptionLocks = new Map<string, Promise<Uint8Array>>();

function getSealClient(): SealClient {
  if (!sealClientInstance) {
    const keyServers = getSealKeyServers('testnet');
    const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

    sealClientInstance = new SealClient({
      suiClient,
      serverConfigs: keyServers.map(s => ({ objectId: s.objectId, weight: 1 })),
      verifyKeyServers: false, // 測試模式
    });
  }
  return sealClientInstance;
}

/**
 * 加密內容（對照 test-seal-simple.js）
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
    packageId: TEST_PACKAGE_ID,
    id: resourceId,
    data: fileData,
  });

  return {
    encryptedBlob: new Blob([encryptedObject], { type: 'application/octet-stream' }),
    resourceId,
  };
}

/**
 * 解密內容（對照 test-seal-simple.js）
 */
export async function decryptContent(
  encryptedData: Uint8Array,
  spaceId: string,
  userAddress: string,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>,
): Promise<Uint8Array> {
  // 創建唯一鎖 key（基於 spaceId + userAddress）
  const lockKey = `${spaceId}-${userAddress}`;
  
  // 如果已經有相同的解密請求在進行中，直接返回該 Promise
  if (decryptionLocks.has(lockKey)) {
    console.log('🔒 Reusing existing decryption request for', lockKey);
    return decryptionLocks.get(lockKey)!;
  }

  console.log('🆕 Starting new decryption request for', lockKey);
  
  // 創建解密 Promise 並存儲
  const decryptPromise = (async () => {
    try {
      const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

      // 1. 創建 SessionKey
      const sessionKey = await SessionKey.create({
        address: userAddress,
        packageId: TEST_PACKAGE_ID,
        ttlMin: 10,
        suiClient,
      });

      // 2. 簽名（只有這一次簽名！）
      const message = sessionKey.getPersonalMessage();
      console.log('🔑 Requesting signature...');
      const { signature } = await signPersonalMessage(message);
      console.log('✅ Signature obtained');
      sessionKey.setPersonalMessageSignature(signature);

      // 3. 建構 seal_approve 交易
      const resourceIdBytes = fromHex(spaceId.replace('0x', ''));
      const tx = new Transaction();
      tx.moveCall({
        target: `${TEST_PACKAGE_ID}::seal_test::seal_approve`,
        arguments: [tx.pure.vector('u8', Array.from(resourceIdBytes))],
      });

      const txBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: true,
      });

      // 4. 解密
      const sealClient = getSealClient();
      const decryptedData = await sealClient.decrypt({
        data: encryptedData,
        sessionKey,
        txBytes,
      });

      return decryptedData;
    } finally {
      // 無論成功或失敗，都清除鎖
      decryptionLocks.delete(lockKey);
      console.log('🔓 Decryption request completed, lock released for', lockKey);
    }
  })();

  // 存儲 Promise
  decryptionLocks.set(lockKey, decryptPromise);
  
  return decryptPromise;
}

/**
 * 從 Walrus 下載並解密內容
 */
export async function downloadAndDecryptContent(
  blobId: string,
  spaceId: string,
  userAddress: string,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>,
  contentType: string,
): Promise<string> {
  // 1. 從 Walrus 下載加密內容
  const aggregatorUrl = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || 
    "https://aggregator.walrus-testnet.walrus.space";
  const response = await fetch(`${aggregatorUrl}/v1/blobs/${blobId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to download: HTTP ${response.status}`);
  }

  const encryptedData = new Uint8Array(await response.arrayBuffer());

  // 2. 解密
  const decryptedData = await decryptContent(
    encryptedData,
    spaceId,
    userAddress,
    signPersonalMessage,
  );

  // 3. 返回結果
  const blob = new Blob([new Uint8Array(decryptedData)], { type: contentType });
  
  if (contentType === 'text/markdown' || contentType === 'text/plain') {
    return await blob.text();
  }

  return URL.createObjectURL(blob);
}
