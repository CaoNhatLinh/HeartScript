import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '../../../store/useExperienceStore';

const vertex = /* glsl */`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4( position, 1.0 );
    }
`;

const fragment = /* glsl */`
    varying vec2 vUv;
    uniform float time;
    uniform float intensity;
    uniform float opacity;
    uniform vec2 resolution;

    // simple hash
    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main(){
        // scale coordinates by resolution to get high-frequency grain
        vec2 p = vUv * resolution.xy * vec2(0.5, 0.5);
        float n = noise(p + time * 6.0);
        float grain = (n - 0.5);
        vec3 col = vec3(grain * intensity);
        // subtle desaturation at edges
        float vign = smoothstep(0.0, 0.6, length(vUv - 0.5));
        float alpha = opacity * (1.0 - vign * 0.5);
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
`;

export const FilmGrain: React.FC = () => {
    const active = useExperienceStore((s) => s.activeLayers.filmGrain);
    const intensity = useExperienceStore((s) => s.layerParams.filmGrainIntensity);
    const opacity = Math.min(1, intensity * 4);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const { size } = useThree();

    // guard resolution value fallback
    const resolution = new THREE.Vector2(size.width || 512, size.height || 512);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.time.value = state.clock.elapsedTime;
            materialRef.current.uniforms.intensity.value = intensity;
            materialRef.current.uniforms.opacity.value = opacity;
            materialRef.current.uniforms.resolution.value.set(size.width, size.height);
        }
    });

    if (!active) return null;

    return (
        <mesh renderOrder={9999} frustumCulled={false} position={[0, 0, -0.1]}>
            <planeGeometry args={[size.width / 100, size.height / 100]} />
            <shaderMaterial
                ref={materialRef}
                transparent
                uniforms={{ time: { value: 0 }, intensity: { value: intensity }, opacity: { value: opacity }, resolution: { value: resolution } }}
                vertexShader={vertex}
                fragmentShader={fragment}
                depthTest={false}
            />
        </mesh>
    );
};
