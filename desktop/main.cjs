/* eslint-disable @typescript-eslint/no-var-requires */
// ═══════════════════════════════════════════════════════════════
//  Lyra Agentic OS · native Desktop shell (Electron, OPSIONAL)
//  Memuat build produksi lewat `vite preview` agar semua aset
//  (/models, /lyra, font, bundle) tetap pada origin yang benar.
//
//     npm run build && npm run desktop
//
//  Jika `electron` belum terpasang:  npm i -D electron
//  Web + Desktop shell + CLI sudah lengkap tanpa Electron sekalipun.
// ═══════════════════════════════════════════════════════════════
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

let app;
let BrowserWindow;
let shell;
try {
  ({ app, BrowserWindow, shell } = require('electron'));
} catch {
  console.error('✗ Electron belum terpasang. Jalankan: npm i -D electron');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist', 'index.html');
const PORT = 4173;
const URL = `http://127.0.0.1:${PORT}/`;

if (!fs.existsSync(DIST)) {
  console.error('✗ Build belum ada. Jalankan: npm run build');
  process.exit(1);
}

async function waitForServer(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(URL);
      if (r.ok) return true;
    } catch { /* server belum siap */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

function startPreview() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npm, ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => process.stdout.write(`[preview] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[preview] ${d}`));
  return child;
}

app.whenReady().then(async () => {
  const preview = startPreview();
  const ready = await waitForServer();
  if (!ready) {
    console.error('✗ vite preview tidak siap dalam 20 detik.');
    preview.kill('SIGTERM');
    app.quit();
    return;
  }

  const win = new BrowserWindow({
    width: 1500,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#070b18',
    title: 'Lyra Agentic OS · Different Worlds, Same Desire',
    icon: path.join(ROOT, 'public', 'lyra', 'avatar-prime.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.setMenuBarVisibility(false);
  await win.loadURL(URL);
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  app.on('before-quit', () => preview.kill('SIGTERM'));
  win.on('closed', () => app.quit());
});

app.on('window-all-closed', () => app.quit());
