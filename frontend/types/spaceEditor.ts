export interface ObjectTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface SceneObject {
  id: string;
  nftId: string;
  objectType: '2d' | '3d';
  name: string;
  thumbnail?: string;
  transform: ObjectTransform;
  visible: boolean;
  listed?: boolean;
  price?: string;
}

export interface SpaceEditorState {
  isEditMode: boolean;
  selectedObject: string | null;
  objects: Map<string, SceneObject>;
  pendingChanges: boolean;
  isDragging: boolean;
}

export type TransformMode = 'translate' | 'rotate' | 'scale';

export interface TransformEvent {
  objectId: string;
  transform: ObjectTransform;
}

