'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperienceStore } from '../../../store/useExperienceStore';

export const SceneTransitionOverlay: React.FC = () => {
  const transitionState = useExperienceStore((s) => s.transitionState);

  return (
    <AnimatePresence>
      {transitionState !== 'idle' && (
        <motion.div
          key="scene-transition"
          className="fixed inset-0 z-[100] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,200,220,0.12) 0%, rgba(0,0,0,0) 70%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: transitionState === 'fading-out' ? 0.3 : 0 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: transitionState === 'fading-out' ? 0.2 : 0.3,
            ease: transitionState === 'fading-out' ? 'easeIn' : 'easeOut',
          }}
        />
      )}
    </AnimatePresence>
  );
};
