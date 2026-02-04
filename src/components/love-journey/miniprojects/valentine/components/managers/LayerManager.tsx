import React from 'react';
import { Starfield } from '../3d/layers/Starfield';
import { MeteorShower } from '../3d/layers/MeteorShower';
import { RainParticles } from '../3d/layers/RainParticles';
import { useExperienceStore } from '../../store/useExperienceStore';

// LayerManager: renders global layers inside the Canvas
export const LayerManager: React.FC = React.memo(() => {
    const activeLayers = useExperienceStore((s) => s.activeLayers);

    return (
        <group>
            {activeLayers.starfield && <Starfield />}
            {/* LightPulse removed */}
            {activeLayers.meteor && <MeteorShower />}
            {activeLayers.rain && <RainParticles />}
        </group>
    );
});
