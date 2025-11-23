import { useState, useCallback } from 'react';
import { WindowType, WindowPosition, WindowManagerState, WindowInstance } from '@/types/window';
import { defaultWindowConfigs } from '@/config/windows';

export function useWindowManager() {
  const [state, setState] = useState<WindowManagerState>({
    windows: {},
    activeWindowId: null,
    draggingWindowId: null,
    maxZIndex: 100,
  });

  const generateWindowId = useCallback((type: WindowType): string => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const getCenterPosition = useCallback((width: number, height: number, offset: number = 0): WindowPosition => {
    if (typeof window === 'undefined') {
      return { x: 0, y: 0 };
    }
    
    const baseX = Math.max(0, Math.round((window.innerWidth - width) / 2));
    const baseY = Math.max(0, Math.round((window.innerHeight - height - 48) / 2));
    
    const x = Math.min(baseX + offset, window.innerWidth - width - 20);
    const y = Math.min(baseY + offset, window.innerHeight - height - 68);
    
    return { x, y };
  }, []);

  const activateWindow = useCallback((windowId: string) => {
    setState(prev => {
      if (!prev.windows[windowId]) return prev;
      
      const newMaxZIndex = prev.maxZIndex + 1;
      return {
        ...prev,
        activeWindowId: windowId,
        windows: {
          ...prev.windows,
          [windowId]: {
            ...prev.windows[windowId],
            zIndex: newMaxZIndex,
          },
        },
        maxZIndex: newMaxZIndex,
      };
    });
  }, []);

  const openWindow = useCallback((
    type: WindowType,
    options?: {
      title?: string;
      data?: Record<string, any>;
    }
  ): string => {
    const windowId = generateWindowId(type);
    const config = defaultWindowConfigs[type];
    
    setState(prev => {
      const windowCount = Object.keys(prev.windows).length;
      const offset = windowCount * 30;
      const position = getCenterPosition(
        config.defaultSize.width,
        config.defaultSize.height,
        offset
      );

      const newZIndex = prev.maxZIndex + 1;

      const newWindow: WindowInstance = {
        id: windowId,
        type,
        title: options?.title || config.title,
        position,
        size: config.defaultSize,
        zIndex: newZIndex,
        resizable: config.resizable,
        data: options?.data,
      };

      return {
        ...prev,
        windows: {
          ...prev.windows,
          [windowId]: newWindow,
        },
        activeWindowId: windowId,
        maxZIndex: newZIndex,
      };
    });

    return windowId;
  }, [generateWindowId, getCenterPosition]);

  const closeWindow = useCallback((windowId: string) => {
    setState(prev => {
      const { [windowId]: removed, ...remainingWindows } = prev.windows;
      
      let newActiveWindowId = prev.activeWindowId === windowId ? null : prev.activeWindowId;
      if (newActiveWindowId === null && Object.keys(remainingWindows).length > 0) {
        const sortedWindows = Object.entries(remainingWindows)
          .sort(([, a], [, b]) => b.zIndex - a.zIndex);
        newActiveWindowId = sortedWindows[0]?.[0] || null;
      }

      return {
        ...prev,
        windows: remainingWindows,
        activeWindowId: newActiveWindowId,
      };
    });
  }, []);

  const startDragging = useCallback((e: React.MouseEvent<Element>, windowId: string) => {
    e.preventDefault();
    activateWindow(windowId);
    
    let offsetX = 0;
    let offsetY = 0;
    
    setState(prev => {
      const win = prev.windows[windowId];
      if (!win) return prev;
      
      offsetX = e.clientX - win.position.x;
      offsetY = e.clientY - win.position.y;
      return { ...prev, draggingWindowId: windowId };
    });

    const handleMouseMove = (e: MouseEvent) => {
      setState(prev => {
        const win = prev.windows[windowId];
        if (!win) return prev;
        
        const maxX = document.documentElement.clientWidth - win.size.width;
        const maxY = document.documentElement.clientHeight - win.size.height - 48;
        
        const newX = Math.max(0, Math.min(e.clientX - offsetX, maxX));
        const newY = Math.max(0, Math.min(e.clientY - offsetY, maxY));
        
        return {
          ...prev,
          windows: {
            ...prev.windows,
            [windowId]: {
              ...win,
              position: { x: newX, y: newY }
            }
          }
        };
      });
    };

    const handleMouseUp = () => {
      setState(prev => ({ ...prev, draggingWindowId: null }));
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [activateWindow]);

  const resizeWindow = useCallback((e: React.MouseEvent, windowId: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;

    setState(prev => {
      const win = prev.windows[windowId];
      if (!win) return prev;

      const startWidth = win.size.width;
      const startHeight = win.size.height;

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        setState(current => {
          const win = current.windows[windowId];
          if (!win) return current;

          return {
            ...current,
            windows: {
              ...current.windows,
              [windowId]: {
                ...win,
                size: {
                  width: Math.max(200, startWidth + (e.clientX - startX)),
                  height: Math.max(100, startHeight + (e.clientY - startY)),
                }
              }
            }
          };
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return prev;
    });
  }, []);

  const getWindow = useCallback((windowId: string): WindowInstance | undefined => {
    return state.windows[windowId];
  }, [state.windows]);

  const getWindowsByType = useCallback((type: WindowType): WindowInstance[] => {
    return Object.values(state.windows).filter(w => w.type === type);
  }, [state.windows]);

  return {
    windows: state.windows,
    activeWindowId: state.activeWindowId,
    draggingWindowId: state.draggingWindowId,
    openWindow,
    closeWindow,
    activateWindow,
    startDragging,
    resizeWindow,
    getWindow,
    getWindowsByType,
  };
}

