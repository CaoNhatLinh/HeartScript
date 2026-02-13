'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useExperienceStore } from '../../store/useExperienceStore';

/**
 * FireworksEffect — Phase 12
 * 3D fireworks with trails, sparkle bursts, and fading particles.
 * Triggered alongside ConfettiBurst via `showConfetti` store flag.
 */

const ROCKET_COUNT = 3;
const SPARKS_PER_BURST = 60;
const TRAIL_PER_ROCKET = 8;
const TOTAL_PARTICLES = ROCKET_COUNT * SPARKS_PER_BURST + ROCKET_COUNT * TRAIL_PER_ROCKET;

const FIREWORK_COLORS = [
    [new THREE.Color('#FF69B4'), new THREE.Color('#FFB6C1'), new THREE.Color('#FF1493')], // Pink burst
    [new THREE.Color('#FFD700'), new THREE.Color('#FFA500'), new THREE.Color('#FF6347')], // Gold-orange
    [new THREE.Color('#E040FB'), new THREE.Color('#BA68C8'), new THREE.Color('#CE93D8')], // Purple
];

const GRAVITY = -3.5;
const dummy = new THREE.Object3D();
const tempColor = new THREE.Color();

interface Particle {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    color: THREE.Color;
    life: number;
    maxLife: number;
    size: number;
    type: 'trail' | 'spark';
    /** For sparks — delay before they appear (simulates burst timing) */
    delay: number;
    /** Pre-generated random values for deterministic reset */
    burstX: number;
    burstY: number;
    burstZ: number;
    initialVelX: number;
    initialVelY: number;
    initialVelZ: number;
    colorIndex: number;
    theta?: number;
    phi?: number;
    speed?: number;
}

export const FireworksEffect: React.FC = () => {
    const showConfetti = useExperienceStore((s) => s.showConfetti);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const phaseRef = useRef<'idle' | 'rising' | 'burst' | 'fading'>('idle');
    const elapsedRef = useRef(0);

    const particlesRef = useRef<Particle[]>([]);

    // Initialize particles on mount
    useEffect(() => {
        const arr: Particle[] = [];
        for (let r = 0; r < ROCKET_COUNT; r++) {
            const burstX = (r - 1) * 3.0 + (Math.random() - 0.5) * 2.0; // Wider gap
            const burstY = 5.0 + Math.random() * 3.0; // Higher burst
            const burstZ = -3 + Math.random() * 2.0;
            const colorSet = FIREWORK_COLORS[r % FIREWORK_COLORS.length];

            // Trail particles (follow rocket path upward)
            for (let t = 0; t < TRAIL_PER_ROCKET; t++) {
                const velX = (Math.random() - 0.5) * 0.3;
                const velY = 4 + Math.random() * 2;
                const velZ = (Math.random() - 0.5) * 0.2;
                arr.push({
                    pos: new THREE.Vector3(burstX, -1 - t * 0.3, burstZ),
                    vel: new THREE.Vector3(velX, velY, velZ),
                    color: new THREE.Color('#FFE4B5'),
                    life: 0.8 + Math.random() * 0.4,
                    maxLife: 0.8 + Math.random() * 0.4,
                    size: 0.02 + Math.random() * 0.02,
                    type: 'trail',
                    delay: t * 0.04,
                    burstX,
                    burstY,
                    burstZ,
                    initialVelX: velX,
                    initialVelY: velY,
                    initialVelZ: velZ,
                    colorIndex: 0, // not used for trails
                });
            }

            // Spark burst particles
            for (let s = 0; s < SPARKS_PER_BURST; s++) {
                // Spherical distribution
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const speed = 2.5 + Math.random() * 3.5; // Faster explosion
                const vx = Math.sin(phi) * Math.cos(theta) * speed;
                const vy = Math.sin(phi) * Math.sin(theta) * speed;
                const vz = Math.cos(phi) * speed;

                // Assign color deterministically based on spark index
                const colorIndex = (r * SPARKS_PER_BURST + s) % colorSet.length;

                arr.push({
                    pos: new THREE.Vector3(burstX, burstY, burstZ),
                    vel: new THREE.Vector3(vx, vy + 0.5, vz),
                    color: colorSet[colorIndex].clone(),
                    life: 1.5 + Math.random() * 1.2, // Longer life
                    maxLife: 1.5 + Math.random() * 1.2,
                    size: 0.04 + Math.random() * 0.05, // Larger particles
                    type: 'spark',
                    delay: 0.5 + r * 0.3 + Math.random() * 0.1, // Stagger bursts per rocket
                    burstX,
                    burstY,
                    burstZ,
                    initialVelX: vx,
                    initialVelY: vy + 0.5,
                    initialVelZ: vz,
                    colorIndex,
                    theta,
                    phi,
                    speed,
                });
            }
        }
        particlesRef.current = arr;
    }, []);

    const resetParticles = useCallback(() => {
        const particles = particlesRef.current;
        for (let r = 0; r < ROCKET_COUNT; r++) {
            const colorSet = FIREWORK_COLORS[r % FIREWORK_COLORS.length];
            const base = r * (TRAIL_PER_ROCKET + SPARKS_PER_BURST);

            // Reset trails
            for (let t = 0; t < TRAIL_PER_ROCKET; t++) {
                const p = particles[base + t];
                p.pos.set(p.burstX, -1 - t * 0.3, p.burstZ);
                p.vel.set(p.initialVelX, p.initialVelY, p.initialVelZ);
                p.life = p.maxLife;
                p.delay = t * 0.04;
            }

            // Reset sparks
            for (let s = 0; s < SPARKS_PER_BURST; s++) {
                const p = particles[base + TRAIL_PER_ROCKET + s];
                p.pos.set(p.burstX, p.burstY, p.burstZ);
                p.vel.set(p.initialVelX, p.initialVelY, p.initialVelZ);
                p.color.copy(colorSet[p.colorIndex]);
                p.life = p.maxLife;
                p.delay = 0.5 + r * 0.3 + (p.theta || 0) * 0.1; // Use theta as delay factor
            }
        }
        phaseRef.current = 'rising';
        elapsedRef.current = 0;
    }, []);

    // Detect trigger
    const prevShowRef = useRef(false);

    useFrame((_, delta) => {
        if (!meshRef.current) return;

        // Trigger on showConfetti flip to true
        if (showConfetti && !prevShowRef.current) {
            resetParticles();
        }
        prevShowRef.current = showConfetti;

        if (phaseRef.current === 'idle') {
            // Hide all
            for (let i = 0; i < TOTAL_PARTICLES; i++) {
                dummy.position.set(0, -100, 0);
                dummy.scale.setScalar(0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }
            meshRef.current.instanceMatrix.needsUpdate = true;
            return;
        }

        elapsedRef.current += delta;
        let allDead = true;

        for (let i = 0; i < TOTAL_PARTICLES; i++) {
            const p = particlesRef.current[i];

            // Particle hasn't started yet
            if (elapsedRef.current < p.delay) {
                dummy.position.set(0, -100, 0);
                dummy.scale.setScalar(0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
                meshRef.current.setColorAt(i, tempColor.setScalar(0));
                allDead = false;
                continue;
            }

            // Decrease life
            p.life -= delta;
            if (p.life <= 0) {
                dummy.position.set(0, -100, 0);
                dummy.scale.setScalar(0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
                continue;
            }

            allDead = false;

            // Physics
            p.vel.y += GRAVITY * delta;
            // Air resistance for sparks
            if (p.type === 'spark') {
                p.vel.multiplyScalar(1 - 1.2 * delta);
            }
            p.pos.addScaledVector(p.vel, delta);

            // Alpha based on remaining life
            const alpha = Math.min(1, p.life / (p.maxLife * 0.3));
            const scale = p.size * (p.type === 'trail' ? (0.3 + alpha * 0.7) : alpha);

            dummy.position.copy(p.pos);
            dummy.scale.setScalar(scale * 30); // Scale up for visibility
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);

            // Color with fade
            tempColor.copy(p.color);
            tempColor.multiplyScalar(alpha);
            meshRef.current.setColorAt(i, tempColor);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }

        if (allDead) {
            phaseRef.current = 'idle';
        }
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, TOTAL_PARTICLES]}
            frustumCulled={false}
        >
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshBasicMaterial
                transparent
                opacity={0.9}
                toneMapped={false}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </instancedMesh>
    );
};
