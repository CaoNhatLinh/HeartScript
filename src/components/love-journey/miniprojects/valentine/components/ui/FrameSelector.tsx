import React from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { Image, X, Heart, Sparkles, Camera, Star, Flower2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Defined Styles with preview gradient/pattern
const FRAMES = [
    {
        id: 'classic',
        label: 'Classic',
        gradient: 'linear-gradient(135deg, #E8AEB7 0%, #d4949e 50%, #E8AEB7 100%)',
        borderStyle: '6px solid #E8AEB7',
        icon: Heart
    },
    {
        id: 'cute',
        label: 'Kawaii',
        gradient: 'linear-gradient(135deg, #ffe6ea 0%, #ffc0cb 50%, #ffe6ea 100%)',
        borderStyle: '8px dashed #ffb6c1',
        icon: Sparkles
    },
    {
        id: 'rose',
        label: 'Rose Gold',
        gradient: 'linear-gradient(135deg, #b76e79 0%, #e6a4b4 30%, #b76e79 70%, #8b4552 100%)',
        borderStyle: '4px double #d4a574',
        icon: Flower2
    },
    {
        id: 'crystal',
        label: 'Crystal',
        gradient: 'linear-gradient(135deg, rgba(165,243,252,0.8) 0%, rgba(200,220,255,0.6) 50%, rgba(165,243,252,0.8) 100%)',
        borderStyle: '3px solid rgba(255,255,255,0.6)',
        icon: Star
    },
    {
        id: 'floral',
        label: 'Floral',
        gradient: 'linear-gradient(135deg, #86efac 0%, #a7f3d0 50%, #6ee7b7 100%)',
        borderStyle: '5px solid #34d399',
        icon: Flower2
    },
    {
        id: 'cinematic',
        label: 'Cinema',
        gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #0a0a0a 100%)',
        borderStyle: '2px solid #333',
        icon: Camera
    },
] as const;

export const FrameSelector: React.FC = () => {
    const isFrameSelectorOpen = useExperienceStore(s => s.isFrameSelectorOpen);
    const setFrameSelectorOpen = useExperienceStore(s => s.setFrameSelectorOpen);
    const selectedFrame = useExperienceStore(s => s.selectedFrame);
    const setSelectedFrame = useExperienceStore(s => s.setSelectedFrame);

    const handleSelect = (id: typeof selectedFrame) => {
        setSelectedFrame(id);
    };

    return (
        <div className="relative">
            {/* Toggle Button */}
            <button
                onClick={() => setFrameSelectorOpen(!isFrameSelectorOpen)}
                className={`p-3 rounded-full transition-all shadow-lg border backdrop-blur-md ${isFrameSelectorOpen ? 'bg-pink-500 text-white border-pink-400' : 'bg-white/10 text-white/90 border-white/10 hover:bg-white/20'}`}
                title="Choose Frame"
            >
                {isFrameSelectorOpen ? <X size={22} /> : <Image size={22} />}
            </button>

            {/* Popup Menu - Grid Layout */}
            <AnimatePresence>
                {isFrameSelectorOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full mt-2 left-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 w-[280px] z-[60] shadow-2xl"
                    >
                        <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 px-1">
                            Chọn khung viền
                        </div>

                        {/* Grid of Frame Previews */}
                        <div className="grid grid-cols-3 gap-3">
                            {FRAMES.map((frame, index) => {
                                const Icon = frame.icon;
                                const isSelected = selectedFrame === frame.id;

                                return (
                                    <motion.button
                                        key={frame.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleSelect(frame.id)}
                                        className={`
                                            relative group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all
                                            ${isSelected
                                                ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-black/80'
                                                : 'hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        {/* Preview Thumbnail */}
                                        <div
                                            className="w-16 h-16 rounded-lg overflow-hidden shadow-lg relative"
                                            style={{
                                                background: frame.gradient,
                                                border: frame.borderStyle
                                            }}
                                        >
                                            {/* Inner content preview */}
                                            <div className="absolute inset-2 bg-white/20 backdrop-blur-sm rounded flex items-center justify-center">
                                                <Icon
                                                    size={20}
                                                    className={`${frame.id === 'cinematic' ? 'text-white/60' : 'text-white/80'}`}
                                                />
                                            </div>

                                            {/* Hover effect */}
                                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />

                                            {/* Selected checkmark */}
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Label */}
                                        <span className={`text-[10px] font-medium ${isSelected ? 'text-pink-400' : 'text-white/70'}`}>
                                            {frame.label}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
