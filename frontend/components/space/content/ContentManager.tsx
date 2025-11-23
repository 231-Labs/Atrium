"use client";

import { useState } from 'react';
import { RetroPanel } from '@/components/common/RetroPanel';
import { RetroButton } from '@/components/common/RetroButton';
import { ContentUploadWindow } from './ContentUploadWindow';
import { StoredContent } from '@/utils/contentStorage';
import { useContentManagement } from './hooks/useContentManagement';
import { StateContainer } from '@/components/common/StateContainer';

interface ContentManagerProps {
  spaceId: string;
  ownershipId: string;
  onContentUpdate?: () => void;
}

export function ContentManager({ spaceId, ownershipId, onContentUpdate }: ContentManagerProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'essay'>('video');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { contents, loading, error, refetch, handleUpload, handleDelete } = useContentManagement({ spaceId });

  const tabs = [
    { id: 'video', label: 'Videos' },
    { id: 'essay', label: 'Essays' },
  ] as const;

  const filteredContents = contents.filter(c => c.type === activeTab);

  const handleUploadComplete = (content: StoredContent) => {
    handleUpload(content);
    
    // Auto-switch to the corresponding tab
    if (content.type === 'video' || content.type === 'essay') {
      setActiveTab(content.type);
    }
    
    onContentUpdate?.();
  };

  return (
    <div className="h-full flex flex-col -mx-4 -mt-4">
      {/* Tabs and Actions Header */}
      <div className="flex-shrink-0 bg-gray-50 border-b" style={{ borderColor: '#d1d5db' }}>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex">
            {tabs.map((tab) => (
              <RetroButton
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'primary' : 'secondary'}
                size="sm"
                className="rounded-none border-r last:border-r-0"
              >
                {tab.label}
              </RetroButton>
            ))}
          </div>

          <RetroButton
            onClick={() => setIsUploadModalOpen(true)}
            variant="primary"
            size="sm"
          >
            + Upload
          </RetroButton>
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-4">
        <StateContainer
          loading={loading}
          error={error}
          empty={filteredContents.length === 0}
          onRetry={refetch}
        >
          <StateContainer.Empty
            icon={activeTab === 'video' ? '🎥' : '📝'}
            title={`No ${activeTab === 'video' ? 'Videos' : 'Essays'} Yet`}
            message={`Upload your first ${activeTab} to get started.`}
          />

          <StateContainer.Content>
            <div className="space-y-3">
              {filteredContents.map((content) => (
                <RetroPanel key={content.id} variant="outset" className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                        {content.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                        {content.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
                        <span>{content.encrypted ? '🔒 Encrypted' : '🔓 Public'}</span>
                        <span>•</span>
                        <span>
                          {new Date(content.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <RetroButton
                      onClick={() => handleDelete(content.id)}
                      variant="secondary"
                      size="sm"
                      className="ml-4"
                      disabled={true}
                    >
                      Delete
                    </RetroButton>
                  </div>
                </RetroPanel>
              ))}
            </div>
          </StateContainer.Content>
        </StateContainer>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <ContentUploadWindow
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          spaceId={spaceId}
          ownershipId={ownershipId}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}
