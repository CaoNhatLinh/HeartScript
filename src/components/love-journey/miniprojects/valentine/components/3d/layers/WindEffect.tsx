import React from 'react';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';

/**
 * WindEffect: Provides wind data for affected components
 * Currently affects Particles component by modifying their movement
 */

// Hook to get current wind vector - can be used by other components
export const useWind = () => {
    const { layerParams } = useExperienceStore();

    return React.useMemo(() => {
        const angleRad = (layerParams.windAngle * Math.PI) / 180;
        const speed = layerParams.windSpeed * layerParams.windIntensity;
        return new THREE.Vector3(
            Math.cos(angleRad) * speed,
            0,
            Math.sin(angleRad) * speed
        );
    }, [layerParams.windSpeed, layerParams.windAngle, layerParams.windIntensity]);
};

// Component that doesn't render anything - just provides wind context
export const WindEffect: React.FC = () => {
    // This component doesn't render anything visible
    // The actual wind application happens in the affected components
    return null;
};