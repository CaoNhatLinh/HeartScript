import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';
import { EnvelopeSparkle } from './EnvelopeSparkle';
import { Text } from '@react-three/drei';

/**
 * LetterEnvelope: Physically accurate Back-of-Envelope.
 * FIX: Reserved the rotation logic. 
 * If it was ngả về trước (leaning forward), it means the rotation sign was wrong or the axis was flip.
 * We will now force it to rotate NEGATIVE X to lean BACKWARDS.
 */
export const LetterEnvelope: React.FC = () => {
    // Parent handles visibility via unconditional mount/unmount
    // const active = useExperienceStore((s) => s.activeLayers.letter); 
    const performanceLevel = useExperienceStore((s) => s.performanceLevel);

    const [isOpen, setIsOpen] = useState(false);
    const [isHolding, setIsHolding] = useState(false);
    const grabRotation = useRef(new THREE.Euler());
    const grabMouse = useRef(new THREE.Vector2());
    const setReading = useExperienceStore((s) => s.setReadingLetter);
    const setIsInspecting = useExperienceStore((s) => s.setIsInspecting);
    const [hovered, setHovered] = useState(false);

    const groupRef = useRef<THREE.Group>(null);
    const flapPivotRef = useRef<THREE.Group>(null);
    const cardRef = useRef<THREE.Group>(null);
    const openProgress = useRef(0);

    const clippingPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), []);

    // Colors - CLASSIC RED
    const ENVELOPE_RED = '#5e000d';
    const HIGHLIGHT_RED = '#900020';
    const GOLD = '#ffbf00';

    const { baseGeometry, sideFlapGeo, bottomFlapGeo, topFlapGeo, cardGeometry } = useMemo(() => {
        const w = 2.4;
        const h = 1.6;

        // 1. BASE PANEL
        const base = new THREE.BoxGeometry(w, h, 0.01);

        // 2. SIDE FLAPS (Classic Sharp)
        const sideShape = new THREE.Shape();
        sideShape.moveTo(0, -h / 2);
        sideShape.lineTo(w / 2, 0);
        sideShape.lineTo(0, h / 2);
        sideShape.lineTo(0, -h / 2);

        // 3. BOTTOM FLAP (Classic Sharp)
        const botShape = new THREE.Shape();
        botShape.moveTo(-w / 2, -h / 2);
        botShape.lineTo(w / 2, -h / 2);
        botShape.lineTo(0, 0);
        botShape.lineTo(-w / 2, -h / 2);

        // 4. TOP FLAP
        const foldDist = 0.05;
        const lidShape = new THREE.Shape();
        lidShape.moveTo(-w / 2, 0);
        lidShape.lineTo(w / 2, 0);
        lidShape.lineTo(w / 2 - 0.02, -foldDist);
        lidShape.lineTo(0, -h * 0.85);
        lidShape.lineTo(-w / 2 + 0.02, -foldDist);
        lidShape.lineTo(-w / 2, 0);

        return {
            baseGeometry: base,
            sideFlapGeo: new THREE.ShapeGeometry(sideShape),
            bottomFlapGeo: new THREE.ShapeGeometry(botShape),
            topFlapGeo: new THREE.ShapeGeometry(lidShape),
            cardGeometry: new THREE.BoxGeometry(w * 0.9, h * 0.88, 0.015)
        };
    }, []);

    useFrame((state) => {
        // Skip if not animating/interacting and low perf (unless hovering/holding)
        // Also ensure group is ready.
        if (!groupRef.current || !flapPivotRef.current || !cardRef.current) return;

        openProgress.current = THREE.MathUtils.lerp(openProgress.current, isOpen ? 1 : 0, 0.06);
        const t = openProgress.current;

        // Hover Scale Effect
        const targetScale = hovered ? 1.05 : 1.0;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        // Interaction
        if (isHolding) {
            const dx = (state.mouse.x - grabMouse.current.x) * Math.PI;
            const dy = (state.mouse.y - grabMouse.current.y) * Math.PI;
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, grabRotation.current.y + dx, 0.2);
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, grabRotation.current.x - dy, 0.2);
        } else {
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.1, 0.05);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, -0.15, 0.05);
        }

        // --- STRICT SEQUENTIAL ANIMATION ---

        // 1. FLAP ANIMATION (Completes at t=0.7)
        const flapT = Math.min(t / 0.7, 1.0);
        flapPivotRef.current.rotation.x = THREE.MathUtils.lerp(0, -3.5, flapT);

        // 2. CARD SLIDE (Starts only after t > 0.7)
        const slideT = Math.max(0, (t - 0.7) * 3.33);
        cardRef.current.position.y = THREE.MathUtils.lerp(0, 1.4, slideT);

        // Clip Plane Update
        const matrix = groupRef.current.matrixWorld;
        const mouthPos = new THREE.Vector3(0, 0.8, -0.02).applyMatrix4(matrix);
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
        const mouthNormal = new THREE.Vector3(0, 1, 0).applyMatrix3(normalMatrix).normalize();
        clippingPlane.setFromNormalAndCoplanarPoint(mouthNormal, mouthPos);
    });

    return (
        <group
            ref={groupRef}
            onPointerOver={() => { setHovered(true); document.body.style.cursor = 'grab'; }}
            onPointerOut={() => { setHovered(false); setIsHolding(false); setIsInspecting(false); document.body.style.cursor = 'auto'; }}
            onPointerDown={(e) => {
                e.stopPropagation();
                setIsHolding(true);
                setIsInspecting(true);
                if (groupRef.current) {
                    grabRotation.current.copy(groupRef.current.rotation);
                    grabMouse.current.copy((e as any).pointer || e); // Three.js events can be tricky with types, but we can avoid explicit 'any' on param
                }
            }}
            onPointerUp={() => { setIsHolding(false); setIsInspecting(false); }}
            onClick={(e) => { e.stopPropagation(); if (!isOpen) setIsOpen(true); }}
        >
            <EnvelopeSparkle count={15} />

            {/* 1. BASE PANEL */}
            <mesh position={[0, 0, -0.02]} castShadow={performanceLevel === 'high'} receiveShadow={performanceLevel === 'high'}>
                <primitive object={baseGeometry} />
                <meshPhysicalMaterial color={ENVELOPE_RED} roughness={0.9} side={THREE.DoubleSide} />
            </mesh>

            {/* 2. CARD */}
            <group ref={cardRef} position={[0, 0, 0.01]} onClick={(e) => { e.stopPropagation(); if (isOpen) setReading(true); }}>
                <mesh geometry={cardGeometry} castShadow={performanceLevel === 'high'} receiveShadow={performanceLevel === 'high'}>
                    <meshPhysicalMaterial
                        color="#fffcf5"
                        roughness={0.8}
                        clippingPlanes={[clippingPlane]}
                        clipShadows
                    />
                </mesh>
                <Text
                    position={[0, 0.1, 0.01]}
                    fontSize={0.12}
                    color="#1a1a1a"
                    maxWidth={2.0}
                    textAlign="center"
                    onSync={(textMesh) => {
                        if (textMesh.material) {
                            textMesh.material.clippingPlanes = [clippingPlane];
                            textMesh.material.clipShadows = true;
                            textMesh.material.needsUpdate = true;
                        }
                    }}
                >
                    {`Happy Valentine's\nDay My Love`}
                </Text>
            </group>

            {/* 3. POCKET FLAPS */}
            <group position={[0, 0, 0.03]}>
                <mesh geometry={sideFlapGeo} position={[-1.2, 0, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
                    <meshPhysicalMaterial color={ENVELOPE_RED} roughness={0.85} sheen={0.5} sheenColor={HIGHLIGHT_RED} side={THREE.DoubleSide} />
                    <mesh position={[0.2, -0.6, 0.01]} scale={[0.2, 0.2, 1]}>
                        <planeGeometry />
                        <meshBasicMaterial color={GOLD} />
                    </mesh>
                </mesh>
                <mesh geometry={sideFlapGeo} position={[1.2, 0, 0]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
                    <meshPhysicalMaterial color={ENVELOPE_RED} roughness={0.85} sheen={0.5} sheenColor={HIGHLIGHT_RED} side={THREE.DoubleSide} />
                    <mesh position={[0.2, -0.6, -0.01]} scale={[0.2, 0.2, 1]}>
                        <planeGeometry />
                        <meshBasicMaterial color={GOLD} side={THREE.DoubleSide} />
                    </mesh>
                </mesh>
                <mesh geometry={bottomFlapGeo} position={[0, 0.0, 0.005]} castShadow receiveShadow>
                    <meshPhysicalMaterial color={ENVELOPE_RED} roughness={0.85} sheen={0.5} sheenColor={HIGHLIGHT_RED} side={THREE.DoubleSide} />
                    <mesh position={[0, -0.79, 0.001]}>
                        <planeGeometry args={[2.3, 0.02]} />
                        <meshPhysicalMaterial color={GOLD} metalness={1} roughness={0.1} />
                    </mesh>
                </mesh>
            </group>

            {/* 4. TOP LID/FLAP */}
            <group ref={flapPivotRef} position={[0, 0.8, -0.02]}>
                <mesh geometry={topFlapGeo} rotation={[0, 0, 0]} castShadow receiveShadow>
                    <meshPhysicalMaterial color={ENVELOPE_RED} roughness={0.85} sheen={1.0} sheenColor={HIGHLIGHT_RED} side={THREE.DoubleSide} />
                    <group position={[0, -0.7, 0.02]}>
                        {/* Classic Wax Seal (Circle + Cylinder) */}
                        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                            <cylinderGeometry args={[0.18, 0.18, 0.05, 32]} />
                            <meshPhysicalMaterial color="#8b0000" roughness={0.4} />
                        </mesh>
                        <mesh position={[0, 0, 0.03]} castShadow receiveShadow>
                            <circleGeometry args={[0.11, 32]} />
                            <meshPhysicalMaterial color={GOLD} metalness={1} roughness={0.1} />
                        </mesh>
                    </group>
                </mesh>
            </group>
        </group>
    );
};
