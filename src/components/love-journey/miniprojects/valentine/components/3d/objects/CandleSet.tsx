import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CandleProps {
    position: [number, number, number];
    height: number;
    radius: number;
    delay: number;
    isActive: boolean;
}

const Candle: React.FC<CandleProps> = ({ position, height, radius, delay, isActive }) => {
    const flameRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);
    const bodyRef = useRef<THREE.Group>(null);
    const [litProgress, setLitProgress] = React.useState(0);
    const timerRef = useRef(0);

    useFrame((_state, delta) => {
        if (!isActive) {
            timerRef.current = 0;
            return;
        }

        timerRef.current += delta;

        // Sequential lighting logic relative to activation
        if (timerRef.current > delay) {
            setLitProgress(prev => Math.min(prev + delta * 2.5, 1));
        }

        if (bodyRef.current) {
            // Magical popup effect: bounce and rise
            const targetScale = litProgress;
            bodyRef.current.scale.y = THREE.MathUtils.lerp(bodyRef.current.scale.y, targetScale, 0.15);
            bodyRef.current.scale.x = bodyRef.current.scale.z = THREE.MathUtils.lerp(bodyRef.current.scale.x, targetScale, 0.15);
            bodyRef.current.position.y = (1 - litProgress) * -0.5;
        }

        if (litProgress > 0.8) {
            if (flameRef.current) {
                const t = _state.clock.elapsedTime;
                const flicker = Math.sin(t * 8 + position[0] * 10) * 0.15 + 1.0;
                flameRef.current.scale.set(flicker * 0.8 * litProgress, flicker * litProgress, flicker * 0.8 * litProgress);
                flameRef.current.position.x = Math.sin(t * 5 + position[0]) * 0.005;
                flameRef.current.visible = true;
            }
            if (lightRef.current) {
                lightRef.current.intensity = (0.8 + Math.sin(_state.clock.elapsedTime * 8 + position[0] * 10) * 0.4) * litProgress;
            }
        } else {
            if (flameRef.current) flameRef.current.visible = false;
            if (lightRef.current) lightRef.current.intensity = 0;
        }
    });

    return (
        <group position={position} ref={bodyRef} scale={0}>
            {/* Wax body */}
            <mesh position={[0, height / 2, 0]} castShadow>
                <cylinderGeometry args={[radius, radius * 1.05, height, 16]} />
                <meshPhysicalMaterial
                    color="#FFF9F0"
                    roughness={0.4}
                    thickness={0.1}
                    transmission={0.2}
                />
            </mesh>

            {/* Wick */}
            <mesh position={[0, height + 0.03, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.06, 6]} />
                <meshBasicMaterial color="#222" />
            </mesh>

            {/* Flame */}
            <mesh ref={flameRef} position={[0, height + 0.09, 0]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshBasicMaterial color="#FFD54F" />
            </mesh>

            {/* Point light for warm glow */}
            <pointLight
                ref={lightRef}
                position={[0, height + 0.12, 0]}
                color="#FFA000"
                intensity={0}
                distance={4}
                decay={2}
            />
        </group>
    );
};

export const CandleSet: React.FC<{ active?: boolean }> = ({ active = true }) => {
    const candles = useMemo(() => [
        { position: [-0.18, 0, 0.05] as [number, number, number], height: 0.35, radius: 0.04, delay: 0.2 },
        { position: [0.05, 0, 0.15] as [number, number, number], height: 0.5, radius: 0.038, delay: 0.5 },
        { position: [0.18, 0, -0.05] as [number, number, number], height: 0.25, radius: 0.045, delay: 0.8 },
    ], []);

    const baseRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (!active || !baseRef.current) return;
        baseRef.current.scale.setScalar(THREE.MathUtils.lerp(baseRef.current.scale.x, 1, 0.1));
    });

    return (
        <group>
            {/* Base plate */}
            <mesh ref={baseRef} position={[0, 0.005, 0]} receiveShadow scale={0}>
                <cylinderGeometry args={[0.3, 0.32, 0.015, 32]} />
                <meshPhysicalMaterial
                    color="#FFD700"
                    metalness={0.9}
                    roughness={0.1}
                    envMapIntensity={1.5}
                />
            </mesh>

            {candles.map((candle, i) => (
                <Candle key={i} {...candle} isActive={active} />
            ))}
        </group>
    );
};
