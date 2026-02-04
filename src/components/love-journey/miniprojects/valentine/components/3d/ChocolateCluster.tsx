import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';

const ChocolateMaterial: React.FC = () => (
    <meshPhysicalMaterial
        color="#2A1510" // Darker, deeper brown
        roughness={0.25} // Glossier (Ganache style)
        metalness={0.1}
        clearcoat={0.3}
        clearcoatRoughness={0.15}
        emissive="#150A05"
        emissiveIntensity={0.1}
        envMapIntensity={1.5}
    />
);

// --- New Premium Components ---

// Option B: Gold Foil / Liquid Gold - Tighter flow
const GoldRibbon: React.FC = () => {
    const curve = useMemo(() => {
        const points = [];
        const segments = 50;
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 2;
            // Reduce radius to be snug but safe (approx 2.2)
            const x = Math.sin(angle) * 2.2;
            const y = Math.sin(angle * 2) * 1.5;
            const z = Math.cos(angle) * 2.2;
            points.push(new THREE.Vector3(x, y, z));
        }
        return new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
    }, []);

    const geometry = useMemo(() => new THREE.TubeGeometry(curve, 128, 0.02, 12, true), [curve]); // Thinner tube

    // ... (rest same, maybe adjust rotation if needed)
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (meshRef.current) {
            // Rotate around its own axis (y-axis) to create orbiting effect around the center
            // Add z rotation for points a->b, b->a effect (counter-rotation)
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
            meshRef.current.rotation.z = -state.clock.elapsedTime * 0.05;
            const material = meshRef.current.material as THREE.MeshStandardMaterial;
            material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
        }
    });

    return (
        // Centered position [0, 0, 0] to encircle the heart
        <mesh ref={meshRef} geometry={geometry} rotation={[Math.PI / 5, 0, Math.PI / 6]} position={[0, 0, 0]}>
            <meshStandardMaterial
                color="#FFD700"
                roughness={0.15}
                metalness={1.0}
                envMapIntensity={3.0}
                emissive="#FFA000"
                emissiveIntensity={0.3}
            />
        </mesh>
    );
};

// ... HeartBurst & Other Essentials ...
// (Keeping HeartBurst for interaction, but reduced and refined if needed, though instruction said to remove 'toy' particles.
// The user asked to remove "Hạt sáng vuông" (Sparkles). HeartBurst is interaction feedback, keeping it consistent with 'Simple' principle?
// User prompt listed "Heart Burst Particles -> Improve". Even in this new prompt, it talks about removing "Hạt sáng vuông" (floating sparkles).
// I will keep HeartBurst for interaction but maybe make it subtler or leave as is since the user explicitly asked to IMPROVE it in the previous step and didn't explicitly kill it in this step, only the floating sparkles.)

// ... (HeartBurst Upgrade)
// ... (HeartBurst Physics Fix)
// ... (HeartBurst Upgrade)
const HeartBurst: React.FC<{ active: boolean }> = ({ active }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const count = 40;

    // Static color/size data (can be memoized as they are constant or random-invariant)
    const staticAttributes = useMemo(() => {
        const c = new Float32Array(count * 3);
        const colorPalette = [
            new THREE.Color("#FFD700"),
            new THREE.Color("#FFFFFF"),
            new THREE.Color("#FFCDD2"),
        ];
        let seed = 42;
        const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
        for (let i = 0; i < count; i++) {
            const color = colorPalette[Math.floor(random() * colorPalette.length)];
            c[i * 3] = color.r; c[i * 3 + 1] = color.g; c[i * 3 + 2] = color.b;
        }
        return { colors: c };
    }, [count]);

    // Physics state
    const physicsState = useRef<{ vel: Float32Array } | null>(null);

    useEffect(() => {
        if (active) {
            const v = new Float32Array(count * 3);
            const random = () => Math.random();
            for (let i = 0; i < count; i++) {
                const phi = Math.acos(-1 + (2 * i) / count);
                const theta = Math.sqrt(count * Math.PI) * phi;
                // Smoother, consistent speed
                const speed = 0.5 + random() * 0.8;
                v[i * 3] = (Math.sin(phi) * Math.cos(theta)) * speed;
                v[i * 3 + 1] = (Math.sin(phi) * Math.sin(theta)) * speed;
                v[i * 3 + 2] = (Math.cos(phi)) * speed;
            }
            physicsState.current = { vel: v };
        }
    }, [active, count]);

    useFrame((_, delta) => {
        if (!pointsRef.current || !active || !physicsState.current) return;
        const attrPos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const vel = physicsState.current.vel;

        for (let i = 0; i < count; i++) {
            vel[i * 3] *= 0.94; // Higher drag -> stops closer to center
            vel[i * 3 + 1] *= 0.94;
            vel[i * 3 + 2] *= 0.94;

            const cx = attrPos.getX(i) + vel[i * 3] * delta;
            const cy = attrPos.getY(i) + vel[i * 3 + 1] * delta;
            const cz = attrPos.getZ(i) + vel[i * 3 + 2] * delta;
            attrPos.setXYZ(i, cx, cy, cz);
        }
        attrPos.needsUpdate = true;
    });

    if (!active) return null;

    return (
        <points ref={pointsRef} key={active ? 'active' : 'inactive'} position={[0, -0.2, 0]}>
            <bufferGeometry>
                {/* FRESH positions array on every mount to prevent accumulating offsets */}
                <bufferAttribute
                    attach="attributes-position"
                    args={[new Float32Array(count * 3), 3]}
                    usage={THREE.DynamicDrawUsage}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[staticAttributes.colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial size={0.08} vertexColors transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
        </points>
    );
};

// New Component: Diamond Ring
const Ring: React.FC = () => {
    const meshRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (meshRef.current) {
            const t = state.clock.elapsedTime;
            // Gentle float
            meshRef.current.position.y = Math.sin(t * 0.5) * 0.1;
            meshRef.current.rotation.y = t * 0.2;
            meshRef.current.rotation.z = Math.sin(t * 0.3) * 0.1;
        }
    });

    return (
        <group ref={meshRef} rotation={[Math.PI / 4, 0, 0]}>
            {/* Rose Gold Band */}
            <mesh>
                <torusGeometry args={[0.6, 0.04, 32, 100]} />
                <meshStandardMaterial
                    color="#F4C2C2" // Rose Gold
                    metalness={1.0}
                    roughness={0.1}
                    envMapIntensity={2}
                />
            </mesh>

            {/* Setting / Prongs */}
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.08, 0.06, 0.1, 8]} />
                <meshStandardMaterial color="#F4C2C2" metalness={1} roughness={0.1} />
            </mesh>

            {/* The Diamond */}
            <mesh position={[0, 0.68, 0]}>
                <octahedronGeometry args={[0.18, 0]} />
                <meshPhysicalMaterial
                    color="white"
                    transmission={1.0}
                    opacity={1}
                    metalness={0.0}
                    roughness={0.0}
                    ior={2.4}
                    thickness={2.0}
                    clearcoat={1.0}
                    attenuationColor="white"
                    attenuationDistance={1}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
};

// New Component: Shining Crystal Shard
const CrystalShard: React.FC<{ position: [number, number, number], rotation: [number, number, number], scale?: number }> = ({ position, rotation, scale = 1 }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame(() => {
        if (meshRef.current) {
            // Subtle twinkle rotation
            meshRef.current.rotation.x += 0.005;
            meshRef.current.rotation.y += 0.005;
        }
    });

    return (
        <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshPhysicalMaterial
                color="#ffffff"
                emissive="#e0f7fa"
                emissiveIntensity={0.5}
                transmission={0.95}
                opacity={1}
                metalness={0.1}
                roughness={0.0}
                ior={1.5}
                thickness={1.0}
                specularIntensity={1}
                envMapIntensity={3}
            />
        </mesh>
    );
};

const HeartGeometry = () => {
    const standardHeartShape = useMemo(() => {
        const s = new THREE.Shape();
        const x = 0, y = 0;
        s.moveTo(x + 0.5, y + 0.5);
        s.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
        s.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
        s.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
        s.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
        s.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 0.5, y + 0.5);
        return s;
    }, []);
    const extrudeSettings = useMemo(() => ({
        depth: 0.4, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: 0.1, bevelThickness: 0.1,
    }), []);
    return <extrudeGeometry args={[standardHeartShape, extrudeSettings]} />;
};

// Updated Truffle with Internal Heartbeat Logic & Reveal State
const Truffle: React.FC<{ hovered: boolean; bursting: boolean; isRevealed?: boolean }> = ({ hovered, bursting, isRevealed }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const scaleRef = useRef(1);

    useFrame((state, delta) => {
        if (meshRef.current) {
            const t = state.clock.elapsedTime;

            // Heartbeat / Pulse Scale
            if (bursting) {
                const beat = Math.sin(t * 20) * 0.2;
                scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 1 + beat, delta * 15);
            } else {
                const target = hovered ? 1.05 : 1.0;
                scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, target, delta * 5);
            }
            const s = scaleRef.current;
            meshRef.current.scale.set(s, s, s);

            // Rotation Logic
            if (isRevealed) {
                // Determine target rotations to face camera
                // Initial JSX rotation is [Math.PI, 0, 0] -> Point Down
                // When isRevealed, we want to reset Y and Z to 0, but keep X at Math.PI
                meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, Math.PI, delta * 2);
                meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, delta * 2);
                meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, delta * 2);
            } else {
                // Continuous rotation for more dynamic movement
                // We add to the base rotation or set it relative to time
                // Since standard rotation is PI, we need to oscillate AROUND that or apply relative changes.
                // Setting directly overrides JSX rotation unless we account for it.
                // Actually, simpler to just set absolute values:
                meshRef.current.rotation.x = Math.PI; // Keep pointing down
                meshRef.current.rotation.y = -Math.sin(t * 0.8) * 0.4;
                meshRef.current.rotation.z = -Math.cos(t * 0.5) * 0.05;
            }
        }
    });

    return (
        // Initial rotation prop is good for static render, but useFrame overrides it.
        <mesh ref={meshRef} castShadow receiveShadow rotation={[Math.PI, 0, 0]}>
            <HeartGeometry />
            <ChocolateMaterial />
        </mesh>
    )
}

// Export correct type with prop
const ConnectedChocolateCluster: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [bursting, setBursting] = useState(false);

    // Surprise Logic: Reveal after 5 clicks
    const isRevealed = clickCount >= 5;

    // Use a spring-like ref for visibility transition
    const scaleRef = useRef(0);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;
        document.body.style.cursor = hovered ? 'pointer' : 'auto';

        // Visibility Transition Logic
        const targetScale = visible ? 1 : 0;
        scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, delta * 3.0);

        // Apply Base Scale + Hover Effect (only if visible)
        if (scaleRef.current > 0.01) {
            // Group float
            groupRef.current.position.y = Math.sin(time * 0.3) * 0.1 - 0.2;

            // Apply scale to the whole group to hide/show
            // Note: Individual children have their own scales, so we multiply or set parent scale.
            // Since children use `scale` prop, changing parent scale works perfectly.
            groupRef.current.scale.setScalar(scaleRef.current);
        } else {
            groupRef.current.scale.setScalar(0);
        }
    });

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        if (!visible) return;
        e.stopPropagation();
        setClickCount(prev => prev + 1);
        setBursting(true);
        setTimeout(() => setBursting(false), 400);
    };

    return (
        <group
            ref={groupRef}
            position={[-1.5, 0.8, 0]} // Moved UP higher as requested (0.5 -> 0.8)
            onPointerOver={() => visible && setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={handleClick}
        >
            {/* Magical Atmosphere Lights */}
            <pointLight color="#FF80AB" intensity={2} distance={10} position={[-2, 4, 2]} />
            <pointLight color="#FFD700" intensity={1.5} distance={10} position={[2, -2, 2]} />
            <ambientLight intensity={0.5} color="#3E2723" />

            <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>

                {/* 1. Background Heart - Centered in the circle */}
                <group
                    position={[0, 0, 0]}
                    // Reduced max scale from 1.8 to 1.3 to stay within ring
                    scale={isRevealed ? 1.3 : 1.0}
                >
                    <Truffle hovered={hovered} bursting={bursting} isRevealed={isRevealed} />
                </group>

                {/* 2. Foreground Ring - Far away from the other components */}
                {isRevealed && (
                    <group position={[0, 0.2, 4.0]} scale={1.2}>
                        {/* Ring positioned far away on Z-axis */}
                        <Ring />
                    </group>
                )}

                {/* 3. The Ribbon - Rotating around the chocolate */}
                <group scale={1.2} position={[0, 0, 0]}>
                    <GoldRibbon />
                </group>

                {/* 4. Crystal Shards - Sparkling around */}
                <CrystalShard position={[-3.0, 1.5, 1.5]} rotation={[0.5, 0.5, 0]} scale={0.8} />
                <CrystalShard position={[3.5, -1.5, 0.5]} rotation={[-0.5, 0.2, 0.5]} scale={0.6} />
                <CrystalShard position={[2.5, 2.5, -1.5]} rotation={[0, 0, 1]} scale={1.0} />
                <CrystalShard position={[-3.5, -2.0, -1.0]} rotation={[1, 0, 0]} scale={0.7} />

                {/* Sparkles / Burst */}
                <HeartBurst active={bursting} />
            </Float>

            {/* Text Message - Adjusted position to be visible */}
            {clickCount >= 1 && (
                <Text
                    position={[0, isRevealed ? -1.5 : 1.8, 1.0]}
                    fontSize={isRevealed ? 0.25 : 0.22}
                    color={isRevealed ? "#FFD700" : "#FFE0B2"}
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.1}
                    outlineWidth={0.01}
                    outlineColor="#5D4037"
                >
                    {isRevealed ? "MARRY ME?" : "SWEET LOVE"}
                </Text>
            )}
        </group>
    );
};
// Export alias to maintain compatibility
export const ChocolateCluster = ConnectedChocolateCluster;
