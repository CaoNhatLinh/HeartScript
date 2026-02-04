import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';

export const EnvelopeSparkle: React.FC<{ count?: number }> = ({ count = 60 }) => {
    // Parent components control visibility, no need for internal active check
    const performanceLevel = useExperienceStore((s) => s.performanceLevel);
    const ref = useRef<THREE.Points | null>(null);

    const effectiveCount = performanceLevel === 'low' ? Math.max(8, Math.floor(count * 0.25)) : (performanceLevel === 'medium' ? Math.max(20, Math.floor(count * 0.6)) : count);

    const positionsRef = React.useRef<Float32Array | null>(null);

    useEffect(() => {
        const arr = new Float32Array(effectiveCount * 3);
        for (let i = 0; i < effectiveCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const r = 0.6 + Math.random() * 0.9;
            const x = Math.cos(theta) * r;
            const y = -0.1 + (Math.random() - 0.5) * 0.2;
            const z = Math.sin(theta) * r;
            arr[i * 3 + 0] = x;
            arr[i * 3 + 1] = y;
            arr[i * 3 + 2] = z;
        }
        positionsRef.current = arr;
        const node = ref.current;
        if (node) {
            node.geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        }

        return () => {
            // clean up buffer attribute to free memory
            if (node) {
                const geom = node.geometry as THREE.BufferGeometry;
                if (geom && geom.getAttribute('position')) {
                    const attr = geom.getAttribute('position') as THREE.BufferAttribute;
                    if (attr) attr.array = new Float32Array(0);
                    geom.deleteAttribute('position');
                }
            }
        };
    }, [effectiveCount]);

    useFrame((state) => {
        if (!ref.current || performanceLevel === 'low') return;
        const time = state.clock.elapsedTime;
        const pos = (ref.current.geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < effectiveCount; i++) {
            const ox = pos.getX(i);
            const oy = pos.getY(i);
            const oz = pos.getZ(i);
            const nx = ox + Math.sin(time * 2 + i) * 0.0006;
            const ny = oy + Math.cos(time * 1.5 + i) * 0.0004;
            pos.setXYZ(i, nx, ny, oz);
        }
        pos.needsUpdate = true;
    });

    return (
        <points ref={ref} renderOrder={9999}>
            <bufferGeometry />
            <pointsMaterial size={0.06} color="#FFF1E6" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
    );
};