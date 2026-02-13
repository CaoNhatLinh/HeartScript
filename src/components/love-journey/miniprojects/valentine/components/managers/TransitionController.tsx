import React, { useEffect } from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { STORY_LINES } from '../../data/storyData';
import gsap from 'gsap';

/**
 * Transitions Controller: The Director of the experience.
 * Orchestrates focus changes, bloom progression, and audio cues.
 */
export const TransitionController: React.FC = () => {
    const currentScene = useExperienceStore((s) => s.currentScene);
    const storyStep = useExperienceStore((s) => s.storyStep);
    const setFocusTarget = useExperienceStore((s) => s.setFocusTarget);
    const setBloomProgress = useExperienceStore((s) => s.setBloomProgress);
    const pendingTransition = useExperienceStore((s) => s.pendingTransition);
    const clearPendingTransition = useExperienceStore((s) => s.clearPendingTransition);
    const setScene = useExperienceStore((s) => s.setScene);
    const hasReadLetter = useExperienceStore((s) => s.hasReadLetter);
    const bloomProgress = useExperienceStore((s) => s.bloomProgress);
    const setIsAnimating = useExperienceStore((s) => s.setIsAnimating);
    const setTransitionState = useExperienceStore((s) => s.setTransitionState);

    // Initial audio unlock listener
    useEffect(() => {
        const playChime = () => {
            const chime = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-small-positive-notification-2690.mp3');
            chime.volume = 0.2;
            chime.play().catch(() => { });
            window.removeEventListener('click', playChime);
        };
        window.addEventListener('click', playChime);
        return () => window.removeEventListener('click', playChime);
    }, []);

    // 1. FLOW LOGIC: Auto-Focus based on events
    useEffect(() => {
        // Once bloom is significant, focus on the envelope (surprising gift)
        if (bloomProgress > 0.6 && !hasReadLetter && currentScene !== 'prelude' && currentScene !== 'intro') {
            setFocusTarget('envelope');
        }
    }, [bloomProgress, hasReadLetter, setFocusTarget, currentScene]);

    // 2. SCENE TRANSITION LOGIC - With fade overlay
    useEffect(() => {
        if (!pendingTransition) return;
        const { scene } = pendingTransition;

        const startTransition = () => {
            setIsAnimating(true);

            // Phase 1: Subtle transition cue (skip for flower scene to avoid flash)
            if (scene !== 'flower') {
                setTransitionState('fading-out');
            }

            setTimeout(() => {
                // Phase 2: Switch scene seamlessly
                const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

                timeline.add(() => {
                    setScene(scene);
                    if (scene === 'ending') {
                        useExperienceStore.getState().triggerConfetti();
                    }
                });

                if (scene === 'flower') {
                    timeline.to({ b: 0 }, {
                        duration: 0.8, // Giảm từ 2.0s xuống 0.8s
                        b: 1,
                        ease: 'power1.inOut',
                        onUpdate() { setBloomProgress(this.targets()[0].b); }
                    });
                }

                // Phase 3: Complete transition (skip for flower scene)
                if (scene !== 'flower') {
                    timeline.add(() => setTransitionState('fading-in'));
                }

                timeline.eventCallback('onComplete', () => {
                    clearPendingTransition();
                    setIsAnimating(false);
                    if (scene !== 'flower') {
                        setTimeout(() => setTransitionState('idle'), 400);
                    }
                });
                timeline.eventCallback('onInterrupt', () => {
                    setIsAnimating(false);
                    setTransitionState('idle');
                });
            }, scene === 'flower' ? 50 : 200); // Faster for flower scene
        };

        if ('requestIdleCallback' in window) {
            (window as Window).requestIdleCallback(startTransition, { timeout: 100 });
        } else {
            setTimeout(startTransition, 50);
        }

        return () => {
            setIsAnimating(false);
        };
    }, [pendingTransition, clearPendingTransition, setScene, setBloomProgress, setIsAnimating, setTransitionState]);

    // 3. STORY STEP TRIGGERS
    useEffect(() => {
        const line = STORY_LINES[storyStep];
        if (!line) return;

        if (line.trigger === 'chocolate') {
            setFocusTarget('chocolate');
            const s = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-birthday-horn-2-605.mp3');
            s.volume = 0.4; s.play().catch(() => { });
        }
    }, [storyStep, setFocusTarget]);

    return null;
};