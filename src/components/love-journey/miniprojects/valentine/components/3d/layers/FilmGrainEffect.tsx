import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useExperienceStore } from '../../../store/useExperienceStore';

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float time;
uniform float intensity;
uniform vec2 resolution;

// Simple hash / noise
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
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

void main() {
  vec2 p = vUv * resolution.xy;
  float t = time * 0.8;
  float n = noise(p * 0.5 + vec2(t * 10.0, t * 7.0));
  float grain = (n - 0.5) * intensity;
  // subtle vignette to avoid edges
  float vign = smoothstep(0.0, 0.6, length(vUv - 0.5));
  float alpha = clamp(abs(grain) * (1.0 - vign * 0.6), 0.0, 1.0);
  gl_FragColor = vec4(vec3(grain * 0.75 + 0.5), alpha);
}
`;

export const FilmGrainEffect: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const active = useExperienceStore((s) => s.activeLayers.filmGrain);
  const intensity = useExperienceStore((s) => s.layerParams.filmGrainIntensity);
  const performanceLevel = useExperienceStore((s) => s.performanceLevel);
  const { size } = useThree();

  useFrame((state) => {
    if (materialRef.current && active && performanceLevel !== 'low') {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.intensity.value = intensity;
      materialRef.current.uniforms.resolution.value.set(size.width, size.height);
    }
  });

  if (!active) return null;
  if (performanceLevel === 'low') return null;

  return (
    <mesh renderOrder={9999} frustumCulled={false} position={[0, 0, -0.05]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={{ time: { value: 0 }, intensity: { value: intensity }, resolution: { value: new THREE.Vector2(size.width, size.height) } }}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.NormalBlending}
        opacity={0.8}
      />
    </mesh>
  );
};
