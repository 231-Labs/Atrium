export class WalrusApiService {
  private publisherUrls: string[];
  private aggregatorUrl: string;
  private currentPublisherIndex: number;

  constructor() {
    const envPublishers = process.env.NEXT_PUBLIC_WALRUS_PUBLISHERS;
    this.publisherUrls = envPublishers 
      ? envPublishers.split(',').map(url => url.trim())
      : [
          'https://publisher.walrus-testnet.walrus.space',
          'https://publisher.testnet.walrus.atalma.io'
        ];

    this.publisherUrls = this.publisherUrls.filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        console.warn(`Invalid publisher URL: ${url}`);
        return false;
      }
    });

    if (this.publisherUrls.length === 0) {
      throw new Error('No valid publisher URLs configured');
    }

    this.aggregatorUrl = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space';
    this.currentPublisherIndex = 0;

    console.log('Configured publishers:', this.publisherUrls);
  }

  private getNextPublisher(): string {
    const publisher = this.publisherUrls[this.currentPublisherIndex];
    this.currentPublisherIndex = (this.currentPublisherIndex + 1) % this.publisherUrls.length;
    return publisher;
  }

  async uploadBlob(fileBuffer: Buffer, epochs: string = '50', retryCount: number = 0): Promise<any> {
    if (retryCount >= this.publisherUrls.length) {
      throw new Error('All publishers failed to respond');
    }

    const publisherUrl = this.getNextPublisher();
    
    try {
      const url = new URL('/v1/blobs', publisherUrl);
      url.searchParams.set('epochs', epochs);

      console.log('Uploading to:', url.toString());
      console.log('File size:', fileBuffer.length, 'bytes');
      console.log('Epochs:', epochs);
      console.log('Retry count:', retryCount);

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Cache-Control': 'no-transform',
          'X-Content-Type-Options': 'nosniff'
        },
        body: new Uint8Array(fileBuffer),
      });

      const responseText = await response.text();
      console.log('Upload response:', response.status, responseText);

      if (!response.ok) {
        // 處理所有可能的錯誤狀態碼
        if (response.status === 429 || response.status === 413 || response.status >= 500) {
          console.log(`Error ${response.status}, trying next publisher...`);
          return this.uploadBlob(fileBuffer, epochs, retryCount + 1);
        }
        throw new Error(`Upload failed: ${response.status} ${responseText}`);
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof Error && error.message.includes('failed to fetch')) {
        console.log('Connection failed, trying next publisher...');
        return this.uploadBlob(fileBuffer, epochs, retryCount + 1);
      }
      throw error;
    }
  }

  async readBlob(blobId: string) {
    if (!this.aggregatorUrl) {
      throw new Error('Aggregator URL is not configured');
    }

    const url = new URL(`/v1/blobs/${encodeURIComponent(blobId)}`, this.aggregatorUrl);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async handleFileUpload(formData: FormData, method: 'PUT' | 'POST' = 'POST') {
    try {
      const file = formData.get('data') || formData.get('file');
      const epochs = formData.get('epochs')?.toString() || '50';
      

      if (!file || typeof file === 'string') {
        throw new Error('Invalid file');
      }

      if (typeof (file as any).arrayBuffer !== 'function') {
        throw new Error('File does not support arrayBuffer()');
      }

      const fileBlob = file as Blob;
      
      console.log('Processing file upload:', {
        fileName: (file as any).name || 'unknown',
        fileSize: fileBlob.size,
        fileType: fileBlob.type,
        epochs
      });

      const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
      return this.uploadBlob(fileBuffer, epochs);
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
}

export const walrusApi = new WalrusApiService();

export interface WalrusUploadResponse {
  blobId: string;
  objectId?: string;
  storage?: {
    id: string;
    startEpoch: number;
    endEpoch: number;
    storageSize: number;
  };
  registeredEpoch?: number;
  encodedLength?: number;
  cost?: number;
  rawResponse: any;
}

/**
 * Convenient helper function to upload a file or blob to Walrus
 * @param file - File or Blob to upload
 * @param epochs - Number of epochs to store (default: 50)
 * @returns Walrus upload response with metadata
 */
export async function uploadToWalrus(file: File | Blob, epochs: string = '50'): Promise<WalrusUploadResponse> {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const result = await walrusApi.uploadBlob(fileBuffer, epochs);
  
  console.log('Walrus upload result:', result);
  console.log('Full result structure:', JSON.stringify(result, null, 2));
  
  // Extract metadata from response
  let response: WalrusUploadResponse;
  
  if (result.newlyCreated) {
    const blobObject = result.newlyCreated.blobObject;
    console.log('Extracting from newlyCreated.blobObject:', blobObject);
    console.log('Object ID:', blobObject.id);
    
    response = {
      blobId: blobObject.blobId,
      objectId: blobObject.id,
      storage: blobObject.storage ? {
        id: blobObject.storage.id,
        startEpoch: blobObject.storage.startEpoch,
        endEpoch: blobObject.storage.endEpoch,
        storageSize: blobObject.storage.storageSize,
      } : undefined,
      registeredEpoch: result.newlyCreated.blobObject.registeredEpoch,
      encodedLength: result.newlyCreated.encodedLength,
      cost: result.cost,
      rawResponse: result,
    };
  } else if (result.alreadyCertified) {
    response = {
      blobId: result.alreadyCertified.blobId,
      objectId: result.alreadyCertified.blobObject?.id,
      registeredEpoch: result.alreadyCertified.blobObject?.registeredEpoch,
      encodedLength: result.alreadyCertified.encodedLength,
      cost: result.cost,
      rawResponse: result,
    };
  } else {
    throw new Error('Failed to get blob ID from Walrus response');
  }
  
  return response;
}

/**
 * Simplified upload function - returns only the blob ID
 * Use this for simple cases where you only need the blob ID
 * @param file - File or Blob to upload
 * @param epochs - Number of epochs to store (default: 50)
 * @returns Blob ID string
 */
export async function uploadBlobToWalrus(file: File | Blob, epochs: string = '50'): Promise<string> {
  const response = await uploadToWalrus(file, epochs);
  return response.blobId;
}
