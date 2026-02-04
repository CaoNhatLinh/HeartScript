import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, SkipForward, Volume2, VolumeX, Music
} from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';

/**
 * MiniMusicPlayer - Phiên bản gọn của Music Player
 * Hiển thị: Play/Pause, Track info nhỏ, Progress bar, và Volume toggle
 */
export const MiniMusicPlayer: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        nextTrack,
        togglePlay,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        toggleMute
    } = useAudioStore();

    // Audio element events
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration || 0);
        const handleEnded = () => nextTrack();
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, [nextTrack, setCurrentTime, setDuration, setIsPlaying]);

    // Sync play state
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;

        if (isPlaying) {
            audio.play().catch(() => setIsPlaying(false));
        } else {
            audio.pause();
        }
    }, [isPlaying, currentTrack, setIsPlaying]);

    // Sync volume
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!currentTrack) return null;

    return (
        <>
            <audio ref={audioRef} src={currentTrack.src} preload="metadata" />

            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-4 right-4 z-50 pointer-events-auto"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="bg-black/60 backdrop-blur-lg rounded-full border border-white/10 shadow-xl flex items-center gap-1.5 p-1.5 pr-2">
                    {/* Play/Pause Button */}
                    <button
                        onClick={togglePlay}
                        className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                    >
                        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>

                    {/* Expanded content on hover */}
                    <AnimatePresence>
                        {isHovered ? (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 'auto', opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex items-center gap-2 px-1">
                                    {/* Progress mini */}
                                    <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-pink-400 to-purple-500"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>

                                    {/* Track title */}
                                    <span className="text-xs text-white/80 whitespace-nowrap max-w-[80px] truncate">
                                        {currentTrack.title}
                                    </span>

                                    {/* Next button */}
                                    <button
                                        onClick={nextTrack}
                                        className="p-1 text-white/50 hover:text-white transition-colors"
                                    >
                                        <SkipForward size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-1 px-0.5"
                            >
                                <Music size={10} className="text-pink-400" />
                                <span className="text-[10px] text-white/60 max-w-[50px] truncate">
                                    {currentTrack.title}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Volume toggle - LUÔN hiển thị */}
                    <button
                        onClick={toggleMute}
                        className={`
                            p-1.5 rounded-full transition-all
                            ${isMuted || volume === 0
                                ? 'text-red-400 bg-red-500/20'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                            }
                        `}
                        title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                    >
                        {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                </div>
            </motion.div>
        </>
    );
};
