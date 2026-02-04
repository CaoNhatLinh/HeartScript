import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';

// Tạo hình trái tim
const createHeartShape = () => {
    const x = 0, y = 0;
    const heartShape = new THREE.Shape();
    heartShape.moveTo(x + 0.25, y + 0.25);
    heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.20, y, x, y);
    heartShape.bezierCurveTo(x - 0.30, y, x - 0.30, y + 0.35, x - 0.30, y + 0.35);
    heartShape.bezierCurveTo(x - 0.30, y + 0.55, x - 0.10, y + 0.77, x + 0.25, y + 0.95);
    heartShape.bezierCurveTo(x + 0.60, y + 0.77, x + 0.80, y + 0.55, x + 0.80, y + 0.35);
    heartShape.bezierCurveTo(x + 0.80, y + 0.35, x + 0.80, y, x + 0.50, y);
    heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);
    return heartShape;
};

// Seeded random để đảm bảo tính nhất quán
const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
};

// Các loại chất liệu
type MaterialType = 'crystal' | 'paper' | 'glass' | 'gold' | 'glow';

// Màu sắc theo chất liệu
const MATERIAL_COLORS: Record<MaterialType, { color: string; emissive: string }> = {
    crystal: { color: '#f8b4d4', emissive: '#e898c0' },
    paper: { color: '#ffe4e9', emissive: '#ffb6c1' },
    glass: { color: '#b8e0ff', emissive: '#7ec8e3' },
    gold: { color: '#ffd700', emissive: '#daa520' },
    glow: { color: '#ff4d6d', emissive: '#e63963' }
};

// Mở rộng range mặc định lên 20
export const FloatingHearts: React.FC<{ count?: number, range?: number }> = ({ count = 60, range = 20 }) => {
    // 5 mesh refs cho 5 loại material
    const crystalRef = useRef<THREE.InstancedMesh>(null);
    const paperRef = useRef<THREE.InstancedMesh>(null);
    const glassRef = useRef<THREE.InstancedMesh>(null);
    const goldRef = useRef<THREE.InstancedMesh>(null);
    const glowRef = useRef<THREE.InstancedMesh>(null);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    const active = useExperienceStore(s => s.activeLayers.hearts);
    const performanceLevel = useExperienceStore(s => s.performanceLevel);
    const layerParams = useExperienceStore(s => s.layerParams);

    const effectiveCount = layerParams.heartCount ?? count;
    const effectiveSpeed = layerParams.heartSpeed ?? 1.0;

    // Tạo particles với seeded random
    const { particles, countsByType } = useMemo(() => {
        const materials: MaterialType[] = ['crystal', 'paper', 'glass', 'gold', 'glow'];
        const counts: Record<MaterialType, number> = { crystal: 0, paper: 0, glass: 0, gold: 0, glow: 0 };

        // EXTENDED RANGE: Multiply range by 1.5 - 2.0 effectively for wider spread
        const spreadX = range * 1.5;
        const spreadY = range * 1.2;
        const spreadZ = range * 0.8;

        const pts = new Array(effectiveCount).fill(0).map((_, i) => {
            const seed = i * 1000;
            const matType = materials[Math.floor(seededRandom(seed + 20) * materials.length)];
            const indexInType = counts[matType]++;

            return {
                position: [
                    (seededRandom(seed + 1) - 0.5) * spreadX,
                    (seededRandom(seed + 2) - 0.5) * spreadY,
                    (seededRandom(seed + 3) - 0.5) * spreadZ
                ],
                rotation: [
                    seededRandom(seed + 4) * Math.PI * 2,
                    seededRandom(seed + 5) * Math.PI * 2,
                    seededRandom(seed + 6) * Math.PI * 2
                ],
                // CHAOTIC SPEED: Wider variance
                speed: 0.002 + seededRandom(seed + 7) * 0.012,
                // CHAOTIC ROTATION: Faster and unpredictable
                rotationSpeed: (seededRandom(seed + 8) - 0.5) * 0.03,
                scale: 0.05 + seededRandom(seed + 9) * 0.12,
                shimmerPhase: seededRandom(seed + 10) * Math.PI * 2,
                materialType: matType,
                indexInType,
                // New: random drift factors for "lung tung" motion
                driftX: (seededRandom(seed + 11) - 0.5) * 0.02,
                driftZ: (seededRandom(seed + 12) - 0.5) * 0.02,
            };
        });

        return { particles: pts, countsByType: counts };
    }, [effectiveCount, range]);

    // Geometry với bevel đẹp hơn
    const geometry = useMemo(() => {
        const shape = createHeartShape();
        return new THREE.ExtrudeGeometry(shape, {
            depth: 0.06,
            bevelEnabled: true,
            bevelThickness: 0.015,
            bevelSize: 0.015,
            bevelSegments: 2
        });
    }, []);

    const isVisible = active && performanceLevel !== 'low';
    const frameCount = useRef(0);

    // FIX: Initialize positions in useLayoutEffect to prevent "clump" at (0,0,0) on first frame
    React.useLayoutEffect(() => {
        if (!isVisible) return;

        const meshRefs: Record<MaterialType, THREE.InstancedMesh | null> = {
            crystal: crystalRef.current,
            paper: paperRef.current,
            glass: glassRef.current,
            gold: goldRef.current,
            glow: glowRef.current
        };

        particles.forEach((particle) => {
            const mesh = meshRefs[particle.materialType];
            if (!mesh) return;

            dummy.position.set(particle.position[0], particle.position[1], particle.position[2]);
            dummy.rotation.set(particle.rotation[0], particle.rotation[1], particle.rotation[2]);
            dummy.scale.set(particle.scale, particle.scale, particle.scale);
            dummy.updateMatrix();
            mesh.setMatrixAt(particle.indexInType, dummy.matrix);
        });

        // Force update immediately
        Object.values(meshRefs).forEach(mesh => {
            if (mesh) mesh.instanceMatrix.needsUpdate = true;
        });

    }, [particles, isVisible, dummy]);

    useFrame((state, delta) => {
        if (!isVisible) return;

        frameCount.current++;
        const skipFrames = performanceLevel === 'medium' ? 2 : 1;
        if (frameCount.current % skipFrames !== 0) return;

        const time = state.clock.elapsedTime;
        const speedMultiplier = delta * 60 * effectiveSpeed;
        const windIntensity = (layerParams.windIntensity ?? 0.5) * 0.03;

        // Map mesh refs
        const meshRefs: Record<MaterialType, THREE.InstancedMesh | null> = {
            crystal: crystalRef.current,
            paper: paperRef.current,
            glass: glassRef.current,
            gold: goldRef.current,
            glow: glowRef.current
        };

        particles.forEach((particle) => {
            const mesh = meshRefs[particle.materialType];
            if (!mesh) return;

            // Updated Chaotic Movement
            // 1. Vertical rise
            particle.position[1] += particle.speed * speedMultiplier;

            // 2. Chaotic Horizontal Drift (Sine wave + random constant drift)
            particle.position[0] += (Math.sin(time * 0.5 + particle.shimmerPhase) * 0.01 + particle.driftX) * windIntensity * 5 * speedMultiplier;
            particle.position[2] += (Math.cos(time * 0.3 + particle.shimmerPhase) * 0.01 + particle.driftZ) * windIntensity * 5 * speedMultiplier;

            // Reset khi lên quá cao
            const heightLimit = range / 2;
            if (particle.position[1] > heightLimit) {
                particle.position[1] = -heightLimit;
                // Respawn totally random X/Z
                particle.position[0] = (seededRandom(Math.random() * 1000) - 0.5) * range * 1.5;
                particle.position[2] = (seededRandom(Math.random() * 1000) - 0.5) * range * 0.8;
            }

            // Update rotation with more chaos
            particle.rotation[0] += particle.rotationSpeed * speedMultiplier;
            particle.rotation[1] += particle.rotationSpeed * speedMultiplier * 0.8;
            particle.rotation[2] += Math.sin(time * 2.0 + particle.shimmerPhase) * 0.02;

            dummy.position.set(particle.position[0], particle.position[1], particle.position[2]);
            dummy.rotation.set(particle.rotation[0], particle.rotation[1], particle.rotation[2]);

            // Shimmer scale effect
            const shimmer = 1 + Math.sin(time * 2.5 + particle.shimmerPhase) * 0.15;
            const finalScale = particle.scale * shimmer;
            dummy.scale.set(finalScale, finalScale, finalScale);

            dummy.updateMatrix();
            mesh.setMatrixAt(particle.indexInType, dummy.matrix);
        });

        // Update all meshes
        Object.values(meshRefs).forEach(mesh => {
            if (mesh) mesh.instanceMatrix.needsUpdate = true;
        });
    });

    if (!isVisible) return null;

    return (
        <group>
            {/* Crystal Hearts - Trong suốt, lấp lánh */}
            {countsByType.crystal > 0 && (
                <instancedMesh ref={crystalRef} args={[geometry, undefined, countsByType.crystal]} raycast={() => null}>
                    <meshPhysicalMaterial
                        color={MATERIAL_COLORS.crystal.color}
                        transmission={0.6}
                        thickness={0.3}
                        roughness={0.15}
                        ior={1.45}
                        transparent
                        opacity={0.85}
                    />
                </instancedMesh>
            )}

            {/* Paper Hearts - Mờ, mềm mại */}
            {countsByType.paper > 0 && (
                <instancedMesh ref={paperRef} args={[geometry, undefined, countsByType.paper]} raycast={() => null}>
                    <meshStandardMaterial
                        color={MATERIAL_COLORS.paper.color}
                        roughness={0.9}
                        metalness={0}
                        transparent
                        opacity={0.8}
                        side={THREE.DoubleSide}
                    />
                </instancedMesh>
            )}

            {/* Glass Hearts - Trong xanh */}
            {countsByType.glass > 0 && (
                <instancedMesh ref={glassRef} args={[geometry, undefined, countsByType.glass]} raycast={() => null}>
                    <meshPhysicalMaterial
                        color={MATERIAL_COLORS.glass.color}
                        transmission={0.8}
                        thickness={0.2}
                        roughness={0.05}
                        ior={1.6}
                        transparent
                        opacity={0.7}
                    />
                </instancedMesh>
            )}

            {/* Gold Hearts - Vàng kim loại */}
            {countsByType.gold > 0 && (
                <instancedMesh ref={goldRef} args={[geometry, undefined, countsByType.gold]} raycast={() => null}>
                    <meshStandardMaterial
                        color={MATERIAL_COLORS.gold.color}
                        metalness={0.95}
                        roughness={0.15}
                        envMapIntensity={1.5}
                    />
                </instancedMesh>
            )}

            {/* Glow Hearts - Phát sáng */}
            {countsByType.glow > 0 && (
                <instancedMesh ref={glowRef} args={[geometry, undefined, countsByType.glow]} raycast={() => null}>
                    <meshStandardMaterial
                        color={MATERIAL_COLORS.glow.color}
                        emissive={MATERIAL_COLORS.glow.emissive}
                        emissiveIntensity={0.7}
                        transparent
                        opacity={0.9}
                    />
                </instancedMesh>
            )}
        </group>
    );
};
