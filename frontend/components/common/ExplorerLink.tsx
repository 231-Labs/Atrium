'use client';

import React from 'react';

interface ExplorerLinkProps {
  objectId: string;
  network?: 'testnet' | 'mainnet';
  className?: string;
  children?: React.ReactNode;
}

export function ExplorerLink({ 
  objectId, 
  network = 'testnet',
  className = '',
  children 
}: ExplorerLinkProps) {
  const explorerUrl = network === 'mainnet'
    ? `https://suiscan.xyz/mainnet/object/${objectId}`
    : `https://suiscan.xyz/testnet/object/${objectId}`;

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-1
        text-sm hover:underline
        transition-colors duration-150
        ${className}
      `}
      style={{
        fontFamily: 'Georgia, serif',
        color: '#2563eb',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#1d4ed8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#2563eb';
      }}
    >
      {children || objectId}
      <svg 
        className="w-3 h-3" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
        />
      </svg>
    </a>
  );
}

