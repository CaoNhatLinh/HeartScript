import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';

/**
 * BackgroundGradient - Nền gradient động với nhiều style
 * Hỗ trợ: radial, linear, aurora
 */
export const BackgroundGradient: React.FC = () => {
    const bgConfig = useExperienceStore(s => s.backgroundConfig);

    // Tạo gradient texture
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        const { gradientStart, gradientMid, gradientEnd, style } = bgConfig;

        if (style === 'radial') {
            // Radial gradient từ giữa ra ngoài
            const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 362);
            gradient.addColorStop(0, gradientMid);
            gradient.addColorStop(0.5, gradientStart);
            gradient.addColorStop(1, gradientEnd);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 512, 512);
        } else if (style === 'linear') {
            // Linear gradient từ trên xuống dưới
            const gradient = ctx.createLinearGradient(0, 0, 0, 512);
            gradient.addColorStop(0, gradientStart);
            gradient.addColorStop(0.5, gradientMid);
            gradient.addColorStop(1, gradientEnd);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 512, 512);
        } else {
            // Aurora style - nhiều layers gradient
            // Base layer
            const baseGradient = ctx.createRadialGradient(256, 400, 0, 256, 256, 450);
            baseGradient.addColorStop(0, gradientMid);
            baseGradient.addColorStop(0.6, gradientStart);
            baseGradient.addColorStop(1, gradientEnd);
            ctx.fillStyle = baseGradient;
            ctx.fillRect(0, 0, 512, 512);

            // Aurora overlay - subtle waves
            ctx.globalCompositeOperation = 'overlay';

            // Wave 1
            const wave1 = ctx.createLinearGradient(0, 100, 512, 200);
            wave1.addColorStop(0, 'rgba(255,100,150,0.1)');
            wave1.addColorStop(0.5, 'rgba(100,50,200,0.15)');
            wave1.addColorStop(1, 'rgba(50,100,200,0.1)');
            ctx.fillStyle = wave1;
            ctx.fillRect(0, 0, 512, 512);

            // Wave 2
            const wave2 = ctx.createLinearGradient(512, 300, 0, 400);
            wave2.addColorStop(0, 'rgba(200,50,150,0.08)');
            wave2.addColorStop(0.5, 'rgba(150,100,200,0.12)');
            wave2.addColorStop(1, 'rgba(100,150,200,0.08)');
            ctx.fillStyle = wave2;
            ctx.fillRect(0, 0, 512, 512);

            ctx.globalCompositeOperation = 'source-over';
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }, [bgConfig]);

    if (!texture) {
        return (
            <mesh position={[0, 0, 0]} scale={[100, 100, 100]}>
                <boxGeometry />
                <meshBasicMaterial color="#1a0a2e" side={THREE.BackSide} />
            </mesh>
        );
    }

    return (
        <mesh position={[0, 0, 0]} scale={[100, 100, 100]}>
            <boxGeometry />
            <meshBasicMaterial map={texture} side={THREE.BackSide} />
        </mesh>
    );
};
