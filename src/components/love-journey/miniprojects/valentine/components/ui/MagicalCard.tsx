import React from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface MagicalCardProps {
    text: string;
    subText?: string;
    isVisible: boolean;
    layout?: 'center' | 'top-left' | 'top-right' | 'bottom-right' | 'top-center' | 'bottom-center' | 'center-left' | 'bottom-left';
    emphasis?: 'whisper' | 'normal' | 'grand' | 'dramatic';
}

export const MagicalCard: React.FC<MagicalCardProps> = ({
    text,
    subText,
    isVisible,
    layout = 'center',
    emphasis = 'normal'
}) => {
    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring physics for the tilt
    const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXVal = e.clientX - rect.left;
        const mouseYVal = e.clientY - rect.top;
        const xPct = mouseXVal / width - 0.5;
        const yPct = mouseYVal / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Layout Logic
    // Layout Logic
    const getPositionStyles = () => {
        switch (layout) {
            case 'top-left': return "justify-start items-start pt-[4vh] pl-[10vw]";
            case 'top-right': return "justify-start items-end pt-[4vh] pr-[10vw]";
            case 'bottom-right': return "justify-end items-end pb-[10vh] pr-[10vw]";
            case 'top-center': return "justify-start items-center pt-[4vh]";
            case 'bottom-center': return "justify-end items-center pb-[10vh]";
            case 'center-left': return "justify-center items-start pl-[10vw]";
            case 'bottom-left': return "justify-end items-start pb-[10vh] pl-[10vw]";
            case 'center': default: return "justify-center items-center";
        }
    };

    const getTextAlignment = () => {
        switch (layout) {
            case 'top-left':
            case 'center-left': return "text-left";
            case 'bottom-right': return "text-right";
            default: return "text-center";
        }
    }

    // Emphasis Logic - Reduced font sizes
    const getFontSize = () => {
        switch (emphasis) {
            case 'dramatic': return 'clamp(32px, 5vw, 48px)';
            case 'grand': return 'clamp(24px, 4vw, 32px)';
            default: return 'clamp(18px, 2.5vw, 24px)';
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div
                    className={`fixed inset-0 flex flex-col pointer-events-none z-50 p-4 ${getPositionStyles()}`}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20, rotateX: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)', transition: { duration: 0.5 } }}
                        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                        style={{
                            rotateX,
                            rotateY,
                            transformStyle: "preserve-3d",
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="relative p-5 md:p-8"
                    >
                        {/* Frosted Glass Background (Darker for Contrast) */}
                        <div
                            className="absolute inset-0 rounded-2xl border border-white/10"
                            style={{
                                background: 'rgba(5, 5, 20, 0.1)', // Even more transparent
                                backdropFilter: 'blur(12px)',
                                boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.02)' // Softened shadow
                            }}
                        />

                        {/* Lighting Glint */}
                        <div
                            className="absolute inset-0 rounded-2xl opacity-40 pointer-events-none"
                            style={{
                                background: 'linear-gradient(125deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0) 100%)'
                            }}
                        />

                        {/* Content */}
                        <div
                            className={`relative text-white font-serif tracking-wide leading-relaxed ${getTextAlignment()}`}
                            style={{
                                transform: "translateZ(30px)",
                                textShadow: '0 1px 4px rgba(0,0,0,0.3)' // Softened shadow
                            }}
                        >
                            {/* Shimmering Text Effect */}
                            <h2
                                className="font-light bg-clip-text text-transparent bg-gradient-to-r from-[#FFFFFF] via-[#FFF8E1] to-[#FFC0CB] animate-shimmer"
                                style={{
                                    fontSize: getFontSize(),
                                }}
                            >
                                {text}
                            </h2>

                            {subText && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 0.8, y: 0 }}
                                    transition={{ delay: 0.5, duration: 1 }}
                                    className="mt-3 font-extralight italic text-rose-100/70"
                                    style={{ fontSize: '15px' }}
                                >
                                    {subText}
                                </motion.p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
