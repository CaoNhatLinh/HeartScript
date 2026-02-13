import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';

interface PetalData {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    color: string;
    speed: number;
    rotationSpeed: [number, number, number];
    phaseOffset: number;
}

const petalShape = (() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.04, 0.08, 0.06, 0.15, 0, 0.2);
    shape.bezierCurveTo(-0.06, 0.15, -0.04, 0.08, 0, 0);
    return shape;
})();

const petalGeometry = new THREE.ShapeGeometry(petalShape);

const PETAL_COLORS = ['#E91E63', '#F06292', '#EC407A', '#D81B60', '#C2185B', '#FF8A80'];

function seededRandom(seed: number) {
    const x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);
}

export const PetalScatter: React.FC<{ count?: number }> = ({ count = 60 }) => {
    const windSpeed = useExperienceStore(s => s.layerParams.windSpeed) || 1;
    const groupRef = useRef<THREE.Group>(null);
    // Generate initial petals
    const createPetals = () => {
        const result: PetalData[] = [];
        for (let i = 0; i < count; i++) {
            const seed = i * 13 + 42;
            result.push({
                position: [
                    (seededRandom(seed) - 0.5) * 15,
                    Math.random() * 10 + 2,
                    (seededRandom(seed + 2) - 0.5) * 15,
                ],
                rotation: [
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                ],
                scale: 0.5 + Math.random() * 0.8,
                color: PETAL_COLORS[Math.floor(seededRandom(seed + 7) * PETAL_COLORS.length)],
                speed: 0.02 + Math.random() * 0.03,
                rotationSpeed: [
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                ],
                phaseOffset: Math.random() * Math.PI * 2,
            });
        }
        return result;
    };

    const [petals] = useState<PetalData[]>(createPetals);

    // Initialize physics ref with a deep copy of the initial state
    // We use a lazy initialization pattern for the ref content 
    // but without accessing .current in logic that runs every render
    const physicsRef = useRef<PetalData[] | null>(null);
    if (physicsRef.current === null) {
        physicsRef.current = JSON.parse(JSON.stringify(petals));
    }

    // Animate falling petals
    useFrame((state) => {
        if (!groupRef.current || !physicsRef.current || physicsRef.current.length === 0) return;
        const t = state.clock.elapsedTime;
        const children = groupRef.current.children;
        const physics = physicsRef.current;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const data = physics[i];
            if (!data) continue;

            // Update internal data position (Gravity)
            data.position[1] -= data.speed;

            // Wind effect (Swaying in X and Z)
            const swayX = Math.sin(t * 0.5 + data.phaseOffset) * 0.01 * windSpeed;
            const swayZ = Math.cos(t * 0.3 + data.phaseOffset) * 0.01 * windSpeed;

            data.position[0] += swayX;
            data.position[2] += swayZ;

            // Reset if below ground (Looping)
            if (data.position[1] < -2) {
                data.position[1] = 10 + Math.random() * 5; // Reset to top
                data.position[0] = (Math.random() - 0.5) * 15; // Random X
                data.position[2] = (Math.random() - 0.5) * 15; // Random Z
            }

            // Apply rotation (Tumbling)
            child.rotation.x += data.rotationSpeed[0];
            child.rotation.y += data.rotationSpeed[1];
            child.rotation.z += data.rotationSpeed[2];

            // Apply position
            child.position.set(data.position[0], data.position[1], data.position[2]);
        }
    });

    if (petals.length === 0) return null;

    return (
        <group ref={groupRef}>
            {petals.map((petal, i) => (
                <mesh
                    key={i}
                    geometry={petalGeometry}
                    // Initial positions set here, but useFrame takes over immediately
                    position={petal.position}
                    rotation={petal.rotation}
                    scale={petal.scale}
                >
                    <meshPhysicalMaterial
                        color={petal.color}
                        roughness={0.6}
                        side={THREE.DoubleSide}
                        transparent
                        opacity={0.9}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
};
