# Desktop surface · Lyra Agentic OS

Ada **dua** makna "Desktop" di proyek ini, keduanya sudah tersedia:

## 1. Desktop shell di dalam website (tanpa instalasi)

Klik **DESKTOP** di top bar. Kamu mendapat:

- Window manager: drag title bar, z-index otomatis, minimize / maximize / close, resize native.
- Taskbar + launcher **LYRA** dengan 8 aplikasi.
- 8 permukaan: Nexus 3D, Council Stream, Terminal, Artefak/Brief, Agent Matrix, Dossier per harness, Arsip Lyra, Cyber Lab, Settings.
- Wallpaper dari referensi Lyra dengan treatment midnight-blue.

Ini bukan screenshot: semua jendela memanggil `LyraOS` yang sama. Jendela Nexus memuat `Scene3D` compact dengan kamera & densitas titik yang disesuaikan.

## 2. Native Electron wrapper (opsional)

```bash
npm install
npm run build
npm i -D electron     # sekali saja; unduh binary Electron dari rilis GitHub
npm run desktop
```

`desktop/main.cjs` akan:

1. Menjalankan `vite preview` di `127.0.0.1:4173` (agar `/models`, `/lyra`, dan font tetap pada origin yang benar).
2. Menunggu HTTP 200.
3. Membuka `BrowserWindow` 1500×960 dengan `contextIsolation`, `nodeIntegration: false`, `sandbox: true`.
4. Mematikan preview saat aplikasi ditutup.

> Kenapa tidak `loadFile('dist/index.html')`? Karena aset 3D di-fetch lewat URL absolut (`/models/...`). Preview server menjaga perilaku identik dengan web, termasuk `file://`-unsafe fetch.

## 3. CLI asli

`npm run lyra -- <perintah>` adalah surface ketiga. Lihat [`docs/CLI.md`](../docs/CLI.md).

## Catatan surface 4 harness

Keempat harness (Claude Code, Antigravity, Hermes, Codex) juga punya aplikasi Desktop & CLI masing-masing. Lyra tidak menggantikan keduanya — Lyra **mengorkestrasi** keduanya lewat `src/core/adapters.ts`. Detail per harness ada di jendela **Agent Matrix → Dossier** atau `npm run lyra -- harness codex`.
