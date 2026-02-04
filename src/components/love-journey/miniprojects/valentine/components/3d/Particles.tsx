import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

import { useExperienceStore } from '../../store/useExperienceStore';
import { useWind } from './layers/WindEffect';

const ParticlesInner: React.FC<{ count?: number }> = ({ count = 50 }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const performanceLevel = useExperienceStore((s) => s.performanceLevel);
    const windVector = useWind();

    // Create particles data using useState for lazy init once (fixes pure render lint)
    const [particles] = useState(() => {
        const temp: any[] = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -5 + Math.random() * 10;
            const yFactor = -5 + Math.random() * 10;
            const zFactor = -5 + Math.random() * 10;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    });

    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        if (context) {
            const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 32, 32);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.premultiplyAlpha = true;
        return tex;
    }, []);

    // Dispose created texture on unmount to avoid GPU memory leaks
    React.useEffect(() => {
        return () => {
            try {
                texture && (texture as any).dispose && texture.dispose();
            } catch (e) {
                // swallow, but keep cleanup robust
                // eslint-disable-next-line no-console
                console.warn('Failed to dispose particles texture', e);
            }
        };
    }, [texture]);

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const activeStarfield = useExperienceStore((s) => s.activeLayers.starfield);
    const visible = !!(activeStarfield && performanceLevel !== 'low');

    useFrame((state) => {
        // Keep hooks order stable — bail out early but do not change hook usage
        if (!meshRef.current || !visible) return;

        try {
            // Only update particles if mouse has moved significantly to reduce CPU usage
            const { x, y } = state.mouse;
            const mouseChanged = Math.abs(x - (particles[0]?.mx || 0)) > 0.01 || Math.abs(y - (particles[0]?.my || 0)) > 0.01;

            particles.forEach((particle, i) => {
                let { t } = particle;
                const { factor, speed, xFactor, yFactor, zFactor, mx, my } = particle;

                // Update time - slower when mouse is still
                t = particle.t += speed / (mouseChanged ? 2 : 4);
                const a = Math.cos(t) + Math.sin(t * 1) / 10;
                const b = Math.sin(t) + Math.cos(t * 2) / 10;
                const s = Math.cos(t);

                // Movement logic with wind
                const windX = windVector.x * t * 0.01; // Accumulate wind over time
                const windZ = windVector.z * t * 0.01;

                dummy.position.set(
                    (mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10 + windX,
                    (my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
                    (my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10 + windZ
                );

                // Scale pulsation
                const scale = (s > 0.5 ? s : 0.5) * 0.1; // modest size
                dummy.scale.set(scale, scale, scale);

                dummy.rotation.set(s * 5, s * 5, s * 5);
                dummy.updateMatrix();

                if (meshRef.current) {
                    meshRef.current.setMatrixAt(i, dummy.matrix);
                }

                // Update mouse position for next frame
                particle.mx = x;
                particle.my = y;
            });
            if (meshRef.current) {
                meshRef.current.instanceMatrix.needsUpdate = true;
            }
        } catch (err) {
            // Prevent runtime exceptions from interfering with React hook flow
            // eslint-disable-next-line no-console
            console.error('Particles frame error', err);
        }
    });

    // Always mount the instanced mesh to keep hook ordering stable across renders.
    // Toggle visibility on the mesh itself to avoid mount/unmount changes causing unexpected behavior elsewhere.
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} visible={visible} frustumCulled={false}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
                map={texture}
                transparent
                opacity={0.6}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </instancedMesh>
    );
};

export const Particles = React.memo(ParticlesInner);
(Particles as any).displayName = 'Particles';
