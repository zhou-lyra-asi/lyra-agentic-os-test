#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lyra 3D Reconstruction Pipeline
==================================================================
Mengubah referensi 2D Lyra menjadi aset 3D nyata yang dipakai WebGL:

  public/models/lyra-pointcloud.bin   -> Float32 positions + Uint8 colors
  public/models/lyra-relief.json      -> depth grid untuk displacement mesh
  public/models/lyra-pointcloud.ply   -> model 3D yang bisa diunduh / dibuka
  public/models/lyra-meta.json        -> metadata rekonstruksi
  public/lyra/lyra-prime.jpg          -> tekstur relief (optimized)
  public/lyra/card-0X.jpg             -> kartu arsip (optimized)
  public/lyra/avatar-*.png            -> avatar wajah dengan alpha feather

Depth diperkirakan secara deterministik dari:
  • luminance (permukaan terang = lebih dekat)
  • edge energy (filigree/emas menonjol)
  • volumetrik elliptical prior (kepala + bahu membentuk volume)
  • shell belakang (memberi ketebalan saat model diputar)

Jalankan:  python3 scripts/build_lyra_model.py
Butuh:     pillow, numpy   (pip install pillow numpy)
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
LYRA = PUBLIC / "lyra"
MODELS = PUBLIC / "models"
MODELS.mkdir(parents=True, exist_ok=True)

RNG = np.random.default_rng(20261119)  # deterministik → build reproducible
SOURCES = [
    ("01-moonlit.png", "Moonlit Fantasy Romance Retreat", (0.16, 0.00, 0.60, 0.56)),
    ("02-sunset.png", "Sunset Fantasy Empress", (0.06, 0.00, 0.54, 0.60)),
    ("03-blindfold.png", "Golden Blindfold at Sunset", (0.46, 0.00, 0.98, 0.60)),
]
PRIME = LYRA / "lyra-prime.png"

N_POINTS = 26000
HALO_POINTS = 2200
GRID_W, GRID_H = 72, 96


def crop_fraction(img: Image.Image, box: tuple[float, float, float, float]) -> Image.Image:
    w, h = img.size
    return img.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))


def feathered_avatar(img: Image.Image, size: int = 512) -> Image.Image:
    """Crop wajah → potongan oval dengan alpha feather, untuk HUD/avatar."""
    img = img.convert("RGB")
    w, h = img.size
    side = int(min(w, h) * 0.86)
    # sedikit geser ke atas agar wajah berada di tengah oval
    left = max(0, (w - side) // 2)
    top = max(0, int(h * 0.06))
    top = min(top, max(0, h - side))
    img = img.crop((left, top, left + side, top + side)).resize((size, size), Image.Resampling.LANCZOS)
    arr = np.asarray(img).astype(np.float32)
    yy, xx = np.mgrid[0:size, 0:size]
    cx, cy = size / 2, size / 2
    r = np.sqrt(((xx - cx) / (size * 0.47)) ** 2 + ((yy - cy) / (size * 0.48)) ** 2)
    alpha = np.clip((1.06 - r) / 0.22, 0.0, 1.0) ** 1.4
    alpha = (alpha * 255).astype(np.uint8)
    out = np.dstack([arr.astype(np.uint8), alpha])
    return Image.fromarray(out, "RGBA")


def build_optimized() -> dict:
    info = {"cards": [], "prime": None}
    for i, (name, title, box) in enumerate(SOURCES, start=1):
        src = LYRA / name
        if not src.exists():
            continue
        img = Image.open(src).convert("RGB")
        card = img.copy()
        card.thumbnail((1500, 1100), Image.Resampling.LANCZOS)
        card_path = LYRA / f"card-{i:02d}.jpg"
        card.save(card_path, quality=86, optimize=True, progressive=True)
        info["cards"].append({"file": card_path.name, "title": title})
        face = crop_fraction(img, box)
        avatar_path = LYRA / f"avatar-{i:02d}.png"
        feathered_avatar(face).save(avatar_path, optimize=True)

    if PRIME.exists():
        prime = Image.open(PRIME).convert("RGB")
        prime.thumbnail((900, 1200), Image.Resampling.LANCZOS)
        prime_path = LYRA / "lyra-prime.jpg"
        prime.save(prime_path, quality=90, optimize=True, progressive=True)
        info["prime"] = prime_path.name
        pw, ph = prime.size
        face = prime.crop((int(pw * 0.16), int(ph * 0.06), int(pw * 0.84), int(ph * 0.74)))
        feathered_avatar(face).save(LYRA / "avatar-prime.png", optimize=True)
    return info


def estimate_fields(img: Image.Image, w: int, h: int) -> dict:
    """Hitung luminance, edge, dan volume prior pada grid sampel."""
    small = img.resize((w, h), Image.Resampling.LANCZOS)
    rgb = np.asarray(small).astype(np.float32) / 255.0
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    gray = Image.fromarray((np.clip(lum, 0, 1) * 255).astype(np.uint8))
    edges = np.asarray(gray.filter(ImageFilter.FIND_EDGES)).astype(np.float32) / 255.0
    edges = np.clip(edges * 2.4, 0, 1)

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    # volume prior: kepala (atas) + bahu/torso (bawah), berbentuk ellipsoid
    head = np.exp(-(((xx - w * 0.50) / (w * 0.235)) ** 2 + ((yy - h * 0.285) / (h * 0.255)) ** 2))
    torso = np.exp(-(((xx - w * 0.50) / (w * 0.410)) ** 2 + ((yy - h * 0.735) / (h * 0.330)) ** 2))
    volume = np.clip(head * 0.92 + torso * 0.58, 0, 1)

    # background gelap → tidak ikut membentuk volume
    fg = np.clip((lum - 0.075) / 0.14, 0, 1)
    volume = volume * (0.35 + 0.65 * fg)
    depth = 0.72 * volume + 0.42 * np.clip(lum, 0, 1) + 0.14 * edges
    depth = np.clip(depth, 0, 1)

    salience = 0.52 * np.clip(lum, 0, 1) ** 1.25 + 0.30 * edges + 0.18 * volume + 0.012
    salience = salience * (0.10 + 0.90 * fg)
    return {"rgb": rgb, "lum": lum, "edges": edges, "volume": volume, "depth": depth, "salience": salience, "fg": fg}


def tint(colors: np.ndarray, lum: np.ndarray) -> np.ndarray:
    """Dorong palet ke champagne-gold sambil mempertahankan warna asliLyra."""
    gold = np.array([0.94, 0.76, 0.44], dtype=np.float32)
    l = np.clip(lum, 0, 1)[:, None]
    mixed = colors * 0.68 + (gold * (0.55 + 0.75 * l)) * 0.32
    mixed = np.clip(mixed * 1.16, 0, 1)
    return (mixed * 255).astype(np.uint8)


def build_pointcloud(f: dict, w: int, h: int) -> tuple[np.ndarray, np.ndarray, int]:
    sal = f["salience"].ravel().astype(np.float64)
    cdf = np.cumsum(sal / sal.sum())
    picks = np.searchsorted(cdf, RNG.random(N_POINTS)).clip(0, w * h - 1)
    py, px = np.divmod(picks, w)

    u = (px.astype(np.float32) / w - 0.5)
    v = (py.astype(np.float32) / h - 0.5)
    x = u * 3.05
    y = -v * 4.05

    depth = f["depth"][py, px]
    edge = f["edges"][py, px]
    jitter = RNG.normal(0, 0.035, N_POINTS).astype(np.float32)
    z = (depth - 0.42) * 1.28 + edge * 0.12 + jitter

    # shell belakang: 18% titik diberi kedalaman negatif → model terasa volumetrik
    back = RNG.random(N_POINTS) < 0.18
    z[back] = -(f["volume"][py[back], px[back]] * 0.95) - 0.22 + RNG.normal(0, 0.05, back.sum())

    # jitter sub-pixel agar tidak terlihat seperti grid foto
    x += RNG.normal(0, 0.006, N_POINTS)
    y += RNG.normal(0, 0.008, N_POINTS)

    rgb = f["rgb"][py, px]
    lum = f["lum"][py, px]
    colors = tint(rgb, lum)

    # halo / mahkota bintang di sekeliling kepala
    t = RNG.uniform(0, 2 * math.pi, HALO_POINTS)
    rr = RNG.normal(1.045, 0.085, HALO_POINTS)
    hx = np.cos(t) * rr * 1.02
    hy = 0.88 + np.sin(t) * rr * 1.16
    hz = RNG.normal(0.05, 0.22, HALO_POINTS)
    hc = np.zeros((HALO_POINTS, 3), dtype=np.uint8)
    hc[:, 0] = RNG.integers(205, 255, HALO_POINTS)
    hc[:, 1] = RNG.integers(160, 220, HALO_POINTS)
    hc[:, 2] = RNG.integers(75, 150, HALO_POINTS)

    pos = np.vstack([
        np.dstack([x, y, z]).reshape(-1, 3),
        np.dstack([hx, hy, hz]).reshape(-1, 3),
    ]).astype(np.float32)
    col = np.vstack([colors, hc])
    return pos, col, N_POINTS + HALO_POINTS


def build_relief(f: dict) -> dict:
    """Depth grid halus untuk mesh displacement (bas-relief 3D)."""
    depth = np.asarray(
        Image.fromarray((f["depth"] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2))
    ).astype(np.float32) / 255.0
    img = Image.fromarray((depth * 255).astype(np.uint8)).resize((GRID_W, GRID_H), Image.Resampling.BILINEAR)
    grid = (np.asarray(img).astype(np.float32) / 255.0).round(4).ravel().tolist()
    return {"width": GRID_W, "height": GRID_H, "depth": grid, "scale": 0.62}


def write_ply(path: Path, pos: np.ndarray, col: np.ndarray) -> None:
    n = pos.shape[0]
    dtype = np.dtype([("x", "<f4"), ("y", "<f4"), ("z", "<f4"),
                      ("red", "u1"), ("green", "u1"), ("blue", "u1")])
    rec = np.empty(n, dtype=dtype)
    rec["x"], rec["y"], rec["z"] = pos[:, 0], pos[:, 1], pos[:, 2]
    rec["red"], rec["green"], rec["blue"] = col[:, 0], col[:, 1], col[:, 2]
    header = (
        "ply\nformat binary_little_endian 1.0\n"
        "comment Lyra Agentic OS - holographic 3D reconstruction\n"
        "comment source: 3 user references + Lyra Prime\n"
        f"element vertex {n}\n"
        "property float x\nproperty float y\nproperty float z\n"
        "property uchar red\nproperty uchar green\nproperty uchar blue\n"
        "end_header\n"
    ).encode("ascii")
    with path.open("wb") as fh:
        fh.write(header)
        fh.write(rec.tobytes())


def main() -> None:
    optimized = build_optimized()
    source = PRIME if PRIME.exists() else LYRA / SOURCES[0][0]
    if not source.exists():
        raise SystemExit("✗ Tidak ada referensi Lyra di public/lyra/ — jalankan dari root repo.")

    W, H = 288, 384
    img = Image.open(source).convert("RGB")
    fields = estimate_fields(img, W, H)
    pos, col, total = build_pointcloud(fields, W, H)

    # .bin = positions (float32) lalu colors (uint8), tanpa header
    with (MODELS / "lyra-pointcloud.bin").open("wb") as fh:
        fh.write(pos.astype("<f4").tobytes())
        fh.write(col.astype(np.uint8).tobytes())

    relief = build_relief(fields)
    (MODELS / "lyra-relief.json").write_text(json.dumps(relief, separators=(",", ":")))

    # Alpha mask: relief hanya menggambar figur Lyra, bukan persegi latar belakang.
    alpha = np.clip(fields["fg"], 0, 1)
    alpha_img = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.0))
    alpha_img.resize((720, 960), Image.Resampling.BILINEAR).save(LYRA / "lyra-relief-alpha.png", optimize=True)

    write_ply(MODELS / "lyra-pointcloud.ply", pos, col)

    meta = {
        "name": "Lyra · Holographic Reconstruction",
        "version": "1.0.0",
        "source": source.name,
        "references": [s[1] for s in SOURCES],
        "points": total,
        "surfacePoints": N_POINTS,
        "haloPoints": HALO_POINTS,
        "reliefGrid": [GRID_W, GRID_H],
        "bounds": {
            "x": [float(pos[:, 0].min()), float(pos[:, 0].max())],
            "y": [float(pos[:, 1].min()), float(pos[:, 1].max())],
            "z": [float(pos[:, 2].min()), float(pos[:, 2].max())],
        },
        "pipeline": "luminance + edge energy + elliptical volume prior + posterior shell",
        "texture": optimized.get("prime") or "lyra-prime.png",
        "cards": optimized["cards"],
        "download": "lyra-pointcloud.ply",
    }
    (MODELS / "lyra-meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False))

    print(f"✓ Lyra 3D rebuilt: {total:,} points · relief {GRID_W}x{GRID_H} · PLY {(MODELS / 'lyra-pointcloud.ply').stat().st_size / 1024:.0f} KB")
    print("  → public/models/lyra-pointcloud.bin / .ply / lyra-relief.json / lyra-meta.json")


if __name__ == "__main__":
    main()
