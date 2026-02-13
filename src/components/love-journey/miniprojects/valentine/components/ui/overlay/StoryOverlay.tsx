import React, { useEffect, useState } from 'react';
import { useExperienceStore } from '../../../store/useExperienceStore';
import { MagicalCard } from '../MagicalCard';
import { FloatingWords } from '../FloatingWords';
import { STORY_LINES } from '../../../data/storyData';

// Sub-component to handle per-step state (animation delay) naturally via remounting
const StoryText: React.FC<{
    line: typeof STORY_LINES[0];
    isFrozen: boolean;
}> = ({ line, isFrozen }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Show after a short delay
        const showTimeout = setTimeout(() => setVisible(true), 700);

        // Hide after 5 seconds
        const hideTimeout = setTimeout(() => setVisible(false), 5700);

        return () => {
            clearTimeout(showTimeout);
            clearTimeout(hideTimeout);
        };
    }, []); // Runs on every mount (controlled by key=storyStep)

    if (!line || !line.text) return null;

    return (
        <div className="relative">
            <MagicalCard
                text={line.text}
                subText={line.subText}
                isVisible={!isFrozen && visible}
                layout={line.layout}
                emphasis={line.emphasis}
            />
        </div>
    );
};

export const StoryOverlay: React.FC = () => {
    const {
        storyStep,
        isFrozen,
        bloomProgress,
        hasReadLetter,
        hasTastedChocolate,
        setStoryStep,
        currentScene,
        setShowMemoryModal,
        setShowPromiseModal
    } = useExperienceStore();

    const currentLine = STORY_LINES[storyStep];

    useEffect(() => {
        if (isFrozen) return;

        // Step 0 -> 1: Bloom complete AND flower scene
        const isFlowerScene = currentScene === 'flower';
        if (storyStep === 0 && bloomProgress >= 0.85 && isFlowerScene) {
            setStoryStep(1);
        }

        // Step 1 -> 2: Auto after bloom text (triggers memory modal)
        if (storyStep === 1 && bloomProgress >= 0.95 && isFlowerScene) {
            const timer = setTimeout(() => {
                setStoryStep(2);
                setShowMemoryModal(true);
            }, 500);
            return () => clearTimeout(timer);
        }

        // Step 3 -> 4: Letter read AND scene = climax+
        const isClimaxOrLater = ['climax', 'chocolate', 'ending'].includes(currentScene);
        if (storyStep === 3 && hasReadLetter && isClimaxOrLater) {
            setStoryStep(4);
        }

        // Step 5 -> 6: Auto advance after sweet_transition
        if (storyStep === 5) {
            const timer = setTimeout(() => setStoryStep(6), 4000);
            return () => clearTimeout(timer);
        }

        // Step 6 -> 7: Chocolate tasted (triggers promise modal)
        if (storyStep === 6 && hasTastedChocolate) {
            setStoryStep(7);
            setShowPromiseModal(true);
        }
    }, [storyStep, bloomProgress, hasReadLetter, hasTastedChocolate, setStoryStep, isFrozen, currentScene, setShowMemoryModal, setShowPromiseModal]);

    return (
        <div className="w-full h-full relative z-10 selection:bg-[#E8AEB7] selection:text-white">

            {/* Ambient Background Layer */}
            {!isFrozen && storyStep > 0 && <FloatingWords />}

            {/* Main Text Card - Remounts on storyStep change to reset delay */}
            {currentLine && currentLine.text && (
                <StoryText key={storyStep} line={currentLine} isFrozen={isFrozen} />
            )}

        </div>
    );
};
