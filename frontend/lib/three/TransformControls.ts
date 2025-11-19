import * as THREE from 'three';
import { TransformControls as ThreeTransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { ObjectTransform, TransformMode } from '@/types/spaceEditor';

export class AtriumTransformControls {
  private controls: ThreeTransformControls;
  private attachedObject: THREE.Object3D | null = null;
  private onChangeCallback: ((transform: ObjectTransform) => void) | null = null;
  private onDragStartCallback: (() => void) | null = null;
  private onDragEndCallback: ((transform: ObjectTransform) => void) | null = null;

  constructor(camera: THREE.Camera, domElement: HTMLElement) {
    this.controls = new ThreeTransformControls(camera, domElement);
    this.controls.setMode('translate');
    this.controls.setSpace('world');
    
    this.controls.addEventListener('change', () => this.handleChange());
    this.controls.addEventListener('dragging-changed', (event: any) => {
      if (event.value) {
        this.onDragStartCallback?.();
      } else {
        if (this.attachedObject) {
          this.onDragEndCallback?.(this.getTransform());
        }
      }
    });
  }

  get object(): THREE.Object3D {
    return this.controls as unknown as THREE.Object3D;
  }

  attachToObject(object: THREE.Object3D): void {
    this.attachedObject = object;
    this.controls.attach(object);
  }

  detach(): void {
    this.controls.detach();
    this.attachedObject = null;
  }

  setMode(mode: TransformMode): void {
    this.controls.setMode(mode);
  }

  getMode(): TransformMode {
    return this.controls.mode as TransformMode;
  }

  setSpace(space: 'world' | 'local'): void {
    this.controls.setSpace(space);
  }

  getTransform(): ObjectTransform {
    if (!this.attachedObject) {
      return {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 1,
      };
    }

    return {
      position: [
        this.attachedObject.position.x,
        this.attachedObject.position.y,
        this.attachedObject.position.z,
      ],
      rotation: [
        this.attachedObject.rotation.x,
        this.attachedObject.rotation.y,
        this.attachedObject.rotation.z,
      ],
      scale: this.attachedObject.scale.x,
    };
  }

  setTransform(transform: ObjectTransform): void {
    if (!this.attachedObject) return;

    this.attachedObject.position.set(...transform.position);
    this.attachedObject.rotation.set(...transform.rotation);
    this.attachedObject.scale.setScalar(transform.scale);
  }

  onChange(callback: (transform: ObjectTransform) => void): void {
    this.onChangeCallback = callback;
  }

  onDragStart(callback: () => void): void {
    this.onDragStartCallback = callback;
  }

  onDragEnd(callback: (transform: ObjectTransform) => void): void {
    this.onDragEndCallback = callback;
  }

  private handleChange(): void {
    if (this.attachedObject && this.onChangeCallback) {
      this.onChangeCallback(this.getTransform());
    }
  }

  setEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  dispose(): void {
    this.controls.removeEventListener('change', () => this.handleChange());
    this.controls.dispose();
    this.attachedObject = null;
    this.onChangeCallback = null;
    this.onDragStartCallback = null;
    this.onDragEndCallback = null;
  }
}

