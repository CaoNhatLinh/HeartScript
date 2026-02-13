import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, ChevronRight } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { APP_CONSTANTS } from '../../constants/app';

/**
 * GiftRevealPrompt - Hiển thị prompt để user click tiếp tục reveal gifts
 * Flow: Click lần 1 -> Mascot, Click lần 2 -> Photo, Click lần 3 -> Chocolate
 */
export const GiftRevealPrompt: React.FC = () => {
    const currentScene = useExperienceStore(s => s.currentScene);
    const giftRevealStage = useExperienceStore(s => s.giftRevealStage);
    const advanceGiftReveal = useExperienceStore(s => s.advanceGiftReveal);
    const hasReadLetter = useExperienceStore(s => s.hasReadLetter);

    // Chỉ hiển thị khi:
    // - Đã đọc thư xong
    // - Đang ở scene climax hoặc sau
    // - Chưa reveal hết (stage < 3)
    const isClimaxOrLater = ['climax', 'chocolate', 'ending'].includes(currentScene);
    const shouldShow = hasReadLetter && isClimaxOrLater && giftRevealStage < 3;

    // Messages cho từng stage
    const getPromptContent = () => {
        switch (giftRevealStage) {
            case 0:
                return APP_CONSTANTS.CONTENT.GIFT_REVEAL.STAGE_0;
            case 1:
                return APP_CONSTANTS.CONTENT.GIFT_REVEAL.STAGE_1;
            case 2:
                return APP_CONSTANTS.CONTENT.GIFT_REVEAL.STAGE_2;
            default:
                return null;
        }
    };

    const content = getPromptContent();
    if (!shouldShow || !content) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto w-auto max-w-[95vw] sm:max-w-3xl px-4"
            >
                <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={advanceGiftReveal}
                    className="
                        flex items-center gap-2 sm:gap-4 px-4 sm:px-8 py-3 sm:py-4 w-full sm:w-auto
                        bg-gradient-to-r from-pink-500/20 to-purple-500/20
                        backdrop-blur-lg border border-pink-300/30
                        rounded-2xl sm:rounded-full shadow-2xl
                        hover:from-pink-500/30 hover:to-purple-500/30
                        transition-all duration-300
                    "
                    style={{
                        boxShadow: '0 20px 50px rgba(236,72,153,0.3), 0 0 100px rgba(236,72,153,0.1)'
                    }}
                >
                    {/* Icon */}
                    <div className="relative">
                        <Gift size={28} className="text-pink-400" />
                        <Sparkles size={14} className="absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
                    </div>

                    {/* Text */}
                    <div className="text-left">
                        <div className="text-white font-semibold text-lg sm:text-xl whitespace-nowrap">{content.TITLE}</div>
                        <div className="text-white/60 text-xs sm:text-sm">{content.DESCRIPTION}</div>
                    </div>

                    {/* Button text */}
                    <div className="flex items-center gap-1 bg-white/10 px-4 py-2 rounded-full">
                        <span className="text-pink-300 font-medium">{content.BUTTON}</span>
                        <ChevronRight size={18} className="text-pink-400" />
                    </div>
                </motion.button>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mt-4">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className={`
                                w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300
                                ${i < giftRevealStage ? 'bg-pink-400 scale-100' : 'bg-white/30 scale-75'}
                                ${i === giftRevealStage ? 'bg-white animate-pulse scale-125' : ''}
                            `}
                        />
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
