import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperienceStore } from '../../store/useExperienceStore';

interface Bubble {
    id: number;
    word: string;
    x: number;
    scale: number;
    delay: number;
    duration: number;
}

export const FloatingWords: React.FC = () => {
    const isVisible = useExperienceStore(s => s.activeLayers.floatingWords);
    const {
        floatingWordsCount: count,
        floatingWordsSpeed: speed,
        floatingWordsOpacity: opacity,
        floatingWordsSize: size,
        floatingWordsColor: color
    } = useExperienceStore(s => s.layerParams);
    const wordList = useExperienceStore(s => s.floatingWordsList);

    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const timers = React.useRef<number[]>([]);

    useEffect(() => {
        if (!isVisible) return;

        // Spawn bubbles periodically based on count/speed
        const spawnRate = 3000 / (speed || 1);

        const interval = setInterval(() => {
            setBubbles(prev => {
                if (prev.length >= count) return prev;

                const newBubble: Bubble = {
                    id: Date.now() + Math.random(),
                    word: wordList[Math.floor(Math.random() * wordList.length)],
                    x: Math.random() * 90 + 5,
                    scale: (0.6 + Math.random() * 0.6) * size,
                    delay: 0,
                    duration: (8 + Math.random() * 6) / speed
                };

                const timeoutId = window.setTimeout(() => {
                    setBubbles(current => current.filter(b => b.id !== newBubble.id));
                    timers.current = timers.current.filter(id => id !== timeoutId);
                }, newBubble.duration * 1000);
                timers.current.push(timeoutId);

                return [...prev, newBubble];
            });
        }, spawnRate);

        return () => {
            clearInterval(interval);
            timers.current.forEach(id => clearTimeout(id));
            timers.current.length = 0;
            setBubbles([]); // Clear on unmount or visibility change
        };
    }, [isVisible, count, speed, size, wordList]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <AnimatePresence mode="popLayout">
                {isVisible && bubbles.map(bubble => (
                    <motion.div
                        key={bubble.id}
                        initial={{ opacity: 0, y: '110vh', scale: bubble.scale * 0.8 }}
                        animate={{
                            opacity: [0, opacity, opacity, 0],
                            y: '-10vh',
                            scale: bubble.scale
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: bubble.duration,
                            ease: "linear"
                        }}
                        className="absolute font-serif font-bold whitespace-nowrap drop-shadow-md"
                        style={{
                            left: `${bubble.x}%`,
                            color: color,
                            textShadow: `0 2px 4px rgba(0,0,0,0.1), 0 0 12px ${color}44`
                        }}
                    >
                        {bubble.word}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
