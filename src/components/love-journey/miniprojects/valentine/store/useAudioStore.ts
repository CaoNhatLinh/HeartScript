// Audio Store - Quản lý trạng thái audio player
import { create } from 'zustand';
import audioConfig from '../data/audioConfig.json';

export interface Track {
    id: string;
    title: string;
    artist: string;
    duration: number; // seconds
    avatar: string;
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
}

export const useAudioStore = create<AudioState>((set, get) => ({
    // Initial state from config
    tracks: audioConfig.tracks as Track[],
    currentTrackIndex: 0,
    currentTrack: audioConfig.tracks[0] as Track || null,

    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: audioConfig.defaultVolume,
    isMuted: false,

    shuffle: audioConfig.shuffle,
    repeat: audioConfig.repeat as 'none' | 'one' | 'all',

    isPlayerExpanded: false,
    isPlaylistOpen: false,

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
        const { currentTrackIndex, tracks, currentTime } = get();

        // Nếu đã phát hơn 3 giây, quay lại đầu bài
        if (currentTime > 3) {
            set({ currentTime: 0 });
            return;
        }

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
    setPlaylistOpen: (open) => set({ isPlaylistOpen: open })
}));
