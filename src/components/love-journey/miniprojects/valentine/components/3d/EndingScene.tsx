import React from 'react';
import { FloatingHearts } from './assets/FloatingHearts';
import { Float } from '@react-three/drei';

export const EndingScene: React.FC = () => {
    return (
        <group>
            <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
                <FloatingHearts count={100} range={15} />
            </Float>
            <ambientLight intensity={0.2} />
        </group>
    );
};
