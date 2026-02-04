import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';

export const MeteorShower: React.FC<{ speed?: number }> = ({ speed }) => {
    const active = useExperienceStore((s) => s.activeLayers.meteor);
    const performanceLevel = useExperienceStore((s) => s.performanceLevel);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = useExperienceStore((s) => s.layerParams.meteorCount);
    const cfgSpeed = useExperienceStore((s) => s.layerParams.meteorSpeed);
    const angleRef = useExperienceStore((s) => s.layerParams.meteorAngle ?? -0.8);
    const actualSpeed = speed ?? cfgSpeed;

    const effectiveCount = performanceLevel === 'low' ? Math.max(1, Math.floor(count * 0.15)) : (performanceLevel === 'medium' ? Math.max(4, Math.floor(count * 0.6)) : count);

    // Meteors state ref
    const meteorsRef = useRef<{ pos: THREE.Vector3; vel: THREE.Vector3; scale: number }[]>([]);

    // FIX: Use useMemo for immediate initialization (avoids empty frames logic)
    useMemo(() => {
        const arr: { pos: THREE.Vector3; vel: THREE.Vector3; scale: number }[] = [];
        // Fixed angle for uniform direction (Restored logic)
        const angle = angleRef;
        const speedX = Math.cos(angle);
        const speedY = Math.sin(angle); // typically negative for falling

        for (let i = 0; i < effectiveCount; i++) {
            const x = (Math.random() - 0.5) * 80;
            const y = (Math.random() - 0.5) * 40;
            const z = -20 - Math.random() * 30;
            arr.push({
                pos: new THREE.Vector3(x, y, z),
                // All same direction, slight speed variance
                vel: new THREE.Vector3(speedX, speedY, 0).multiplyScalar(actualSpeed * (1 + Math.random() * 0.5) * 6),
                scale: 0.1 + Math.random() * 0.2
            });
        }
        meteorsRef.current = arr;
    }, [effectiveCount, actualSpeed, angleRef]);

    // FIX: useLayoutEffect to set matrix BEFORE first paint -> Eliminates the 0,0,0 beam glitch
    useLayoutEffect(() => {
        if (!meshRef.current || meteorsRef.current.length === 0) return;

        const dummy = new THREE.Object3D();
        const meteors = meteorsRef.current;

        for (let i = 0; i < meteors.length; i++) {
            const m = meteors[i];
            // Calculate initial orientation same as in useFrame
            const length = Math.max(0.5, m.scale * 8);
            dummy.position.copy(m.pos);
            const lookAt = new THREE.Vector3(m.pos.x + m.vel.x * 8, m.pos.y + m.vel.y * 8, m.pos.z);
            dummy.lookAt(lookAt);
            dummy.rotateX(Math.PI / 2);
            dummy.scale.set(1.0, length, 1.0);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [effectiveCount, actualSpeed, angleRef]);

    useFrame(() => {
        if (!meshRef.current || !active || performanceLevel === 'low') return;
        const dummy = new THREE.Object3D();
        const meteors = meteorsRef.current;
        for (let i = 0; i < meteors.length; i++) {
            const m = meteors[i];
            // add velocity with a slight randomness
            m.pos.addScaledVector(m.vel, 1 + (Math.random() - 0.5) * 0.2);
            // respawn when too low or out of bounds
            if (m.pos.y < -15 || Math.abs(m.pos.x) > 50) {
                m.pos.set(
                    (Math.random() - 0.5) * 60,
                    15 + Math.random() * 10,   // Spawn from top
                    -15 - Math.random() * 30   // Keep deep Z
                );
            }
            // elongate meteors along velocity vector to create streaks
            const length = Math.max(0.5, m.scale * 8);
            dummy.position.copy(m.pos);
            // align orientation to velocity
            const lookAt = new THREE.Vector3(m.pos.x + m.vel.x * 8, m.pos.y + m.vel.y * 8, m.pos.z);
            dummy.lookAt(lookAt);
            // Default Cylinder is Y-up. We want Y to point to Target Z (velocity).
            // lookAt aligns +Z to target.
            // So we rotate X by PI/2 so that +Y becomes +Z.
            dummy.rotateX(Math.PI / 2);

            // Adjust scale: Thickness is X/Z (0.2), Length is Y (scale.y)
            dummy.scale.set(1.0, length, 1.0);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!active || performanceLevel === 'low') return null;

    return (
        <instancedMesh ref={meshRef} args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, Math.max(1, effectiveCount)]}>
            {/* Comet shape: Top (0.15)=Head, Bottom (0.0)=Tail, Height (1.0)=Length */}
            {/* Restored Original Geometry */}
            <cylinderGeometry args={[0.08, 0, 1, 6]} />
            <meshStandardMaterial
                emissive="#FFFFFF"
                emissiveIntensity={4}
                color="#FFFFFF"
                toneMapped={false}
                transparent
                opacity={0.6}
            />
        </instancedMesh>
    );
};
