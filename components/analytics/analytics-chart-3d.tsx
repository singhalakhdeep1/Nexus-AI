"use client";

import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls, Text, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/**
 * NexusFlow — 3D Analytics Visualization
 *
 * React Three Fiber chart showing project velocity as a 3D line graph.
 * Data points float in 3D space; the chart auto-rotates for a "live" feel.
 *
 * Skill coverage: Three.js, React Three Fiber, @react-three/drei,
 *                 @react-three/postprocessing
 */

interface DataPoint {
    week: string;
    completed: number;
    added: number;
}

interface Props {
    data: DataPoint[];
}

function VelocityLine({ points, color }: { points: THREE.Vector3[]; color: string }) {
    const linePoints = useMemo(() => points, [points]);

    return (
        <Line
            points={linePoints}
            color={color}
            lineWidth={2.5}
            dashed={false}
        />
    );
}

function DataSphere({
    position,
    value,
    color,
}: {
    position: THREE.Vector3;
    value: number;
    color: string;
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y =
                position.y + Math.sin(state.clock.elapsedTime * 1.5 + position.x) * 0.05;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
            <Html distanceFactor={8} center>
                <div className="text-[9px] text-white font-mono bg-black/60 px-1 rounded select-none">
                    {value}
                </div>
            </Html>
        </mesh>
    );
}

function VelocityScene({ data }: Props) {
    const scaleX = 1.2;
    const scaleY = 0.04;

    const completedPoints = useMemo(
        () => data.map((d, i) => new THREE.Vector3(i * scaleX, d.completed * scaleY, 0)),
        [data]
    );

    const addedPoints = useMemo(
        () => data.map((d, i) => new THREE.Vector3(i * scaleX, d.added * scaleY, 0.5)),
        [data]
    );

    const groupRef = useRef<THREE.Group>(null);
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.003;
        }
    });

    const centerX = ((data.length - 1) * scaleX) / 2;

    return (
        <group ref={groupRef} position={[-centerX, -1, 0]}>
            {/* Completed tasks line */}
            <VelocityLine points={completedPoints} color="#6366f1" />

            {/* Added tasks line */}
            <VelocityLine points={addedPoints} color="#22c55e" />

            {/* Spheres at each data point */}
            {data.map((d, i) => (
                <>
                    <DataSphere
                        key={`c-${i}`}
                        position={completedPoints[i]}
                        value={d.completed}
                        color="#6366f1"
                    />
                    <DataSphere
                        key={`a-${i}`}
                        position={addedPoints[i]}
                        value={d.added}
                        color="#22c55e"
                    />
                </>
            ))}

            {/* Grid floor */}
            <gridHelper args={[(data.length - 1) * scaleX + 1, data.length - 1, "#334155", "#1e293b"]} position={[centerX, -0.1, 0.25]} />
        </group>
    );
}

export default function AnalyticsChart3D({ data }: Props) {
    if (!data?.length) return null;

    return (
        <div className="w-full h-64 rounded-xl overflow-hidden bg-slate-950" role="img" aria-label="3D project velocity chart">
            <Canvas camera={{ position: [0, 2, 6], fov: 50 }} dpr={[1, 2]}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <pointLight position={[-3, 3, 3]} color="#6366f1" intensity={0.8} />

                <VelocityScene data={data} />

                <EffectComposer>
                    <Bloom intensity={0.4} luminanceThreshold={0.5} luminanceSmoothing={0.8} />
                </EffectComposer>

                <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
            </Canvas>
        </div>
    );
}
