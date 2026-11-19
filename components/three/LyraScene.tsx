"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import HarnessSigil from "./HarnessSigil";
import LyraBust, { SunDisc } from "./LyraBust";
import { HARNESSES } from "@/lib/harnesses";

/* ------------------------------------------------------------------ */
/*  Gold particle halo — the "sight without eyes" field                */
/* ------------------------------------------------------------------ */
function HaloDust({ count = 900 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 1.9 + Math.random() * 3.4;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 5.2;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    return { positions, seeds };
  }, [count]);

  useFrame(({ clock }) => {
    const p = ref.current;
    if (!p) return;
    const t = clock.getElapsedTime();
    const arr = p.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t * 0.35 + seeds[i]) * 0.0016;
    }
    p.geometry.attributes.position.needsUpdate = true;
    p.rotation.y = t * 0.035;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#f2d8a6"
        transparent
        opacity={0.72}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/*  Orbiting rings                                                     */
/* ------------------------------------------------------------------ */
function OrbitRing({
  radius,
  tilt,
  speed,
  color,
  opacity = 0.22,
}: {
  radius: number;
  tilt: [number, number, number];
  speed: number;
  color: string;
  opacity?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.getElapsedTime() * speed;
  });
  return (
    <group rotation={tilt}>
      <group ref={ref}>
        <mesh>
          <torusGeometry args={[radius, 0.0032, 3, 220]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[radius, 0, 0]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Pointer parallax rig                                               */
/* ------------------------------------------------------------------ */
function Rig({ pointer }: { pointer: React.RefObject<{ x: number; y: number }> }) {
  const { camera } = useThree();
  useFrame(() => {
    const px = pointer.current?.x ?? 0;
    const py = pointer.current?.y ?? 0;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, px * 0.3, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.06 - py * 0.18, 0.04);
    camera.lookAt(0, 0.1, 0);
  });
  return null;
}

function SceneContent({
  pointer,
  onHover,
}: {
  pointer: React.RefObject<{ x: number; y: number }>;
  onHover: (v: string | null) => void;
}) {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const aspect = width / Math.max(1, height);
  // Keep every sigil inside the frustum: on portrait screens the visible
  // half-width is far narrower, so the orbit contracts with it.
  const sigilRadius = aspect > 1.25 ? 1.95 : aspect > 0.9 ? 1.7 : 1.35;

  return (
    <>
      <color attach="background" args={["#060509"]} />
      <fog attach="fog" args={["#060509", 7, 16]} />
      <ambientLight intensity={0.6} />
      <Rig pointer={pointer} />
      <SunDisc />
      <Suspense fallback={null}>
        <Float speed={1.1} rotationIntensity={0.06} floatIntensity={0.28}>
          <LyraBust pointer={pointer} position={[0.34, -0.22, 0]} />
        </Float>
      </Suspense>
      <HaloDust />
      <OrbitRing radius={1.62} tilt={[Math.PI / 2.4, 0, 0]} speed={0.16} color="#d6b079" />
      <OrbitRing radius={2.02} tilt={[Math.PI / 1.95, 0.5, 0.3]} speed={-0.1} color="#8fe3d8" opacity={0.14} />
      <OrbitRing radius={2.3} tilt={[Math.PI / 2.7, -0.3, 0]} speed={0.07} color="#e08a52" opacity={0.1} />
      {HARNESSES.map((h, i) => (
        <HarnessSigil
          key={h.id}
          id={h.id}
          index={i}
          total={HARNESSES.length}
          radius={sigilRadius}
          color={h.accent}
          accentSoft={h.accentSoft}
          name={h.name}
          onHover={onHover}
        />
      ))}
      <EffectComposer>
        <Bloom intensity={0.95} luminanceThreshold={0.22} luminanceSmoothing={0.5} mipmapBlur />
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.055} />
        <Vignette eskil={false} offset={0.24} darkness={0.82} />
      </EffectComposer>
    </>
  );
}

export default function LyraScene() {
  const pointer = useRef({ x: 0, y: 0 });
  const [hoverName, setHoverName] = useState<string | null>(null);

  return (
    <div
      className="absolute inset-0"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        pointer.current = {
          x: ((e.clientX - r.left) / r.width) * 2 - 1,
          y: ((e.clientY - r.top) / r.height) * 2 - 1,
        };
      }}
    >
      <Canvas
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.1, 9.6], fov: 40 }}
      >
        <SceneContent pointer={pointer} onHover={setHoverName} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <div
          className="font-mono text-[10px] tracking-[0.34em] text-gold/60 transition-opacity duration-500"
          style={{ opacity: hoverName ? 1 : 0.45 }}
        >
          {hoverName ? `◆ ${hoverName.toUpperCase()}` : "LYRA · AUREA CORE"}
        </div>
      </div>
    </div>
  );
}
