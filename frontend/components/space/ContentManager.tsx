"use client";

import { useState } from 'react';
import { RetroPanel } from '@/components/common/RetroPanel';
import { RetroButton } from '@/components/common/RetroButton';
import { RetroHeading } from '@/components/common/RetroHeading';
import { ContentUploadModal } from './ContentUploadModal';

interface ContentItem {
  id: string;
  type: 'video' | 'image' | 'essay' | 'nft';
  title: string;
  thumbnail?: string;
  blobId: string;
  encrypted: boolean;
  createdAt: string;
  expiresAt?: string;
}

interface ContentManagerProps {
  spaceId: string;
  onContentUpdate?: () => void;
}

export function ContentManager({ spaceId, onContentUpdate }: ContentManagerProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'essay'>('video');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const tabs = [
    { id: 'video', label: 'Videos' },
    { id: 'essay', label: 'Essays' },
  ] as const;

  const filteredContents = contents.filter(c => c.type === activeTab);

  const handleUploadComplete = (blobId: string) => {
    console.log('Upload complete:', blobId);
    onContentUpdate?.();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this content?')) {
      setContents(prev => prev.filter(c => c.id !== id));
      onContentUpdate?.();
    }
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
            <div className="text-4xl mb-3">
              {activeTab === 'video' ? '🎬' : '📝'}
            </div>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
              No {activeTab}s uploaded yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContents.map(content => (
              <RetroPanel key={content.id} variant="outset" className="p-3">
                <div className="flex gap-3">
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                    {content.thumbnail ? (
                      <img
                        src={content.thumbnail}
                        alt={content.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {content.type === 'video' ? '🎬' : '📝'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 truncate" style={{ fontFamily: 'Georgia, serif' }}>
                      {content.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                      <span>{content.encrypted ? '🔒 Encrypted' : '📖 Public'}</span>
                      {content.expiresAt && (
                        <span>⏰ Expires: {new Date(content.expiresAt).toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <RetroButton variant="secondary" size="sm">
                        Edit
                      </RetroButton>
                      <RetroButton 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleDelete(content.id)}
                      >
                        Delete
                      </RetroButton>
                      {content.encrypted && (
                        <RetroButton variant="secondary" size="sm">
                          Toggle Encryption
                        </RetroButton>
                      )}
                    </div>
                  </div>
                </div>
              </RetroPanel>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <ContentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        spaceId={spaceId}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}

