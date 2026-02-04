import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';

export const RainParticles: React.FC<{ area?: number }> = ({ area = 25 }) => {
    const performanceLevel = useExperienceStore((s) => s.performanceLevel);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const rainCount = useExperienceStore((s) => Math.max(32, s.layerParams.rainCount || 300));
    const rainOpacity = useExperienceStore((s) => Math.max(0, Math.min(1, s.layerParams.rainOpacity ?? 0.8)));

    // Scale count based on performance budget
    const effectiveCount = performanceLevel === 'low' ? Math.max(16, Math.floor(rainCount * 0.2)) : (performanceLevel === 'medium' ? Math.max(24, Math.floor(rainCount * 0.6)) : rainCount);

    // State for positions and velocities
    const stateRef = useRef<{ pos: THREE.Vector3; vel: number; scale: number; speedOffset: number }[]>([]);

    useEffect(() => {
        const arr: { pos: THREE.Vector3; vel: number; scale: number; speedOffset: number }[] = [];
        for (let i = 0; i < effectiveCount; i++) {
            const x = (Math.random() - 0.5) * area;
            const y = Math.random() * 30;
            const z = (Math.random() - 0.5) * area;
            arr.push({
                pos: new THREE.Vector3(x, y, z),
                vel: 0.3 + Math.random() * 0.3, // Faster fall speed
                scale: 1.0 + Math.random() * 0.5,
                speedOffset: Math.random()
            });
        }
        stateRef.current = arr;
    }, [area, effectiveCount]);

    useFrame((state) => {
        if (!meshRef.current) return;

        const dummy = new THREE.Object3D();
        const particles = stateRef.current;
        const windX = -0.1;

        // Dynamic wind sway
        const time = state.clock.elapsedTime;
        const currentWind = windX + Math.sin(time * 0.5) * 0.05;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            p.pos.y -= p.vel;
            p.pos.x += currentWind;

            // Loop boundaries
            if (p.pos.y < -5) {
                p.pos.y = 25 + Math.random() * 5;
                p.pos.x = (Math.random() - 0.5) * area;
                p.pos.z = (Math.random() - 0.5) * area;
                p.vel = 0.3 + Math.random() * 0.3;
            }

            dummy.position.copy(p.pos);

            // Simplified tilt and sway
            dummy.rotation.z = currentWind * 2.0;
            dummy.rotation.x = Math.sin(time + p.speedOffset) * 0.05;

            dummy.scale.set(1, p.scale, 1);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });



    return (
        <instancedMesh ref={meshRef} args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, effectiveCount]}>
            {/* Very thin and long for streak effect */}
            <cylinderGeometry args={[0.003, 0.003, 1.5, 4]} />
            {performanceLevel === 'low' ? (
                <meshBasicMaterial
                    color="#cceeff"
                    transparent
                    opacity={rainOpacity * 0.6} // More opaque to compensate for lack of shiny
                />
            ) : (
                <meshPhysicalMaterial
                    color="#cceeff"
                    transparent
                    opacity={rainOpacity}
                    roughness={0.1}
                    metalness={0.1}
                    transmission={performanceLevel === 'medium' ? 0 : 0.98} // Disable transmission on medium too if needed, or keep
                    thickness={0.2}
                    ior={1.33}
                    clearcoat={1.0}
                    side={THREE.DoubleSide}
                />
            )}
        </instancedMesh>
    );
};
