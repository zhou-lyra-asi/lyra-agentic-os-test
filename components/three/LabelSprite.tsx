"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Canvas-texture label — no external font fetch, so the scene renders
 * identically offline and in any environment.
 */
export default function LabelSprite({
  text,
  color = "#cbb79a",
  scale = 1,
}: {
  text: string;
  color?: string;
  scale?: number;
}) {
  const texture = useMemo(() => {
    const dpr = 3;
    const pad = 24;
    const fontPx = 34;
    const font = `500 ${fontPx}px "JetBrains Mono", ui-monospace, monospace`;

    const measure = document.createElement("canvas").getContext("2d")!;
    measure.font = font;
    const w = Math.ceil(measure.measureText(text).width) + pad * 2;
    const h = fontPx + pad * 2;

    const c = document.createElement("canvas");
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.letterSpacing = "3px";
    ctx.fillText(text, w / 2, h / 2);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    tex.userData.aspect = w / h;
    return tex;
  }, [text, color]);

  const aspect = (texture.userData.aspect as number) ?? 4;
  const height = 0.13 * scale;

  return (
    <sprite scale={[height * aspect, height, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} opacity={0.9} />
    </sprite>
  );
}
