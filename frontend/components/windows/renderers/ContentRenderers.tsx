/**
 * Content Renderers - Strategy Pattern
 * Different rendering strategies for various content types
 */

import React from 'react';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';

/**
 * Text/Essay Renderer - 使用 MarkdownRenderer 正確解析 Markdown
 */
export const TextRenderer: React.FC<{ content: string; title: string }> = ({ content, title }) => {
  return (
    <div className="w-full h-full bg-white overflow-y-auto scrollbar-hidden p-8">
      <MarkdownRenderer 
        content={content} 
        title={title}
        showTitle={true}
        className="h-full"
      />
    </div>
  );
};

/**
 * Video Renderer
 */
export const VideoRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="w-full h-full bg-black flex flex-col">
      {content ? (
        <video 
          src={content} 
          controls 
          autoPlay 
          className="w-full h-full object-contain"
          controlsList="nodownload"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Video unavailable
        </div>
      )}
    </div>
  );
};

/**
 * Image Renderer
 */
export const ImageRenderer: React.FC<{ content: string; title?: string }> = ({ content, title }) => {
  return (
    <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-4">
      <img 
        src={content} 
        alt={title || 'Image'} 
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};

