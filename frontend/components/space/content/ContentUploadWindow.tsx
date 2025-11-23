"use client";

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { RetroWindow } from '@/components/common/RetroWindow';
import { RetroButton } from '@/components/common/RetroButton';
import { RetroPanel } from '@/components/common/RetroPanel';
import { 
  RetroInput, 
  RetroTextarea, 
  RetroFileUpload, 
  RetroToggle 
} from '@/components/common/RetroForm';
import { useContentUpload } from './hooks/useContentUpload';
import { useWindowPosition } from '@/components/windows/hooks/useWindowPosition';
import { saveContent, StoredContent, dispatchContentUpdateEvent } from '@/utils/contentStorage';
import { recordContent } from '@/utils/transactions';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';

interface ContentUploadWindowProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  ownershipId: string;
  onUploadComplete: (content: StoredContent) => void;
  initialPosition?: { x: number; y: number };
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

// 使用統一的 MarkdownRenderer 組件進行預覽
const SimpleMarkdown = ({ content }: { content: string }) => {
    return (
      <div className="h-full overflow-y-auto scrollbar-hidden p-4 bg-white">
        <MarkdownRenderer 
          content={content}
          className="prose-sm"
        />
      </div>
    );
};

const initialWindowSize = { width: 640, height: 540 };

export function ContentUploadWindow({ 
  isOpen, 
  onClose, 
  spaceId,
  ownershipId,
  onUploadComplete,
  initialPosition = { x: 100, y: 50 }
}: ContentUploadWindowProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { upload: uploadContent } = useContentUpload();
  
  // Window management
  const {
    position,
    size,
    mounted,
    handleDragStart,
    handleResizeStart,
    setSize
  } = useWindowPosition(initialWindowSize, initialPosition);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UploadFormData>({
    file: null,
    title: '',
    description: '',
    contentType: 'video',
    requiresSubscription: false,
    tags: '',
  });
  
  // Essay Editor State
  const [essayMode, setEssayMode] = useState<'upload' | 'write'>('upload');
  const [editorContent, setEditorContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  // Auto-resize for essay mode
  useEffect(() => {
    if (step === 1 && formData.contentType === 'essay' && essayMode === 'write') {
      setSize({ 
        width: Math.max(size.width, 800), 
        height: Math.max(size.height, 600) 
      });
    }
  }, [step, formData.contentType, essayMode, size.width, size.height, setSize]);

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

  const handleNextStep = () => {
      if (step === 1 && formData.contentType === 'essay' && essayMode === 'write') {
          if (!editorContent.trim()) {
              setError('Please write some content');
              return;
          }
          const file = new File([editorContent], 'essay.md', { type: 'text/markdown' });
          setFormData(prev => ({ ...prev, file }));
          if (!formData.title) {
             const firstLine = editorContent.split('\n')[0].replace(/^#\s*/, '').trim();
             if (firstLine) {
                 setFormData(prev => ({ ...prev, title: firstLine }));
             }
          }
      } else {
          if (!formData.file && step === 1) {
            setError('Please select a file');
            return;
          }
      }
      
      setError('');
      setStep(step + 1);
  };

  const handleUpload = async () => {
    if (!formData.file) {
      setError('Please select a file or write content');
      return;
    }

    if (!formData.title) {
      setError('Please enter a title');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Use unified upload hook
      const uploadResult = await uploadContent(formData.file, {
          spaceId,
        requiresEncryption: formData.requiresSubscription,
        });
        
      const { blobId, resourceId: sealResourceId, objectId } = uploadResult;

      // Record content on blockchain
      if (objectId && currentAccount) {
        setProgress('Recording on blockchain...');
        
        const tx = recordContent(
          spaceId,
          ownershipId,
          objectId,
          blobId,
          formData.contentType,
          formData.title,
          formData.description,
          formData.requiresSubscription,
          0, // price
          formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        );
        
        try {
          await new Promise<void>((resolve, reject) => {
            signAndExecute(
              { transaction: tx },
              {
                onSuccess: () => {
                  console.log('✅ Content recorded on chain');
                  resolve();
                },
                onError: (error) => {
                  console.error('❌ Failed to record on chain:', error);
                  reject(error);
                }
              }
            );
          });
          
          setProgress('Recorded on blockchain!');
        } catch (error) {
          console.error('Blockchain recording failed:', error);
          setError('Blockchain recording failed, but content is saved locally');
        }
      }

      // Save content metadata with complete Walrus information
      const content: StoredContent = {
        id: objectId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        spaceId,
        blobId,
        walrusMetadata: {
          blobId,
          objectId,
          storage: uploadResult.storage,
        },
        sealResourceId, // CRITICAL: Save Seal resourceId for decryption
        title: formData.title,
        description: formData.description,
        type: formData.contentType,
        encrypted: formData.requiresSubscription,
        price: 0,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
      };

      console.log('✅ Saving content with metadata:', {
        ...content,
        hasSealResourceId: !!sealResourceId,
        sealResourceIdLength: sealResourceId?.length,
      });
      saveContent(content);
      setProgress('Upload complete!');
      
      // Dispatch event to notify other components (only with spaceId)
      // First dispatch immediately (to update from localStorage)
      dispatchContentUpdateEvent(spaceId);
      console.log('🔔 Dispatched immediate content update event for space:', spaceId);
      
      // Then dispatch again after a delay (to update from blockchain)
      setTimeout(() => {
        dispatchContentUpdateEvent(spaceId);
        console.log('🔔 Dispatched delayed content update event for blockchain sync:', spaceId);
      }, 2000);
      
      setTimeout(() => {
        onUploadComplete(content);
        onClose();
        resetForm();
      }, 500);
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
    setEditorContent('');
    setEssayMode('upload');
    setShowPreview(false);
    setProgress('');
    setError('');
    setSize(initialWindowSize);
  };

  const handleClose = () => {
    if (!uploading) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen || !mounted) return null;

  const isWritingEssay = step === 1 && formData.contentType === 'essay' && essayMode === 'write';

  return (
    <RetroWindow
      title={isWritingEssay ? "Write Essay - Untitled" : "Upload Content"}
      position={position}
      size={size}
      zIndex={50}
      onClose={handleClose}
      onDragStart={handleDragStart}
      onResize={handleResizeStart}
      resizable={true}
      isActive={true}
      className="animate-fade-in fixed top-0 left-0"
    >
      <div className="h-full flex flex-col bg-gray-50">
        {/* Progress Indicator */}
        <div className="px-6 pt-6 pb-2 bg-transparent flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div 
                            className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all
                                ${step >= s 
                                    ? 'bg-gray-800 text-white border-gray-800' 
                                    : 'bg-white text-gray-400 border-gray-300'}
                            `}
                        >
                            {s}
                        </div>
                        {s < 3 && (
                            <div className={`w-8 h-[1px] mx-2 ${step > s ? 'bg-gray-800' : 'bg-gray-300'}`} />
                        )}
                    </div>
                ))}
            </div>
            
            <div className="text-xs font-serif text-gray-500 uppercase tracking-widest">
                {step === 1 && "Select Media"}
                {step === 2 && "Information"}
                {step === 3 && "Finalize"}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hidden p-6 flex flex-col">
          {/* Step 1: File Selection OR Editor */}
          {step === 1 && (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Content Type Tabs */}
               <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg w-fit">
                  {(['video', 'image', 'essay'] as const).map((type) => (
                      <button
                          key={type}
                          onClick={() => {
                              setFormData(prev => ({ ...prev, contentType: type }));
                              if (type !== 'essay') setEssayMode('upload');
                          }}
                          className={`
                              px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize
                              ${formData.contentType === type 
                                  ? 'bg-white text-gray-900 shadow-sm' 
                                  : 'text-gray-500 hover:text-gray-700'}
                          `}
                      >
                          {type}
                      </button>
                  ))}
              </div>

              {/* Sub-mode for Essay */}
              {formData.contentType === 'essay' && (
                  <div className="flex gap-4 border-b border-gray-200 pb-1">
                      <button
                          onClick={() => setEssayMode('upload')}
                          className={`text-sm pb-2 -mb-1.5 border-b-2 transition-colors font-serif ${
                              essayMode === 'upload' ? 'border-gray-800 text-gray-900 font-bold' : 'border-transparent text-gray-400'
                          }`}
                      >
                          Upload Markdown
                      </button>
                      <button
                          onClick={() => setEssayMode('write')}
                          className={`text-sm pb-2 -mb-1.5 border-b-2 transition-colors font-serif ${
                              essayMode === 'write' ? 'border-gray-800 text-gray-900 font-bold' : 'border-transparent text-gray-400'
                          }`}
                      >
                          Write New
                      </button>
                  </div>
              )}

              <div className="flex-1 flex flex-col min-h-0">
                {essayMode === 'write' ? (
                   <div className="flex-1 flex flex-col h-full">
                       <div className="flex justify-end mb-2">
                           <button 
                                onClick={() => setShowPreview(!showPreview)}
                                className="text-xs font-medium text-gray-500 hover:text-gray-900 uppercase tracking-wider"
                           >
                               {showPreview ? 'Back to Edit' : 'Preview Mode'}
                           </button>
                       </div>
                       <RetroPanel variant="inset" className="flex-1 flex flex-col overflow-hidden bg-white">
                            {showPreview ? (
                                <SimpleMarkdown content={editorContent} />
                            ) : (
                                <textarea
                                    className="flex-1 w-full p-6 resize-none outline-none font-mono text-sm bg-white leading-relaxed"
                                    placeholder="# Your Title Here&#10;&#10;Start writing your story..."
                                    value={editorContent}
                                    onChange={(e) => setEditorContent(e.target.value)}
                                />
                            )}
                       </RetroPanel>
                       <div className="mt-2 text-[10px] text-gray-400 font-mono text-right">
                           {editorContent.length} characters
                       </div>
                   </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-8">
                        <div className="w-full max-w-md">
                            <RetroFileUpload
                                label={`Select ${formData.contentType === 'essay' ? 'Markdown File' : 'Media File'}`}
                                accept={formData.contentType === 'essay' ? ".md" : "video/*,image/*"}
                                onChange={handleFileChange}
                                value={formData.file}
                            />
                             <p className="mt-4 text-xs text-gray-400 text-center leading-relaxed max-w-xs mx-auto">
                                {formData.contentType === 'video' && "Supports MP4, WebM. Max 100MB."}
                                {formData.contentType === 'image' && "Supports JPG, PNG, GIF, WebP. High resolution recommended."}
                                {formData.contentType === 'essay' && "Upload a .md file. Images must be hosted externally."}
                            </p>
                        </div>
                    </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Metadata */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <RetroInput
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Give your work a name"
                autoFocus
              />

              <RetroTextarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What is this about?"
                rows={6}
              />

              <RetroInput
                label="Tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g. generative, landscape, monochrome"
              />
            </div>
          )}

          {/* Step 3: Finalize */}
          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
              <RetroPanel variant="outset" className="p-6 bg-white space-y-4">
                  <div className="flex items-start justify-between">
                      <div>
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Access Control</h3>
                          <p className="text-xs text-gray-500 mt-1 max-w-[280px]">
                            Decide who can see your content. Encrypted content requires users to have a subscription key.
                          </p>
                      </div>
                      <RetroToggle
                        checked={formData.requiresSubscription}
                        onChange={(checked) => setFormData(prev => ({ ...prev, requiresSubscription: checked }))}
                      />
                  </div>
                  
                  <div className={`
                      text-xs p-3 rounded border transition-colors duration-300
                      ${formData.requiresSubscription 
                          ? 'bg-blue-50 border-blue-100 text-blue-800' 
                          : 'bg-gray-50 border-gray-100 text-gray-600'}
                  `}>
                      {formData.requiresSubscription ? (
                          <div className="flex items-center gap-2">
                              <span className="text-lg">🔒</span>
                              <span>Content will be <strong>encrypted</strong> and stored on Walrus. Only subscribers can decrypt.</span>
                          </div>
                      ) : (
                          <div className="flex items-center gap-2">
                              <span className="text-lg">🌍</span>
                              <span>Content will be <strong>public</strong>. Anyone with the link can view it.</span>
                          </div>
                      )}
                  </div>
              </RetroPanel>

              {uploading && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs uppercase font-bold text-gray-500">
                        <span>Status</span>
                        <span>{progress}</span>
                    </div>
                    <RetroPanel variant="inset" className="h-4 w-full p-[2px]">
                         <div className="h-full bg-gray-800 animate-pulse w-full opacity-80" />
                    </RetroPanel>
                </div>
              )}
            </div>
          )}

          {/* Footer / Navigation */}
          <div className="mt-auto pt-8 flex justify-between items-center gap-4">
             {error && (
                <div className="absolute bottom-20 left-6 right-6 p-2 bg-red-50 border border-red-200 text-red-600 text-xs text-center">
                    {error}
                </div>
             )}

             {step > 1 && (
                 <RetroButton 
                    variant="secondary" 
                    onClick={() => {
                        setStep(step - 1);
                        setError('');
                    }}
                    disabled={uploading}
                 >
                     ← Back
                 </RetroButton>
             )}
             
             <div className="ml-auto"> {/* Spacer to push Next button to right if Back button is missing */}
                {step < 3 ? (
                     <RetroButton 
                        variant="primary" 
                        onClick={handleNextStep}
                        disabled={essayMode === 'upload' && step === 1 ? !formData.file : false}
                     >
                        Next Step →
                     </RetroButton>
                ) : (
                    <RetroButton 
                        variant="primary" 
                        onClick={handleUpload}
                        isLoading={uploading}
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Publish Content'}
                    </RetroButton>
                )}
             </div>
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}
