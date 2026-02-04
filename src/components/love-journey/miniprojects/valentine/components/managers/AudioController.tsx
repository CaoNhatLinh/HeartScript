import React, { useEffect, useRef } from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';

export const AudioController: React.FC = () => {
    const { audioPlaying, audioVolume } = useExperienceStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Ideally, we would load the audio file here.
        // For now, we'll placeholder logic.
        if (!audioRef.current) {
            audioRef.current = new Audio('https://assets.mixkit.co/music/preview/mixkit-romantic-moment-146.mp3'); // Example placeholder
            audioRef.current.loop = true;
        }
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = audioVolume;
            if (audioPlaying) {
                audioRef.current.play().catch(e => console.warn("Autoplay prevented:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [audioPlaying, audioVolume]);

    return null; // Logic only component
};
