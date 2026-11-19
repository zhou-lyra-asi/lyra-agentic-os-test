"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

/** Native aspect of public/assets/lyra-bust.webp (900 × 1120). */
export const BUST_ASPECT = 900 / 1120; // 0.804
/** Display height in scene units — width follows from the true aspect. */
export const BUST_H = 3.55;
export const BUST_W = BUST_H * BUST_ASPECT;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * The source art has a near-black (but not pure black) background. Blending it
 * additively lifts that background into a visible rectangle, so instead we
 * multiply by an elliptical mask that feathers to zero at the plane edges.
 * The result is a bust that dissolves into the scene with no hard border.
 */
const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uFeather;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uMap, vUv);

    // elliptical feather so the plane edge is never visible
    vec2 p = (vUv - 0.5) * 2.0;
    float d = length(p * vec2(1.02, 0.92));
    float mask = 1.0 - smoothstep(uFeather, 1.06, d);

    // dissolve the base of the pedestal into the dark
    float bottom = smoothstep(0.0, 0.16, vUv.y);
    mask *= bottom;

    // very slow vertical scan shimmer — reads as a live hologram
    float scan = 0.965 + 0.035 * sin((vUv.y * 220.0) - uTime * 1.1);

    vec3 col = tex.rgb * mask * scan * uOpacity;
    gl_FragColor = vec4(col, mask * uOpacity);
  }
`;

export default function LyraBust({
  pointer,
  position = [0, 0, 0] as [number, number, number],
}: {
  pointer: React.RefObject<{ x: number; y: number }>;
  position?: [number, number, number];
}) {
  const tex = useTexture("/assets/lyra-bust.webp");
  const group = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uMap: { value: tex },
      uOpacity: { value: 0.94 },
      uFeather: { value: 0.52 },
      uTime: { value: 0 },
    }),
    [tex]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (matRef.current) matRef.current.uniforms.uTime.value = t;

    if (group.current) {
      const px = pointer.current?.x ?? 0;
      const py = pointer.current?.y ?? 0;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, px * 0.14, 0.045);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -py * 0.05, 0.045);
      group.current.position.y = position[1] + Math.sin(t * 0.7) * 0.03;
    }
  });

  return (
    <group ref={group} position={position}>
      <mesh>
        <planeGeometry args={[BUST_W, BUST_H]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={VERT}
          fragmentShader={FRAG}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Sun disc behind her                                                */
/* ------------------------------------------------------------------ */
export function SunDisc() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 0.5) * 0.014;
      ref.current.scale.set(s, s, 1);
    }
  });
  return (
    <group position={[0.62, 0.8, -2.65]}>
      <mesh ref={ref}>
        <circleGeometry args={[2.0, 96]} />
        <meshBasicMaterial color="#c98a45" transparent opacity={0.13} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[2.4, 96]} />
        <meshBasicMaterial color="#e8a45c" transparent opacity={0.055} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}
