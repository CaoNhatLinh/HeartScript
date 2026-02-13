'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { useExperienceStore } from '../../../store/useExperienceStore';

interface Particle {
  key: number;
  left: number;
  top: number;
  size: number;
  rotation: number;
  duration: number;
  delay: number;
}

export const PromiseModal: React.FC = () => {
  const show = useExperienceStore((s) => s.showPromiseModal);
  const setShow = useExperienceStore((s) => s.setShowPromiseModal);
  const nextStep = useExperienceStore((s) => s.nextStoryStep);
  const requestTransition = useExperienceStore((s) => s.requestSceneTransition);

  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Defer state update to next tick to avoid "synchronous setState in effect" lint error
    const timer = setTimeout(() => {
      setParticles(Array.from({ length: 15 }).map((_, i) => ({
        key: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 20 + 10,
        rotation: Math.random() * 360,
        duration: 5 + Math.random() * 5,
        delay: Math.random() * 2
      })));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    setShow(false);
    nextStep();
    requestTransition('ending');
  };

  if (particles.length === 0) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Backdrop with cute blurred pink overlay */}
          <div className="absolute inset-0 bg-pink-100/40 backdrop-blur-sm" onClick={handleContinue} role="presentation" />

          {/* Floating background hearts */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.key}
                className="absolute text-pink-300"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  fontSize: `${p.size}px`
                }}
                animate={{
                  y: [0, -100],
                  opacity: [0, 0.6, 0],
                  rotate: [0, p.rotation]
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: "linear"
                }}
              >
                <Heart fill="currentColor" />
              </motion.div>
            ))}
          </div>

          {/* Main Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Lời hứa dành cho em"
            className="relative z-10 w-[min(90vw,420px)] mx-auto"
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Card Content */}
            <div className="relative bg-white/90 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(255,100,150,0.3)] border-4 border-white overflow-hidden">
              {/* Decorative Header */}
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-pink-100 to-transparent opacity-50" />

              <div className="relative p-8 flex flex-col items-center text-center">

                {/* Icon/Image with Glow */}
                <motion.div
                  className="mb-6 relative"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="absolute inset-0 bg-pink-400 rounded-full blur-2xl opacity-20 scale-150" />
                  <div className="w-20 h-20 bg-gradient-to-tr from-pink-100 to-white rounded-full flex items-center justify-center shadow-inner border-2 border-pink-50 relative z-10">
                    <Heart className="w-10 h-10 text-rose-400" fill="#fb7185" />
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-6 h-6 text-yellow-400" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-rose-600 mb-2" style={{ fontFamily: "'Dancing Script', cursive", fontSize: '2rem' }}>
                  Lời Hứa Dành Cho Em
                </h2>
                <div className="w-16 h-1 bg-pink-200 rounded-full mb-6" />

                {/* Promise Text */}
                <div className="space-y-4 mb-8 text-slate-600" style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.25rem', lineHeight: '1.6' }}>
                  <p>
                    Anh hứa sẽ luôn ở bên em,<br />
                    <span className="text-rose-500">yêu thương và che chở</span> cho em.
                  </p>
                  <p>
                    Mỗi ngày trôi qua sẽ là một ngày<br />
                    ngập tràn <span className="text-rose-500">niềm vui và hạnh phúc</span>.
                  </p>
                  <p className="font-semibold text-rose-600 pt-2">
                    Mãi yêu em!
                  </p>
                </div>

                {/* Cute Button */}
                <motion.button
                  onClick={handleContinue}
                  className="group relative px-8 py-3 bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white font-medium rounded-full shadow-lg shadow-pink-300/50 transition-all flex items-center gap-2 overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10">Nhận quà thôi nàoo</span>
                  <Heart size={18} className="relative z-10 fill-current animate-pulse" />

                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
