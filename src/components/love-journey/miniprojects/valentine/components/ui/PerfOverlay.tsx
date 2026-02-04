import React, { useEffect, useState } from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';

const PerfOverlay: React.FC = () => {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let last = performance.now();
    let frames = 0;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(() => {
        const now = performance.now();
        frames++;
        if (now - last >= 1000) {
          setFps(Math.round((frames * 1000) / (now - last)));
          frames = 0;
          last = now;
        }
        loop();
      });
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Helper: log a 5s sample average to console for quick before/after checks
  const logSample = (seconds = 5) => {
    let frames = 0;
    const start = performance.now();
    const stopAt = start + seconds * 1000;
    const sample = () => {
      requestAnimationFrame(() => {
        frames++;
        const now = performance.now();
        if (now < stopAt) return sample();
        const avg = Math.round((frames * 1000) / (now - start));
        console.info(`Perf sample (${seconds}s): avg FPS = ${avg}`);
      });
    };
    sample();
  };

  const showFps = useExperienceStore(s => s.showFps);

  if (!showFps) return null;

  return (
    <div style={{ position: 'fixed', right: 10, bottom: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white', fontSize: 12, borderRadius: 6, zIndex: 9999, border: '1px solid rgba(255,255,255,0.1)' }}>
      <div>FPS: {fps}</div>
      <div style={{ marginTop: 6 }}>
        <button onClick={() => logSample(5)} style={{ fontSize: 11, padding: '4px 6px', borderRadius: 4 }}>Log 5s Sample</button>
      </div>
    </div>
  );
};

export default PerfOverlay;