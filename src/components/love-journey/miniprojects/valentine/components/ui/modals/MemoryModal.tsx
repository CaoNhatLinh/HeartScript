'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Sparkles, Music, Cloud } from 'lucide-react';
import { useExperienceStore } from '../../../store/useExperienceStore';
import { APP_CONSTANTS } from '../../../constants/app';

export const MemoryModal: React.FC = () => {
  const show = useExperienceStore((s) => s.showMemoryModal);
  const setShow = useExperienceStore((s) => s.setShowMemoryModal);
  const nextStep = useExperienceStore((s) => s.nextStoryStep);

  const handleContinue = () => {
    setShow(false);
    nextStep();
  };

  // Cute floating icons configuration
  const floatingIcons = [
    { Icon: Heart, color: "text-rose-400", delay: 0, x: -120, y: -100, size: 24 },
    { Icon: Star, color: "text-yellow-400", delay: 0.5, x: 140, y: -80, size: 20 },
    { Icon: Sparkles, color: "text-blue-300", delay: 1.0, x: -100, y: 80, size: 28 },
    { Icon: Music, color: "text-purple-400", delay: 1.5, x: 120, y: 100, size: 18 },
    { Icon: Heart, color: "text-pink-300", delay: 2.0, x: 0, y: -140, size: 16 },
    { Icon: Cloud, color: "text-sky-200", delay: 2.5, x: -150, y: 0, size: 32 },
  ];

  const [backgroundHearts, setBackgroundHearts] = React.useState<any[]>([]);
  const [iconDurations, setIconDurations] = React.useState<number[]>([]);

  React.useEffect(() => {
    setBackgroundHearts(Array.from({ length: 12 }).map((_, i) => ({
      key: i,
      initialX: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
      initialY: (typeof window !== 'undefined' ? window.innerHeight : 800) + 100,
      duration: 10 + Math.random() * 10,
      delay: Math.random() * 5,
      size: 20 + Math.random() * 30
    })));

    setIconDurations(floatingIcons.map(() => 3 + Math.random()));
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Backdrop with cute pastel blur */}
          <div className="absolute inset-0 bg-pink-900/40 backdrop-blur-md" onClick={handleContinue} role="presentation" />

          {/* Floating background elements (outside the modal) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {backgroundHearts.map((bgHeart) => (
              <motion.div
                key={bgHeart.key}
                className="absolute text-pink-300/30"
                initial={{
                  x: bgHeart.initialX,
                  y: bgHeart.initialY
                }}
                animate={{
                  y: -100,
                  rotate: [0, 360],
                }}
                transition={{
                  duration: bgHeart.duration,
                  repeat: Infinity,
                  delay: bgHeart.delay,
                  ease: "linear"
                }}
              >
                <Heart size={bgHeart.size} fill="currentColor" />
              </motion.div>
            ))}
          </div>

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Kỷ niệm ngày đầu gặp nhau"
            className="relative z-10 w-full max-w-[90vw] sm:max-w-md mx-4"
            initial={{ scale: 0.8, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 120 }}
          >

            {/* Cute Modal Container */}
            <div className="relative bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(255,100,150,0.4)] border-4 border-white overflow-visible">

              {/* Decorative "Ears" or top curve */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-20 bg-white rounded-t-full -z-10" />

              {/* Floating Icons Loop */}
              {floatingIcons.map((item, index) => (
                <motion.div
                  key={index}
                  className={`absolute ${item.color} z-20`}
                  style={{ left: '50%', top: '50%', marginLeft: item.x, marginTop: item.y }}
                  animate={{
                    y: [0, -15, 0],
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: iconDurations[index],
                    repeat: Infinity,
                    delay: item.delay,
                    ease: "easeInOut"
                  }}
                >
                  <item.Icon size={item.size} fill="currentColor" className="opacity-80 drop-shadow-md" />
                </motion.div>
              ))}

              <div className="relative p-6 sm:p-8 flex flex-col items-center">

                {/* Photo Frame - Sticker Style */}
                <motion.div
                  className="relative mb-6 p-2 bg-white rounded-2xl shadow-lg rotate-2"
                  whileHover={{ rotate: 0, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="absolute -top-3 -right-3 z-20 bg-yellow-300 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 border-2 border-white transform rotate-12">
                    <Sparkles size={12} />
                    <span>Cute!</span>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border-2 border-pink-100">
                    <img
                      src="/memory-first-meet.png"
                      alt="Ngày đầu tiên gặp em"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-cover"
                    />
                  </div>

                  {/* Washi Tape Effect */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-pink-200/50 backdrop-blur-sm -rotate-3 rounded-sm opacity-80" />
                </motion.div>

                {/* Title with Cute Font */}
                <h2 className="text-center text-2xl sm:text-3xl text-rose-500 mb-2 font-bold drop-shadow-sm"
                  style={{ fontFamily: "'Dancing Script', cursive" }}>
                  {APP_CONSTANTS.CONTENT.MEMORY_MODAL.TITLE} <span className="inline-block animate-bounce">✨</span>
                </h2>

                <div className="w-16 h-1.5 bg-pink-200 rounded-full mb-6" />

                {/* Content */}
                <div className="space-y-4 text-center">
                  <p className="text-slate-700 text-base sm:text-lg font-medium leading-relaxed px-2"
                    style={{ fontFamily: "'Quicksand', sans-serif" }}>
                    &ldquo;{APP_CONSTANTS.CONTENT.MEMORY_MODAL.TEXT_1}&rdquo;
                  </p>
                  <p className="text-slate-500 text-sm leading-relaxed px-4">
                    {APP_CONSTANTS.CONTENT.MEMORY_MODAL.TEXT_2}
                  </p>
                </div>

                {/* Kawaii Button */}
                <motion.button
                  onClick={handleContinue}
                  className="mt-8 group relative px-8 py-3 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-full shadow-[0_8px_20px_-5px_rgba(244,114,182,0.5)] transition-all overflow-hidden"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10 flex items-center gap-2 font-bold tracking-wide">
                    Tiếp Tục Nè
                    <Heart size={18} className="fill-white animate-pulse" />
                  </span>
                  {/* Shine */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </motion.button>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
