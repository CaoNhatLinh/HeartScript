'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useExperienceStore } from '../../store/useExperienceStore';

const PARTICLE_COUNT = 200;
const COLORS = [
  new THREE.Color('#FFD700'),
  new THREE.Color('#FF69B4'),
  new THREE.Color('#FF4444'),
  new THREE.Color('#FFFFFF'),
  new THREE.Color('#FF8C00'),
  new THREE.Color('#E040FB'),
];

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  rotation: THREE.Euler;
  color: THREE.Color;
  life: number;
  maxLife: number;
}

export const ConfettiBurst: React.FC = () => {
  const showConfetti = useExperienceStore((s) => s.showConfetti);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const wasShowingRef = useRef(false);

  const particles = useMemo<ParticleData[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      rotSpeed: new THREE.Vector3(
        (Math.sin(i * 1.3) * 0.5 + 0.5) * 10 - 5,
        (Math.cos(i * 2.1) * 0.5 + 0.5) * 10 - 5,
        (Math.sin(i * 3.7) * 0.5 + 0.5) * 10 - 5
      ),
      rotation: new THREE.Euler(0, 0, 0),
      color: COLORS[i % COLORS.length],
      life: 0,
      maxLife: 2 + (i % 20) * 0.1,
    }));
  }, []);

  // Refs for mutable particle data
  const particleLivesRef = useRef<number[]>(new Array(PARTICLE_COUNT).fill(0));
  const particleVelocitiesRef = useRef<THREE.Vector3[]>(particles.map(() => new THREE.Vector3(0, 0, 0)));
  const particlePositionsRef = useRef<THREE.Vector3[]>(particles.map(() => new THREE.Vector3(0, 0, 0)));
  const particleRotationsRef = useRef<THREE.Euler[]>(particles.map(() => new THREE.Euler(0, 0, 0)));

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;

    // Reset particles when confetti starts
    if (showConfetti && !wasShowingRef.current) {
      wasShowingRef.current = true;
      particles.forEach((p, i) => {
        particleLivesRef.current[i] = 0;
        particlePositionsRef.current[i].set(0, 2, 0);
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.sin(i) * 0.5;
        const force = 3 + (i % 10) * 0.5;
        particleVelocitiesRef.current[i].set(
          Math.cos(angle) * force * (0.5 + Math.sin(i * 0.7) * 0.5),
          3 + (i % 8) * 0.8,
          Math.sin(angle) * force * (0.5 + Math.cos(i * 1.1) * 0.5)
        );
        particleRotationsRef.current[i].set(0, 0, 0);
      });

      // Set colors
      particles.forEach((p, i) => {
        mesh.setColorAt(i, p.color);
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    if (!showConfetti) {
      wasShowingRef.current = false;
    }

    const clampedDelta = Math.min(delta, 0.05);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const life = particleLivesRef.current[i];
      const velocity = particleVelocitiesRef.current[i];
      const position = particlePositionsRef.current[i];
      const rotation = particleRotationsRef.current[i];

      if (wasShowingRef.current && life < p.maxLife) {
        particleLivesRef.current[i] = life + clampedDelta;

        // Gravity
        velocity.y -= 9.8 * clampedDelta;
        // Air resistance
        velocity.x *= 1 - 1.5 * clampedDelta;
        velocity.z *= 1 - 1.5 * clampedDelta;

        position.x += velocity.x * clampedDelta;
        position.y += velocity.y * clampedDelta;
        position.z += velocity.z * clampedDelta;

        rotation.x += p.rotSpeed.x * clampedDelta;
        rotation.y += p.rotSpeed.y * clampedDelta;
        rotation.z += p.rotSpeed.z * clampedDelta;

        const fadeRatio = Math.max(0, 1 - life / p.maxLife);
        dummy.position.copy(position);
        dummy.rotation.copy(rotation);
        dummy.scale.setScalar(fadeRatio * 0.08);
      } else {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0);
      }

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial side={THREE.DoubleSide} transparent />
    </instancedMesh>
  );
};
