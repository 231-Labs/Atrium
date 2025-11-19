import { SealClient, DemType } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { SEAL_CONFIG, getSealKeyServers } from '@/config/seal';
import { PACKAGE_ID } from '@/config/sui';

type SuiJsonRpcClient = any;

export interface SealEncryptionResult {
  encryptedBlob: Blob;
  resourceId: string;
  metadata: {
    encrypted: boolean;
    originalSize: number;
    encryptedSize: number;
    encryptionDate: string;
  };
}

export interface SealEncryptionOptions {
  spaceId: string;
  contentType: 'video' | 'image' | 'essay';
  requiresSubscription: boolean;
}

let sealClientInstance: SealClient | null = null;

function getSealClient(network: 'testnet' | 'mainnet' = 'testnet'): SealClient {
  if (!sealClientInstance) {
    const keyServers = getSealKeyServers(network);
    const serverConfigs = keyServers.map(server => ({
      objectId: server.objectId,
      weight: server.weight,
    }));

    console.log('🔐 Initializing Seal Client with servers:', 
      keyServers.map(s => s.provider).join(', ')
    );

    const suiClient = new SuiClient({ 
      url: getFullnodeUrl(network) 
    }) as SuiJsonRpcClient;

    sealClientInstance = new SealClient({
      suiClient,
      serverConfigs,
      verifyKeyServers: SEAL_CONFIG.verifyKeyServers,
      timeout: SEAL_CONFIG.timeout,
    });
  }

  return sealClientInstance;
}

export async function encryptContent(
  file: File,
  options: SealEncryptionOptions,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<SealEncryptionResult> {
  try {
    console.log('🔐 Encrypting content with Seal...', {
      fileName: file.name,
      fileSize: file.size,
      options,
      network,
    });

    if (!SEAL_CONFIG.enabled) {
      console.warn('⚠️ Seal encryption is disabled, returning unencrypted file');
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      return {
        encryptedBlob: blob,
        resourceId: `unencrypted_${Date.now()}`,
        metadata: {
          encrypted: false,
          originalSize: file.size,
          encryptedSize: blob.size,
          encryptionDate: new Date().toISOString(),
        },
      };
    }

    if (!options.requiresSubscription) {
      console.log('📖 Content is public, skipping encryption');
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      return {
        encryptedBlob: blob,
        resourceId: `public_${Date.now()}`,
        metadata: {
          encrypted: false,
          originalSize: file.size,
          encryptedSize: blob.size,
          encryptionDate: new Date().toISOString(),
        },
      };
    }
    
    const fileExtension = file.name.split('.').pop() || '';
    if (!SEAL_CONFIG.isTypeSupported(fileExtension)) {
      console.warn(`⚠️ File type ${fileExtension} is not supported for encryption`);
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      return {
        encryptedBlob: blob,
        resourceId: `unsupported_${Date.now()}`,
        metadata: {
          encrypted: false,
          originalSize: file.size,
          encryptedSize: blob.size,
          encryptionDate: new Date().toISOString(),
        },
      };
    }

    const fileBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(fileBuffer);

    const sealClient = getSealClient(network);

    const metadata = {
      fileName: file.name,
      fileType: file.type,
      timestamp: Date.now(),
      spaceId: options.spaceId,
      contentType: options.contentType,
    };

    const sealPackageId = PACKAGE_ID;
    const sealId = options.spaceId;
    
    console.log('🔐 Encrypting with Seal SDK...', {
      dataSize: fileData.length,
      packageId: sealPackageId,
      id: sealId,
      idLength: sealId.length,
    });

    const { encryptedObject, key } = await sealClient.encrypt({
      demType: DemType.AesGcm256,
      threshold: SEAL_CONFIG.threshold,
      packageId: sealPackageId,
      id: sealId,
      data: fileData,
      aad: new TextEncoder().encode(JSON.stringify(metadata)),
    });

    const encryptedBlob = new Blob([encryptedObject], { type: 'application/octet-stream' });

    const resourceId = sealId;

    console.log('✅ Seal encryption completed', {
      resourceId,
      packageId: sealPackageId,
      originalSize: file.size,
      encryptedSize: encryptedBlob.size,
      compressionRatio: (encryptedBlob.size / file.size * 100).toFixed(2) + '%',
    });

    return {
      encryptedBlob,
      resourceId,
      metadata: {
        encrypted: true,
        originalSize: file.size,
        encryptedSize: encryptedBlob.size,
        encryptionDate: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('❌ Seal encryption failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
    });
    
    console.warn('⚠️ Falling back to unencrypted upload');
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    
    return {
      encryptedBlob: blob,
      resourceId: `fallback_${Date.now()}`,
      metadata: {
        encrypted: false,
        originalSize: file.size,
        encryptedSize: blob.size,
        encryptionDate: new Date().toISOString(),
      },
    };
  }
}

export function isSealAvailable(): boolean {
  try {
    return typeof window !== 'undefined';
  } catch {
    return false;
  }
}

export { SEAL_CONFIG } from '@/config/seal';

