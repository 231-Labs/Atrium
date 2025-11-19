import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AtriumTransformControls } from '@/lib/three/TransformControls';
import { ObjectTransform, TransformMode } from '@/types/spaceEditor';

interface UseTransformControlsProps {
  camera: THREE.Camera | null;
  domElement: HTMLElement | null;
  enabled: boolean;
  onTransformChange?: (transform: ObjectTransform) => void;
  onTransformEnd?: (transform: ObjectTransform) => void;
}

export function useTransformControls({
  camera,
  domElement,
  enabled,
  onTransformChange,
  onTransformEnd,
}: UseTransformControlsProps) {
  const controlsRef = useRef<AtriumTransformControls | null>(null);
  const [mode, setMode] = useState<TransformMode>('translate');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!camera || !domElement) return;

    const controls = new AtriumTransformControls(camera, domElement);
    controlsRef.current = controls;

    controls.onChange((transform) => {
      onTransformChange?.(transform);
    });

    controls.onDragStart(() => {
      setIsDragging(true);
    });

    controls.onDragEnd((transform) => {
      setIsDragging(false);
      onTransformEnd?.(transform);
    });

    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, domElement]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.setEnabled(enabled);
    }
  }, [enabled]);

  const attachToObject = useCallback((object: THREE.Object3D) => {
    controlsRef.current?.attachToObject(object);
  }, []);

  const detach = useCallback(() => {
    controlsRef.current?.detach();
  }, []);

  const changeMode = useCallback((newMode: TransformMode) => {
    setMode(newMode);
    controlsRef.current?.setMode(newMode);
  }, []);

  const getTransform = useCallback((): ObjectTransform => {
    return controlsRef.current?.getTransform() || {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
    };
  }, []);

  const setTransform = useCallback((transform: ObjectTransform) => {
    controlsRef.current?.setTransform(transform);
  }, []);

  return {
    controls: controlsRef.current,
    attachToObject,
    detach,
    mode,
    setMode: changeMode,
    getTransform,
    setTransform,
    isDragging,
  };
}

