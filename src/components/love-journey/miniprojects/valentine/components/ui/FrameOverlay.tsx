import React from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FrameOverlay - Hiển thị khung viền live preview trên canvas
 * Chỉ hiển thị khi user đã chọn một frame từ FrameSelector
 */
export const FrameOverlay: React.FC = () => {
    const selectedFrame = useExperienceStore(s => s.selectedFrame);
    const currentScene = useExperienceStore(s => s.currentScene);
    const isFrameSelectorOpen = useExperienceStore(s => s.isFrameSelectorOpen);

    // Chỉ hiển thị khi đã bắt đầu (không ở prelude) và khi menu frame selector đang mở
    const isStarted = currentScene !== 'prelude';
    if (!isStarted || !isFrameSelectorOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center p-8"
            >
                {/* Classic Frame */}
                {selectedFrame === 'classic' && (
                    <div className="w-full h-full max-w-[90vw] max-h-[80vh] border-[6px] border-[#E8AEB7] rounded-lg shadow-2xl bg-transparent relative">
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="text-[#E8AEB7]/60 text-xs tracking-[0.2em] font-serif uppercase bg-black/30 px-4 py-1 rounded-full">
                                Valentine 2026
                            </span>
                        </div>
                    </div>
                )}

                {/* Kawaii Frame */}
                {selectedFrame === 'cute' && (
                    <div className="w-full h-full max-w-[90vw] max-h-[80vh] border-[8px] border-dashed border-pink-300 rounded-[30px] bg-transparent relative">
                        <div className="absolute -top-4 left-8 text-3xl">🎀</div>
                        <div className="absolute -bottom-4 right-8 text-3xl">💖</div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="text-pink-300/80 font-bold text-xs tracking-[0.15em]">
                                SWEET MOMENT
                            </span>
                        </div>
                    </div>
                )}

                {/* Rose Gold Frame */}
                {selectedFrame === 'rose' && (
                    <div className="w-full h-full max-w-[90vw] max-h-[80vh] border-[4px] border-double border-[#b76e79] bg-transparent relative">
                        <div className="absolute inset-2 border border-[#b76e79]/30" />
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="text-[#b76e79]/80 font-serif italic text-sm tracking-[0.1em]">
                                L O V E
                            </span>
                        </div>
                    </div>
                )}

                {/* Crystal Frame */}
                {selectedFrame === 'crystal' && (
                    <div
                        className="w-full h-full max-w-[90vw] max-h-[80vh] border-[3px] border-cyan-200/60 rounded-xl bg-transparent relative"
                        style={{
                            boxShadow: 'inset 0 0 40px rgba(165,243,252,0.15), 0 0 30px rgba(165,243,252,0.1)'
                        }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 rounded-xl" />
                        <div className="absolute top-2 left-2 right-2 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
                    </div>
                )}

                {/* Floral Frame */}
                {selectedFrame === 'floral' && (
                    <div className="w-full h-full max-w-[90vw] max-h-[80vh] border-[5px] border-emerald-400/60 rounded-2xl bg-transparent relative">
                        {/* Corner decorations */}
                        <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                        <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                    </div>
                )}

                {/* Cinematic Frame */}
                {selectedFrame === 'cinematic' && (
                    <div className="w-full h-full max-w-[90vw] max-h-[80vh] border-[2px] border-neutral-700 bg-transparent relative">
                        {/* Letterbox bars */}
                        <div className="absolute top-0 left-0 right-0 h-[10%] bg-black/80" />
                        <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black/80" />
                        {/* Film grain overlay simulation */}
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
                        }} />
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
