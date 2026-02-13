"use client";

import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../store/useExperienceStore';
import { CrystalRose } from './CrystalRose';
import { ChocolateCluster } from './ChocolateCluster';
import { SceneEffects } from './SceneEffects';
import { Particles } from './Particles';
import { FloatingHearts } from './assets/FloatingHearts';
import { WindEffect } from './layers/WindEffect';
import { LetterEnvelope } from './layers/LetterEnvelope';
import { SoftGroundShadow } from './SoftGroundShadow';
import { CandleSet } from './objects/CandleSet';
import { GiftBox } from './objects/GiftBox';
import { HeartBalloons } from './objects/HeartBalloons';
import { PetalScatter } from './objects/PetalScatter';
import { HangingPolaroids } from './objects/HangingPolaroids';
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
    const showEnvelope = (bloomProgress >= 0.99) && isFlowerOrLater && (visibleModels?.envelope ?? true);

    // Sync visibility state for useFrame loop
    const showRoseRef = React.useRef(showRose);
    const showEnvelopeRef = React.useRef(showEnvelope);

    React.useLayoutEffect(() => {
        showRoseRef.current = showRose;
        showEnvelopeRef.current = showEnvelope;
    }, [showRose, showEnvelope]);

    // Scene context for gift reveals
    const isClimaxOrLater = ['climax', 'chocolate', 'ending'].includes(currentScene);

    // 3. Mascot appears when giftRevealStage >= 1 (click lần 1)
    // AND enabled in debug
    const showMascot = (hasReadLetter && isClimaxOrLater && giftRevealStage >= 1) && (visibleModels?.mascot ?? true);

    // 4. Photo appears when giftRevealStage >= 2 (click lần 2)
    const showPhoto = (hasReadLetter && isClimaxOrLater && giftRevealStage >= 2) && (visibleModels?.photo ?? true);

    // 5. Chocolate appears when giftRevealStage >= 3 (click lần 3)
    const showChocolate = (hasReadLetter && isClimaxOrLater && giftRevealStage >= 3) && (visibleModels?.chocolate ?? true);





    // New model visibility based on scene progression
    const isIntroOrLater = currentScene !== 'prelude';
    const showCandles = isIntroOrLater && (visibleModels?.candles ?? true);
    const showPetals = isFlowerOrLater && (visibleModels?.petals ?? true);
    const showGiftBox = (isClimaxOrLater && giftRevealStage >= 1) && (visibleModels?.giftBox ?? true);
    const showBalloons = (currentScene === 'ending') && (visibleModels?.balloons ?? true);

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
            roseGroup.current.rotation.set(rose.rotation[0], rose.rotation[1], rose.rotation[2]);

            // Visibility Check via Ref
            const targetScale = showRoseRef.current ? rose.scale : 0;
            const currentScale = roseGroup.current.scale.x;
            const newScale = THREE.MathUtils.lerp(currentScale, targetScale, speed * 2);
            roseGroup.current.scale.setScalar(newScale);
        }

        // ENVELOPE Target
        if (envelopeGroup.current) {
            const targetPos = new THREE.Vector3(...envelope.position);
            envelopeGroup.current.position.lerp(targetPos, speed);
            envelopeGroup.current.rotation.set(envelope.rotation[0], envelope.rotation[1], envelope.rotation[2]);

            // Visibility Check via Ref (Fixes "Envelope shows immediately" bug)
            const targetScale = showEnvelopeRef.current ? envelope.scale : 0;
            const currentScale = envelopeGroup.current.scale.x;
            const newScale = THREE.MathUtils.lerp(currentScale, targetScale, speed * 3);
            envelopeGroup.current.scale.setScalar(newScale);
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
            <group
                ref={roseGroup}
                position={[...modelTransforms.rose.position] as [number, number, number]}
                rotation={[...modelTransforms.rose.rotation] as [number, number, number]}
                scale={showRose ? modelTransforms.rose.scale : 0}
            >
                <CrystalRose
                    scale={1.0}
                    position={[0, 0, 0]}
                    isBud={bloomProgress < 0.1 && (currentScene === 'prelude' || currentScene === 'intro')}
                />
            </group>

            {/* 2. LETTER ENVELOPE */}
            <group
                ref={envelopeGroup}
                position={[...modelTransforms.envelope.position] as [number, number, number]}
                rotation={[...modelTransforms.envelope.rotation] as [number, number, number]}
                scale={showEnvelope ? modelTransforms.envelope.scale : 0}
            >
                <LetterEnvelope />
            </group>

            {/* 3. MEMORY PHOTO - Pre-rendered via scale */}
            <group
                position={[...modelTransforms.photo.position] as [number, number, number]}
                rotation={[...modelTransforms.photo.rotation] as [number, number, number]}
                scale={showPhoto ? modelTransforms.photo.scale : 0}
            >
                <HangingPolaroids visible={true} />
            </group>

            {/* 4. CHOCOLATE CLUSTER */}
            <group
                position={[...modelTransforms.chocolate.position] as [number, number, number]}
                rotation={[...modelTransforms.chocolate.rotation] as [number, number, number]}
                scale={modelTransforms.chocolate.scale}
            >
                <ChocolateCluster
                    visible={showChocolate}
                    ringTransform={modelTransforms.ring}
                />
            </group>

            {/* 5. MASCOT CHARACTER */}
            <group
                position={[...modelTransforms.mascot.position] as [number, number, number]}
                rotation={[...modelTransforms.mascot.rotation] as [number, number, number]}
                scale={showMascot ? modelTransforms.mascot.scale : 0.0001}
            >
                <primitive object={mascotScene} />
            </group>

            {/* 6. CANDLE SETS - Distributed around the rose for ambient glow */}
            <group scale={showCandles ? 1 : 0}>
                {/* Center Right */}
                <group
                    position={[...modelTransforms.candles.position] as [number, number, number]}
                    rotation={[...modelTransforms.candles.rotation] as [number, number, number]}
                    scale={modelTransforms.candles.scale}
                >
                    <CandleSet active={showCandles} />
                </group>

                {/* Front Left */}
                <group
                    position={[-5.5, 0, 5.0]}
                    rotation={[0, 0.5, 0]}
                    scale={modelTransforms.candles.scale * 0.8}
                >
                    <CandleSet active={showCandles} />
                </group>

                {/* Back Center */}
                <group
                    position={[-3.7, 0, 1.8]}
                    rotation={[0, -0.3, 0]}
                    scale={modelTransforms.candles.scale * 0.9}
                >
                    <CandleSet active={showCandles} />
                </group>
            </group>

            {/* 7. PETAL SCATTER */}
            {showPetals && (
                <group
                    position={[...modelTransforms.petals.position] as [number, number, number]}
                    rotation={[...modelTransforms.petals.rotation] as [number, number, number]}
                    scale={modelTransforms.petals.scale}
                >
                    <PetalScatter count={25} />
                </group>
            )}

            {/* 8. GIFT BOX */}
            <group
                position={[...modelTransforms.giftBox.position] as [number, number, number]}
                rotation={[...modelTransforms.giftBox.rotation] as [number, number, number]}
                scale={showGiftBox ? modelTransforms.giftBox.scale : 0}
            >
                <GiftBox />
            </group>

            {/* 9. HEART BALLOONS */}
            <group
                position={[...modelTransforms.balloons.position] as [number, number, number]}
                rotation={[...modelTransforms.balloons.rotation] as [number, number, number]}
                scale={showBalloons ? modelTransforms.balloons.scale : 0}
            >
                <HeartBalloons />
            </group>

            {/* Soft ground shadow */}
            <SoftGroundShadow />
        </group>
    );
});
VisualStoryScene.displayName = 'VisualStoryScene';

// Preload the model to prevent stutter
useGLTF.preload('/valentine/models/charator.glb');

// Preload critical assets to prevent UI freeze
if (typeof window !== 'undefined') {
    const assetsToPreload = [
        '/memory-first-meet.png',
        '/promise-heart.png',
    ];
    assetsToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}
