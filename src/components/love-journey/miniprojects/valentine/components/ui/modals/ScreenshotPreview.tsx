import React from 'react';
import { Download, X } from 'lucide-react';
import { useExperienceStore } from '../../../store/useExperienceStore';
import { motion, AnimatePresence } from 'framer-motion';

export const ScreenshotPreview: React.FC = () => {
    const capturedImage = useExperienceStore(s => s.capturedImage);
    const setCapturedImage = useExperienceStore(s => s.setCapturedImage);
    const selectedFrame = useExperienceStore(s => s.selectedFrame) || 'classic';

    if (!capturedImage) return null;

    const handleDownload = () => {
        const link = document.createElement("a");
        const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
        link.setAttribute("download", `valentine-gift-${timestamp}.png`);
        link.setAttribute("href", capturedImage);
        link.click();
    };

    const handleClose = () => {
        setCapturedImage(null);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-lg p-4 overflow-hidden pointer-events-auto"
                style={{ zIndex: 10000 }}
            >
                <div className="flex flex-col items-center justify-center w-full h-full max-h-screen">

                    {/* The Framed Photo Container - Scaled Down */}
                    <motion.div
                        initial={{ scale: 0.5, rotate: -5, y: 100 }}
                        animate={{ scale: 1, rotate: 0, y: 0 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="relative max-w-[85vw] md:max-w-[65vw]"
                    >
                        {/* 1. CLASSIC STYLE - Matched with Overlay */}
                        {selectedFrame === 'classic' && (
                            <div className="relative">
                                {/* Border Container similar to Overlay */}
                                <div className="absolute inset-0 border-[6px] border-[#E8AEB7] rounded-lg shadow-2xl pointer-events-none z-20" />
                                <img src={capturedImage} alt="Captured" className="block max-h-[45vh] w-auto rounded-lg" />
                                <div className="absolute bottom-4 left-0 right-0 text-center z-20">
                                    <span className="text-[#E8AEB7]/80 text-xs tracking-[0.2em] font-serif uppercase bg-black/30 px-4 py-1 rounded-full">
                                        Valentine 2026
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 2. CUTE STYLE - Matched with Overlay */}
                        {selectedFrame === 'cute' && (
                            <div className="relative">
                                <div className="absolute inset-0 border-[8px] border-dashed border-pink-300 rounded-[30px] pointer-events-none z-20" />
                                <div className="absolute -top-4 left-8 text-3xl z-20">🎀</div>
                                <div className="absolute -bottom-4 right-8 text-3xl z-20">💖</div>
                                <img src={capturedImage} alt="Captured" className="block max-h-[45vh] w-auto rounded-[24px]" />
                                <div className="absolute bottom-4 left-0 right-0 text-center z-20">
                                    <span className="text-pink-300/90 font-bold text-xs tracking-[0.15em] bg-white/50 px-2 rounded-sm text-shadow-sm">
                                        SWEET MOMENT
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 3. ROSE STYLE - Matched with Overlay */}
                        {selectedFrame === 'rose' && (
                            <div className="relative">
                                <div className="absolute inset-0 border-[4px] border-double border-[#b76e79] pointer-events-none z-20" />
                                <div className="absolute inset-2 border border-[#b76e79]/30 pointer-events-none z-20" />
                                <img src={capturedImage} alt="Captured" className="block max-h-[45vh] w-auto" />
                                <div className="absolute bottom-4 left-0 right-0 text-center z-20">
                                    <span className="text-[#b76e79]/90 font-serif italic text-sm tracking-[0.1em] drop-shadow-md">
                                        L O V E
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 4. CRYSTAL STYLE - Matched with Overlay */}
                        {selectedFrame === 'crystal' && (
                            <div className="relative rounded-xl overflow-hidden">
                                <div className="absolute inset-0 border-[3px] border-cyan-200/60 rounded-xl pointer-events-none z-20 box-border"
                                    style={{ boxShadow: 'inset 0 0 40px rgba(165,243,252,0.15)' }} />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none z-10" />
                                <img src={capturedImage} alt="Captured" className="block max-h-[45vh] w-auto rounded-xl" />
                            </div>
                        )}

                        {/* 5. FLORAL STYLE - Matched with Overlay */}
                        {selectedFrame === 'floral' && (
                            <div className="relative rounded-2xl">
                                <div className="absolute inset-0 border-[5px] border-emerald-400/60 rounded-2xl pointer-events-none z-20" />
                                {/* Decorations */}
                                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg z-30" />
                                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg z-30" />
                                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg z-30" />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg z-30" />

                                <img src={capturedImage} alt="Captured" className="block max-h-[45vh] w-auto rounded-xl" />
                            </div>
                        )}

                        {/* 6. CINEMATIC STYLE - Matched with Overlay */}
                        {selectedFrame === 'cinematic' && (
                            <div className="relative">
                                {/* Letterbox bars */}
                                <div className="absolute top-0 left-0 right-0 h-[10%] bg-black/90 z-20" />
                                <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black/90 z-20" />
                                {/* Grain */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none z-20 mix-blend-overlay" style={{
                                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
                                }} />
                                <img src={capturedImage} alt="Captured" className="block max-h-[45vh] w-auto" />
                            </div>
                        )}
                    </motion.div>

                    {/* Controls */}
                    <div className="flex items-center gap-10 mt-8 mb-4">
                        <button
                            onClick={handleClose}
                            className="group flex flex-col items-center gap-2 text-white/50 hover:text-white transition-all opacity-80"
                        >
                            <div className="p-2.5 rounded-full border border-white/20 group-hover:bg-white/10 transition-all">
                                <X size={20} />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest">Bỏ qua</span>
                        </button>

                        <button
                            onClick={handleDownload}
                            className="group flex flex-col items-center gap-2 text-white"
                        >
                            <div className="p-3.5 rounded-full bg-pink-500 shadow-xl shadow-pink-500/30 group-hover:scale-110 group-hover:bg-pink-600 transition-all">
                                <Download size={24} />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-pink-300">Lưu ảnh</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
