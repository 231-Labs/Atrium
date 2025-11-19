"use client";

import { useEffect } from 'react';
import { RetroPanel } from './RetroPanel';

interface RetroModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  children: React.ReactNode;
}

export function RetroModal({ isOpen, onClose, title, size = 'md', children }: RetroModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    fullscreen: 'max-w-full m-0 md:m-4',
  };

  const heightClasses = {
    sm: 'max-h-[80vh]',
    md: 'max-h-[85vh]',
    lg: 'max-h-[90vh]',
    fullscreen: 'h-[100vh] md:h-[calc(100vh-2rem)]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`
          relative w-full ${sizeClasses[size]} ${heightClasses[size]}
          animate-slide-up md:animate-fade-in
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <RetroPanel className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: '#d1d5db' }}
          >
            <h2 
              className="text-lg font-bold text-gray-800"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hidden">
            {children}
          </div>
        </RetroPanel>
      </div>
    </div>
  );
}

