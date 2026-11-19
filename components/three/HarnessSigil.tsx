"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { useFrame } from "@react-three/fiber";
import { LOGO_SVG } from "@/lib/logos";
import LabelSprite from "./LabelSprite";

/** Optical size of the extruded glyph, in scene units. This is the hero. */
const GLYPH_TARGET = 0.46;
/** Thin orbit accent that frames the glyph without turning it into a coin. */
const ARC_R = 0.36;

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
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
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
        Math.cos(a) * radius * 1.16,
        Math.sin(a * 0.9) * 0.4 + 0.5,
        Math.sin(a) * radius * 0.5
      );
      const s = hovered ? 1.3 : 1;
      scaleTarget.current.set(s, s, s);
      group.current.scale.lerp(scaleTarget.current, 0.1);
    }

    // The glyph presents its face to the viewer but keeps a slow independent
    // turn, so the extrusion catches light and reads as a solid object.
    if (face.current) {
      face.current.quaternion.copy(camera.quaternion);
      face.current.rotateZ(Math.sin(t * 0.4 + index * 1.7) * 0.05);
      face.current.rotateY(Math.sin(t * 0.55 + index) * 0.3);
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
        <circleGeometry args={[0.38, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={face}>
        {/* soft halo — identity colour, no hard edge */}
        <mesh>
          <circleGeometry args={[0.5, 48]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={hovered ? 0.22 : 0.1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* thin orbit arc framing the glyph (not a closed ring) */}
        <mesh position={[0, 0, -0.02]}>
          <torusGeometry args={[ARC_R, 0.0028, 3, 96, Math.PI * 1.55]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={hovered ? 0.95 : 0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, -0.02]} rotation={[0, 0, Math.PI * 1.1]}>
          <torusGeometry args={[ARC_R, 0.0022, 3, 64, Math.PI * 0.55]} />
          <meshBasicMaterial
            color={accentSoft}
            transparent
            opacity={hovered ? 0.7 : 0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* extruded glyph — bright face plus an additive bloom shell */}
        {geo && (
          <>
            <mesh geometry={geo}>
              <meshBasicMaterial color={accentSoft} toneMapped={false} />
            </mesh>
            <mesh geometry={geo} position={[0, 0, -0.03]} scale={1.14}>
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.75}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
                depthWrite={false}
              />
            </mesh>
          </>
        )}
      </group>

      <group position={[0, -0.45, 0]}>
        <LabelSprite text={name.toUpperCase()} color={hovered ? "#fff6e6" : "#cbb79a"} scale={hovered ? 1.25 : 1.05} />
      </group>
    </group>
  );
}
