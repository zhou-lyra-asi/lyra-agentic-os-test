/**
 * Offline proof-render of the hero composition.
 *
 * There is no browser or WebGL in this environment, so this script reproduces
 * the *geometry* of components/three/LyraScene.tsx — same camera, same fov, same
 * orbit radii, same medallion sizes — and projects it to an SVG, then PNG.
 *
 * It is a composition check, not a pixel-accurate replica: bloom, pointer
 * parallax and shader effects are absent. It answers one question only:
 * "does everything fit, and is it in the right place?"
 *
 *   node scripts/render-hero.mjs            # uses the medallion mockups
 */
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";

const CAM = { z: 9.6, fov: 40, y: 0.06 };
const BUST = { w: 3.55 * (900 / 1120), h: 3.55, x: 0.62, y: -0.37 };

const HARNESS = [
  { id: "claude", color: "#d9855f", soft: "#f0c4a8", label: "CLAUDE CODE" },
  { id: "antigravity", color: "#7fa8ec", soft: "#c2d8ff", label: "ANTIGRAVITY" },
  { id: "hermes", color: "#6fd3ad", soft: "#b7f1dc", label: "HERMES" },
  { id: "codex", color: "#b8adf5", soft: "#ded8ff", label: "CODEX" },
];

const VIEWPORTS = [
  { name: "desktop", w: 1440, h: 935, radius: 2.15, size: 1 },
  { name: "tablet", w: 1000, h: 940, radius: 1.95, size: 0.86 },
  { name: "phone", w: 420, h: 900, radius: 1.05, size: 0.62 },
];

const f = (v) => Number(v.toFixed(2));

/** world -> normalised device, then to pixels */
function projector(W, H) {
  const halfH = CAM.z * Math.tan((CAM.fov * Math.PI) / 360);
  const halfW = halfH * (W / H);
  return (x, y, z = 0) => {
    // simple perspective divide against the camera plane
    const k = CAM.z / (CAM.z - z);
    return [W / 2 + (x * k * W) / (2 * halfW), H / 2 - ((y - CAM.y) * k * H) / (2 * halfH)];
  };
}

const logos = Object.fromEntries(
  HARNESS.map((h) => {
    const buf = fs.readFileSync(`public/assets/logos/${h.id}.png`);
    return [h.id, `data:image/png;base64,${buf.toString("base64")}`];
  })
);

function scene(viewport) {
  const { w: W, h: H, radius, size = 1 } = viewport;
  const P = projector(W, H);
  const parts = [];

  // sun disc behind her
  const [sx, sy] = P(0.62, 0.8, -2.65);
  const sr = ((2.0 * CAM.z) / (CAM.z + 2.65) / (2 * CAM.z * Math.tan((CAM.fov * Math.PI) / 360))) * H;
  parts.push(`<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(sr)}" fill="#c98a45" opacity="0.13"/>`);

  // the bust
  const [bx, by] = P(BUST.x, BUST.y);
  const scale = H / (2 * CAM.z * Math.tan((CAM.fov * Math.PI) / 360));
  const bw = BUST.w * scale;
  const bh = BUST.h * scale;
  const bust = fs.readFileSync("/tmp/lyra-bust-proof.png");
  parts.push(
    `<image x="${f(bx - bw / 2)}" y="${f(by - bh / 2)}" width="${f(bw)}" height="${f(bh)}" preserveAspectRatio="none" href="data:image/png;base64,${bust.toString("base64")}" opacity="0.95"/>`
  );

  // orbit paths
  for (const [r, tilt, op, col] of [
    [1.62, 0.95, 0.3, "#d6b079"],
    [2.02, 1.2, 0.16, "#8fe3d8"],
    [2.3, 0.85, 0.12, "#e08a52"],
  ]) {
    const pts = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * Math.cos(tilt * 0.72);
      const z = Math.sin(a) * r * Math.sin(tilt * 0.72) * 0.5;
      pts.push(P(x, y + 0.15, z).map(f).join(","));
    }
    parts.push(`<polygon points="${pts.join(" ")}" fill="none" stroke="${col}" stroke-width="1" opacity="${op}"/>`);
  }

  // the four medallions
  HARNESS.forEach((hh, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const tier = Math.floor(i / 2);
    const x = side * radius;
    const y = tier === 0 ? 0.62 : -0.34;
    const z = tier === 0 ? 0.55 : 0.25;
    const [px, py] = P(x, y, z);
    const coinR = 0.3 * size * (CAM.z / (CAM.z - z)) * scale;
    const logoR = 0.235 * size * (CAM.z / (CAM.z - z)) * scale;

    parts.push(`<circle cx="${f(px)}" cy="${f(py)}" r="${f(coinR * 1.5)}" fill="${hh.color}" opacity="0.11"/>`);
    parts.push(
      `<circle cx="${f(px)}" cy="${f(py)}" r="${f(coinR)}" fill="#0b0912" stroke="${hh.color}" stroke-width="${f(Math.max(1.2, coinR * 0.05))}"/>`
    );
    parts.push(
      `<image x="${f(px - logoR)}" y="${f(py - logoR)}" width="${f(logoR * 2)}" height="${f(logoR * 2)}" href="${logos[hh.id]}"/>`
    );
    parts.push(
      `<text x="${f(px)}" y="${f(py + coinR + 24)}" font-size="${f(8 + 4 * size)}" text-anchor="middle" font-family="monospace" letter-spacing="2" fill="#cbb79a">${hh.label}</text>`
    );
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#060509"/>
    ${parts.join("\n")}
    <text x="24" y="${H - 18}" font-family="monospace" font-size="11" fill="#d6b079" opacity="0.8">PROOF RENDER · ${viewport.name} ${W}×${H} · orbit r=${radius}</text>
  </svg>`;
}

fs.mkdirSync("docs/proof", { recursive: true });
for (const vp of VIEWPORTS) {
  const svg = scene(vp);
  const png = new Resvg(svg, { fitTo: { mode: "width", value: vp.w } }).render().asPng();
  fs.writeFileSync(`docs/proof/${vp.name}.png`, png);
  console.log(`${vp.name.padEnd(8)} ${vp.w}×${vp.h} ->${vp.w}px`, png.length, "bytes");
}
