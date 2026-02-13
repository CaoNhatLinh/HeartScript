"use client";

import React, { useEffect } from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { VisualStoryScene } from '../3d/VisualStoryScene';


export const SceneManager: React.FC = React.memo(() => {
    const currentScene = useExperienceStore((state) => state.currentScene);
    const setBloomProgress = useExperienceStore((state) => state.setBloomProgress);
    const setOpenCount = useExperienceStore((state) => state.setOpenCount);



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
