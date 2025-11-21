"use client";

import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { RetroPanel } from '@/components/common/RetroPanel';
import { RetroButton } from '@/components/common/RetroButton';
import { ContentUploadWindow } from './ContentUploadWindow';
import { getContentBySpace, getAllContent, deleteContent, StoredContent, saveContent, saveMultipleContents } from '@/utils/contentStorage';
import { ContentIndexer } from '@/services/contentIndexer';

interface ContentManagerProps {
  spaceId: string;
  ownershipId: string;
  onContentUpdate?: () => void;
}

export function ContentManager({ spaceId, ownershipId, onContentUpdate }: ContentManagerProps) {
  const suiClient = useSuiClient();
  const [activeTab, setActiveTab] = useState<'video' | 'essay'>('video');
  const [contents, setContents] = useState<StoredContent[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Load contents from localStorage and blockchain
  useEffect(() => {
    let isMounted = true;
    
    const loadContents = async () => {
      if (!isMounted) return;
      
      console.log('📂 Loading contents for space:', spaceId);
      
      // Step 1: Load from localStorage (fast display)
      const cached = getContentBySpace(spaceId);
      if (cached.length > 0 && isMounted) {
        console.log('📦 [ContentManager] Loaded', cached.length, 'from cache');
        setContents(cached);
      }
      
      // Step 2: Query from blockchain (authoritative source)
      try {
        const indexer = new ContentIndexer(suiClient);
        const chainContents = await indexer.querySpaceContents(spaceId);
        
        if (!isMounted) return;
        
        console.log('⛓️ [ContentManager] Loaded', chainContents.length, 'from blockchain');
        
        // Update state
        setContents(chainContents);
        
        // Step 3: Sync to localStorage (replace, not append)
        const allContents = getAllContent();
        const otherSpaceContents = allContents.filter(c => c.spaceId !== spaceId);
        const newAllContents = [...otherSpaceContents, ...chainContents];
        saveMultipleContents(newAllContents);
        
        console.log('💾 [ContentManager] Synced to localStorage');
      } catch (error) {
        console.error('❌ [ContentManager] Failed to load:', error);
      }
    };
    
    loadContents();
    
    // Listen for content updates (only for this space)
    const handleContentUpdate = (event: CustomEvent) => {
      const { spaceId: updatedSpaceId } = event.detail || {};
      if (updatedSpaceId === spaceId) {
        console.log('🔔 Received content update for current space');
        loadContents();
      }
    };
    
    window.addEventListener('atrium-content-updated', handleContentUpdate as EventListener);
    
    return () => {
      isMounted = false;
      window.removeEventListener('atrium-content-updated', handleContentUpdate as EventListener);
    };
  }, [spaceId, suiClient]);

  const tabs = [
    { id: 'video', label: 'Videos' },
    { id: 'essay', label: 'Essays' },
  ] as const;

  const filteredContents = contents.filter(c => c.type === activeTab);

  const handleUploadComplete = (content: StoredContent) => {
    console.log('✅ [ContentManager] Upload complete:', content.title);
    setContents(prev => [...prev, content]);
    
    // Auto-switch to the corresponding tab
    if (content.type === 'video' || content.type === 'essay') {
      setActiveTab(content.type);
    }
    
    onContentUpdate?.();
  };

  const handleDelete = (id: string) => {
    // TODO: Implement on-chain content deletion
    alert('Delete functionality is not yet implemented. Content can only be deleted from localStorage for now.');
    
    // Temporary localStorage-only deletion (commented out for safety)
    // if (confirm('Are you sure you want to delete this content?')) {
    //   deleteContent(id);
    //   setContents(prev => prev.filter(c => c.id !== id));
    //   onContentUpdate?.();
    // }
  };

  return (
    <div className="h-full flex flex-col -mx-4 -mt-4">
      {/* Header with Tabs */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b" style={{ borderColor: '#e5e7eb' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{ 
              fontFamily: 'Georgia, serif',
              border: activeTab === tab.id ? '1px solid #d1d5db' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="text-xs text-gray-600 hover:text-gray-900 underline transition-colors"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Upload
        </button>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-3">
        {filteredContents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 italic" style={{ fontFamily: 'Georgia, serif' }}>
              No {activeTab}s uploaded yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContents.map(content => {
              const objectId = content.walrusMetadata?.objectId;
              const explorerUrl = objectId 
                ? `https://suiscan.xyz/testnet/object/${objectId}`
                : null;
              
              const handleCopyBlobId = () => {
                navigator.clipboard.writeText(content.blobId);
                alert('Blob ID copied to clipboard!');
              };

              return (
                <RetroPanel key={content.id} variant="outset" className="p-4">
                  <div className="space-y-3">
                    {/* Title and Type */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-base font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                        {content.title}
                      </h4>
                      <span className="text-xs uppercase tracking-wide text-gray-500 font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                        {content.type}
                      </span>
                    </div>

                    {/* Description */}
                    {content.description && (
                      <p className="text-sm text-gray-700 italic leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                        {content.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="space-y-1.5 text-xs" style={{ fontFamily: 'Georgia, serif' }}>
                      {/* Object ID */}
                      {objectId && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-medium">Object ID:</span>
                          <a 
                            href={explorerUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-900 underline hover:text-blue-600 transition-colors font-mono text-[11px] tracking-tight"
                            title="View on Sui Explorer"
                          >
                            {objectId.slice(0, 12)}...{objectId.slice(-8)}
                          </a>
                        </div>
                      )}

                      {/* Blob ID */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-medium">Blob ID:</span>
                        <button
                          onClick={handleCopyBlobId}
                          className="text-gray-900 hover:text-blue-600 transition-colors font-mono text-[11px] tracking-tight underline decoration-dotted cursor-pointer"
                          title="Click to copy"
                        >
                          {content.blobId.slice(0, 16)}...
                        </button>
                      </div>

                      {/* Status and Date */}
                      <div className="flex items-center gap-4 text-gray-600 pt-1">
                        <span className={content.encrypted ? 'font-semibold' : ''}>
                          {content.encrypted ? 'Encrypted' : 'Public'}
                        </span>
                        <span>•</span>
                        <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <RetroButton 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleDelete(content.id)}
                        disabled={true}
                        className="opacity-50 cursor-not-allowed"
                        title="Delete functionality not yet implemented"
                      >
                        Delete (Coming Soon)
                      </RetroButton>
                    </div>
                  </div>
                </RetroPanel>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <ContentUploadWindow
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        spaceId={spaceId}
        ownershipId={ownershipId}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}

