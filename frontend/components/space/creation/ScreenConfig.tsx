"use client";

import { useState } from 'react';
import { RetroButton } from '@/components/common/RetroButton';
import { RetroSelect, RetroToggle } from '@/components/common/RetroForm';
import { SpaceScreenConfig } from '@/utils/spaceConfig';

interface ScreenConfigProps {
  config: SpaceScreenConfig;
  onChange: (config: SpaceScreenConfig) => void;
  availableContent: Array<{ id: string; title: string; type: 'video' | 'image' }>;
}

export function ScreenConfig({ config, onChange, availableContent }: ScreenConfigProps) {
  const [selectedType, setSelectedType] = useState<'video' | 'image' | 'none'>(config.contentType);
  const [selectedBlobId, setSelectedBlobId] = useState(config.blobId);
  const [autoplay, setAutoplay] = useState(config.autoplay);

  const handleSave = () => {
    onChange({
      contentType: selectedType,
      blobId: selectedBlobId,
      autoplay,
    });
  };

  const filteredContent = availableContent.filter(c => c.type === selectedType);

  return (
    <div className="space-y-4">
      <RetroSelect
        label="Content Type"
        value={selectedType}
        onChange={(e) => {
          setSelectedType(e.target.value as any);
          setSelectedBlobId('');
        }}
        options={[
          { value: 'none', label: 'None (Empty Screen)' },
          { value: 'video', label: 'Video' },
          { value: 'image', label: 'Image' },
        ]}
      />

      {selectedType !== 'none' && (
        <>
          <RetroSelect
            label="Select Content"
            value={selectedBlobId}
            onChange={(e) => setSelectedBlobId(e.target.value)}
            options={[
              { value: '', label: '-- Select --' },
              ...filteredContent.map(c => ({
                value: c.id,
                label: c.title,
              })),
            ]}
          />

          {selectedType === 'video' && (
            <RetroToggle
              label="Autoplay"
              checked={autoplay}
              onChange={setAutoplay}
            />
          )}

          {selectedBlobId && (
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Preview:
              </p>
              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                {selectedType === 'video' ? '🎬' : '🖼️'}
              </div>
            </div>
          )}
        </>
      )}

      <RetroButton
        variant="primary"
        className="w-full"
        onClick={handleSave}
        disabled={selectedType !== 'none' && !selectedBlobId}
      >
        Apply Configuration
      </RetroButton>
    </div>
  );
}

