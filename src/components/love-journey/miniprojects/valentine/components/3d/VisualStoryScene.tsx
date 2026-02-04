"use client";

import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../store/useExperienceStore';
import { CrystalRose } from './CrystalRose';
import { ChocolateCluster } from './ChocolateCluster';
import { MemoryGroup } from './MemoryGroup';
import { SceneEffects } from './SceneEffects';
import { Particles } from './Particles';
import { FloatingHearts } from './assets/FloatingHearts';
import { WindEffect } from './layers/WindEffect';
import { LetterEnvelope } from './layers/LetterEnvelope';
import { SoftGroundShadow } from './SoftGroundShadow';
import { useGLTF } from '@react-three/drei';

/**
 * VisualStoryScene: The main stage where objects appear in order.
 * 1. Rose (The Hero)
 * 2. Envelope (The Surprise - appears after bloom)
 * 3. Photo (The Heart - appears after reading the letter)
 */
export const VisualStoryScene: React.FC = React.memo(() => {
    const currentScene = useExperienceStore(s => s.currentScene);
    const bloomProgress = useExperienceStore(s => s.bloomProgress);
    const hasReadLetter = useExperienceStore(s => s.hasReadLetter);
    const giftRevealStage = useExperienceStore(s => s.giftRevealStage);

    // Preload the mascot model
    const { scene: mascotScene } = useGLTF('/valentine/models/charator.glb');

    const visibleModels = useExperienceStore((s) => s.visibleModels);

    // 1. Rose (The Hero) - always visible unless debug override
    const showRose = visibleModels?.rose ?? true;

    // 2. Envelope (Bì thư) appears when rose bloomed and scene is flower+
    const isFlowerOrLater = ['flower', 'climax', 'chocolate', 'ending'].includes(currentScene);
    const showEnvelope = (bloomProgress >= 0.85) && isFlowerOrLater && (visibleModels?.envelope ?? true);

    // Scene context for gift reveals
    const isClimaxOrLater = ['climax', 'chocolate', 'ending'].includes(currentScene);

    // 3. Mascot appears when giftRevealStage >= 1 (click lần 1)
    // AND enabled in debug
    const showMascot = (hasReadLetter && isClimaxOrLater && giftRevealStage >= 1) && (visibleModels?.mascot ?? true);

    // 4. Photo appears when giftRevealStage >= 2 (click lần 2)
    const showPhoto = (hasReadLetter && isClimaxOrLater && giftRevealStage >= 2) && (visibleModels?.photo ?? true);

    // 5. Chocolate appears when giftRevealStage >= 3 (click lần 3)
    const showChocolate = (hasReadLetter && isClimaxOrLater && giftRevealStage >= 3) && (visibleModels?.chocolate ?? true);

    const hasTastedChocolate = useExperienceStore(s => s.hasTastedChocolate);

    // FINAL CONVERGENCE STATE
    const isFinalConvergence = currentScene === 'ending' && hasTastedChocolate;

    const modelTransforms = useExperienceStore(s => s.modelTransforms);

    // Refs for groups to animate them smoothly
    const roseGroup = React.useRef<THREE.Group>(null);
    const envelopeGroup = React.useRef<THREE.Group>(null);

    // Animation Loop
    useFrame((_state, delta) => {
        const speed = 2.0 * delta;

        // Use transforms from store
        const { rose, envelope } = modelTransforms;

        // ROSE Target
        if (roseGroup.current) {
            // Lerp to the stored configuration
            const targetPos = new THREE.Vector3(...rose.position);
            roseGroup.current.position.lerp(targetPos, speed);

            // Rotation is static from store unless special logic overrides
            roseGroup.current.rotation.set(rose.rotation[0], rose.rotation[1], rose.rotation[2]);
            roseGroup.current.scale.setScalar(rose.scale);
        }

        // ENVELOPE Target
        if (envelopeGroup.current) {
            const targetPos = new THREE.Vector3(...envelope.position);
            envelopeGroup.current.position.lerp(targetPos, speed);

            // Auto rotate logic combined with stored rotation Y? 
            // For now, let's honor store rotation primarily to allow debugging.
            // If we want "Convergence" auto-rotate, we could blend it, but let's stick to manual control for now as requested.
            envelopeGroup.current.rotation.set(envelope.rotation[0], envelope.rotation[1], envelope.rotation[2]);
            envelopeGroup.current.scale.setScalar(envelope.scale);
        }
    });

    React.useLayoutEffect(() => {
        mascotScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                const mat = m.material as THREE.MeshStandardMaterial;
                if (mat && !Array.isArray(mat)) {
                    // Vinyl Toy Look:
                    mat.roughness = 0.6;
                    mat.metalness = 0.1;
                    mat.envMapIntensity = 0.8;
                    // DEBUG: DYE TEST to find the beam
                    // Debug color removed
                }
                m.castShadow = true;
                m.receiveShadow = true;
            }
        });
    }, [mascotScene]);

    return (
        <group>
            <React.Suspense fallback={null}>
                <SceneEffects />
                <WindEffect />
            </React.Suspense>

            <Particles count={30} />
            {/* Increased range for wider spread (User requested 50x area, so range 10 -> 30 covers huge volume) */}
            <FloatingHearts count={40} range={30} />

            {/* 1. CRYSTAL ROSE */}
            {showRose && (
                <group
                    ref={roseGroup}
                    position={[...modelTransforms.rose.position] as [number, number, number]}
                    rotation={[...modelTransforms.rose.rotation] as [number, number, number]}
                    scale={modelTransforms.rose.scale}
                >
                    <CrystalRose
                        scale={1.0} // Scale handled by parent group now
                        position={[0, 0, 0]}
                        isBud={bloomProgress < 0.1 && (currentScene === 'prelude' || currentScene === 'intro')}
                    />
                </group>
            )}

            {/* 2. LETTER ENVELOPE */}
            {showEnvelope && (
                <group
                    ref={envelopeGroup}
                    position={[...modelTransforms.envelope.position] as [number, number, number]}
                    rotation={[...modelTransforms.envelope.rotation] as [number, number, number]}
                    scale={modelTransforms.envelope.scale}
                >
                    <LetterEnvelope />
                </group>
            )}

            {/* 3. MEMORY PHOTO */}
            <group
                position={[...modelTransforms.photo.position] as [number, number, number]}
                rotation={[...modelTransforms.photo.rotation] as [number, number, number]}
                scale={modelTransforms.photo.scale}
            >
                <MemoryGroup visible={showPhoto} isFinalMode={isFinalConvergence} />
            </group>

            {/* 4. CHOCOLATE CLUSTER */}
            <group
                position={[...modelTransforms.chocolate.position] as [number, number, number]}
                rotation={[...modelTransforms.chocolate.rotation] as [number, number, number]}
                scale={modelTransforms.chocolate.scale}
            >
                <ChocolateCluster visible={showChocolate} />
            </group>

            {/* 5. MASCOT CHARACTER */}
            {/* 5. MASCOT CHARACTER */}
            <group
                position={[...modelTransforms.mascot.position] as [number, number, number]}
                rotation={[...modelTransforms.mascot.rotation] as [number, number, number]}
                scale={showMascot ? modelTransforms.mascot.scale : 0.0001}
            >
                <primitive object={mascotScene} />
            </group>

            {/* Soft ground shadow to give a unified contact shadow without many dynamic casters */}
            <SoftGroundShadow />
        </group>
    );
});
VisualStoryScene.displayName = 'VisualStoryScene';

// Preload the model to prevent stutter
useGLTF.preload('/valentine/models/charator.glb');
