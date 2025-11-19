import { SealClient, SessionKey } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { SEAL_CONFIG, getSealKeyServers } from '@/config/seal';
import { PACKAGE_ID } from '@/config/sui';

type SuiJsonRpcClient = any;

let sealClientInstance: SealClient | null = null;

function getSealClient(network: 'testnet' | 'mainnet' = 'testnet'): SealClient {
  if (!sealClientInstance) {
    const keyServers = getSealKeyServers(network);
    const serverConfigs = keyServers.map(server => ({
      objectId: server.objectId,
      weight: server.weight,
    }));

    const suiClient = new SuiClient({ 
      url: getFullnodeUrl(network) 
    }) as SuiJsonRpcClient;

    sealClientInstance = new SealClient({
      suiClient,
      serverConfigs,
      verifyKeyServers: false,
      timeout: SEAL_CONFIG.timeout,
    });
  }

  return sealClientInstance;
}

export async function decryptContent(
  encryptedBlobId: string,
  spaceId: string,
  sealResourceId: string,
  userAddress: string,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<Uint8Array> {
  try {
    console.log('🔓 Decrypting content with Seal...', {
      blobId: encryptedBlobId,
      spaceId,
      sealResourceId,
      userAddress,
    });

    const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

    // Download encrypted blob from Walrus
    const response = await fetch(
      `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${encryptedBlobId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to download encrypted blob: ${response.statusText}`);
    }

    const encryptedData = await response.arrayBuffer();
    const encryptedBytes = new Uint8Array(encryptedData);

    // Create SessionKey for decryption
    const sessionKey = await SessionKey.create({
      address: userAddress,
      packageId: PACKAGE_ID,
      ttlMin: 10,
      suiClient,
    });

    // Get personal message and request signature
    const message = sessionKey.getPersonalMessage();
    const { signature } = await signPersonalMessage(message);
    sessionKey.setPersonalMessageSignature(signature);

    // Create transaction to call seal_approve
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::space::seal_approve`,
      arguments: [
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(sealResourceId))),
        tx.object(spaceId),
        tx.object(SEAL_CONFIG.subscriptionRegistryId),
      ],
    });

    // Build transaction bytes (only transaction kind)
    const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

    // Decrypt using Seal SDK
    const sealClient = getSealClient(network);
    const decryptedData = await sealClient.decrypt({
      data: encryptedBytes,
      sessionKey,
      txBytes,
    });

    console.log('✅ Seal decryption completed', {
      originalSize: encryptedBytes.length,
      decryptedSize: decryptedData.length,
    });

    return new Uint8Array(decryptedData);
  } catch (error) {
    console.error('❌ Seal decryption failed:', error);
    throw error;
  }
}

export async function checkAccess(
  spaceId: string,
  userAddress: string,
  spaceCreator: string
): Promise<boolean> {
  if (userAddress === spaceCreator) {
    return true;
  }

  return false;
}

