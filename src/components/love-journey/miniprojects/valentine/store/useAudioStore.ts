// Audio Store - Quản lý trạng thái audio player
import { create } from 'zustand';
import { useRef, useCallback } from 'react';
import audioConfig from '../data/audioConfig.json';

export interface Track {
    id: string;
    title: string;
    artist: string;
    duration: number; // seconds
    avatar?: string;
    genre?: string;
    src: string;
}

interface AudioState {
    // Danh sách bài hát
    tracks: Track[];

    // Bài hát hiện tại
    currentTrackIndex: number;
    currentTrack: Track | null;

    // Trạng thái phát
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;

    // Chế độ phát
    shuffle: boolean;
    repeat: 'none' | 'one' | 'all';

    // UI State
    isPlayerExpanded: boolean;
    isPlaylistOpen: boolean;

    // Audio Analysis
    analyser: AnalyserNode | null;
    audioContext: AudioContext | null;
    sourceNode: MediaElementAudioSourceNode | null;
    seekRequestTime: number | null; // Used to signal GlobalAudioElement to seek

    // Actions
    setTracks: (tracks: Track[]) => void;
    playTrack: (index: number) => void;
    nextTrack: () => void;
    previousTrack: () => void;
    togglePlay: () => void;
    setIsPlaying: (playing: boolean) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    setPlayerExpanded: (expanded: boolean) => void;
    setPlaylistOpen: (open: boolean) => void;
    initAnalyser: (audioElement: HTMLAudioElement) => void;
    seek: (time: number) => void;
    clearSeekRequest: () => void;
    getAudioData: () => { bass: number; mid: number; high: number; rms: number };
}

export const useAudioStore = create<AudioState>((set, get) => ({
    // Initial state from config
    tracks: audioConfig.tracks as Track[],
    currentTrackIndex: 0,
    currentTrack: audioConfig.tracks[0] as Track || null,

    isPlaying: true,
    currentTime: 0,
    duration: 0,
    volume: audioConfig.defaultVolume,
    isMuted: false,

    shuffle: audioConfig.shuffle,
    repeat: audioConfig.repeat as 'none' | 'one' | 'all',

    isPlayerExpanded: false,
    isPlaylistOpen: false,

    // Audio Analysis initial state
    analyser: null,
    audioContext: null,
    sourceNode: null,
    seekRequestTime: null,

    // Actions
    setTracks: (tracks) => set({ tracks, currentTrack: tracks[0] || null, currentTrackIndex: 0 }),

    playTrack: (index) => {
        const { tracks } = get();
        if (index >= 0 && index < tracks.length) {
            set({
                currentTrackIndex: index,
                currentTrack: tracks[index],
                isPlaying: true,
                currentTime: 0
            });
        }
    },

    nextTrack: () => {
        const { currentTrackIndex, tracks, shuffle, repeat } = get();
        let nextIndex: number;

        if (shuffle) {
            // Random track (không lặp lại bài hiện tại)
            do {
                nextIndex = Math.floor(Math.random() * tracks.length);
            } while (nextIndex === currentTrackIndex && tracks.length > 1);
        } else {
            nextIndex = currentTrackIndex + 1;
            if (nextIndex >= tracks.length) {
                nextIndex = repeat === 'all' ? 0 : currentTrackIndex;
            }
        }

        get().playTrack(nextIndex);
    },

    previousTrack: () => {
        const { currentTrackIndex, tracks } = get();

        let prevIndex = currentTrackIndex - 1;
        if (prevIndex < 0) {
            prevIndex = tracks.length - 1;
        }

        get().playTrack(prevIndex);
    },

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setDuration: (duration) => set({ duration }),
    setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
    toggleRepeat: () => set((state) => {
        const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(state.repeat);
        const nextIndex = (currentIndex + 1) % modes.length;
        return { repeat: modes[nextIndex] };
    }),
    setPlayerExpanded: (expanded) => set({ isPlayerExpanded: expanded }),
    setPlaylistOpen: (open) => set({ isPlaylistOpen: open }),

    initAnalyser: (audioElement: HTMLAudioElement) => {
        const { analyser: existing } = get();
        if (existing) return;

        try {
            const contextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const audioContext = new contextClass();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;

            const sourceNode = audioContext.createMediaElementSource(audioElement);
            sourceNode.connect(analyser);
            analyser.connect(audioContext.destination);

            if (audioContext.state === 'suspended') {
                const resume = () => {
                    audioContext.resume();
                    window.removeEventListener('pointerdown', resume);
                };
                window.addEventListener('pointerdown', resume);
            }

            set({ analyser, audioContext, sourceNode });
        } catch (e) {
            console.warn('Audio analyser init failed:', e);
        }
    },

    seek: (time) => set({ seekRequestTime: time, currentTime: time }),
    clearSeekRequest: () => set({ seekRequestTime: null }),

    getAudioData: () => {
        const { analyser } = get();
        const zero = { bass: 0, mid: 0, high: 0, rms: 0 };
        if (!analyser) return zero;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const third = Math.floor(bufferLength / 3);
        let bassSum = 0, midSum = 0, highSum = 0, totalSum = 0;

        for (let i = 0; i < bufferLength; i++) {
            const val = dataArray[i];
            totalSum += val * val;
            if (i < third) bassSum += val;
            else if (i < third * 2) midSum += val;
            else highSum += val;
        }

        const bass = bassSum / (third * 255);
        const mid = midSum / (third * 255);
        const high = highSum / ((bufferLength - third * 2) * 255);
        const rms = Math.sqrt(totalSum / bufferLength) / 255;

        return { bass, mid, high, rms };
    }
}));

export const useAudioData = () => {
    const getAudioData = useAudioStore((s) => s.getAudioData);
    const frameRef = useRef(0);
    const cacheRef = useRef({ bass: 0, mid: 0, high: 0, rms: 0 });

    const read = useCallback(() => {
        frameRef.current++;
        if (frameRef.current % 2 === 0) {
            cacheRef.current = getAudioData();
        }
        return cacheRef.current;
    }, [getAudioData]);

    return read;
};
