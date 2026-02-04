import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, SkipBack, SkipForward,
    Volume2, VolumeX, Repeat, Repeat1, Shuffle,
    ChevronUp, ChevronDown, Music, List
} from 'lucide-react';
import { useAudioStore, type Track } from '../../store/useAudioStore';

// Helper: Format thời gian (seconds -> mm:ss)
const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Sub-component: Track Item trong playlist
const TrackItem: React.FC<{
    track: Track;
    index: number;
    isActive: boolean;
    onPlay: () => void;
}> = ({ track, index, isActive, onPlay }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={onPlay}
        className={`
            flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all
            ${isActive
                ? 'bg-pink-500/30 border border-pink-400/50'
                : 'hover:bg-white/10 border border-transparent'
            }
        `}
    >
        {/* Album Art */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
            {track.avatar ? (
                <img src={track.avatar} alt={track.title} className="w-full h-full object-cover" />
            ) : (
                <Music size={18} className="text-white/80" />
            )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${isActive ? 'text-pink-300' : 'text-white/90'}`}>
                {track.title}
            </div>
            <div className="text-xs text-white/50 truncate">{track.artist}</div>
        </div>

        {/* Duration */}
        <div className="text-xs text-white/40">{formatTime(track.duration)}</div>
    </motion.div>
);

// Main Component: Music Player
export const MusicPlayer: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);

    const {
        tracks,
        currentTrack,
        currentTrackIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        shuffle,
        repeat,
        isPlayerExpanded,
        isPlaylistOpen,
        playTrack,
        nextTrack,
        previousTrack,
        togglePlay,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        setPlayerExpanded,
        setPlaylistOpen
    } = useAudioStore();

    // Audio element event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration || 0);
        const handleEnded = () => {
            if (repeat === 'one') {
                audio.currentTime = 0;
                audio.play();
            } else {
                nextTrack();
            }
        };
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
    }, [repeat, nextTrack, setCurrentTime, setDuration, setIsPlaying]);

    // Sync play/pause state với audio element
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;

        if (isPlaying) {
            audio.play().catch(() => {
                // Auto-play blocked, user needs to interact first
                setIsPlaying(false);
            });
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

    // Handle seek (kéo thanh progress)
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (audio) {
            const time = Number(e.target.value);
            audio.currentTime = time;
            setCurrentTime(time);
        }
    };

    // Handle volume change
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(Number(e.target.value));
    };

    // Progress percentage
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!currentTrack) return null;

    return (
        <>
            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                src={currentTrack.src}
                preload="metadata"
            />

            {/* Floating Player Container */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 pointer-events-auto"
            >
                <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

                    {/* Playlist Panel */}
                    <AnimatePresence>
                        {isPlaylistOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-b border-white/10 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20"
                            >
                                <div className="p-3 space-y-1">
                                    {tracks.map((track, index) => (
                                        <TrackItem
                                            key={track.id}
                                            track={track}
                                            index={index}
                                            isActive={index === currentTrackIndex}
                                            onPlay={() => playTrack(index)}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Player */}
                    <div className="p-4">
                        {/* Track Info Row */}
                        <div className="flex items-center gap-3 mb-3">
                            {/* Album Art */}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                                {currentTrack.avatar ? (
                                    <img
                                        src={currentTrack.avatar}
                                        alt={currentTrack.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Music size={24} className="text-white/80" />
                                )}
                            </div>

                            {/* Track Details */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white truncate">
                                    {currentTrack.title}
                                </div>
                                <div className="text-xs text-white/50 truncate">
                                    {currentTrack.artist}
                                </div>
                            </div>

                            {/* Expand/Playlist Toggle */}
                            <button
                                onClick={() => setPlaylistOpen(!isPlaylistOpen)}
                                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            >
                                <List size={18} />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                            <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={duration || 100}
                                value={currentTime}
                                onChange={handleSeek}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                style={{ position: 'relative', marginTop: '-4px' }}
                            />
                            <div className="flex justify-between text-[10px] text-white/40 mt-1">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            {/* Left: Shuffle */}
                            <button
                                onClick={toggleShuffle}
                                className={`p-2 rounded-full transition-colors ${shuffle ? 'text-pink-400' : 'text-white/40 hover:text-white/70'
                                    }`}
                            >
                                <Shuffle size={16} />
                            </button>

                            {/* Center: Playback Controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={previousTrack}
                                    className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <SkipBack size={20} fill="currentColor" />
                                </button>

                                <button
                                    onClick={togglePlay}
                                    className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg hover:scale-105 transition-transform"
                                >
                                    {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                                </button>

                                <button
                                    onClick={nextTrack}
                                    className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <SkipForward size={20} fill="currentColor" />
                                </button>
                            </div>

                            {/* Right: Repeat */}
                            <button
                                onClick={toggleRepeat}
                                className={`p-2 rounded-full transition-colors ${repeat !== 'none' ? 'text-pink-400' : 'text-white/40 hover:text-white/70'
                                    }`}
                            >
                                {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
                            </button>
                        </div>

                        {/* Volume Control (Expanded) */}
                        <AnimatePresence>
                            {isPlayerExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-3 pt-3 border-t border-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={toggleMute}
                                            className="text-white/60 hover:text-white transition-colors"
                                        >
                                            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                        </button>
                                        <input
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.01}
                                            value={isMuted ? 0 : volume}
                                            onChange={handleVolumeChange}
                                            className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-pink-500"
                                        />
                                        <span className="text-xs text-white/40 w-8 text-right">
                                            {Math.round((isMuted ? 0 : volume) * 100)}%
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Expand Toggle */}
                        <button
                            onClick={() => setPlayerExpanded(!isPlayerExpanded)}
                            className="w-full mt-2 py-1 text-white/30 hover:text-white/60 transition-colors flex items-center justify-center"
                        >
                            {isPlayerExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
};
