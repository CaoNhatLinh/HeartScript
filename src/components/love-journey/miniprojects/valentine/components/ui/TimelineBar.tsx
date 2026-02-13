'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperienceStore } from '../../store/useExperienceStore';

const STEP_LABELS = [
  'Mo dau',
  'Hoa no',
  'Ky niem',
  'La thu',
  'Khoang khac',
  'Ngot ngao',
  'Chocolate',
  'Loi hua',
  'Valentine',
];

export const TimelineBar: React.FC = () => {
  const storyStep = useExperienceStore((s) => s.storyStep);
  const currentScene = useExperienceStore((s) => s.currentScene);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [storyStep]);

  if (currentScene === 'prelude') return null;

  const totalSteps = STEP_LABELS.length;
  const progress = ((storyStep + 1) / totalSteps) * 100;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: visible ? 1 : 0.3, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setVisible(true)}
      onTouchStart={() => setVisible(true)}
    >
      <AnimatePresence>
        {hoveredStep !== null && (
          <motion.div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg text-xs text-white/90 whitespace-nowrap border border-white/10"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            {STEP_LABELS[hoveredStep]}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between px-4 sm:px-8 pb-1">
        {STEP_LABELS.map((_, i) => (
          <button
            key={i}
            className="relative p-1"
            onMouseEnter={() => setHoveredStep(i)}
            onMouseLeave={() => setHoveredStep(null)}
          >
            <div
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-500 ${
                i <= storyStep
                  ? 'bg-pink-400 shadow-sm shadow-pink-400/50'
                  : i === storyStep + 1
                  ? 'bg-white/30'
                  : 'bg-white/10'
              } ${i === storyStep ? 'scale-150' : ''}`}
            />
          </button>
        ))}
      </div>

      <div className="h-1 bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};
