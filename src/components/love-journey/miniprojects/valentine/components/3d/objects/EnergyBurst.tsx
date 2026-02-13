import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface EnergyBurstProps {
    trigger: number; // Timestamp or counter
    color?: string;
}

export const EnergyBurst: React.FC<EnergyBurstProps> = ({ trigger, color = "#ffb3c1" }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const count = 100;

    // Create fixed random directions for particles with a simple pseudo-random generator
    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        let seed = 123;
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        for (let i = 0; i < count; i++) {
            // Initial position (center)
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0.5;
            positions[i * 3 + 2] = 0;

            // Sphere direction
            const theta = random() * Math.PI * 2;
            const phi = Math.acos(2 * random() - 1);
            const speed = 0.02 + random() * 0.08;

            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
            velocities[i * 3 + 2] = Math.cos(phi) * speed;

            sizes[i] = random() * 2 + 1;
        }

        return { positions, velocities, sizes };
    }, []);

    const startTime = useRef(0);

    useEffect(() => {
        if (trigger > 0) {
            startTime.current = performance.now();
            if (pointsRef.current) {
                // Reset positions
                const pos = pointsRef.current.geometry.attributes.position;
                for (let i = 0; i < count; i++) {
                    pos.setXYZ(i, 0, 0.5, 0);
                }
                pos.needsUpdate = true;
            }
        }
    }, [trigger]);

    useFrame(() => {
        if (!pointsRef.current || startTime.current === 0) return;

        const elapsed = (performance.now() - startTime.current) / 1000;
        const duration = 1.0; // Seconds

        if (elapsed > duration) {
            pointsRef.current.visible = false;
            return;
        }

        pointsRef.current.visible = true;
        const posAttr = pointsRef.current.geometry.attributes.position;
        const mat = pointsRef.current.material as THREE.PointsMaterial;

        for (let i = 0; i < count; i++) {
            const x = particles.velocities[i * 3] * elapsed * 20;
            const y = 0.5 + particles.velocities[i * 3 + 1] * elapsed * 20;
            const z = particles.velocities[i * 3 + 2] * elapsed * 20;

            posAttr.setXYZ(i, x, y, z);
        }

        posAttr.needsUpdate = true;
        mat.opacity = Math.max(0, 1 - elapsed / duration);
    });

    return (
        <points ref={pointsRef} visible={false}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[particles.positions, 3]}
                    usage={THREE.DynamicDrawUsage}
                />
            </bufferGeometry>
            <pointsMaterial
                color={color}
                size={0.15}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                sizeAttenuation={true}
            />
        </points>
    );
};
