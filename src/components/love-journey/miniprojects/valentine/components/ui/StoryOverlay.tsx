import React, { useEffect, useState } from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { MagicalCard } from './MagicalCard';
import { FloatingWords } from './FloatingWords';
import { STORY_LINES } from '../../data/storyData';
import { Volume2, VolumeX } from 'lucide-react';

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
        audioPlaying,
        setAudioPlaying
    } = useExperienceStore();

    const currentLine = STORY_LINES[storyStep];
    // const isFinished = storyStep >= STORY_LINES.length;

    // AUTO-ADVANCE LOGIC (Smart Story Progression)
    // 0: "Có một món quà" -> 1: "Từng chút một" (Bloom > 0.8)
    // 1 -> 2: "Hiểu nhau hơn" (Read Letter AND Scene changed to Climax/Chocolate/Ending)
    // 2 -> 3: "Ngọt ngào" (Tasted Chocolate)
    const {
        bloomProgress,
        hasReadLetter,
        hasTastedChocolate,
        setStoryStep,
        currentScene
    } = useExperienceStore();

    useEffect(() => {
        if (isFrozen) return;

        // Step 0 -> 1: Bloom complete AND scene transitioned to 'flower'
        // Only trigger when bloom is done AND we've actually moved to the flower scene
        const isFlowerScene = currentScene === 'flower';
        if (storyStep === 0 && bloomProgress >= 0.85 && isFlowerScene) {
            setStoryStep(1);
        }

        // Step 1 -> 2: Letter read AND scene transitioned to 'climax' or later
        // This ensures the letter was actually read before we move on
        const isClimaxOrLater = ['climax', 'chocolate', 'ending'].includes(currentScene);
        if (storyStep === 1 && hasReadLetter && isClimaxOrLater) {
            setStoryStep(2);
        }

        // Step 2 -> 3: Chocolate tasted
        if (storyStep === 2 && hasTastedChocolate) {
            setStoryStep(3);
        }
    }, [storyStep, bloomProgress, hasReadLetter, hasTastedChocolate, setStoryStep, isFrozen, currentScene]);

    return (
        <div className="w-full h-full relative z-10 selection:bg-[#E8AEB7] selection:text-white">

            {/* Ambient Background Layer */}
            {!isFrozen && storyStep > 0 && <FloatingWords />}

            {/* Audio Toggle */}
            <div className="absolute top-6 right-6 pointer-events-auto z-50">
                <button
                    onClick={() => setAudioPlaying(!audioPlaying)}
                    className="p-3 bg-white/5 backdrop-blur-md rounded-full text-white/90 hover:bg-white/10 transition-all cursor-pointer"
                >
                    {audioPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </button>
            </div>

            {/* Interaction Layer: Managed by 3D Scene events directly */}

            {/* Main Text Card - Remounts on storyStep change to reset delay */}
            {currentLine && currentLine.text && (
                <StoryText key={storyStep} line={currentLine} isFrozen={isFrozen} />
            )}

        </div>
    );
};
