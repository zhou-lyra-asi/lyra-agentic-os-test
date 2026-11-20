import { AGENTS } from './agents';
import type { HarnessId, Settings } from './types';

export interface AdapterStatus {
  id: HarnessId;
  name: string;
  binary: string;
  command: string;
  env: string[];
  envPresent: string[];
  available: boolean;
  reason: string;
  surfaceCli: string;
  surfaceDesktop: string;
}

export interface LiveResult {
  ok: boolean;
  output: string;
  error?: string;
  durationMs: number;
}

const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node);

function envOf(): Record<string, string | undefined> {
  return isNode ? (process.env as Record<string, string | undefined>) : {};
}

async function nodeChildProcess(): Promise<any | null> {
  if (!isNode) return null;
  // Dynamic + indirect import: aman untuk bundle browser (tidak pernah dipanggil di sana).
  const specifier = 'node:child_process';
  try {
    return await import(/* @vite-ignore */ specifier);
  } catch {
    return null;
  }
}

function argsFor(id: HarnessId, prompt: string): string[] {
  switch (id) {
    case 'claude-code': return ['-p', prompt, '--output-format', 'json'];
    case 'antigravity': return ['run', '--task', prompt, '--json'];
    case 'hermes': return ['reason', '--depth', 'deep', '--prompt', prompt];
    case 'codex': return ['exec', '--full-auto', prompt];
  }
}

function binaryFor(agent: (typeof AGENTS)[number]): string {
  const env = envOf();
  const key = `LYRA_${agent.id.toUpperCase().replace(/-/g, '_')}_BIN`;
  return env[key] || agent.surfaces.cli.binary;
}

export async function probe(id: HarnessId): Promise<AdapterStatus> {
  const agent = AGENTS.find((a) => a.id === id)!;
  const env = envOf();
  const envPresent = agent.surfaces.cli.env.filter((k) => Boolean(env[k]));
  const binary = binaryFor(agent);
  const base: AdapterStatus = {
    id,
    name: agent.name,
    binary,
    command: agent.surfaces.cli.command,
    env: agent.surfaces.cli.env,
    envPresent,
    available: false,
    reason: isNode ? 'Binary tidak ditemukan di PATH' : 'Browser: jalankan lewat `npm run lyra` (CLI)',
    surfaceCli: agent.surfaces.cli.command,
    surfaceDesktop: agent.surfaces.desktop.app,
  };
  if (!isNode) return base;
  const cp = await nodeChildProcess();
  if (!cp) return base;
  return await new Promise<AdapterStatus>((resolve) => {
    try {
      cp.execFile(binary, ['--version'], { timeout: 2500, env: { ...process.env } }, (err: any, stdout: any) => {
        resolve({
          ...base,
          available: !err,
          reason: err
            ? 'Binary belum terpasang / tidak merespons --version'
            : `Terdeteksi: ${String(stdout).trim().split('\n')[0].slice(0, 64)}`,
        });
      });
    } catch {
      resolve(base);
    }
  });
}

export async function probeAll(): Promise<AdapterStatus[]> {
  return Promise.all(AGENTS.map((a) => probe(a.id)));
}

export function resolveMode(settings: Settings, statuses: AdapterStatus[]): 'sim' | 'live' {
  if (settings.mode === 'sim') return 'sim';
  if (settings.mode === 'live') return 'live';
  return statuses.some((s) => s.available) ? 'live' : 'sim';
}

/** Menjalankan harness asli (hanya di Node, tanpa shell, prompt sebagai argumen aman). */
export async function invokeLive(id: HarnessId, prompt: string, timeoutMs = 45000): Promise<LiveResult> {
  const start = Date.now();
  if (!isNode) return { ok: false, output: '', error: 'Live adapter hanya tersedia di CLI Node.', durationMs: 0 };
  const cp = await nodeChildProcess();
  if (!cp) return { ok: false, output: '', error: 'child_process tidak tersedia.', durationMs: 0 };
  const agent = AGENTS.find((a) => a.id === id)!;
  const binary = binaryFor(agent);
  return await new Promise<LiveResult>((resolve) => {
    cp.execFile(
      binary,
      argsFor(id, prompt),
      { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024, env: { ...process.env } },
      (err: any, stdout: any, stderr: any) => {
        const out = String(stdout ?? '').trim();
        const errText = String(stderr ?? '').trim();
        resolve({
          ok: !err && Boolean(out),
          output: out || errText,
          error: err ? `${err.message?.slice(0, 160) ?? 'exec failed'}${errText ? ` · ${errText.slice(0, 120)}` : ''}` : undefined,
          durationMs: Date.now() - start,
        });
      },
    );
  });
}
