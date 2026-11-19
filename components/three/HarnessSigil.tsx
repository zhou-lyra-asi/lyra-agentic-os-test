"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import LabelSprite from "./LabelSprite";

/** Medallion dimensions, in scene units. */
const R = {
  halo: 0.46,
  coin: 0.3,
  coinDepth: 0.05,
  logo: 0.235,
};

/**
 * A 3D medallion carrying the harness's real logo.
 *
 * The logo texture is white-on-transparent, so `material.color` tints it —
 * one asset per harness, no per-brand colour PNGs. The coin is a real cylinder
 * that tilts, so its rim and the logo plane parallax against each other and the
 * badge reads as a solid object rather than a flat sticker.
 */
export default function HarnessSigil({
  id,
  color,
  accentSoft,
  name,
  index,
  total,
  radius = 2.15,
  size = 1,
  onHover,
}: {
  id: string;
  color: string;
  accentSoft: string;
  name: string;
  index: number;
  total: number;
  radius?: number;
  /** uniform scale of the medallion — smaller on narrow viewports */
  size?: number;
  onHover: (v: string | null) => void;
}) {
  const tex = useTexture(`/assets/logos/${id}.png`);
  const group = useRef<THREE.Group>(null);
  const coin = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const scaleTarget = useRef(new THREE.Vector3(1, 1, 1));

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();

    // Guardian formation rather than a carousel: two medallions flank her on
    // each side. A full orbit would drag a badge across her face — the bust is
    // transparent and never occludes — so the ring is implied by the orbit
    // arcs instead, while the badges hold a legible, symmetric station.
    const side = index % 2 === 0 ? -1 : 1; // -1 left, 1 right
    const tier = Math.floor(index / 2); // 0 upper, 1 lower
    const bob = Math.sin(t * 0.8 + index * 1.9) * 0.055;

    if (group.current) {
      group.current.position.set(
        side * radius,
        (tier === 0 ? 0.62 : -0.34) + bob,
        tier === 0 ? 0.55 : 0.25
      );
      const s = hovered ? 1.28 : 1;
      scaleTarget.current.set(s, s, s);
      group.current.scale.lerp(scaleTarget.current, 0.1);
    }

    if (coin.current) {
      const target = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(
          camera.position,
          coin.current.getWorldPosition(new THREE.Vector3()),
          new THREE.Vector3(0, 1, 0)
        )
      );
      coin.current.quaternion.slerp(target, 0.12);
      coin.current.rotateY(Math.sin(t * 0.5 + index) * 0.42);
      coin.current.rotateX(Math.sin(t * 0.42 + index * 2) * 0.16);
    }
  });

  return (
    <group ref={group}>
      {/* generous invisible hit area — easy to hover on desktop and touch */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(name);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
        }}
      >
        <circleGeometry args={[0.34, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={coin} scale={size}>
        {/* identity halo */}
        <mesh position={[0, 0, -0.06]}>
          <circleGeometry args={[R.halo, 40]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={hovered ? 0.24 : 0.11}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* the coin body */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[R.coin, R.coin, R.coinDepth, 56, 1, false]} />
          <meshBasicMaterial color="#0b0912" transparent opacity={0.94} />
        </mesh>

        {/* rim light, front and back */}
        <mesh position={[0, 0, R.coinDepth / 2 + 0.001]}>
          <ringGeometry args={[R.coin - 0.012, R.coin, 56]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -R.coinDepth / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
          <ringGeometry args={[R.coin - 0.016, R.coin, 56]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} toneMapped={false} />
        </mesh>

        {/* real logo */}
        <mesh position={[0, 0, R.coinDepth / 2 + 0.002]}>
          <planeGeometry args={[R.logo * 2, R.logo * 2]} />
          <meshBasicMaterial map={tex} color={accentSoft} transparent toneMapped={false} />
        </mesh>

        {/* bloom copy of the logo, additive, slightly behind and larger */}
        <mesh position={[0, 0, R.coinDepth / 2 - 0.004]} scale={1.12}>
          <planeGeometry args={[R.logo * 2, R.logo * 2]} />
          <meshBasicMaterial
            map={tex}
            color={color}
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group position={[0, -0.52 * size, 0]}>
        <LabelSprite text={name.toUpperCase()} color={hovered ? "#fff6e6" : "#cbb79a"} scale={hovered ? 1.15 : 0.9} />
      </group>
    </group>
  );
}
