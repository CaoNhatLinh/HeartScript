import React, { useRef, useEffect, useState } from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

/**
 * FpsCounter - Hiển thị FPS counter ở góc trên phải
 * Chỉ hiển thị khi showFps = true trong store
 */
export const FpsCounter: React.FC = () => {
    const showFps = useExperienceStore(s => s.showFps);
    const [fps, setFps] = useState(0);
    const frameCount = useRef(0);
    const lastTime = useRef(0); // Khởi tạo trong useEffect để tránh lỗi React strict mode

    useEffect(() => {
        if (!showFps) return;

        // Khởi tạo lastTime khi bắt đầu đo
        lastTime.current = performance.now();

        let animationId: number;

        const measureFps = () => {
            frameCount.current++;
            const currentTime = performance.now();
            const elapsed = currentTime - lastTime.current;

            if (elapsed >= 1000) {
                setFps(Math.round((frameCount.current * 1000) / elapsed));
                frameCount.current = 0;
                lastTime.current = currentTime;
            }

            animationId = requestAnimationFrame(measureFps);
        };

        animationId = requestAnimationFrame(measureFps);

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [showFps]);

    // Màu sắc theo FPS
    const getColor = () => {
        if (fps >= 55) return 'text-green-400';
        if (fps >= 30) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getBgColor = () => {
        if (fps >= 55) return 'bg-green-500/10 border-green-500/20';
        if (fps >= 30) return 'bg-yellow-500/10 border-yellow-500/20';
        return 'bg-red-500/10 border-red-500/20';
    };

    return (
        <AnimatePresence>
            {showFps && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`
                        fixed top-4 right-4 z-50 
                        px-3 py-1.5 rounded-full
                        backdrop-blur-md border
                        flex items-center gap-2
                        pointer-events-none
                        ${getBgColor()}
                    `}
                >
                    <Activity size={14} className={getColor()} />
                    <span className={`text-sm font-mono font-bold ${getColor()}`}>
                        {fps}
                    </span>
                    <span className="text-[10px] text-white/40 uppercase">FPS</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
