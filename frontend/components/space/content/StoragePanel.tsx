"use client";

import { useState, useEffect } from 'react';
import { RetroPanel } from '@/components/common/RetroPanel';
import { RetroButton } from '@/components/common/RetroButton';
import { RetroHeading } from '@/components/common/RetroHeading';

interface StorageResource {
  id: string;
  blobId: string;
  fileName: string;
  size: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'expiring' | 'expired';
}

interface StoragePanelProps {
  resources: StorageResource[];
  onExtendStorage?: (blobId: string) => void;
  onDeleteResource?: (blobId: string) => void;
  onRefresh?: () => void;
}

export function StoragePanel({ 
  resources, 
  onExtendStorage, 
  onDeleteResource,
  onRefresh 
}: StoragePanelProps) {
  const [totalSize, setTotalSize] = useState(0);

  useEffect(() => {
    const total = resources.reduce((acc, r) => acc + r.size, 0);
    setTotalSize(total);
  }, [resources]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const getDaysUntilExpiration = (expiresAt: string): number => {
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    return Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status: StorageResource['status']) => {
    const badges = {
      active: { color: 'text-green-600 bg-green-50', label: '✓ Active' },
      expiring: { color: 'text-yellow-600 bg-yellow-50', label: '⚠ Expiring Soon' },
      expired: { color: 'text-red-600 bg-red-50', label: '✕ Expired' },
    };
    const badge = badges[status];
    return (
      <span className={`text-xs px-2 py-1 rounded ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <RetroPanel className="h-full flex flex-col">
      <div className="p-4 border-b" style={{ borderColor: '#d1d5db' }}>
        <div className="flex items-center justify-between mb-4">
          <RetroHeading 
            title="Storage Management"
            subtitle={`${resources.length} resources • ${formatSize(totalSize)}`}
            className="mb-0"
          />
          {onRefresh && (
            <RetroButton onClick={onRefresh} variant="secondary" size="sm">
              Refresh
            </RetroButton>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
              Total Storage
            </p>
            <p className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
              {formatSize(totalSize)}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
              Active Files
            </p>
            <p className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
              {resources.filter(r => r.status === 'active').length}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden p-4">
        {resources.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>
              No storage resources yet
            </p>
            <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: 'Georgia, serif' }}>
              Upload content to see storage info
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map(resource => {
              const daysLeft = getDaysUntilExpiration(resource.expiresAt);
              
              return (
                <RetroPanel key={resource.id} variant="outset" className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-800 truncate" style={{ fontFamily: 'Georgia, serif' }}>
                          {resource.fileName}
                        </h4>
                        {getStatusBadge(resource.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                        <div>
                          <span className="text-gray-500">Size:</span> {formatSize(resource.size)}
                        </div>
                        <div>
                          <span className="text-gray-500">Days left:</span> {daysLeft > 0 ? daysLeft : 'Expired'}
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 truncate" style={{ fontFamily: 'Georgia, serif' }}>
                        Blob: {resource.blobId.slice(0, 16)}...
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {resource.status !== 'expired' && onExtendStorage && (
                        <RetroButton
                          variant="secondary"
                          size="sm"
                          onClick={() => onExtendStorage(resource.blobId)}
                        >
                          Extend
                        </RetroButton>
                      )}
                      {onDeleteResource && (
                        <RetroButton
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete ${resource.fileName}?`)) {
                              onDeleteResource(resource.blobId);
                            }
                          }}
                        >
                          Delete
                        </RetroButton>
                      )}
                    </div>
                  </div>

                  {resource.status === 'expiring' && daysLeft <= 7 && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-700" style={{ fontFamily: 'Georgia, serif' }}>
                      ⚠ This file will expire in {daysLeft} days. Extend storage to keep it.
                    </div>
                  )}

                  {resource.status === 'expired' && (
                    <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700" style={{ fontFamily: 'Georgia, serif' }}>
                      ✕ This file has expired and may no longer be accessible.
                    </div>
                  )}
                </RetroPanel>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t" style={{ borderColor: '#d1d5db' }}>
        <div className="text-xs text-gray-500 text-center" style={{ fontFamily: 'Georgia, serif' }}>
          Storage powered by Walrus
        </div>
      </div>
    </RetroPanel>
  );
}

