import React, { useRef } from 'react';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useExperienceStore } from '../../store/useExperienceStore';

export const SceneEffects: React.FC = () => {
    const params = useExperienceStore(s => s.layerParams);
    const bgConfig = useExperienceStore(s => s.backgroundConfig);
    const lightRef = useRef<THREE.DirectionalLight>(null);

    // Tính toán màu nắng dựa trên warmth (0: trưa/trắng, 1: chiều tà/cam đỏ)
    const sunColor = new THREE.Color().setHSL(
        0.05 + (1 - params.warmth) * 0.1, // Hue: 0.05 (cam) -> 0.15 (vàng chanh)
        0.8,
        0.5 + (1 - params.warmth) * 0.4  // Lightness: Tối hơn khi warmth cao
    );

    // Tính vị trí mặt trời dựa trên sunsetAngle
    // Angle 0: Horizon, 90: Zenith
    const angleRad = (params.sunsetAngle * Math.PI) / 180;
    const sunY = Math.sin(angleRad) * 10;
    const sunZ = Math.cos(angleRad) * 10;

    return (
        <>
            {/* Dynamic HDR Environment */}
            <Environment
                preset="sunset"
                background={false}
                environmentIntensity={params.envIntensity}
            />

            {/* Supplemental Sun Light (Directional) */}
            <directionalLight
                ref={lightRef}
                position={[5, sunY, sunZ]} // Lệch sang phải 5 đơn vị
                intensity={params.sunsetIntensity * 2.5}
                color={sunColor}
                castShadow
                shadow-bias={-0.0005}
                shadow-mapSize={[1024, 1024]}
            />

            {/* Ambient fill for warmth */}
            <hemisphereLight
                args={['#ffd1dc', '#2d1b4e', params.ambientIntensity]}
            />

            {/* Fog để tạo depth cho sunset atmosphere */}
            <fog attach="fog" args={[bgConfig?.gradientMid || '#2d1b4e', 5, 25]} />
        </>
    );
};
