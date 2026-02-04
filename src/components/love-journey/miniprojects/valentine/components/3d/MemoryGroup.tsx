'use client';

import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useExperienceStore } from '../../store/useExperienceStore';

const MemoryImage: React.FC<{ url: string; position: [number, number, number] }> = ({ url, position }) => {
  const texture = useTexture(url);

  return (
    <mesh position={position}>
      <planeGeometry args={[1.0, 1.0]} />
      <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

// Import all images manually (Turbopack compatible)
const IMAGE_URLS = [
  '/valentine/img/anh1.png',
  '/valentine/img/anh2.png',
  '/valentine/img/anh3.png',
  '/valentine/img/anh4.png',
  '/valentine/img/anh5.png',
];

// Preload to avoid pop-in
IMAGE_URLS.forEach(url => useTexture.preload(url));

export const MemoryGroup: React.FC<{ visible: boolean; isFinalMode?: boolean }> = ({ visible, isFinalMode = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<Array<THREE.Group | null>>([]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const performanceLevel = useExperienceStore((s) => s.performanceLevel);

  // Precompute base X positions
  const basePositions = React.useMemo(() =>
    IMAGE_URLS.map((_, i) => (i - (IMAGE_URLS.length - 1) / 2) * 1.3),
    []);

  // Single useFrame drives all motion for the group to reduce per-object frames
  useFrame((state, delta) => {
    if (!visible) return;
    if (performanceLevel === 'low') return; // skip heavy motion on low

    const time = state.clock.elapsedTime;

    for (let i = 0; i < IMAGE_URLS.length; i++) {
      const node = meshRefs.current[i];
      if (!node) continue;

      const x = basePositions[i];
      // Wind formula (shared) - reduced amplitude to be subtle and cheaper
      const baseY = 1.6 + Math.pow(x * 0.2, 2);
      const wind = Math.sin(time * 0.8 + x * 0.5) * 0.12;
      const breeze = Math.sin(time * 2.2 + x * 1.2) * 0.02;
      const y = baseY + wind + breeze + (i % 2 === 0 ? 0.02 : -0.02);
      const z = -0.4 + Math.pow(Math.abs(x) * 0.08, 2) + Math.cos(time * 0.6 + x * 0.4) * 0.04;

      if (focusIndex === i) {
        // Bring to center and forward
        node.position.lerp(new THREE.Vector3(0, 0, 1.6), delta * 6);
        node.scale.lerp(new THREE.Vector3(1.6, 1.6, 1.6), delta * 6);
      } else if (focusIndex !== null) {
        // Dimmed and slightly out
        node.position.lerp(new THREE.Vector3(x * 1.1, y, -0.5), delta * 3);
        node.scale.lerp(new THREE.Vector3(0.6, 0.6, 0.6), delta * 4);
      } else {
        // Normal sway
        node.position.lerp(new THREE.Vector3(x, y, z), delta * 4);
        node.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 4);

        // Face the center (0, y, 8) to avoid vertical tilt, but keep horizontal curve
        node.lookAt(0, y, 8);

        // Apply wind sway (roll) AFTER lookAt to ensure it persists
        node.rotateZ(Math.sin(time * 1.5 + x) * 0.05);
      }
    }
  });

  return (
    <group ref={groupRef} visible={visible}>
      {IMAGE_URLS.map((url, i) => (
        <group
          key={i}
          ref={(el) => (meshRefs.current[i] = el)}
          onClick={(e) => { e.stopPropagation(); setFocusIndex((f) => (f === i ? null : i)); }}
          position={[basePositions[i], 1.8, -0.5]}
        >
          {/* Frame */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.2, 1.5]} />
            <meshStandardMaterial color="#f0e6d2" roughness={0.8} metalness={0.1} />
          </mesh>

          {/* Photo with Suspense Fallback */}
          <React.Suspense fallback={
            <mesh position={[0, 0.05, 0.02]}>
              <planeGeometry args={[1.0, 1.0]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          }>
            <MemoryImage url={url} position={[0, 0.05, 0.02]} />
          </React.Suspense>
        </group>
      ))}

      {/* Final heart photo */}
      <group position={[0, 0.5, 0.5]}>
        <React.Suspense fallback={null}>
          <FinalHeartPhoto visible={!!isFinalMode} url={IMAGE_URLS[0]} />
        </React.Suspense>
      </group>
    </group>
  );
};

const FinalHeartPhoto: React.FC<{ visible: boolean; url: string }> = ({ visible, url }) => {
  const meshRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetScale = visible ? 1.2 : 0;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2);
    meshRef.current.position.y = Math.sin(performance.now() * 0.001) * 0.05;
  });

  return (
    <group ref={meshRef} scale={0}>
      <pointLight color="#ff4d6d" intensity={visible ? 1.5 : 0} distance={3} decay={2} />
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[2.4, 2.8]} />
        <meshBasicMaterial color="#ffc0cb" />
      </mesh>
      <group>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.2, 1.5]} />
          <meshStandardMaterial color="#f0e6d2" roughness={0.8} metalness={0.1} />
        </mesh>
        <MemoryImage url={url} position={[0, 0.1, 0.01]} />
      </group>
    </group>
  );
};