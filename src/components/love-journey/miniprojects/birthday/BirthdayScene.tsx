'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import {
    AdditiveBlending, DataTexture, Group, LinearFilter, MathUtils, Sprite, SRGBColorSpace, type Object3D, type PointLight,
} from 'three';
import type { BirthdaySceneId, BirthdayStory } from './birthday-story';

const cakeModel = '/birthday/models/cake-citrus.glb?v=heart';
type Memory = BirthdayStory['memories'][number];
const frameModels: Record<Memory['frame'], string> = {
    brass: '/birthday/models/frame.glb',
    ribbon: '/birthday/models/frame-ribbon.glb',
    oval: '/birthday/models/frame-oval.glb',
};

export function preloadBirthdayCake() {
    useGLTF.preload(cakeModel);
}

export function preloadBirthdayMemories(memories: BirthdayStory['memories']) {
    memories.forEach(({ frame, image }) => {
        useGLTF.preload(frameModels[frame]);
        useTexture.preload(image);
    });
}

type SceneProps = {
    scene: BirthdaySceneId;
    memory: Memory;
    wished: boolean;
    opened: boolean;
    reduced: boolean;
    turn: RefObject<number>;
    onReady: (ready: boolean) => void;
};

class SceneBoundary extends Component<{
    children: ReactNode;
    onFailure: () => void;
}, { failed: boolean }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch() {
        this.props.onFailure();
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}

function Photograph({ memory, anchor }: { memory: Memory; anchor: Object3D }) {
    const source = useTexture(memory.image);
    const texture = useMemo(() => {
        const copy = source.clone();
        const image = source.image as HTMLImageElement;
        const imageAspect = image.width / image.height;
        const frameAspect = 1.91 / 2.29;
        copy.repeat.set(Math.min(1, frameAspect / imageAspect), Math.min(1, imageAspect / frameAspect));
        copy.offset.set((1 - copy.repeat.x) * memory.focusX, (1 - copy.repeat.y) * 0.66);
        copy.colorSpace = SRGBColorSpace;
        copy.needsUpdate = true;
        return copy;
    }, [memory.focusX, source]);

    useEffect(() => () => texture.dispose(), [texture]);

    return (
        <mesh position={anchor.position} scale={[1.91, 2.29, 1]}>
            {memory.frame === 'oval' ? <circleGeometry args={[0.5, 64]} /> : <planeGeometry args={[1, 1]} />}
            <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
    );
}

function Candlelight({ wicks, wished, reduced }: { wicks: Object3D[]; wished: boolean; reduced: boolean }) {
    const flames = useRef<Group>(null);
    const smoke = useRef<Group>(null);
    const candleLight = useRef<PointLight>(null);
    const wasLit = useRef(!wished);
    const blowStarted = useRef<number | null>(null);
    const invalidate = useThree(state => state.invalidate);
    const glow = useMemo(() => {
        const size = 32;
        const pixels = new Uint8Array(size * size * 4);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const distance = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
                pixels.set([255, 255, 255, Math.round(255 * Math.max(0, 1 - distance) ** 3)], (y * size + x) * 4);
            }
        }
        const texture = new DataTexture(pixels, size, size);
        texture.magFilter = LinearFilter;
        texture.minFilter = LinearFilter;
        texture.colorSpace = SRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
    }, []);

    useEffect(() => () => glow.dispose(), [glow]);
    useEffect(() => invalidate(), [wished, reduced, invalidate]);

    useFrame(({ clock }, delta) => {
        const time = clock.elapsedTime;
        if (!reduced && wished && wasLit.current) blowStarted.current = time;
        if (!wished) blowStarted.current = null;
        wasLit.current = !wished;

        const elapsed = blowStarted.current === null ? Infinity : time - blowStarted.current;
        let lightStrength = 0;
        flames.current?.children.forEach((flame, index) => {
            const sinceGust = elapsed - index * 0.095;
            const fading = wished ? 1 - MathUtils.smoothstep(sinceGust, 0.12, 0.34) : 1;
            const gust = wished && !reduced ? Math.sin(Math.PI * MathUtils.smoothstep(sinceGust, 0, 0.35)) : 0;
            const flicker = reduced ? 1 : 1 + 0.075 * Math.sin(time * 9 + index * 2);
            const brightness = reduced && wished ? 0 : fading * flicker;
            flame.scale.set(
                brightness * (1 + gust * 0.45),
                brightness * (1 - gust * 0.23),
                brightness,
            );
            flame.rotation.z = reduced ? 0 : 0.08 * Math.sin(time * 6 + index) - gust * 0.94;
            lightStrength += brightness;

            smoke.current?.children[index].children.forEach((wisp, wispIndex) => {
                if (!(wisp instanceof Sprite)) return;
                const age = (sinceGust - 0.24 - wispIndex * 0.11) / 1.25;
                wisp.visible = !reduced && age > 0 && age < 1;
                if (!wisp.visible) return;
                const size = 0.18 + age * 0.46;
                wisp.position.set(age * 0.43 + Math.sin(age * 5 + index) * age * 0.06, age * 0.66, 0);
                wisp.scale.set(size, size * 1.4, 1);
                wisp.material.opacity = Math.sin(age * Math.PI) * 0.34;
            });
        });
        if (candleLight.current) {
            const intensity = 3.8 * lightStrength / Math.max(1, wicks.length);
            candleLight.current.intensity = reduced ? intensity : MathUtils.damp(candleLight.current.intensity, intensity, 9, delta);
        }
    });

    return (
        <>
            <pointLight ref={candleLight} position={[0, 2.1, 0.65]} color="#ffb977" distance={3.8} intensity={0} />
            <group ref={flames}>
                {wicks.map(wick => (
                    <group key={wick.name} position={wick.position}>
                        <sprite scale={[1.06, 1.06, 1]}>
                            <spriteMaterial map={glow} color="#ffa34d" transparent opacity={0.58}
                                blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
                        </sprite>
                        <mesh scale={[0.064, 0.137, 0.06]} rotation={[0, 0, -0.1]}>
                            <sphereGeometry args={[1, 16, 12]} />
                            <meshBasicMaterial color="#ffb45c" toneMapped={false} />
                        </mesh>
                        <mesh position={[0, -0.022, 0.042]} scale={[0.038, 0.091, 0.027]}>
                            <sphereGeometry args={[1, 12, 10]} />
                            <meshBasicMaterial color="#fff1bc" toneMapped={false} />
                        </mesh>
                    </group>
                ))}
            </group>
            <group ref={smoke}>
                {wicks.map(wick => (
                    <group key={wick.name} position={wick.position}>
                        {[0, 1, 2].map(wisp => (
                            <sprite key={wisp} visible={false}>
                                <spriteMaterial map={glow} color="#dfc3d2" transparent depthWrite={false} toneMapped={false} />
                            </sprite>
                        ))}
                    </group>
                ))}
            </group>
        </>
    );
}

function Keepsake({ scene, memory, wished, opened, reduced, turn, onReady }: SceneProps) {
    const asset = useGLTF(scene === 'cake' ? cakeModel : scene === 'frame' ? frameModels[memory.frame] : '/birthday/models/envelope.glb');
    const model = useMemo(() => asset.scene.clone(true), [asset.scene]);
    const rig = useRef<Group>(null);
    const invalidate = useThree(state => state.invalidate);
    const renderer = useThree(state => state.gl);
    const frame = model.getObjectByName('Photograph');
    const wicks = ['Wick1', 'Wick2', 'Wick3'].map(name => model.getObjectByName(name)).filter(wick => wick !== undefined);
    const initialAngle = scene === 'cake' ? -0.14 : scene === 'frame' && memory.frame === 'brass' ? 0.21 : -0.19;
    const initialTilt = scene === 'cake' ? 0 : scene === 'frame' ? (memory.frame === 'brass' ? -0.105 : 0.09) : -0.15;

    useEffect(() => {
        const surface = renderer.domElement;
        const handleLoss = (event: Event) => {
            event.preventDefault();
            onReady(false);
        };
        const handleRestore = () => {
            invalidate();
            onReady(true);
        };
        surface.addEventListener('webglcontextlost', handleLoss);
        surface.addEventListener('webglcontextrestored', handleRestore);
        onReady(!renderer.getContext().isContextLost());
        return () => {
            surface.removeEventListener('webglcontextlost', handleLoss);
            surface.removeEventListener('webglcontextrestored', handleRestore);
        };
    }, [renderer, invalidate, onReady]);

    useEffect(() => invalidate(), [opened, reduced, invalidate]);

    useFrame(({ clock }, delta) => {
        const time = clock.elapsedTime;
        if (rig.current) {
            const sway = reduced ? 0 : Math.sin(time * 0.67) * 0.09;
            const angle = initialAngle + (reduced ? 0 : turn.current + sway);
            rig.current.rotation.y = reduced ? angle : MathUtils.damp(rig.current.rotation.y, angle, 6, delta);
            rig.current.position.y = reduced ? 0 : Math.sin(time * 0.96) * 0.044;
        }
        if (scene === 'envelope' && rig.current) {
            const flap = rig.current.getObjectByName('EnvelopeFlap');
            const sheet = rig.current.getObjectByName('LetterSheet');
            if (!flap || !sheet) return;
            const angle = opened ? 2.5 : 0;
            const height = opened ? 1.67 : 0.91;
            flap.rotation.x = reduced ? angle : MathUtils.damp(flap.rotation.x, angle, 8, delta);
            sheet.position.y = reduced ? height : MathUtils.damp(sheet.position.y, height, 5, delta);
        }
    });

    return (
        <group ref={rig} rotation={[0, initialAngle, initialTilt]}>
            <primitive object={model} />
            {frame && <Photograph memory={memory} anchor={frame} />}
            {scene === 'cake' && <Candlelight wicks={wicks} wished={wished} reduced={reduced} />}
        </group>
    );
}

export default function BirthdayScene(props: SceneProps) {
    return (
        <SceneBoundary onFailure={() => props.onReady(false)}>
            <Canvas
                frameloop={props.reduced ? 'demand' : 'always'}
                camera={{ position: [0, 2.54, 7.45], fov: 34, near: 0.1, far: 30 }}
                gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
                dpr={[1, 1.6]}
                onCreated={({ camera }) => camera.lookAt(0, 0.88, 0)}
            >
                <hemisphereLight args={['#fff0df', '#83526d', 1.45]} />
                <directionalLight color="#ffe5c3" intensity={props.scene === 'cake' ? 1.55 : 2.15} position={[-3.5, 5, 4]} />
                <directionalLight color="#f5a0a7" intensity={1.3} position={[3.5, 2, -3]} />
                <directionalLight color="#f1d6ff" intensity={0.38} position={[3, 0.6, 4]} />
                <Suspense fallback={null}>
                    <Keepsake key={props.scene === 'frame' ? props.memory.image : props.scene} {...props} />
                </Suspense>
            </Canvas>
        </SceneBoundary>
    );
}
