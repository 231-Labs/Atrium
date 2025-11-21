// Temporary local storage solution for content management
// TODO: Replace with on-chain storage when contract is extended

export interface WalrusMetadata {
  blobId: string;
  objectId?: string;           // Walrus blob object ID
  storage?: {
    id: string;
    startEpoch: number;
    endEpoch: number;
    storageSize: number;
  };
  registeredEpoch?: number;
  encodedLength?: number;
  cost?: number;
}

export interface StoredContent {
  id: string;
  spaceId: string;
  blobId: string;
  walrusMetadata?: WalrusMetadata; // 完整的 Walrus 元數據
  sealResourceId?: string; // Seal Protocol 加密時使用的 resourceId (用於解密)
  title: string;
  description: string;
  type: 'video' | 'image' | 'essay' | 'merch';
  encrypted: boolean;
  price: number;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'atrium_content_items';

export function saveContent(content: StoredContent): void {
  const existing = getAllContent();
  
  // Check if content already exists (avoid duplicates)
  const index = existing.findIndex(item => item.id === content.id);
  if (index !== -1) {
    // Update existing content
    existing[index] = content;
  } else {
    // Add new content
    existing.push(content);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getAllContent(): StoredContent[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getContentBySpace(spaceId: string): StoredContent[] {
  return getAllContent().filter(item => item.spaceId === spaceId);
}

export function deleteContent(contentId: string): void {
  const existing = getAllContent();
  const filtered = existing.filter(item => item.id !== contentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function updateContent(contentId: string, updates: Partial<StoredContent>): void {
  const existing = getAllContent();
  const index = existing.findIndex(item => item.id === contentId);
  if (index !== -1) {
    existing[index] = { ...existing[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }
}

export function dispatchContentUpdateEvent(spaceId?: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('atrium-content-updated', { 
      detail: { spaceId } 
    }));
  }
}

// Helper to save multiple contents at once (for chain sync)
export function saveMultipleContents(contents: StoredContent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contents));
}

