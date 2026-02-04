import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useExperienceStore } from '../../store/useExperienceStore';

// Dynamically pull all images from the assets/img folder so adding new images updates the list (Vite supports HMR)
const imagesDict = import.meta.glob('/src/assets/img/*', { eager: true, import: 'default' }) as Record<string, string>;
const IMAGE_URLS = Object.values(imagesDict) as string[];

interface MemoryPhotoParams {
    visible: boolean;
    isFinalMode?: boolean;
}

export const MemoryPhoto: React.FC<MemoryPhotoParams> = ({ visible, isFinalMode = false }) => {
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const performanceLevel = useExperienceStore((s) => s.performanceLevel);

    // Dynamic Line Generation
    // We use a ref to hold the line geometry to update it every frame
    const lineRef = useRef<any>(null);
    const count = IMAGE_URLS.length;

    // Base positions (static X distribution)
    const basePositions = useMemo(() => {
        if (count === 0) return [];
        const pos = [];
        for (let i = 0; i < count; i++) {
            const x = (i - (count - 1) / 2) * 1.5;
            pos.push(x);
        }
        return pos;
    }, [count]);

    // Generate initial points for the line to avoid "Invalid typed array length" error
    const initialPoints = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= 30; i++) {
            const x = -6 + (12 * (i / 30));
            // Curve match the wind formula base state (t=0)
            const y = 1.8 + Math.pow(x * 0.25, 2) + 0.6;
            const z = -0.5 + Math.pow(x * 0.1, 2);
            pts.push(new THREE.Vector3(x, y, z));
        }
        return pts;
    }, []);

    useFrame((state) => {
        if (!visible || count === 0 || performanceLevel === 'low') return;
        const time = state.clock.elapsedTime;

        // WIND FORMULA
        const getWindY = (x: number) => {
            const baseCurve = 1.8 + Math.pow(x * 0.25, 2);
            const wind = Math.sin(time * 0.8 + x * 0.5) * 0.15;
            const breeze = Math.sin(time * 2.2 + x * 1.2) * 0.03;
            return baseCurve + wind + breeze;
        };

        const getWindZ = (x: number) => {
            const baseCurve = -0.5 + Math.pow(x * 0.1, 2);
            const wind = Math.cos(time * 0.6 + x * 0.4) * 0.1;
            return baseCurve + wind;
        };

        // Update Line Geometry
        if (lineRef.current && lineRef.current.geometry) {
            const flatPoints: number[] = [];
            for (let i = 0; i <= 30; i++) {
                const x = -6 + (12 * (i / 30));
                flatPoints.push(x, getWindY(x) + 0.6, getWindZ(x));
            }
            lineRef.current.geometry.setPositions(flatPoints);
        }
    });

    if (!visible || IMAGE_URLS.length === 0) return null;

    return (
        <group visible={visible}>
            {/* The Connecting String */}
            <Line
                ref={lineRef}
                points={initialPoints}
                color="#8b5a2b"
                lineWidth={1.5}
                dashed={false}
            />

            {IMAGE_URLS.map((url, i) => (
                <SwayingPhotoFrame
                    key={i}
                    url={url}
                    baseX={basePositions[i]}
                    index={i}
                    isFocused={focusedIndex === i}
                    isDimmed={focusedIndex !== null && focusedIndex !== i}
                    onFocus={(idx) => setFocusedIndex(idx === focusedIndex ? null : idx)}
                    performanceLevel={performanceLevel}
                />
            ))}

            <group position={[0, 0.5, 0.5]}>
                <FinalHeartPhoto visible={!!isFinalMode} url={IMAGE_URLS[0]} />
            </group>
        </group>
    );
};

// Wrapper to handle individual Sway
const SwayingPhotoFrame: React.FC<{
    url: string;
    baseX: number;
    index: number;
    isFocused: boolean;
    isDimmed: boolean;
    onFocus: (idx: number) => void;
    performanceLevel: string;
}> = ({ url, baseX, index, isFocused, isDimmed, onFocus, performanceLevel }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const scale = useRef(0);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Skip heavy animation on low perf, unless focused!
        if (performanceLevel === 'low' && !isFocused) {
            // Static position fallback logic could go here if needed, but current setup assumes dynamic.
            // If low perf, we might just set static position once.
            // But 'delta' is still running.
            // Let's just allow it for now but maybe SKIP wind calculations if strict?
            // Actually, let's keep it simple: clamp FPS via frameloop in App.tsx mainly.
            // But we can early return if specific thresholds.
        }

        const time = state.clock.elapsedTime;

        // Same Wind Formula to match String
        const getWindY = (x: number) => {
            const baseCurve = 1.8 + Math.pow(x * 0.25, 2);
            const wind = Math.sin(time * 0.8 + x * 0.5) * 0.15;
            const breeze = Math.sin(time * 2.2 + x * 1.2) * 0.03;
            return baseCurve + wind + breeze;
        };
        const getWindZ = (x: number) => {
            const baseCurve = -0.5 + Math.pow(x * 0.1, 2);
            const wind = Math.cos(time * 0.6 + x * 0.4) * 0.1;
            return baseCurve + wind;
        };

        const targetX = isFocused ? 0 : baseX;
        const targetY = isFocused ? 0 : getWindY(baseX);
        const targetZ = isFocused ? 1.5 : getWindZ(baseX);

        // Apply Position (Lerp for smoothness if focused, direct wind otherwise?)
        // Direct wind is better for "sticking" to the string.
        if (isFocused) {
            groupRef.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), delta * 4);
        } else {
            // Apply wind position directly, but maybe lerp slightly to avoid jitter if fps low?
            // Direct set is best for synch with line
            groupRef.current.position.set(targetX, targetY, targetZ);
        }

        // Scale Logic
        let targetScale = isFocused ? 1.8 : 1.0;
        if (isDimmed) targetScale = 0.5;
        else if (hovered && !isFocused) targetScale = 1.15;
        scale.current = THREE.MathUtils.lerp(scale.current, targetScale, delta * 3);
        groupRef.current.scale.setScalar(scale.current);

        // Rotation Logic
        if (!isFocused) {
            // Sway rotation based on movement
            const swayRot = Math.sin(time * 1.5 + baseX) * 0.1; // Pendulum effect
            groupRef.current.rotation.z = swayRot;
            groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
            groupRef.current.lookAt(0, 0, 8); // Look at camera roughly
        } else {
            groupRef.current.rotation.set(0, 0, 0);
        }
    });

    return (
        <group
            ref={groupRef}
            onClick={(e) => { e.stopPropagation(); onFocus(index); }}
            onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
        >
            <mesh position={[0, 0, -0.01]} castShadow={performanceLevel === 'high'} receiveShadow={performanceLevel === 'high'}>
                <planeGeometry args={[1.2, 1.5]} />
                <meshStandardMaterial color="#f0e6d2" roughness={0.8} metalness={0.1} />
            </mesh>
            <Image
                url={url}
                scale={[1.0, 1.0]}
                position={[0, 0.1, 0.01]}
                transparent
            />
        </group>
    );
}

// Keep FinalHeartPhoto as is
const FinalHeartPhoto: React.FC<{ visible: boolean; url: string }> = ({ visible, url }) => {
    const meshRef = useRef<THREE.Group>(null);
    const performanceLevel = useExperienceStore((s) => s.performanceLevel);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        const targetScale = visible ? 1.2 : 0;
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2);
        meshRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    });

    return (
        <group ref={meshRef} scale={0}>
            <pointLight color="#ff4d6d" intensity={visible ? 1.5 : 0} distance={3} decay={2} />
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[2.4, 2.8]} />
                <meshBasicMaterial color="#ffc0cb" transparent opacity={0.3} />
            </mesh>
            <group>
                <mesh position={[0, 0, -0.01]} castShadow={performanceLevel === 'high'} receiveShadow={performanceLevel === 'high'}>
                    <planeGeometry args={[1.2, 1.5]} />
                    <meshStandardMaterial color="#f0e6d2" roughness={0.8} metalness={0.1} />
                </mesh>
                <Image url={url} scale={[1.0, 1.0]} position={[0, 0.1, 0.01]} transparent />
            </group>
        </group>
    )
}
