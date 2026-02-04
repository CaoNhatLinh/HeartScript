"use client";

import React, { useEffect } from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { VisualStoryScene } from '../3d/VisualStoryScene';


export const SceneManager: React.FC = React.memo(() => {
    const currentScene = useExperienceStore((state) => state.currentScene);
    const setBloomProgress = useExperienceStore((state) => state.setBloomProgress);
    const setOpenCount = useExperienceStore((state) => state.setOpenCount);

    // Intro Sequence Logic
    const focusTarget = useExperienceStore((state) => state.focusTarget);
    const setFocusTarget = useExperienceStore((state) => state.setFocusTarget);
    const setLayerParams = useExperienceStore((state) => state.setLayerParams);

    useEffect(() => {
        if (focusTarget === 'intro_start') {
            // Sequence:
            // 1. Wait a tiny bit for the "Dark" state to render
            const timer1 = setTimeout(() => {
                // 2. Start Camera Move
                setFocusTarget('rose');

                // 3. Restore Lighting (Brighten up)
                // We do this concurrently or slightly staggered with camera move
                setLayerParams({
                    ambientIntensity: 0.15, // Restore to normal
                    envIntensity: 0.8,      // Restore to normal
                    bloomIntensity: 0.5,    // Normal bloom
                });
            }, 800); // 0.8s delay before flying in

            return () => clearTimeout(timer1);
        }
    }, [focusTarget, setFocusTarget, setLayerParams]);

    // Failsafe: Reset bloom if going back to prelude (rare)
    useEffect(() => {
        if (currentScene === 'prelude') {
            setBloomProgress(0);
            setOpenCount(0);
        }
    }, [currentScene, setBloomProgress, setOpenCount]);

    return (
        <group>
            <VisualStoryScene />
        </group>
    );
});
SceneManager.displayName = 'SceneManager';
