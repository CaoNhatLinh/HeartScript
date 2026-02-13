import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const heartShape = (() => {
    const shape = new THREE.Shape();
    const x = 0, y = 0;
    shape.moveTo(x, y + 0.15);
    shape.bezierCurveTo(x, y + 0.22, x - 0.06, y + 0.28, x - 0.15, y + 0.28);
    shape.bezierCurveTo(x - 0.28, y + 0.28, x - 0.28, y + 0.12, x - 0.28, y + 0.12);
    shape.bezierCurveTo(x - 0.28, y + 0.02, x - 0.18, y - 0.1, x, y - 0.22);
    shape.bezierCurveTo(x + 0.18, y - 0.1, x + 0.28, y + 0.02, x + 0.28, y + 0.12);
    shape.bezierCurveTo(x + 0.28, y + 0.12, x + 0.28, y + 0.28, x + 0.15, y + 0.28);
    shape.bezierCurveTo(x + 0.06, y + 0.28, x, y + 0.22, x, y + 0.15);
    return shape;
})();

const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.1,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.02,
    bevelThickness: 0.02,
};

interface BalloonData {
    position: [number, number, number];
    color: string;
    scale: number;
    phaseOffset: number;
}

const SingleBalloon: React.FC<{ data: BalloonData }> = ({ data }) => {
    const groupRef = useRef<THREE.Group>(null);
    const vel = useRef(new THREE.Vector3(0, 0, 0));

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;

        // 1. Mouse Repulsion
        // Convert normalized pointer [-1, 1] to world-ish space [~ -5, 5]
        // The balloons are around x:±0.3, y:1.0 in local space, but they are inside a group 
        // that's at [0, 4.5, 2.0] in VisualStoryScene.
        // So we need to be careful about coordinate systems.
        // Simplest: use state.raycaster to check distance in 3D

        const mousePoint = new THREE.Vector3().copy(state.raycaster.ray.origin);
        // Project mouse onto the plane of balloons (roughly z=2)
        const planeZ = 2.0;
        const distanceToPlane = (planeZ - mousePoint.z) / state.raycaster.ray.direction.z;
        const worldMouse = new THREE.Vector3().addVectors(
            mousePoint,
            state.raycaster.ray.direction.clone().multiplyScalar(distanceToPlane)
        );

        // Calculate world position of balloon
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);

        const dist = worldPos.distanceTo(worldMouse);
        if (dist < 1.0) {
            const force = (1.0 - dist) * 0.2;
            const dir = new THREE.Vector3().subVectors(worldPos, worldMouse).normalize();
            vel.current.add(dir.multiplyScalar(force * delta * 60));
        }

        // 2. Return to origin force
        const homeForce = new THREE.Vector3().subVectors(new THREE.Vector3(...data.position), groupRef.current.position).multiplyScalar(0.08);
        vel.current.add(homeForce);

        // 3. Friction/Damping - slightly higher to stop faster
        vel.current.multiplyScalar(0.88);

        // 4. Update Position
        groupRef.current.position.add(vel.current);

        // 5. Gentle sway (add to base position)
        const swayX = Math.sin(t * 0.8 + data.phaseOffset) * 0.002;
        const swayY = Math.sin(t * 0.5 + data.phaseOffset) * 0.002;
        groupRef.current.position.x += swayX;
        groupRef.current.position.y += swayY;

        groupRef.current.rotation.z = Math.sin(t * 0.6 + data.phaseOffset) * 0.08 + vel.current.x * 0.5;
        groupRef.current.rotation.x = vel.current.y * -0.5;
    });

    return (
        <group ref={groupRef} position={data.position} scale={data.scale}>
            {/* Heart balloon */}
            <mesh rotation={[0, 0, Math.PI]} castShadow>
                <extrudeGeometry args={[heartShape, extrudeSettings]} />
                <meshPhysicalMaterial
                    color={data.color}
                    roughness={0.3}
                    metalness={0.1}
                    clearcoat={0.8}
                    clearcoatRoughness={0.2}
                />
            </mesh>

            {/* String */}
            <mesh position={[0, -0.35, 0.05]}>
                <cylinderGeometry args={[0.003, 0.003, 0.7, 4]} />
                <meshBasicMaterial color="#aaa" />
            </mesh>
        </group>
    );
};

export const HeartBalloons: React.FC = () => {
    const balloons = useMemo<BalloonData[]>(() => [
        { position: [-0.3, 0.8, 0], color: '#E53935', scale: 1.0, phaseOffset: 0 },
        { position: [0.0, 1.0, -0.15], color: '#F48FB1', scale: 0.85, phaseOffset: 1.5 },
        { position: [0.25, 0.7, 0.1], color: '#FFD700', scale: 0.75, phaseOffset: 3.0 },
        { position: [-0.15, 1.2, 0.2], color: '#FF7043', scale: 0.65, phaseOffset: 4.5 },
    ], []);

    return (
        <group>
            {balloons.map((balloon, i) => (
                <SingleBalloon key={i} data={balloon} />
            ))}
        </group>
    );
};
