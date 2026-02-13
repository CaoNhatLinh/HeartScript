import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';

// Local mini-fireworks/confetti specifically for the GiftBox
const BoxFireworks: React.FC<{ active: boolean }> = ({ active }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const particleCount = 50;
    const dummy = new THREE.Object3D();
    const [particles] = useState(() => Array.from({ length: particleCount }).map(() => ({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 3 + 2, (Math.random() - 0.5) * 2),
        color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
        life: 0,
        active: false
    })));

    // Actually, simpler approach: Just render standard confetti burst at box position using the main ConfettiBurst but positioning matters.
    // The user wants "fireworks AT THE GIFT BOX POSITION".
    // Let's implement a simple direct mesh system.

    const launchedRef = useRef(false);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        if (active && !launchedRef.current) {
            // Launch!
            particles.forEach(p => {
                p.pos.set(0, 0, 0); // Local to box center
                p.vel.set((Math.random() - 0.5) * 1.5, Math.random() * 2 + 1, (Math.random() - 0.5) * 1.5);
                p.life = 1.0 + Math.random() * 0.5;
                p.active = true;
            });
            launchedRef.current = true;
        } else if (!active) {
            launchedRef.current = false; // Reset for close/re-open
        }

        let anyActive = false;
        particles.forEach((p, i) => {
            if (p.active) {
                p.life -= delta;
                p.vel.y -= 5 * delta; // Gravity
                p.pos.addScaledVector(p.vel, delta);

                if (p.life <= 0) p.active = false;
                else anyActive = true;

                dummy.position.copy(p.pos);
                dummy.scale.setScalar(p.active ? p.life * 0.5 : 0);
                dummy.updateMatrix();
                meshRef.current!.setMatrixAt(i, dummy.matrix);
                meshRef.current!.setColorAt(i, p.color);
            } else {
                dummy.scale.setScalar(0);
                dummy.updateMatrix();
                meshRef.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]} position={[0, 0.2, 0]}>
            <boxGeometry args={[0.03, 0.03, 0.03]} />
            <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
    );
};

export const GiftBox: React.FC = () => {
    const lidRef = useRef<THREE.Group>(null);
    const [isOpen, setIsOpen] = useState(false);
    const openProgress = useRef(0);
    const triggerConfetti = useExperienceStore((s) => s.triggerConfetti);

    useFrame(() => {
        if (!lidRef.current) return;
        // Smoothly animate open progress
        openProgress.current = THREE.MathUtils.lerp(
            openProgress.current,
            isOpen ? 1 : 0,
            0.05
        );

        // Lid pivots from the back edge (negative Z)
        // Rotate backward up to -110 degrees for a wide open feel
        if (lidRef.current) {
            lidRef.current.rotation.x = THREE.MathUtils.lerp(0, -Math.PI * 0.7, openProgress.current);
        }
    });

    const BOX_W = 0.6;
    const BOX_H = 0.4;
    const BOX_D = 0.5;
    const LID_H = 0.08;
    const RIBBON_W = 0.08;

    const handleOpen = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (!isOpen) {
            triggerConfetti();
        }
        setIsOpen(!isOpen);
    };

    return (
        <group
            onClick={handleOpen}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
            <BoxFireworks active={isOpen} />
            {/* Box body */}
            <mesh position={[0, BOX_H / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[BOX_W, BOX_H, BOX_D]} />
                <meshPhysicalMaterial color="#E91E63" roughness={0.6} />
            </mesh>

            {/* Ribbon vertical (front to back) */}
            <mesh position={[0, BOX_H / 2, 0]}>
                <boxGeometry args={[RIBBON_W, BOX_H + 0.002, BOX_D + 0.002]} />
                <meshPhysicalMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Ribbon horizontal (left to right) */}
            <mesh position={[0, BOX_H / 2, 0]}>
                <boxGeometry args={[BOX_W + 0.002, BOX_H + 0.002, RIBBON_W]} />
                <meshPhysicalMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Lid - pivots from back edge */}
            <group ref={lidRef} position={[0, BOX_H, -BOX_D / 2]}>
                {/* Lid plate */}
                <mesh position={[0, LID_H / 2, BOX_D / 2]} castShadow>
                    <boxGeometry args={[BOX_W + 0.02, LID_H, BOX_D + 0.02]} />
                    <meshPhysicalMaterial color="#C2185B" roughness={0.5} />
                </mesh>

                {/* Lid ribbon cross */}
                <mesh position={[0, LID_H / 2 + 0.001, BOX_D / 2]}>
                    <boxGeometry args={[RIBBON_W, LID_H + 0.002, BOX_D + 0.022]} />
                    <meshPhysicalMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
                </mesh>
                <mesh position={[0, LID_H / 2 + 0.001, BOX_D / 2]}>
                    <boxGeometry args={[BOX_W + 0.022, LID_H + 0.002, RIBBON_W]} />
                    <meshPhysicalMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
                </mesh>

                {/* Bow - two small torus loops */}
                <mesh position={[-0.06, LID_H + 0.03, BOX_D / 2]} rotation={[0, 0, Math.PI / 4]}>
                    <torusGeometry args={[0.04, 0.015, 8, 16]} />
                    <meshPhysicalMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
                </mesh>
                <mesh position={[0.06, LID_H + 0.03, BOX_D / 2]} rotation={[0, 0, -Math.PI / 4]}>
                    <torusGeometry args={[0.04, 0.015, 8, 16]} />
                    <meshPhysicalMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
                </mesh>

                {/* Bow center knot */}
                <mesh position={[0, LID_H + 0.03, BOX_D / 2]}>
                    <sphereGeometry args={[0.025, 8, 8]} />
                    <meshPhysicalMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
                </mesh>
            </group>
        </group>
    );
};
