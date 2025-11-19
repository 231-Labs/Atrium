'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { RetroButton } from '@/components/common/RetroButton';
import { RetroPanel } from '@/components/common/RetroPanel';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  view?: 'explore' | 'my-space' | 'subscribed' | 'settings';
}

interface SidebarProps {
  onViewChange?: (view: 'explore' | 'my-space' | 'subscribed' | 'settings') => void;
  activeView?: 'explore' | 'my-space' | 'subscribed' | 'settings';
  isRegistering?: boolean;
  isDisabled?: boolean;
  hasIdentity?: boolean;
}

export function Sidebar({ onViewChange, activeView = 'explore', isRegistering = false, isDisabled = false, hasIdentity = true }: SidebarProps = {}) {
  const router = useRouter();
  const currentAccount = useCurrentAccount();

  const menuItems: SidebarItem[] = [
    {
      id: 'explore',
      label: 'Explore',
      icon: '🌍',
      view: 'explore',
    },
    {
      id: 'my-space',
      label: 'My Space',
      icon: '🏛️',
      view: 'my-space',
    },
    {
      id: 'subscribed',
      label: 'Subscribed',
      icon: '⭐',
      view: 'subscribed',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      view: 'settings',
    },
  ];

  const handleNavigation = (item: SidebarItem) => {
    if (isDisabled || isRegistering) return;
    
    if (item.view && onViewChange) {
      if (!hasIdentity && item.view !== 'explore') {
        return;
      }
      onViewChange(item.view);
    }
  };

  return (
    <RetroPanel 
      variant="outset" 
      className="w-full md:w-64 flex-shrink-0 md:h-full flex flex-col"
    >
      {/* Mobile Wallet Bar */}
      <div 
        className="md:hidden px-3 py-1 border-b"
        style={{ 
          borderColor: '#d1d5db',
          background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
        }}
      >
        {currentAccount ? (
          <div className="flex items-center justify-center gap-1">
            <span 
              className="text-[10px] text-gray-500"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Connected:
            </span>
            <p 
              className="text-[10px] font-mono text-gray-700 truncate"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {currentAccount.address.slice(0, 10)}...{currentAccount.address.slice(-8)}
            </p>
            <span className="text-gray-400 mx-1">|</span>
            <button
              onClick={() => {
                if (isRegistering) {
                  // In registration mode, reload page to disconnect
                  window.location.reload();
                } else {
                  const settingsItem = menuItems.find(item => item.id === 'settings');
                  if (settingsItem) handleNavigation(settingsItem);
                }
              }}
              className="text-[10px] text-gray-600 hover:text-gray-800 underline"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              change
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <p 
              className="text-[10px] text-gray-500"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Wallet not connected
            </p>
          </div>
        )}
      </div>

      {/* Header - Desktop only */}
      <div 
        className="p-4 md:p-6 border-b hidden md:block"
        style={{ 
          borderColor: '#d1d5db',
          background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
        }}
      >
        <h1 
          className="text-2xl font-bold text-gray-800 mb-1"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Atrium
        </h1>
        <p 
          className="text-xs text-gray-400 uppercase tracking-wider"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Creator Platform
        </p>
      </div>

      {/* User Info - Desktop only */}
      <div className="m-4 hidden md:block">
        {currentAccount ? (
          <RetroPanel variant="inset" className="p-3 md:p-4">
            <div>
                <p 
                  className="text-xs text-gray-500 mb-1 uppercase tracking-wide"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Connected
                </p>
              <div className="flex items-center gap-1">
                <p 
                  className="text-xs font-mono text-gray-800 truncate"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-6)}
                </p>
                <span className="text-gray-400">|</span>
                <button
                  onClick={() => {
                    if (isRegistering) {
                      // In registration mode, reload page to disconnect
                      window.location.reload();
                    } else {
                      const settingsItem = menuItems.find(item => item.id === 'settings');
                      if (settingsItem) handleNavigation(settingsItem);
                    }
                  }}
                  className="text-xs text-gray-600 hover:text-gray-800 underline"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  change
                </button>
              </div>
            </div>
          </RetroPanel>
        ) : (
          <RetroPanel variant="inset" className="p-4">
            <p 
              className="text-xs text-gray-500 text-center"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Not Connected
            </p>
          </RetroPanel>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="md:flex-1 p-1 md:p-4 flex md:flex-col md:space-y-2 justify-around md:justify-start md:space-x-0">
        {menuItems.map((item) => {
          const isActive = item.view === activeView;
          const isItemDisabled = isDisabled || 
                                 (isRegistering && item.id !== 'explore') ||
                                 (!hasIdentity && item.id !== 'explore');
          
          return (
            <button
              key={item.id}
              onClick={() => !isItemDisabled && handleNavigation(item)}
              disabled={isItemDisabled}
              className="flex-1 md:flex-none md:w-full text-center md:text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                padding: '6px 8px',
                borderTop: isActive ? '2px solid #d1d5db' : '2px solid transparent',
                borderLeft: isActive ? '2px solid #d1d5db' : '2px solid transparent',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid transparent',
                borderRight: isActive ? '2px solid #ffffff' : '2px solid transparent',
                boxShadow: isActive 
                  ? 'inset 1px 1px 2px rgba(0, 0, 0, 0.05)' 
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive && !isItemDisabled) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !isItemDisabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="flex md:flex-row flex-col md:items-center items-center gap-0.5 md:gap-3">
                <span className="text-base md:text-xl">{item.icon}</span>
                <span 
                  className="text-[10px] md:text-sm font-medium whitespace-nowrap"
                  style={{ 
                    fontFamily: 'Georgia, serif',
                    color: isActive ? '#1f2937' : '#6b7280',
                  }}
                >
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-2 md:p-4 border-t space-y-2 hidden md:block" style={{ borderColor: '#d1d5db' }}>
        <RetroButton
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => router.push('/about')}
        >
          About Atrium
        </RetroButton>
      </div>

      {/* Version Info */}
      <div 
        className="p-2 md:p-4 text-center border-t hidden md:block"
        style={{ 
          borderColor: '#d1d5db',
          backgroundColor: '#f9fafb',
        }}
      >
        <p 
          className="text-xs text-gray-400"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Version 1.0.0
        </p>
      </div>
    </RetroPanel>
  );
}

