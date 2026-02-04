import React from 'react';
import { ContactShadows } from '@react-three/drei';
import { useExperienceStore } from '../../store/useExperienceStore';

export const SoftGroundShadow: React.FC<{ position?: [number, number, number] }> = ({ position = [0, -1.2, 0] }) => {
  const performanceLevel = useExperienceStore((s) => s.performanceLevel);
  const currentScene = useExperienceStore((s) => s.currentScene);

  // Only show on medium/high quality and when scene is beyond prelude
  if (performanceLevel === 'low' || currentScene === 'prelude') return null;

  return (
    <group position={position}>
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={20}
        blur={2.5}
        far={6}
        resolution={performanceLevel === 'high' ? 512 : 256}
        color="#1a0a2e"
        frames={performanceLevel === 'high' ? Infinity : 1}
      />
    </group>
  );
};