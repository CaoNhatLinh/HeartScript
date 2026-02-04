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

    // 2. SCENE TRANSITION LOGIC - Optimized to reduce jank
    useEffect(() => {
        if (!pendingTransition) return;
        const { scene } = pendingTransition;

        // Use requestIdleCallback or setTimeout to defer heavy work
        const startTransition = () => {
            const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

            // Activate continuous rendering during transitions
            setIsAnimating(true);

            // Small delay to let React finish rendering UI changes first
            timeline.to({}, { duration: 0.15 });
            timeline.add(() => setScene(scene));

            if (scene === 'flower') {
                // Smoother bloom animation with lower tension
                timeline.to({ b: 0 }, {
                    duration: 2.0, // Slower, smoother
                    b: 1,
                    ease: 'power1.inOut',
                    onUpdate() { setBloomProgress(this.targets()[0].b); }
                });
            }

            timeline.eventCallback('onComplete', () => {
                clearPendingTransition();
                setIsAnimating(false);
            });
            timeline.eventCallback('onInterrupt', () => { setIsAnimating(false); });
        };

        // Defer to next idle period or use setTimeout as fallback
        if ('requestIdleCallback' in window) {
            (window as Window).requestIdleCallback(startTransition, { timeout: 100 });
        } else {
            setTimeout(startTransition, 50);
        }

        return () => {
            setIsAnimating(false);
        };
    }, [pendingTransition, clearPendingTransition, setScene, setBloomProgress, setIsAnimating]);

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