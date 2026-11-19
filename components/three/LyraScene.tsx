"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import HarnessSigil from "./HarnessSigil";
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
/*  The Lyra bust, as a luminous holographic plane                     */
/* ------------------------------------------------------------------ */
function LyraBust({ pointer }: { pointer: React.RefObject<{ x: number; y: number }> }) {
  const tex = useTexture("/assets/lyra-bust.webp");
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock, pointer: p }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      const px = pointer.current?.x ?? 0;
      const py = pointer.current?.y ?? 0;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, px * 0.16, 0.05);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -py * 0.07, 0.05);
      group.current.position.y = Math.sin(t * 0.7) * 0.035 - 0.02;
    }
    if (mat.current) {
      mat.current.opacity = 0.94 + Math.sin(t * 2.1) * 0.02;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <planeGeometry args={[2.61, 3.25]} />
        <meshBasicMaterial
          ref={mat}
          map={tex}
          transparent
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* soft silhouette to seat the figure in the dark */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[2.82, 3.42]} />
        <meshBasicMaterial map={tex} transparent opacity={0.06} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Sun disc behind her                                                */
/* ------------------------------------------------------------------ */
function SunDisc() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      const s = 1 + Math.sin(t * 0.5) * 0.015;
      ref.current.scale.set(s, s, 1);
    }
  });
  return (
    <group position={[0, 0.62, -2.4]}>
      <mesh ref={ref}>
        <circleGeometry args={[2.05, 96]} />
        <meshBasicMaterial color="#c98a45" transparent opacity={0.16} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[2.35, 96]} />
        <meshBasicMaterial
          color="#e8a45c"
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
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
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, px * 0.42, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.1 - py * 0.24, 0.04);
    camera.lookAt(0, 0.12, 0);
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
  return (
    <>
      <color attach="background" args={["#060509"]} />
      <fog attach="fog" args={["#060509", 7, 16]} />
      <ambientLight intensity={0.6} />
      <Rig pointer={pointer} />
      <SunDisc />
      <Suspense fallback={null}>
        <Float speed={1.1} rotationIntensity={0.06} floatIntensity={0.28}>
          <LyraBust pointer={pointer} />
        </Float>
      </Suspense>
      <HaloDust />
      <OrbitRing radius={2.1} tilt={[Math.PI / 2.35, 0, 0]} speed={0.16} color="#d6b079" />
      <OrbitRing radius={2.62} tilt={[Math.PI / 1.9, 0.5, 0.3]} speed={-0.1} color="#8fe3d8" opacity={0.14} />
      <OrbitRing radius={3.15} tilt={[Math.PI / 2.6, -0.3, 0]} speed={0.07} color="#e08a52" opacity={0.1} />
      {HARNESSES.map((h, i) => (
        <HarnessSigil
          key={h.id}
          id={h.id}
          index={i}
          total={HARNESSES.length}
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
        camera={{ position: [0, 0.1, 7.2], fov: 38 }}
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
