# Lyra · Rekonstruksi 3D dari 3 Referensi

Kamu meminta **"3D model yang sama dengan 3 gambar itu"**. Karena gambar sumber adalah ilustrasi 2D, pipeline ini membangun representasi 3D yang benar-benar diputar di WebGL, bukan sekadar foto tempel:

```
3 referensi pengguna
  01 Moonlit Fantasy Romance Retreat
  02 Sunset Fantasy Empress in Golden Reverie
  03 Golden Blindfold at Sunset
        │  (generate_image: fusi wajah, mahkota bunga, renda emas)
        ▼
  Lyra Prime  ·  potret 3D simetris, front-facing, latar midnight-blue
        │
        ├──▶ point-cloud 28.200 vertex (posisi xyz + warna RGB)
        ├──▶ bas-relief mesh (72×96 depth grid + texture + alpha mask)
        └──▶ avatar RGBA + kartu arsip teroptimasi
```

## Estimasi kedalaman (deterministik)

`scripts/build_lyra_model.py` memakai `pillow` + `numpy` dengan seed tetap (`20261119`):

1. **Luminance** — permukaan terang (wajah, filigree emas) dianggap lebih dekat.
2. **Edge energy** — `FIND_EDGES` membuat detail renda/mahkota menonjol.
3. **Elliptical volume prior** — ellipsoid kepala + ellipsoid bahu/torso, dikali mask foreground agar latar gelap tidak ikut membentuk volume.
4. **Posterior shell** — 18% titik diberi kedalaman negatif supaya model terasa berisi saat diorbit.
5. **Halo** — 2.200 titik cincin bintang di sekeliling kepala.

Warna didorong ke palet champagne-gold (`mix(0.68·asli, 0.32·emas)`), namun tetap mempertahankan karakter ivory/amber Lyra.

## Artefak

| File | Isi |
|---|---|
| `public/models/lyra-pointcloud.bin` | `Float32[3N]` posisi + `Uint8[3N]` warna (tanpa header, little-endian). |
| `public/models/lyra-relief.json` | Grid depth 72×96 + `scale` untuk displacement vertex. |
| `public/models/lyra-pointcloud.ply` | **Binary PLY** (`x,y,z` float32 + `red,green,blue` uint8) — bisa dibuka di Meshlab, Blender, CloudCompare. |
| `public/models/lyra-meta.json` | Metadata: sumber, jumlah titik, bounds, pipeline, daftar kartu. |
| `public/lyra/lyra-prime.jpg` | Tekstur relief. |
| `public/lyra/lyra-relief-alpha.png` | Mask alpha agar relief tidak menampilkan persegi latar. |
| `public/lyra/avatar-0X.png`, `avatar-prime.png` | Avatar oval ber-feather untuk HUD. |
| `public/lyra/card-0X.jpg` | 3 kartu arsip teroptimasi. |

## Render di browser

`src/components/Scene3D.tsx`:

- `useLyraModel()` fetch `.bin` + `lyra-relief.json`, lalu membuat `BufferGeometry`.
- `ShaderMaterial` khusus: twinkle, drift halus, `gl_PointSize` menyesuaikan jarak, additive blending. Kamera compact (jendela Desktop) memakai `uSize`/`uAlpha` lebih kecil agar tidak overexposed.
- `PlaneGeometry(3.05, 4.05, 71, 95)` di-displacement per vertex dari depth grid → **mesh 3D bas-relief**, dengan `map` potret + `alphaMap`.
- Sigil berputar, starfield, sparkles, 4 node harness, dan energy link dengan particle yang mengalir mengikuti `pulse` dari message bus.
- `OrbitControls`: drag untuk orbit, scroll untuk zoom, klik node → dossier.

## Rebuild

```bash
pip install pillow numpy      # atau python3 -m pip install --user pillow numpy
npm run model                 # = python3 scripts/build_lyra_model.py
```

Ganti gambar di `public/lyra/0X-*.png` atau `lyra-prime.png`, lalu jalankan ulang. Karena RNG berseed tetap, perubahan hasil hanya berasal dari perubahan gambar — build reproducible.

## Unduh model

Di jendela **Arsip Lyra** terdapat tombol *Unduh model 3D (.ply)*, atau langsung:

```
/models/lyra-pointcloud.ply
```

## Batasan jujur

Ini adalah **hologram volumetrik**: point-cloud + bas-relief yang punya kedalaman, parallax, dan rotasi nyata. Bukan karakter GLTF rigged dengan skeleton/ekspresi wajah. Untuk itu, langkah lanjutan yang natural adalah retopologi mesh + rigging dari depth map ini, atau memakai pipeline text-to-3D dengan Lyra Prime sebagai referensi konsistensi.
