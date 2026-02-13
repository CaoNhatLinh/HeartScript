import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Heart, Maximize2, Minimize2
} from 'lucide-react';
import { useAudioStore } from '../../../store/useAudioStore';
import AudioVisualizer from '../feedback/AudioVisualizer';

/**
 * MiniMusicPlayer - Premium Kawaii Edition
 * A floating, expandable, and beautiful music controller with seek and volume controls.
 */
export const MiniMusicPlayer: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const volumeTimerRef = useRef<NodeJS.Timeout | null>(null);

    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        nextTrack,
        previousTrack,
        togglePlay,
        toggleMute,
        audioContext,
        setVolume,
        seek
    } = useAudioStore();

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!currentTrack) return null;

    const handleTogglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        togglePlay();
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        seek(time);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-6 right-6 z-[1000] pointer-events-auto flex flex-col items-end gap-3"
        >
            {/* Volume Slider Popover */}
            <AnimatePresence>
                {showVolume && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        onMouseEnter={() => {
                            if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
                        }}
                        onMouseLeave={() => {
                            volumeTimerRef.current = setTimeout(() => setShowVolume(false), 2000);
                        }}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-xl flex flex-col items-center gap-2 mb-1"
                    >
                        <div className="h-32 w-1.5 bg-white/10 rounded-full relative overflow-hidden group/vol cursor-pointer">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="absolute inset-0 w-32 h-1.5 origin-bottom-left -rotate-90 translate-y-32 opacity-0 cursor-pointer z-10"
                            />
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pink-400 to-rose-300"
                                style={{ height: `${(isMuted ? 0 : volume) * 100}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-white/70 font-bold">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-pink-400/20 via-rose-300/20 to-purple-400/20 rounded-[28px] blur-xl opacity-20 group-hover:opacity-100 transition-opacity duration-700" />

                <motion.div
                    animate={{ width: isExpanded ? 340 : 200 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    className="relative bg-white/10 backdrop-blur-2xl rounded-[24px] border border-white/30 shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden transition-colors hover:bg-white/15"
                >
                    {/* Top Section: Main Controls & Info */}
                    <div className="flex items-center p-2.5 gap-3">
                        {/* Play/Pause Button */}
                        <div className="relative flex-shrink-0">
                            <svg className="absolute -inset-1.5 w-11 h-11 -rotate-90 pointer-events-none">
                                <circle cx="22" cy="22" r="18.5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                                <motion.circle
                                    cx="22" cy="22" r="18.5" fill="none"
                                    stroke="url(#kawaii-player-grad)" strokeWidth="2.5" strokeLinecap="round"
                                    strokeDasharray="116.2"
                                    animate={{ strokeDashoffset: 116.2 - (116.2 * progressPercent) / 100 }}
                                />
                                <defs>
                                    <linearGradient id="kawaii-player-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#ff7eb3" />
                                        <stop offset="100%" stopColor="#ff758c" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            <button
                                onClick={handleTogglePlay}
                                className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-all active:scale-90 z-10 shadow-lg border border-white/20 group/play"
                            >
                                {currentTrack.avatar ? (
                                    <img
                                        src={currentTrack.avatar}
                                        alt={currentTrack.title}
                                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-pink-400/80 to-rose-500/80" />
                                )}
                                <div className="absolute inset-0 bg-black/20 group-hover/play:bg-black/40 transition-colors" />
                                <div className="relative z-10 text-white">
                                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                                </div>
                            </button>
                        </div>

                        {/* Track Info */}
                        <div className="flex flex-col flex-1 min-w-0 pointer-events-none">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[12px] font-bold text-white/95 truncate">{currentTrack.title}</span>
                                {isPlaying && (
                                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                                        <Heart size={8} className="text-pink-300 fill-pink-300" />
                                    </motion.div>
                                )}
                            </div>
                            <div className="text-[10px] text-white/50 truncate">{currentTrack.artist}</div>
                        </div>

                        {/* Buttons Group */}
                        <div className="flex items-center gap-0.5 pr-1">
                            {isExpanded && (
                                <>
                                    <button onClick={() => previousTrack()} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                        <SkipBack size={14} />
                                    </button>
                                    <button onClick={() => nextTrack()} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                        <SkipForward size={14} />
                                    </button>
                                </>
                            )}
                            <button
                                onMouseEnter={() => setShowVolume(true)}
                                onClick={() => toggleMute()}
                                className={`p-1.5 rounded-full transition-all ${isMuted || volume === 0 ? 'text-rose-400' : 'text-white/50 hover:text-white'}`}
                            >
                                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 text-white/50 hover:text-white rounded-full">
                                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Bottom Section: SeekBar (Animated height) */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-5 pb-4 flex flex-col gap-2"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-white/50 min-w-[28px] tabular-nums">{formatTime(currentTime)}</span>
                                    <div className="flex-1 h-1 bg-white/10 rounded-full relative group/seek">
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration || 100}
                                            step="0.1"
                                            value={currentTime}
                                            onChange={handleSeek}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <motion.div
                                            className="absolute top-0 left-0 bottom-0 bg-pink-400 rounded-full"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md scale-0 group-hover/seek:scale-100 transition-transform"
                                            style={{ left: `${progressPercent}%`, marginLeft: '-5px' }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-white/50 min-w-[28px] tabular-nums">{formatTime(duration)}</span>
                                </div>

                                {isPlaying && (
                                    <div className="flex justify-center mt-1">
                                        <AudioVisualizer
                                            width={120}
                                            height={20}
                                            barCount={15}
                                            variant="bars"
                                            colorStart="#fecada"
                                            colorEnd="#fbcfe8"
                                            className="opacity-60"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </motion.div>
    );
};
