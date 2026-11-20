export const uid = (prefix = 'id'): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const clamp = (n: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, n));
export const round = (n: number, d = 2): number => Number(n.toFixed(d));

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, Math.max(0, ms)));

/** FNV-1a — deterministik lintas platform, untuk seeded reasoning. */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

export function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length) % arr.length];
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function truncate(s: string, n = 140): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

/** Token kata bermakna dari prompt pengguna (ID + EN stopwords). */
const STOP = new Set([
  'dan', 'yang', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'aku', 'saya', 'ini', 'itu', 'atau',
  'tidak', 'ada', 'juga', 'serta', 'agar', 'bisa', 'akan', 'sudah', 'oleh', 'dalam', 'sebuah', 'buat',
  'bantu', 'ingin', 'punya', 'harus', 'saat', 'setelah', 'secara', 'the', 'a', 'an', 'and', 'or',
  'of', 'to', 'in', 'for', 'with', 'is', 'are', 'on', 'how', 'i', 'my', 'we', 'please', 'buatlah',
  'susun', 'rancang', 'bangun', 'bedah', 'tentang', 'beserta', 'lengkap', 'plus', 'tanpa',
]);

export function keywords(text: string, limit = 8): string[] {
  const raw = text.toLowerCase().match(/[\p{L}\p{N}_./-]{3,}/gu) ?? [];
  const counts = new Map<string, number>();
  for (const w of raw) {
    if (STOP.has(w) || /^\d+$/.test(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([w]) => w);
}

export interface Entities {
  urls: string[];
  ips: string[];
  paths: string[];
  identifiers: string[];
  numbers: string[];
  quoted: string[];
}

export function extractEntities(text: string): Entities {
  return {
    urls: [...new Set(text.match(/https?:\/\/[^\s),;"']+/g) ?? [])].slice(0, 4),
    ips: [...new Set(text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) ?? [])].slice(0, 4),
    paths: [...new Set(text.match(/(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+/g) ?? [])].slice(0, 4),
    identifiers: [...new Set(text.match(/\b[a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*\b|\b[A-Za-z_]+\(\)/g) ?? [])].slice(0, 5),
    numbers: [...new Set(text.match(/\b\d+(?:[.,]\d+)?%?\b/g) ?? [])].slice(0, 6),
    quoted: [...new Set([...text.matchAll(/["“']([^"”']{3,60})["”']/g)].map((m) => m[1]))].slice(0, 3),
  };
}
