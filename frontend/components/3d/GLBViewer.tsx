'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface GLBViewerProps {
  blobId: string | null | undefined;
  className?: string;
}

export default function GLBViewer({ blobId, className = 'w-full h-full' }: GLBViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !blobId) {
      setLoading(false);
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf9fafb);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 10, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, 5, -5);
    scene.add(directionalLight2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;

    const loader = new GLTFLoader();
    const modelUrl = `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`;

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.multiplyScalar(scale);

        model.position.sub(center.multiplyScalar(scale));

        scene.add(model);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error loading GLB:', err);
        setError('Failed to load 3D avatar');
        setLoading(false);
      }
    );

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }

      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((mat) => mat.dispose());
            } else {
              object.material?.dispose();
            }
          }
        });
      }
    };
  }, [blobId]);

  if (!blobId) {
    return (
      <div className={`${className} relative flex items-center justify-center`} style={{ backgroundColor: '#f9fafb' }}>
        <div className="text-center">
          <span className="text-4xl block mb-2">🤖</span>
          <p className="text-gray-500 text-xs" style={{ fontFamily: 'Georgia, serif' }}>
            No 3D Avatar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${className} relative`} style={{ backgroundColor: '#f9fafb' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div 
              className="w-6 h-6 border-2 rounded-full animate-spin mx-auto mb-2"
              style={{
                borderColor: '#e5e7eb',
                borderTopColor: '#6b7280'
              }}
            />
            <p className="text-gray-500 text-xs" style={{ fontFamily: 'Georgia, serif' }}>
              Loading...
            </p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-3xl block mb-2">⚠️</span>
            <p className="text-gray-600 text-xs" style={{ fontFamily: 'Georgia, serif' }}>
              {error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

