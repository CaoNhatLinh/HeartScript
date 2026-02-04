// fix@[valentine/src/components/3d/CrystalRose.tsx]
// Nâng cấp Cinematic Refinement: Geometry Profile, Weighted Opening, và Gradient Shader
// Khắc phục triệt để lỗi Shader và loại bỏ các kiểu 'any' không cần thiết.

import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { Html } from '@react-three/drei';
import { useExperienceStore } from '../../store/useExperienceStore';

// ---------------------------------------------------------
// LUXURY CINEMATIC CRYSTAL ROSE - REFINED VERSION
// ---------------------------------------------------------

const seedRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

const useVeinTexture = () => {
    // Use effect-based creation to avoid React compiler skipping manual memoization
    const [tex, setTex] = React.useState<THREE.Texture>(() => new THREE.Texture());

    React.useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; // Tăng độ phân giải cho gân lá sắc nét hơn
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            const placeholder = new THREE.CanvasTexture(document.createElement('canvas'));
            setTex(placeholder);
            return () => { try { placeholder.dispose(); } catch { /* ignore */ } };
        }

        // Màu nền Normal Map chuẩn (flat: 128, 128, 255)
        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, 1024, 1024);

        // Vẽ các gân lá với độ đậm nhạt khác nhau để tạo độ khối cho Normal Map
        ctx.strokeStyle = '#8888ee';
        for (let i = 0; i < 60; i++) {
            ctx.lineWidth = 1 + seedRandom(i) * 2;
            ctx.beginPath();
            const startX = 512 + (seedRandom(i) - 0.5) * 200;
            ctx.moveTo(startX, 1024);

            let x = startX;
            let y = 1024;
            for (let j = 0; j < 15; j++) {
                x += (seedRandom(i * 15 + j) - 0.5) * 60;
                y -= 70;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 8; // Tăng độ mịn khi nhìn ở góc nghiêng
        setTex(texture);

        return () => { try { texture.dispose(); } catch { /* ignore */ } };
    }, []);

    return tex;
};

/**
 * Petal Material with REFIXED Cinematic Gradient Shader
 * Sử dụng tọa độ Local Position Y thay vì UV để tránh lỗi biên dịch trên một số trình duyệt.
 */
const PetalMaterial = React.memo(({
    color,
    bloomProgress = 0,
    veinTex,
    performanceLevel
}: {
    color: string;
    bloomProgress: number;
    veinTex: THREE.Texture;
    performanceLevel: string;
}) => {
    // Low performance: Standard Material (No Transmission, No Clearcoat)
    if (performanceLevel === 'low') {
        return (
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.2 + (bloomProgress * 0.2)}
                roughness={0.4}
                metalness={0.1}
                side={THREE.DoubleSide}
                transparent={true}
                opacity={0.85} // Fake transmission
                map={null} // Optional: could use veinTex as bump map if cheap
                normalMap={veinTex}
                normalScale={new THREE.Vector2(0.2, 0.2)}
            />
        );
    }

    // High/Medium: Full Physical Material
    const transmission = 0.35 + (bloomProgress * 0.15);
    const emissiveIntensity = 0.1 + (bloomProgress * 0.25);

    return (
        <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            roughness={0.2 - (bloomProgress * 0.1)}
            metalness={0.05}
            transmission={transmission}
            thickness={1.2}
            ior={1.48}
            clearcoat={1.0}
            clearcoatRoughness={0.02}
            normalMap={veinTex}
            normalScale={new THREE.Vector2(0.3, 0.3)}
            attenuationDistance={1.4}
            attenuationColor={color}
            side={THREE.DoubleSide}
            transparent={true}
            onBeforeCompile={(shader) => {
                shader.vertexShader = shader.vertexShader.replace(
                    '#include <common>',
                    `#include <common>\nvarying float vLocalY;`
                );
                shader.vertexShader = shader.vertexShader.replace(
                    '#include <begin_vertex>',
                    `#include <begin_vertex>\nvLocalY = position.y;`
                );
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <common>',
                    `#include <common>\nvarying float vLocalY;`
                );
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <color_fragment>',
                    `
                    #include <color_fragment>
                    float grad = clamp(vLocalY / 1.5, 0.0, 1.0);
                    vec3 bCol = diffuseColor.rgb;
                    vec3 iCol = bCol * 0.65;
                    vec3 oCol = mix(bCol, vec3(1.0, 0.88, 0.95), 0.35);
                    diffuseColor.rgb = mix(iCol, oCol, pow(grad, 1.2));
                    `
                );
            }}
        />
    );
});

interface PetalData {
    id: number;
    layerIndex: number;
    color: string;
    scale: [number, number, number];
}

interface PetalProps extends PetalData {
    index: number;
    openCount: number;
    geometry: THREE.BufferGeometry;
    veinTex: THREE.Texture;
    performanceLevel: string;
}

/**
 * Individual Petal Component
 */
const CrystalPetal = React.memo(({
    id,
    index,
    openCount,
    layerIndex,
    color,
    geometry,
    scale: baseScale,
    veinTex,
    performanceLevel
}: PetalProps) => {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = index * goldenAngle;

    const petalProgress = Math.min(Math.max((openCount - id), 0), 1);
    const layerWeight = layerIndex / 3;

    const tiltX = THREE.MathUtils.lerp(
        THREE.MathUtils.degToRad(-28 + layerWeight * 6),
        THREE.MathUtils.degToRad(8 + layerWeight * 24),
        petalProgress
    );

    const rollZ = THREE.MathUtils.lerp(
        THREE.MathUtils.degToRad((index % 2 === 0 ? 2 : -2)),
        THREE.MathUtils.degToRad((index % 2 === 0 ? 6 : -6) * (0.6 + layerWeight)),
        petalProgress
    );

    const compression = (1.0 - layerWeight) * 0.04;

    const { springRotation, springPosition } = useSpring({
        springRotation: [tiltX, angle, rollZ] as const,
        springPosition: [0, -0.05 * petalProgress + compression, 0.03 * petalProgress] as const,
        config: { mass: 2.2, tension: 70, friction: 38 }
    });

    return (
        <animated.group
            rotation={springRotation as unknown as [number, number, number]}
            rotation-order="YXZ"
            position={springPosition as unknown as [number, number, number]}
            scale={baseScale}
        >
            <mesh geometry={geometry} castShadow={performanceLevel !== 'low'} receiveShadow={performanceLevel !== 'low'}>
                <PetalMaterial
                    color={color}
                    bloomProgress={petalProgress}
                    veinTex={veinTex}
                    performanceLevel={performanceLevel}
                />
            </mesh>
        </animated.group>
    );
});

/**
 * Main Luxury Crystal Rose Component
 */
export const CrystalRose: React.FC<{
    position?: [number, number, number];
    scale?: number;
    autoRotate?: boolean;
    opacity?: number;
    isBud?: boolean;
}> = React.memo(({
    position = [0, 0, 0],
    scale = 1,
    autoRotate = true,
    isBud = false
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const coreRef = useRef<THREE.Mesh>(null);
    const glowLightRef = useRef<THREE.PointLight>(null);
    const [isHovered, setIsHovered] = useState(false);
    const veinTex = useVeinTexture();

    // Sử dụng Store thay vì local state để tránh bị reset khi chuyển cảnh
    // Sử dụng Store thay vì local state để tránh bị reset khi chuyển cảnh
    const currentScene = useExperienceStore(s => s.currentScene);
    const requestSceneTransition = useExperienceStore(s => s.requestSceneTransition);
    const setRoseHover = useExperienceStore(s => s.setRoseHover);
    const setBloomProgress = useExperienceStore(s => s.setBloomProgress);
    const bloomProgress = useExperienceStore(s => s.bloomProgress);
    const openCount = useExperienceStore(s => s.openCount);
    const setOpenCount = useExperienceStore(s => s.setOpenCount);
    const setIsInspecting = useExperienceStore(s => s.setIsInspecting);
    const performanceLevel = useExperienceStore((s) => s.performanceLevel);

    // Interaction State
    const [isHolding, setIsHolding] = useState(false);
    const grabRotation = useRef(new THREE.Euler());
    const grabMouse = useRef(new THREE.Vector2());
    const dragStartPos = useRef(new THREE.Vector2());
    const isDragging = useRef(false);

    // 1. GENERATE ORGANIC PETAL GEOMETRY (Spine Lift & Rim Dip)
    const petalGeometry = useMemo(() => {
        const points = [];
        const resolution = 32;
        for (let i = 0; i <= resolution; i++) {
            const t = i / resolution;
            const x = Math.pow(t, 0.8) * 0.9 + Math.sin(t * Math.PI) * 0.2;
            const y = t * 1.5;
            points.push(new THREE.Vector2(x, y));
        }

        const geo = new THREE.LatheGeometry(points, 48, -1.2, 2.4);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vy = pos.getY(i);
            const vx = pos.getX(i);
            const vz = pos.getZ(i);
            const edgeEffect = vy / 1.5;

            const centerFactor = Math.exp(-Math.abs(vx) * 3.2);
            const edgeFactor = 1.0 - centerFactor;

            const spineLift = centerFactor * 0.22 * Math.pow(edgeEffect, 1.8);
            const rimDip = -edgeFactor * 0.12 * Math.pow(edgeEffect, 2.2);
            const rimCurl = Math.sin(vx * 4.2) * edgeFactor * 0.09 * edgeEffect;
            const cup = Math.cos(vx * 1.1) * 0.06 * edgeEffect;

            pos.setY(i, vy + spineLift + rimDip);
            pos.setZ(i, vz + rimCurl + cup);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        return geo;
    }, []);

    // 2. PHÂN LỚP CÁNH HOA (Layered Logic)
    const petalsData = useMemo(() => {
        const data: PetalData[] = [];
        let petalIdCounter = 0;
        const layers = [
            { count: 6, color: "#8a0c24", scale: [0.25, 0.35, 0.32] },
            { count: 8, color: "#9c1130", scale: [0.45, 0.52, 0.45] },
            { count: 10, color: "#c41a45", scale: [0.65, 0.7, 0.6] },
            { count: 12, color: "#ff5e84", scale: [0.9, 0.8, 0.75] }
        ];

        for (let l = layers.length - 1; l >= 0; l--) {
            const layer = layers[l];
            for (let i = 0; i < layer.count; i++) {
                data.push({
                    id: petalIdCounter++,
                    layerIndex: l,
                    color: layer.color,
                    scale: layer.scale as [number, number, number]
                });
            }
        }
        return data;
    }, []);

    const totalCount = petalsData.length;

    const handleInteract = () => {
        if (currentScene === 'prelude') {
            requestSceneTransition('intro');
            return;
        }

        const next = Math.min(openCount + 6, totalCount);
        if (next !== openCount) {
            setOpenCount(next);
            setBloomProgress(next / totalCount);

            // Nếu hoa nở được khoảng 85% hoặc hơn, bắt đầu chuẩn bị hiện thư
            if (next >= totalCount * 0.85 && currentScene === 'intro') {
                requestSceneTransition('flower');
            }
        }
    };

    useFrame((state, delta) => {
        // Defer costly per-frame work when not in active scenes or on low quality
        const activeScenes = ['intro', 'flower', 'climax', 'chocolate'];
        if (!groupRef.current || performanceLevel === 'low' || !activeScenes.includes(currentScene)) return;

        const t = state.clock.elapsedTime;
        const breathe = 1 + Math.sin(t * 1.2) * 0.005;
        groupRef.current.scale.set(scale * breathe, scale * breathe, scale * breathe);

        // ROTATION LOGIC
        if (isHolding) {
            const deltaX = (state.mouse.x - grabMouse.current.x) * Math.PI;
            const deltaY = (state.mouse.y - grabMouse.current.y) * Math.PI;

            // Detect if user is intentionally dragging/rotating
            if (Math.abs(deltaX) > 0.01 || Math.abs(deltaY) > 0.01) {
                isDragging.current = true;
            }

            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, grabRotation.current.y + deltaX, 0.2);
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, grabRotation.current.x - deltaY, 0.2);
        } else if (autoRotate) {
            groupRef.current.rotation.y += delta * 0.15;
            // Gentle sway reset when released
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.05);
        } else {
            // Idle state sway
            groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.12;
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.05);
        }

        // Core Pulse Animation
        if (coreRef.current) {
            const pulse = 1 + Math.sin(t * 3.0) * 0.15;
            const size = Math.max(0.001, bloomProgress);
            coreRef.current.scale.setScalar(size * pulse);
        }
        if (glowLightRef.current) {
            const pulse = 1 + Math.sin(t * 3.0) * 0.15;
            glowLightRef.current.intensity = (0.5 + bloomProgress * 3.0) * pulse;
        }
    });

    return (
        <group position={position as [number, number, number]} ref={groupRef}>
            <mesh
                visible={false}
                // Removed onClick to handle logic in PointerUp for better control
                onPointerOver={() => { setIsHovered(true); setRoseHover(true); document.body.style.cursor = 'grab'; }}
                onPointerOut={() => {
                    setIsHovered(false);
                    setRoseHover(false);
                    setIsHolding(false);
                    setIsInspecting(false);
                    document.body.style.cursor = 'auto';
                }}
                onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                    e.stopPropagation();
                    setIsHolding(true);
                    setIsInspecting(true);
                    isDragging.current = false; // Reset drag state
                    if (groupRef.current) {
                        grabRotation.current.copy(groupRef.current.rotation);
                        grabMouse.current.copy(e.pointer);
                        dragStartPos.current.copy(e.pointer);
                    }
                }}
                onPointerUp={() => {
                    setIsHolding(false);
                    setIsInspecting(false);
                    // If not dragging (just a click), trigger the bloom interaction
                    if (!isDragging.current) {
                        handleInteract();
                    }
                }}
            >
                <sphereGeometry args={[1.3, 16, 16]} />
            </mesh>

            {isBud && isHovered && openCount === 0 && (
                <Html position={[0, 1.8, 0]} center distanceFactor={10}>
                    <div style={{ color: 'white', opacity: 0.8, fontSize: '12px', whiteSpace: 'nowrap', fontStyle: 'italic', textShadow: '0 0 10px rgba(255,100,100,0.6)' }}>
                        Nhấn để bắt đầu
                    </div>
                </Html>
            )}

            {/* Thân và Đài hoa */}
            <mesh receiveShadow castShadow position={[0, -0.05, 0]}>
                <tubeGeometry args={[
                    new THREE.CatmullRomCurve3([
                        new THREE.Vector3(0, -3.5, 0),
                        new THREE.Vector3(0.05, -2.0, 0.05),
                        new THREE.Vector3(-0.02, -0.8, -0.02),
                        new THREE.Vector3(0, 0, 0),
                    ]),
                    32, 0.045, 16, false
                ]} />
                <meshStandardMaterial color="#1a2e1a" roughness={0.9} />
            </mesh>

            <group position={[0, -0.05, 0]}>
                {[0, 1, 2, 3, 4].map(i => (
                    <mesh key={i} rotation={[0.45, i * Math.PI * 0.4, 0]} castShadow receiveShadow>
                        <meshStandardMaterial color="#1a2e1a" roughness={0.8} side={THREE.DoubleSide} />
                        <cylinderGeometry args={[0.01, 0.06, 0.55, 8, 4, true, 0, 0.6]} />
                    </mesh>
                ))}
            </group>

            {/* Các lớp cánh hoa */}
            {petalsData.map((p, idx) => (
                <CrystalPetal
                    key={p.id}
                    {...p}
                    index={idx}
                    openCount={openCount}
                    geometry={petalGeometry}
                    veinTex={veinTex}
                    performanceLevel={performanceLevel}
                />
            ))}

            {/* Glowing Core - Visible Heart of the Flower */}
            <mesh ref={coreRef} position={[0, 0.4, 0]}>
                <sphereGeometry args={[0.12, 32, 32]} />
                <meshBasicMaterial color="#ffeba1" transparent opacity={0.9} toneMapped={false} />
            </mesh>

            <pointLight
                ref={glowLightRef}
                position={[0, 0.5, 0]}
                color="#ff4d6d"
                distance={2.5}
                decay={2}
            />

            <spotLight
                position={[0, 5, 4]}
                intensity={1.2} // Reduced from 1.8
                angle={0.4}
                penumbra={1}
                color="#ffffff"
                castShadow={performanceLevel === 'high' && currentScene !== 'prelude'}
            />
        </group>
    );
});