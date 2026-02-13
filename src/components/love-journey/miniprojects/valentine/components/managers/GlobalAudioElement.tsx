'use client';

import React, { useRef, useEffect } from 'react';
import { useAudioStore } from '../../store/useAudioStore';

/**
 * GlobalAudioElement - Hidden component that manages the physical <audio> tag.
 */
export const GlobalAudioElement: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const {
        currentTrack,
        isPlaying,
        volume,
        isMuted,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        nextTrack,
        initAnalyser,
        seekRequestTime,
        clearSeekRequest
    } = useAudioStore();

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Initialize audio context/analyser
        const handleCanPlay = () => {
            initAnalyser(audio);
        };

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration || 0);
        const handleEnded = () => nextTrack();
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleError = (event: Event | string) => {
            const error = audio.error;
            console.error("Audio Load Error Details:", {
                code: error?.code,
                message: error?.message,
                src: audio.src,
                event
            });

            // If CORS fails, try without it as a last resort
            if (audio.crossOrigin === "anonymous") {
                console.warn("Retrying without CORS for visibility...");
                audio.removeAttribute("crossOrigin");
                // We don't call audio.load() here to avoid loop if it's not CORS
                // but setting src again or just letting it be might help
            }
        };

        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('error', handleError);
        };
    }, [initAnalyser, setCurrentTime, setDuration, nextTrack, setIsPlaying]);

    // Playback sync
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;

        if (isPlaying) {
            audio.play().catch((e) => {
                console.warn("Playback blocked:", e);
                setIsPlaying(false);
            });
        } else {
            audio.pause();
        }
    }, [isPlaying, currentTrack, setIsPlaying]);

    // Volume sync
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Seek Request handler
    useEffect(() => {
        const audio = audioRef.current;
        if (audio && seekRequestTime !== null) {
            audio.currentTime = seekRequestTime;
            clearSeekRequest();
        }
    }, [seekRequestTime, clearSeekRequest]);

    if (!currentTrack) return null;

    return (
        <audio
            ref={audioRef}
            src={currentTrack.src}
            preload="auto"
            style={{ display: 'none' }}
        />
    );
};
