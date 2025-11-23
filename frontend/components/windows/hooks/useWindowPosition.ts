import { useState, useEffect, useRef } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

interface WindowPosition {
  x: number;
  y: number;
}

export function useWindowPosition(
  defaultSize: WindowSize, 
  initialPosition?: WindowPosition
) {
  const [position, setPosition] = useState<WindowPosition>(
    initialPosition || { x: 0, y: 0 }
  );
  const [size, setSize] = useState<WindowSize>(defaultSize);
  const [mounted, setMounted] = useState(false);
  
  const dragRef = useRef<{ 
    startX: number; 
    startY: number; 
    initialX: number; 
    initialY: number;
  } | null>(null);
  
  const resizeRef = useRef<{ 
    startX: number; 
    startY: number; 
    startWidth: number; 
    startHeight: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !initialPosition) {
      const x = Math.max(0, (window.innerWidth - defaultSize.width) / 2);
      const y = Math.max(50, (window.innerHeight - defaultSize.height) / 4);
      setPosition({ x, y });
      setMounted(true);
    } else {
      setMounted(true);
    }
  }, [defaultSize.width, defaultSize.height, initialPosition]);

  const centerWindow = () => {
    if (typeof window !== 'undefined') {
      const x = Math.max(0, (window.innerWidth - size.width) / 2);
      const y = Math.max(50, (window.innerHeight - size.height) / 4);
      setPosition({ x, y });
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
    
    const handleDrag = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      
      const newX = Math.max(0, Math.min(
        dragRef.current.initialX + dx, 
        window.innerWidth - size.width
      ));
      const newY = Math.max(0, Math.min(
        dragRef.current.initialY + dy, 
        window.innerHeight - size.height
      ));

      setPosition({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height
    };

    const handleResize = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      
      setSize({
        width: Math.max(400, resizeRef.current.startWidth + dx),
        height: Math.max(300, resizeRef.current.startHeight + dy)
      });
    };

    const handleResizeEnd = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  return {
    position,
    setPosition,
    size,
    setSize,
    mounted,
    centerWindow,
    handleDragStart,
    handleResizeStart,
  };
}

