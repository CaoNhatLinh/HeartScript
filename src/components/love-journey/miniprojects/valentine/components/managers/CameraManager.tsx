import React, { useRef, useEffect } from 'react';
import { CameraControls } from '@react-three/drei';
import { useExperienceStore } from '../../store/useExperienceStore';
import type { FocusTarget } from '../../store/useExperienceStore';

/**
 * SOURCE OF TRUTH: Camera Configurations
 */
const CAMERA_CONFIGS: Record<FocusTarget, { position: [number, number, number], target: [number, number, number] }> = {
    // Rose is at [-3.7, 1.6, 3.7]. We position camera in front (Z+), slightly right/up for cinematic angle.
    rose: { position: [-3.7, 2.2, 8.5], target: [-3.7, 1.8, 3.7] },

    // INTRO START: Far away, looking at the Rose (from user provided coords)
    // Pos: [-4.90, 9.92, 39.46] | Dist: 35.00
    // We want it to look at the rose center
    intro_start: { position: [-4.90, 9.92, 39.46], target: [-3.7, 1.8, 3.7] },

    envelope: { position: [5.0, 0.5, 6.0], target: [5.0, -0.5, 2.0] },
    photo: { position: [1.1, 1.5, 4.0], target: [1.1, 1.5, 0] },
    // Chocolate/Mascot: Pull back camera to avoid being too close (Z=5 -> Z=8)
    chocolate: { position: [-5.0, 5.0, 9.0], target: [-5.0, 5.0, 0.3] },
    center: { position: [0, 1.0, 16.0], target: [0, 0, 0] },
};

export const CameraManager: React.FC = () => {
    const focusTarget = useExperienceStore((state) => state.focusTarget);
    const setIsTransitioning = useExperienceStore((state) => state.setIsTransitioning);
    const isFrozen = useExperienceStore((state) => state.isFrozen);

    // We get the controls instance
    const controlsRef = useRef<CameraControls>(null);

    // FIX: Force initial position IMMEDIATELY to prevent "jump" from center
    React.useLayoutEffect(() => {
        // Only force set if it's the very first render and we are in intro_start
        const initialTarget = useExperienceStore.getState().focusTarget;
        const config = CAMERA_CONFIGS[initialTarget];

        if (initialTarget === 'intro_start' && config && controlsRef.current) {
            controlsRef.current.setLookAt(
                ...config.position,
                ...config.target,
                false // INSTANT JUMP, NO TRANSITION
            );
        }
    }, []); // Run ONCE on mount

    // Handle Transitions when focusTarget changes
    useEffect(() => {
        const config = CAMERA_CONFIGS[focusTarget];
        if (config && controlsRef.current) {
            setIsTransitioning(true);

            // Allow transition even on first run to provide "Fly-in" effect
            // User requested "đi từ xa từ từ lại" (go from afar slowly)
            controlsRef.current.setLookAt(
                ...config.position,
                ...config.target,
                true // enable transition ALWAYS
            ).then(() => {
                setIsTransitioning(false);
            });
        }
    }, [focusTarget, setIsTransitioning]);

    // Debug: Log Camera Position on Move
    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls) return;

        const logPosition = () => {
            const pos = controls.camera.position;
            const dist = controls.distance;
            // Use console.log for debug purposes as requested
            console.log(`Pos: [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}] | Dist: ${dist.toFixed(2)}`);
        };

        const callback = () => logPosition();

        // Listen to 'update' to catch all movements (mouse or auto)
        controls.addEventListener('control', callback);
        return () => controls.removeEventListener('control', callback);
    }, []);

    return (
        <CameraControls
            ref={controlsRef}
            makeDefault
            dollyToCursor={true} // ENABLE ZOOM TO CURSOR
            minDistance={2}
            maxDistance={35}
            smoothTime={1.2} // Cinematic smoothing
            enabled={!isFrozen} // Disable when frozen (snapshot)
            draggingSmoothTime={0.1} // Responsive but smooth
        />
    );
};
