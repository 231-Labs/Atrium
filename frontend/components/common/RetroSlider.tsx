import React, { useRef, useState, useEffect, useCallback } from 'react';

interface RetroSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

export const RetroSlider = React.forwardRef<HTMLDivElement, RetroSliderProps>(
  ({ min = 0, max = 100, step = 1, value, onChange, className = '', disabled = false }, ref) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Ensure value is within bounds
    const clampedValue = Math.min(Math.max(value, min), max);
    
    // Calculate percentage for thumb position
    const percentage = ((clampedValue - min) / (max - min)) * 100;

    const handleMove = useCallback((clientX: number) => {
      if (!trackRef.current || disabled) return;
      
      const rect = trackRef.current.getBoundingClientRect();
      const width = rect.width;
      const left = rect.left;
      
      // Calculate new value based on position
      let newValue = ((clientX - left) / width) * (max - min) + min;
      
      // Apply step
      if (step > 0) {
        newValue = Math.round(newValue / step) * step;
      }
      
      // Clamp
      newValue = Math.min(Math.max(newValue, min), max);
      
      if (newValue !== value) {
        onChange(newValue);
      }
    }, [min, max, step, value, onChange, disabled]);

    const handleMouseDown = (e: React.MouseEvent) => {
      if (disabled) return;
      setIsDragging(true);
      handleMove(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (disabled) return;
      setIsDragging(true);
      handleMove(e.touches[0].clientX);
    };

    useEffect(() => {
      const onMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          handleMove(e.clientX);
        }
      };
      
      const onMouseUp = () => {
        setIsDragging(false);
      };

      const onTouchMove = (e: TouchEvent) => {
        if (isDragging) {
          handleMove(e.touches[0].clientX);
        }
      };

      const onTouchEnd = () => {
        setIsDragging(false);
      };

      if (isDragging) {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchend', onTouchEnd);
      }

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };
    }, [isDragging, handleMove]);

    return (
      <div 
        ref={ref}
        className={`relative h-6 flex items-center select-none ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track - Inset Style */}
        <div 
          ref={trackRef}
          className="w-full h-2 bg-gray-100 relative"
          style={{
            borderTop: '2px solid #9ca3af',
            borderLeft: '2px solid #9ca3af',
            borderBottom: '2px solid #f3f4f6',
            borderRight: '2px solid #f3f4f6',
            boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {/* Fill/Progress (Optional - maybe just a different color for filled part like old Windows progress bars?) 
              For a slider, often there is no fill, just the thumb. Let's keep it simple first.
          */}
        </div>

        {/* Thumb - Outset Style */}
        <div
          className="absolute top-0 w-4 h-6 bg-gray-200 transform -translate-x-1/2 hover:bg-gray-100 transition-colors"
          style={{
            left: `${percentage}%`,
            borderTop: '2px solid #f3f4f6',
            borderLeft: '2px solid #f3f4f6',
            borderBottom: '2px solid #4b5563',
            borderRight: '2px solid #4b5563',
            boxShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }}
        >
           {/* Thumb Grip Lines */}
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5">
             <div className="w-2 h-px bg-gray-400"></div>
             <div className="w-2 h-px bg-gray-400"></div>
             <div className="w-2 h-px bg-gray-400"></div>
           </div>
        </div>
      </div>
    );
  }
);

RetroSlider.displayName = 'RetroSlider';

