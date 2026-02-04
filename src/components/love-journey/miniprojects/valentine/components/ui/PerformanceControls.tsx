import React from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';

export const PerformanceControls: React.FC = () => {
  const level = useExperienceStore(s => s.performanceLevel);
  const setLevel = useExperienceStore(s => s.setPerformanceLevel);
  const showFps = useExperienceStore(s => s.showFps);
  const setShowFps = useExperienceStore(s => s.setShowFps);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Quality:</span>
      <button className={`px-2 py-1 rounded ${level === 'low' ? 'bg-white/10' : 'bg-white/6'}`} onClick={() => setLevel('low')}>Low</button>
      <button className={`px-2 py-1 rounded ${level === 'medium' ? 'bg-white/10' : 'bg-white/6'}`} onClick={() => setLevel('medium')}>Medium</button>
      <button className={`px-2 py-1 rounded ${level === 'high' ? 'bg-white/10' : 'bg-white/6'}`} onClick={() => setLevel('high')}>High</button>

      <div className="w-[1px] h-4 bg-white/20 mx-1" />

      <button
        className={`px-2 py-1 rounded text-xs ${showFps ? 'bg-pink-500/20 text-pink-300' : 'bg-white/5 text-white/40'}`}
        onClick={() => setShowFps(!showFps)}
      >
        FPS
      </button>
    </div>
  );
};