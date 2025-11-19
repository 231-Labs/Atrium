"use client";

import { useState } from 'react';
import { RetroModal } from '@/components/common/RetroModal';
import { RetroButton } from '@/components/common/RetroButton';
import { RetroInput, RetroTextarea, RetroSelect, RetroFileUpload, RetroToggle } from '@/components/common/RetroForm';
import { encryptContent } from '@/utils/sealEncryption';
import { uploadToWalrus } from '@/services/walrusApi';

interface ContentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  onUploadComplete: (blobId: string) => void;
}

type ContentType = 'video' | 'image' | 'essay';

interface UploadFormData {
  file: File | null;
  title: string;
  description: string;
  contentType: ContentType;
  requiresSubscription: boolean;
  tags: string;
}

export function ContentUploadModal({ 
  isOpen, 
  onClose, 
  spaceId,
  onUploadComplete 
}: ContentUploadModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UploadFormData>({
    file: null,
    title: '',
    description: '',
    contentType: 'video',
    requiresSubscription: false,
    tags: '',
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, file }));
    if (file) {
      if (!formData.title) {
        setFormData(prev => ({ 
          ...prev, 
          title: file.name.replace(/\.[^/.]+$/, '') 
        }));
      }
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && ['mp4', 'webm', 'mov'].includes(ext)) {
        setFormData(prev => ({ ...prev, contentType: 'video' }));
      } else if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        setFormData(prev => ({ ...prev, contentType: 'image' }));
      } else if (ext === 'md') {
        setFormData(prev => ({ ...prev, contentType: 'essay' }));
      }
    }
  };

  const handleUpload = async () => {
    if (!formData.file) {
      setError('Please select a file');
      return;
    }

    if (!formData.title) {
      setError('Please enter a title');
      return;
    }

    try {
      setUploading(true);
      setError('');

      if (formData.requiresSubscription) {
        setProgress('Encrypting content with Seal...');
        const encrypted = await encryptContent(formData.file, {
          spaceId,
          contentType: formData.contentType,
          requiresSubscription: true,
        });

        setProgress('Uploading to Walrus...');
        const blobId = await uploadToWalrus(encrypted.encryptedBlob);

        setProgress('Upload complete!');
        onUploadComplete(blobId);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1000);
      } else {
        setProgress('Uploading to Walrus...');
        const blobId = await uploadToWalrus(formData.file);

        setProgress('Upload complete!');
        onUploadComplete(blobId);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1000);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed');
      setProgress('');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      file: null,
      title: '',
      description: '',
      contentType: 'video',
      requiresSubscription: false,
      tags: '',
    });
    setStep(1);
    setProgress('');
    setError('');
  };

  const handleClose = () => {
    if (!uploading) {
      onClose();
      resetForm();
    }
  };

  return (
    <RetroModal isOpen={isOpen} onClose={handleClose} title="Upload Content" size="md">
      <div className="p-6 space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${step >= s ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}
                `}
              >
                {s}
              </div>
              {s < 3 && (
                <div 
                  className={`w-12 h-1 ${step > s ? 'bg-blue-500' : 'bg-gray-300'}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: File Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <RetroFileUpload
              label="Select File"
              accept="video/*,image/*,.md"
              onChange={handleFileChange}
              value={formData.file}
            />
            
            <RetroSelect
              label="Content Type"
              value={formData.contentType}
              onChange={(e) => setFormData(prev => ({ ...prev, contentType: e.target.value as ContentType }))}
              options={[
                { value: 'video', label: 'Video' },
                { value: 'image', label: 'Image' },
                { value: 'essay', label: 'Essay/Article' },
              ]}
            />

            {error && (
              <p className="text-sm text-red-600" style={{ fontFamily: 'Georgia, serif' }}>
                {error}
              </p>
            )}

            <RetroButton
              variant="primary"
              className="w-full"
              onClick={() => formData.file && setStep(2)}
              disabled={!formData.file}
            >
              Next
            </RetroButton>
          </div>
        )}

        {/* Step 2: Metadata */}
        {step === 2 && (
          <div className="space-y-4">
            <RetroInput
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter content title"
            />

            <RetroTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your content..."
              rows={3}
            />

            <RetroInput
              label="Tags (comma separated)"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="art, 3d, exclusive"
            />

            {error && (
              <p className="text-sm text-red-600" style={{ fontFamily: 'Georgia, serif' }}>
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <RetroButton
                variant="secondary"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Back
              </RetroButton>
              <RetroButton
                variant="primary"
                className="flex-1"
                onClick={() => formData.title && setStep(3)}
                disabled={!formData.title}
              >
                Next
              </RetroButton>
            </div>
          </div>
        )}

        {/* Step 3: Encryption & Upload */}
        {step === 3 && (
          <div className="space-y-4">
            <RetroToggle
              label="Require Subscription (Encrypt)"
              checked={formData.requiresSubscription}
              onChange={(checked) => setFormData(prev => ({ ...prev, requiresSubscription: checked }))}
            />

            <div 
              className="p-4 bg-gray-50 rounded text-sm"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {formData.requiresSubscription ? (
                <>
                  <p className="font-medium mb-2">🔒 Content will be encrypted</p>
                  <p className="text-gray-600 text-xs">
                    Only subscribers will be able to view this content.
                    Encryption is done using Seal protocol.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium mb-2">📖 Public Content</p>
                  <p className="text-gray-600 text-xs">
                    This content will be accessible to everyone.
                  </p>
                </>
              )}
            </div>

            {progress && (
              <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded">
                {progress}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600" style={{ fontFamily: 'Georgia, serif' }}>
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <RetroButton
                variant="secondary"
                className="flex-1"
                onClick={() => setStep(2)}
                disabled={uploading}
              >
                Back
              </RetroButton>
              <RetroButton
                variant="primary"
                className="flex-1"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </RetroButton>
            </div>
          </div>
        )}
      </div>
    </RetroModal>
  );
}

