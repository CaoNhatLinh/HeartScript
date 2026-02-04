import React from 'react';
import { Stars } from '@react-three/drei';


export const Starfield: React.FC<{ count?: number; radius?: number }> = ({ count = 1000, radius = 80 }) => {

    return (
        <Stars radius={radius} depth={50} count={count} factor={4} saturation={0} fade speed={0.2} />
    );
};
