import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useTexture, Line, Html } from '@react-three/drei';
import { useExperienceStore } from '../../../store/useExperienceStore';

const PolaroidPhoto: React.FC<{
    url: string,
    index: number,
    total: number,
    isFocused: boolean,
    onFocus: () => void
}> = ({ url, index, total, isFocused, onFocus }) => {
    const texture = useTexture(url);
    const groupRef = useRef<THREE.Group>(null);
    const time = useRef(index * 100);

    // Grid config
    const cols = 5;
    const spacingX = 1.6;
    const spacingY = 1.9;

    // Stable "random" offsets based on the URL (which is unique and stable)
    const offsets = useMemo(() => {
        // Simple hash function to get a stable seed from URL
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            hash = (hash << 5) - hash + url.charCodeAt(i);
            hash |= 0;
        }
        const s1 = Math.sin(hash) * 10000;
        const seed = s1 - Math.floor(s1);

        const row = Math.floor(index / cols);
        const col = index % cols;
        const totalRows = Math.ceil(total / cols);

        const rowStartIndex = row * cols;
        const rowCount = Math.min(total - rowStartIndex, cols);
        const rowWidth = (rowCount - 1) * spacingX;

        return {
            x: (col * spacingX) - (rowWidth / 2) + (seed * 0.4 - 0.2),
            y: (totalRows - 1 - row) * spacingY - ((totalRows - 1) * spacingY / 2) + 1.2 + (seed * 0.3 - 0.15),
            z: (seed * 0.2 - 0.1),
            zRot: (seed * 0.4 - 0.2)
        };
    }, [url, index, total]);

    const targetPos = useRef(new THREE.Vector3(offsets.x, offsets.y, offsets.z));
    const targetRot = useRef(new THREE.Euler(0, 0, offsets.zRot));

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        time.current += delta;

        if (isFocused) {
            targetPos.current.set(0, 1.2, 2.5);
            targetRot.current.set(0, 0, 0);
        } else {
            const swayY = Math.cos(time.current * 0.5 + index) * 0.04;
            const swayRot = Math.sin(time.current * 0.3 + index) * 0.06;
            targetPos.current.set(offsets.x, offsets.y + swayY, offsets.z);
            targetRot.current.set(0, 0, offsets.zRot + swayRot);
        }

        groupRef.current.position.lerp(targetPos.current, 0.1);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRot.current.x, 0.1);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot.current.y, 0.1);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRot.current.z, 0.1);
    });

    return (
        <group
            ref={groupRef}
            onClick={(e) => {
                e.stopPropagation();
                onFocus();
            }}
        >
            {/* Clothespin */}
            <mesh position={[0, 0.7 - (index % 2 === 0 ? 0 : 0.05), 0]} visible={!isFocused}>
                <boxGeometry args={[0.04, 0.12, 0.04]} />
                <meshStandardMaterial color="#d4c5b0" roughness={0.5} />
            </mesh>

            <mesh castShadow receiveShadow>
                <planeGeometry args={[1.2, 1.4]} />
                <meshStandardMaterial color="#fff" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.1, 0.01]}>
                <planeGeometry args={[1.0, 1.0]} />
                <meshBasicMaterial map={texture} toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.5, 0.01]}>
                <planeGeometry args={[0.8, 0.1]} />
                <meshStandardMaterial color="#eee" transparent opacity={0.5} />
            </mesh>
            {!isFocused && (
                <Html position={[0, -0.8, 0]} center distanceFactor={10}>
                    <div className="text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity italic px-2 py-1 bg-black/40 rounded-full backdrop-blur-sm">
                        Chạm để xem
                    </div>
                </Html>
            )}
        </group>
    );
};

export const HangingPolaroids: React.FC<{ visible: boolean }> = ({ visible }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [rotation, setRotation] = useState(0);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const images = useExperienceStore(s => s.valentinePhotos);
    const isDragging = useRef(false);
    const lastMouseX = useRef(0);

    // Generate strings for each row
    const strings = useMemo(() => {
        const cols = 5;
        const totalRows = Math.ceil(images.length / cols);
        const rowData = [];
        const spacingX = 1.6;
        const spacingY = 1.9;

        for (let r = 0; r < totalRows; r++) {
            const rowStartIndex = r * cols;
            const rowCount = Math.min(images.length - rowStartIndex, cols);
            const width = (rowCount - 1) * spacingX + 0.5;

            const yOffset = (totalRows - 1 - r) * spacingY - ((totalRows - 1) * spacingY / 2) + 1.2;
            const pts = [];
            const resolution = 20;
            for (let i = 0; i <= resolution; i++) {
                const t = i / resolution;
                const x = (t * (width + 1)) - ((width + 1) / 2);
                const sag = Math.sin(t * Math.PI) * 0.15;
                pts.push(new THREE.Vector3(x, yOffset + 0.7 - sag, -0.05));
            }
            rowData.push(pts);
        }
        return rowData;
    }, [images.length]);

    useFrame((state) => {
        if (!groupRef.current) return;
        if (isDragging.current && focusedIndex === null) {
            const mouseX = state.mouse.x;
            const deltaX = (mouseX - lastMouseX.current) * 2;
            setRotation(prev => prev + deltaX);
            lastMouseX.current = mouseX;
        }
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotation, 0.1);
    });

    if (!visible) return null;

    return (
        <group
            ref={groupRef}
            position={[0, -0.2, -4]}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                if (focusedIndex !== null) return;
                e.stopPropagation();
                isDragging.current = true;
                lastMouseX.current = e.pointer.x;
            }}
            onPointerUp={() => isDragging.current = false}
            onPointerLeave={() => isDragging.current = false}
        >
            {/* The Strings */}
            {strings.map((pts, i) => (
                <Line
                    key={`string-${i}`}
                    points={pts}
                    color="#f0e6d2"
                    lineWidth={1}
                    transparent
                    opacity={0.4}
                />
            ))}

            {/* The Photos */}
            {images.map((url, i) => (
                <PolaroidPhoto
                    key={url}
                    url={url}
                    index={i}
                    total={images.length}
                    isFocused={focusedIndex === i}
                    onFocus={() => setFocusedIndex(focusedIndex === i ? null : i)}
                />
            ))}

            {/* Background Close Trigger - Placed at the end to avoid shifting indices */}
            {focusedIndex !== null && (
                <mesh
                    position={[0, 0, -5]}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        setFocusedIndex(null);
                    }}
                >
                    <planeGeometry args={[200, 200]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>
            )}
        </group>
    );
};
