"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { useFrame } from "@react-three/fiber";
import { LOGO_SVG } from "@/lib/logos";
import LabelSprite from "./LabelSprite";

/** Optical size of the extruded glyph, in scene units. */
const GLYPH_TARGET = 0.23;
/** Medallion proportions, in scene units. */
const R = {
  halo: 0.245,
  face: 0.172,
  innerRing: 0.15,
  outerRing: 0.176,
};

/**
 * Builds extruded geometry from a 24×24 SVG glyph, normalised so every harness
 * reads at the same optical size regardless of how much of its box it fills.
 */
function useGlyphGeometry(id: string) {
  return useMemo(() => {
    const raw = LOGO_SVG[id] ?? "";
    if (!raw) return null;

    const svg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${raw}</svg>`;
    const parsed = new SVGLoader().parse(svg);

    const shapes: THREE.Shape[] = [];
    for (const path of parsed.paths) {
      for (const shape of path.toShapes()) shapes.push(shape);
    }
    if (shapes.length === 0) return null;

    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 2,
      curveSegments: 9,
    });

    // SVG space is y-down and 24 units wide.
    geo.center();
    geo.scale(1, -1, 1);
    geo.computeBoundingBox();

    const bb = geo.boundingBox!;
    const w = bb.max.x - bb.min.x;
    const h = bb.max.y - bb.min.y;
    const k = GLYPH_TARGET / Math.max(w, h);
    geo.scale(k, k, 1);
    geo.center();
    geo.computeVertexNormals();

    return geo;
  }, [id]);
}

export default function HarnessSigil({
  id,
  color,
  accentSoft,
  name,
  index,
  total,
  radius = 2.55,
  onHover,
}: {
  id: string;
  color: string;
  accentSoft: string;
  name: string;
  index: number;
  total: number;
  radius?: number;
  onHover: (v: string | null) => void;
}) {
  const geo = useGlyphGeometry(id);
  const group = useRef<THREE.Group>(null);
  const face = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const scaleTarget = useRef(new THREE.Vector3(1, 1, 1));

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    const a = (index / total) * Math.PI * 2 + t * 0.11;

    if (group.current) {
      group.current.position.set(
        Math.cos(a) * radius * 1.18,
        Math.sin(a * 0.9) * 0.42 + 0.55,
        Math.sin(a) * radius * 0.55
      );
      const s = hovered ? 1.35 : 1;
      scaleTarget.current.set(s, s, s);
      group.current.scale.lerp(scaleTarget.current, 0.1);
    }

    // the medallion always presents its face, like a coin catching the light,
    // with a slow independent turn of the glyph for depth.
    if (face.current) {
      face.current.quaternion.copy(camera.quaternion);
      face.current.rotateZ(Math.sin(t * 0.45 + index * 1.7) * 0.06);
      face.current.rotateY(Math.sin(t * 0.6 + index) * 0.22);
    }
  });

  return (
    <group ref={group}>
      {/* generous invisible hit area — easier to hover on touch and desktop */}
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
        <circleGeometry args={[0.24, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={face}>
        {/* hover bloom */}
        <mesh>
          <circleGeometry args={[R.halo, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={hovered ? 0.3 : 0.13}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* dark medallion face */}
        <mesh position={[0, 0, -0.004]}>
          <circleGeometry args={[R.face, 56]} />
          <meshBasicMaterial color="#0a0810" transparent opacity={0.9} depthWrite={false} />
        </mesh>

        {/* rim + inner ring */}
        <mesh position={[0, 0, -0.003]}>
          <ringGeometry args={[R.outerRing - 0.004, R.outerRing, 56]} />
          <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -0.003]}>
          <ringGeometry args={[R.innerRing, R.innerRing + 0.0025, 56]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
        </mesh>

        {/* extruded logo */}
        {geo && (
          <>
            <mesh geometry={geo} position={[0, 0, 0.001]}>
              <meshBasicMaterial color={accentSoft} toneMapped={false} />
            </mesh>
            {/* soft backing plate so dark glyphs still read against the void */}
            <mesh geometry={geo} position={[0, 0, -0.006]} scale={1.09}>
              <meshBasicMaterial color={color} transparent opacity={0.42} toneMapped={false} depthWrite={false} />
            </mesh>
          </>
        )}
      </group>

      <group position={[0, -0.275, 0]}>
        <LabelSprite text={name.toUpperCase()} color={hovered ? "#fff6e6" : "#cbb79a"} scale={hovered ? 1.18 : 1} />
      </group>
    </group>
  );
}
