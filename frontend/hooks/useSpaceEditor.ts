import { useState, useCallback, useRef, useEffect } from 'react';
import { SpaceEditorState, SceneObject, ObjectTransform, TransformEvent } from '@/types/spaceEditor';

interface UseSpaceEditorOptions {
  onObjectsChange?: (objects: Map<string, SceneObject>) => void;
}

export function useSpaceEditor(options: UseSpaceEditorOptions = {}) {
  const [state, setState] = useState<SpaceEditorState>({
    isEditMode: false,
    selectedObject: null,
    objects: new Map(),
    pendingChanges: false,
    isDragging: false,
  });

  const objectsRef = useRef<Map<string, SceneObject>>(new Map());

  useEffect(() => {
    objectsRef.current = state.objects;
  }, [state.objects]);

  const setEditMode = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      isEditMode: enabled,
      selectedObject: enabled ? prev.selectedObject : null,
    }));
  }, []);

  const selectObject = useCallback((objectId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedObject: objectId,
    }));
  }, []);

  const addObject = useCallback((object: SceneObject) => {
    setState(prev => {
      const newObjects = new Map(prev.objects);
      newObjects.set(object.id, object);
      
      options.onObjectsChange?.(newObjects);
      
      return {
        ...prev,
        objects: newObjects,
        pendingChanges: true,
      };
    });
  }, [options]);

  const removeObject = useCallback((objectId: string) => {
    setState(prev => {
      const newObjects = new Map(prev.objects);
      newObjects.delete(objectId);
      
      options.onObjectsChange?.(newObjects);
      
      return {
        ...prev,
        objects: newObjects,
        selectedObject: prev.selectedObject === objectId ? null : prev.selectedObject,
        pendingChanges: true,
      };
    });
  }, [options]);

  const updateObjectTransform = useCallback((objectId: string, transform: ObjectTransform) => {
    setState(prev => {
      const object = prev.objects.get(objectId);
      if (!object) return prev;

      const newObjects = new Map(prev.objects);
      newObjects.set(objectId, {
        ...object,
        transform,
      });

      return {
        ...prev,
        objects: newObjects,
        pendingChanges: true,
      };
    });
  }, []);

  const updateObjectScale = useCallback((objectId: string, scale: number) => {
    setState(prev => {
      const object = prev.objects.get(objectId);
      if (!object) return prev;

      const newObjects = new Map(prev.objects);
      newObjects.set(objectId, {
        ...object,
        transform: {
          ...object.transform,
          scale,
        },
      });

      return {
        ...prev,
        objects: newObjects,
        pendingChanges: true,
      };
    });
  }, []);

  const toggleObjectVisibility = useCallback((objectId: string) => {
    setState(prev => {
      const object = prev.objects.get(objectId);
      if (!object) return prev;

      const newObjects = new Map(prev.objects);
      newObjects.set(objectId, {
        ...object,
        visible: !object.visible,
      });

      options.onObjectsChange?.(newObjects);

      return {
        ...prev,
        objects: newObjects,
        pendingChanges: true,
      };
    });
  }, [options]);

  const setObjects = useCallback((objects: SceneObject[]) => {
    const objectsMap = new Map(objects.map(obj => [obj.id, obj]));
    setState(prev => ({
      ...prev,
      objects: objectsMap,
      pendingChanges: false,
    }));
  }, []);

  const clearPendingChanges = useCallback(() => {
    setState(prev => ({
      ...prev,
      pendingChanges: false,
    }));
  }, []);

  const setDragging = useCallback((isDragging: boolean) => {
    setState(prev => ({
      ...prev,
      isDragging,
    }));
  }, []);

  const getObject = useCallback((objectId: string): SceneObject | undefined => {
    return objectsRef.current.get(objectId);
  }, []);

  const getAllObjects = useCallback((): SceneObject[] => {
    return Array.from(objectsRef.current.values());
  }, []);

  const getVisibleObjects = useCallback((): SceneObject[] => {
    return Array.from(objectsRef.current.values()).filter(obj => obj.visible);
  }, []);

  return {
    state,
    setEditMode,
    selectObject,
    addObject,
    removeObject,
    updateObjectTransform,
    updateObjectScale,
    toggleObjectVisibility,
    setObjects,
    clearPendingChanges,
    setDragging,
    getObject,
    getAllObjects,
    getVisibleObjects,
  };
}

