import React from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useExperienceStore } from '../../store/useExperienceStore';

export const RenderLoopActivator: React.FC = () => {
  const isAnimating = useExperienceStore((s) => s.isAnimating);
  const performanceLevel = useExperienceStore((s) => s.performanceLevel);
  const { invalidate } = useThree();

  // When isAnimating is true we request continuous invalidation to keep animation smooth.
  useFrame(() => {
    if (isAnimating) {
      invalidate();
    }
  });

  // Safety: when on very low performance we avoid continuous invalidation
  if (performanceLevel === 'low') return null;
  return null;
};