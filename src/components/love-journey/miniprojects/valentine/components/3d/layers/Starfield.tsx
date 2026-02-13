import React from 'react';
import { Stars } from '@react-three/drei';
import { useExperienceStore } from '../../../store/useExperienceStore';

export const Starfield: React.FC<{ count?: number; radius?: number }> = ({ count: propCount, radius: propRadius }) => {
    const starfieldCount = useExperienceStore(s => s.layerParams.starfieldCount);
    const starfieldRadius = useExperienceStore(s => s.layerParams.starfieldRadius);

    const count = propCount ?? starfieldCount ?? 1500;
    const radius = propRadius ?? starfieldRadius ?? 80;

    return (
        <Stars radius={radius} depth={50} count={count} factor={4} saturation={0} fade speed={0.2} />
    );
};
