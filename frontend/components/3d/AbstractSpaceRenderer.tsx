'use client';

import React, { useEffect, useRef } from 'react';
import type { SpaceState } from '@/types/spaceState';
import { AbstractSpaceScene } from '@/lib/three/AbstractSpaceScene';
import type { AbstractSpaceSceneConfig } from '@/lib/three/AbstractSpaceScene';

export interface AbstractSpaceRendererProps {
  state: SpaceState;
  performanceMode?: 'high' | 'medium' | 'low';
  className?: string;
}

const AbstractSpaceRenderer: React.FC<AbstractSpaceRendererProps> = ({
  state,
  performanceMode = 'high',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<AbstractSpaceScene | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Set canvas size to match container
    const updateSize = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      if (sceneRef.current) {
        sceneRef.current.resize(width, height);
      }
    };

    updateSize();

    // Create scene
    const config: AbstractSpaceSceneConfig = {
      enableLineGrid: true,
      enableVortex: true,
      enableParticles: true,
      enableTopology: true,
      performanceMode,
    };

    try {
      sceneRef.current = new AbstractSpaceScene(canvas, config);
      console.log('✅ AbstractSpaceScene initialized');

      // Apply initial state
      if (state) {
        sceneRef.current.updateFromSpaceState(state);
      }
    } catch (error) {
      console.error('❌ Failed to initialize AbstractSpaceScene:', error);
    }

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, [performanceMode]);

  // Update state when it changes
  useEffect(() => {
    if (sceneRef.current && state) {
      console.log('🔄 Updating space state:', state);
      sceneRef.current.updateFromSpaceState(state);
    }
  }, [state]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default AbstractSpaceRenderer;
