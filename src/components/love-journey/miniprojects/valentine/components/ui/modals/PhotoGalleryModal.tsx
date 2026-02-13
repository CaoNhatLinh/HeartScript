'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Heart } from 'lucide-react';
import { useExperienceStore } from '../../../store/useExperienceStore';

export const PhotoGalleryModal: React.FC = () => {
  const isOpen = useExperienceStore((s) => s.isGalleryOpen);
  const galleryIndex = useExperienceStore((s) => s.galleryIndex);
  const valentinePhotos = useExperienceStore((s) => s.valentinePhotos);
  const setGalleryOpen = useExperienceStore((s) => s.setGalleryOpen);

  const [current, setCurrent] = useState(galleryIndex);
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const photos = valentinePhotos.length > 0 ? valentinePhotos : [];

  React.useEffect(() => {
    if (isOpen) setCurrent(galleryIndex);
  }, [isOpen, galleryIndex]);

  const close = useCallback(() => setGalleryOpen(false), [setGalleryOpen]);
  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, photos.length - 1)), [photos.length]);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);
  const toggleLike = (idx: number) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, next, prev, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-black/90" onClick={close} />

          <button
            onClick={close}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="relative z-10 w-full h-full flex items-center justify-center p-4 sm:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                className="relative max-w-full max-h-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <img
                  src={photos[current]}
                  alt={`Valentine Moment ${current + 1}`}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                  draggable={false}
                />

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg p-4 pt-12">
                  <p className="text-white/90 text-center text-sm sm:text-base" style={{ fontFamily: "'Dancing Script', cursive" }}>
                    Valentine Moment {current + 1}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {current > 0 && (
            <button
              onClick={prev}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
          )}
          {current < photos.length - 1 && (
            <button
              onClick={next}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
            >
              <ChevronRight size={28} />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
            <div className="flex gap-2">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${i === current ? 'bg-pink-400 w-6' : 'bg-white/30 hover:bg-white/50 w-2'
                    }`}
                />
              ))}
            </div>

            <button
              onClick={() => toggleLike(current)}
              className={`p-2 rounded-full transition-all ${liked.has(current) ? 'bg-pink-500/20 text-pink-400' : 'bg-white/10 text-white/50 hover:text-white/80'
                }`}
            >
              <Heart size={18} fill={liked.has(current) ? 'currentColor' : 'none'} />
            </button>

            <a
              href={photos[current]}
              download
              className="p-2 rounded-full bg-white/10 text-white/50 hover:text-white/80 transition-colors"
            >
              <Download size={18} />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
