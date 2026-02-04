import React from 'react';
import { Noise } from '@react-three/postprocessing';
import { useExperienceStore } from '../../../store/useExperienceStore';

const FilmGrainPass: React.FC = () => {
  const active = useExperienceStore((s) => s.activeLayers.filmGrain);
  const intensity = useExperienceStore((s) => s.layerParams.filmGrainIntensity);
  const performanceLevel = useExperienceStore((s) => s.performanceLevel);

  // Scale intensity by performance tier (less on medium)
  const baseOpacity = performanceLevel === 'medium' ? intensity * 0.5 : intensity;

  // If inactive or low perf, set opacity to 0 instead of unmounting (checks/hooks might depend on it)
  const shouldRender = active && performanceLevel !== 'low';
  const effectiveOpacity = shouldRender ? baseOpacity * 0.15 : 0;

  return <Noise opacity={effectiveOpacity} />;
};

export default FilmGrainPass;