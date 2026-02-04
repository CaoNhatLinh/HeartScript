import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { Image } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useExperienceStore } from '../../store/useExperienceStore';

// Import all images dynamically
const imagesDict = import.meta.glob('/src/assets/img/*', { eager: true, import: 'default' }) as Record<string, string>;
const IMAGE_URLS = Object.values(imagesDict) as string[];

export const MemoryGroup: React.FC<{ visible: boolean; isFinalMode?: boolean }> = ({ visible, isFinalMode = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<Array<THREE.Group | null>>([]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const performanceLevel = useExperienceStore((s) => s.performanceLevel);

  // Precompute base X positions
  const basePositions = IMAGE_URLS.map((_, i) => (i - (IMAGE_URLS.length - 1) / 2) * 1.3);

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

  // if (!visible || IMAGE_URLS.length === 0) return null; // FIX: Keep mounted to avoid lag

  return (
    <group ref={groupRef} visible={true} scale={visible ? 1 : 0.0001}>
      {/* Connecting line */}
      <group position={[0, 1.8, -0.5]}>
        {/* Use a subtle curved line or small decoration here if desired */}
      </group>

      {IMAGE_URLS.map((url, i) => (
        <group
          key={i}
          ref={(el) => (meshRefs.current[i] = el)}
          onClick={(e) => { e.stopPropagation(); setFocusIndex((f) => (f === i ? null : i)); }}
          position={[basePositions[i], 1.8, -0.5]}
        >
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.2, 1.5]} />
            <meshStandardMaterial color="#f0e6d2" roughness={0.8} metalness={0.1} />
          </mesh>
          <Image url={url} scale={[1.0, 1.0]} position={[0, 0.05, 0.02]} transparent />
        </group>
      ))}

      {/* Final heart photo */}
      <group position={[0, 0.5, 0.5]}>
        <FinalHeartPhoto visible={!!isFinalMode} url={IMAGE_URLS[0]} />
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
        <meshBasicMaterial color="#ffc0cb" transparent opacity={0.3} />
      </mesh>
      <group>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.2, 1.5]} />
          <meshStandardMaterial color="#f0e6d2" roughness={0.8} metalness={0.1} />
        </mesh>
        <Image url={url} scale={[1.0, 1.0]} position={[0, 0.1, 0.01]} transparent />
      </group>
    </group>
  );
};