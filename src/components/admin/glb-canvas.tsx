"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Minimal orbit viewer (admin preview only — no perf budget needed). */
export function GlbCanvas({ model }: { model: THREE.Group }) {
  const mount = useRef<THREE.Group>(null);

  useEffect(() => {
    // clone so disposing this preview can't corrupt anything else
    return () => {
      mount.current?.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry?.dispose?.();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat?.dispose?.());
        }
      });
    };
  }, []);

  return (
    <Canvas camera={{ position: [0, 0.4, 3.4], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 3]} intensity={1.4} />
      <directionalLight position={[-3, 1, -2]} intensity={0.8} color="#8899ff" />
      <primitive ref={mount} object={model} />
      <OrbitControls enablePan={false} autoRotate autoRotateSpeed={1.2} minDistance={2} maxDistance={6} />
    </Canvas>
  );
}
