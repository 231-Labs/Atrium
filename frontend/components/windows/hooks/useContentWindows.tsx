import React from 'react';
import { useWindowManager } from './useWindowManager';
import Window from '@/components/windows/Window';
import { EssayWindow } from '@/components/windows/EssayWindow';
import { VideoWindow } from '@/components/windows/VideoWindow';

export function useContentWindows() {
  const {
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    activateWindow,
    startDragging,
    resizeWindow,
  } = useWindowManager();

  const openEssay = (
    blobId: string,
    spaceId: string,
    title: string,
    isLocked: boolean,
    isCreator: boolean = false,
    authId?: string,
  ) => {
    openWindow('essay-reader', {
      title: title,
      data: {
        blobId,
        spaceId,
        title,
        isLocked,
        isCreator,
        authId,
      }
    });
  };

  const openVideo = (
    blobId: string,
    resourceId: string,
    title: string,
    isLocked: boolean,
    isCreator: boolean = false,
    authId?: string,
  ) => {
    openWindow('video-player', {
      title: title,
      data: {
        blobId,
        resourceId,
        title,
        isLocked,
        isCreator,
        authId,
      }
    });
  };

  const renderWindows = (options?: { isMobile?: boolean }) => {
    const isMobile = options?.isMobile || false;
    
    return (
      <>
        {Object.values(windows)
          .filter(window => {
            if (isMobile) {
              return window.id === activeWindowId;
            }
            return true;
          })
          .map(window => {
            let content = null;

            if (window.type === 'video-player') {
              content = (
                <VideoWindow 
                  blobId={window.data?.blobId}
                  resourceId={window.data?.resourceId}
                  title={window.data?.title}
                  isLocked={window.data?.isLocked}
                  isCreator={window.data?.isCreator}
                  authId={window.data?.authId}
                />
              );
            } else if (window.type === 'essay-reader') {
              content = (
                <EssayWindow
                  blobId={window.data?.blobId}
                  spaceId={window.data?.spaceId}
                  title={window.data?.title}
                  isLocked={window.data?.isLocked}
                  isCreator={window.data?.isCreator}
                  authId={window.data?.authId}
                />
              );
            }

            if (!content) return null;

            return (
              <Window
                key={window.id}
                id={window.id}
                title={window.title}
                position={window.position}
                size={window.size}
                isActive={activeWindowId === window.id}
                zIndex={window.zIndex}
                onClose={closeWindow}
                onDragStart={startDragging}
                onResize={resizeWindow}
                onClick={() => activateWindow(window.id)}
                resizable={window.resizable}
              >
                {content}
              </Window>
            );
          })}
      </>
    );
  };

  return {
    openEssay,
    openVideo,
    renderWindows,
    windows,
    closeWindow,
  };
}

