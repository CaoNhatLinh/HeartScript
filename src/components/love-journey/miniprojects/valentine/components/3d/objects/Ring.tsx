import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Ring: React.FC = () => {
    const ringRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!ringRef.current) return;
        // Gentle floating and rotation
        const t = state.clock.getElapsedTime();
        ringRef.current.rotation.y = t * 0.5;
        ringRef.current.position.y = Math.sin(t * 1.5) * 0.1;
    });

    return (
        <group ref={ringRef}>
            {/* Ring Band (Gold) */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                <torusGeometry args={[0.3, 0.04, 16, 32]} />
                <meshStandardMaterial
                    color="#FFC107"
                    metalness={1.0}
                    roughness={0.1}
                    envMapIntensity={2.0}
                />
            </mesh>

            {/* Diamond Setting */}
            <mesh position={[0, 0.34, 0]}>
                <cylinderGeometry args={[0.06, 0.04, 0.05, 6]} />
                <meshStandardMaterial color="#FFC107" metalness={1.0} roughness={0.1} />
            </mesh>

            {/* Diamond Gem */}
            <mesh position={[0, 0.42, 0]} castShadow>
                <octahedronGeometry args={[0.12, 0]} />
                <meshPhysicalMaterial
                    color="#FFFFFF"
                    metalness={0.0}
                    roughness={0.0}
                    transmission={1.0} // Glass
                    thickness={0.5}
                    ior={2.4} // Diamond IOR
                    clearcoat={1.0}
                    attenuationColor="#FFFFFF"
                    attenuationDistance={1}
                />
            </mesh>

            {/* Sparkle effect plane (add later if needed) */}
        </group>
    );
};
