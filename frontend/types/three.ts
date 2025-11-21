/**
 * Three.js related type definitions for Atrium
 */

import { AtriumGallerySceneConfig } from '../lib/three/AtriumGalleryScene';
import * as THREE from 'three';

// Configuration for Three.js scene rendering
export interface ThreeSceneConfig {
  backgroundColor?: number;
  ambientLightColor?: number;
  ambientLightIntensity?: number;
  directionalLightColor?: number;
  directionalLightIntensity?: number;
  enableShadows?: boolean;
  cameraPosition?: [number, number, number];
  galleryScene?: AtriumGallerySceneConfig;
}

// Options for loading GLB models
export interface LoadGLBOptions {
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  castShadow?: boolean;
  receiveShadow?: boolean;
  name?: string;
  onProgress?: (progress: ProgressEvent) => void;
}

// 3D Model item from Kiosk
export interface Model3DItem {
  id: string;
  name: string;
  blobId?: string;
  modelUrl?: string;
  is2D?: boolean;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
}

export interface ThreeSceneApi {
  loadModel: (model: Model3DItem) => Promise<THREE.Group | null>;
  loadModels: (models: Model3DItem[]) => Promise<THREE.Group[]>;
  removeModel: (id: string) => void;
  clearModels: () => void;
  attachTransformControls: (object: THREE.Object3D) => void;
  attachTransformControlsById: (modelId: string) => boolean;
  detachTransformControls: () => void;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  pickObject: (x: number, y: number) => THREE.Object3D | null;
  getSceneState: () => any[];
  playIntroAnimation: (config?: { duration?: number; startDistanceMultiplier?: number; startHeightOffset?: number }) => Promise<void>;
  setTransformCallbacks: (onDraggingChanged?: (isDragging: boolean) => void, onTransformChange?: () => void) => void;
  updateModelPosition: (modelId: string, position: { x: number; y: number; z: number }) => void;
  updateModelRotation: (modelId: string, rotation: { x: number; y: number; z: number }) => void;
  updateModelScale: (modelId: string, scale: { x: number; y: number; z: number }) => void;
  loadedModels: Array<{ id: string; model: THREE.Group }>;
  canvas: HTMLCanvasElement | null;
}
