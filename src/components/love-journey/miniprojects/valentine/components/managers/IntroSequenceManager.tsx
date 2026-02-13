"use client";

import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../store/useExperienceStore';

/**
 * IntroSequenceManager: Handles the magical zoom-in and lighting-up sequence
 * once the phone gift is clicked.
 */
export const IntroSequenceManager: React.FC = () => {
    const isIntroStarting = useExperienceStore(s => s.isIntroStarting);
    const setFocusTarget = useExperienceStore(s => s.setFocusTarget);
    const setLayerParams = useExperienceStore(s => s.setLayerParams);
    const currentScene = useExperienceStore(s => s.currentScene);
    const setModelTransform = useExperienceStore(s => s.setModelTransform);

    // Local refs to track animation progress
    const progressRef = useRef(0);
    const activeRef = useRef(false);

    // Initial Lighting State (Dark)
    useEffect(() => {
        if (isIntroStarting && !activeRef.current) {
            activeRef.current = true;
            // Start Dark
            setLayerParams({
                ambientIntensity: 0,
                envIntensity: 0,
                bloomIntensity: 0,
            });
            // Flower starts invisible (scale 0)
            setModelTransform('rose', 'scale', 0.001);
        }
    }, [isIntroStarting, setLayerParams, setModelTransform]);

    useFrame((_state, delta) => {
        if (!activeRef.current || currentScene === 'prelude') return;

        // Animate up over ~3 seconds
        progressRef.current = Math.min(progressRef.current + delta * 0.4, 1);

        // Easing (Smooth start and end)
        const t = THREE.MathUtils.smoothstep(progressRef.current, 0, 1);

        // 1. Zoom Camera (Wait for phone exit animation which takes ~1s)
        if (progressRef.current > 0.3) {
            setFocusTarget('rose');
        }

        // 2. Brighten Lighting
        setLayerParams({
            ambientIntensity: THREE.MathUtils.lerp(0, 0.15, t),
            envIntensity: THREE.MathUtils.lerp(0, 0.8, t),
            bloomIntensity: THREE.MathUtils.lerp(0, 1.2, t),
        });

        // 3. Flower Graduation (Scale up)
        const targetScale = 1.2;
        setModelTransform('rose', 'scale', THREE.MathUtils.lerp(0.001, targetScale, t));

        // Cleanup when done
        if (progressRef.current >= 1) {
            activeRef.current = false;
        }
    });

    return null;
};
