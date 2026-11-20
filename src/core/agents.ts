import type { HarnessId, HarnessProfile, PillarId } from './types';

export const PILLARS: Record<PillarId, { label: string; short: string; glyph: string; color: string; description: string }> = {
  everyday: {
    label: 'Everyday Help',
    short: 'Harian',
    glyph: '✦',
    color: '#f0c987',
    description: 'Perencanaan, keputusan sehari-hari, produktivitas, dan orkestrasi hidup.',
  },
  code: {
    label: 'Code Engineering',
    short: 'Kode',
    glyph: '⌘',
    color: '#8de9c0',
    description: 'Arsitektur, refactor, debugging, test strategy, dan eksekusi sandbox.',
  },
  analysis: {
    label: 'Deeper Analysis',
    short: 'Analisis',
    glyph: '◈',
    color: '#b69cff',
    description: 'Reasoning mendalam, hipotesis, trade-off, causal map, dan epistemik.',
  },
  cyber: {
    label: 'Cyber Defense',
    short: 'Cyber',
    glyph: '⛨',
    color: '#7bdff2',
    description: 'Threat modeling, triage, hardening, dan lab simulasi ber-approval.',
  },
};

export const AGENTS: HarnessProfile[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    vendor: 'Anthropic',
    codename: 'ARCHITECT',
    glyph: '✳',
    color: '#e8a87c',
    colorSoft: 'rgba(232,168,124,.18)',
    role: 'Arsitek & Penjaga Struktur',
    lens: 'struktur, keterbacaan, invariant, dan perubahan multi-file yang aman',
    tagline: 'Memikirkan bentuk sebelum menulis baris pertama.',
    model: 'claude-sonnet / opus (via Claude Code CLI)',
    strengths: ['Refactor multi-file', 'Invariant & contract', 'Test design', 'Code review'],
    surfaces: {
      cli: {
        binary: 'claude',
        command: 'claude -p "<prompt>" --output-format json',
        env: ['ANTHROPIC_API_KEY', 'LYRA_CLAUDE_BIN'],
        note: 'Non-interactive print mode; JSON terstruktur untuk blackboard.',
      },
      desktop: { app: 'Claude Code · Desktop / IDE', note: 'Workspace diff, permission gate, file edit.' },
    },
    capabilities: { everyday: 0.76, code: 0.97, analysis: 0.88, cyber: 0.79 },
    weight: 1.06,
    latencyHint: 240,
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    vendor: 'Google',
    codename: 'PATHFINDER',
    glyph: '◉',
    color: '#7bdff2',
    colorSoft: 'rgba(123,223,242,.18)',
    role: 'Penjelajah Konteks & Integrasi',
    lens: 'surface area, integrasi, dependensi eksternal, observability, dan UX',
    tagline: 'Melihat seluruh medan sebelum memilih jalur.',
    model: 'Gemini (via Antigravity agent workspace)',
    strengths: ['Workspace mapping', 'Browser/UX flow', 'Dependency graph', 'Telemetry'],
    surfaces: {
      cli: {
        binary: 'ag',
        command: 'ag run --task "<prompt>" --json',
        env: ['GOOGLE_API_KEY', 'LYRA_ANTIGRAVITY_BIN'],
        note: 'Agent workspace headless; mengembalikan rencana + artefak.',
      },
      desktop: { app: 'Antigravity Studio', note: 'Manager view, browser preview, artifact timeline.' },
    },
    capabilities: { everyday: 0.9, code: 0.82, analysis: 0.84, cyber: 0.86 },
    weight: 1.0,
    latencyHint: 200,
  },
  {
    id: 'hermes',
    name: 'Hermes',
    vendor: 'Nous Research',
    codename: 'ORACLE',
    glyph: '⌘',
    color: '#b69cff',
    colorSoft: 'rgba(182,156,255,.18)',
    role: 'Analis Epistemik & Peneliti Dalam',
    lens: 'asumsi tersembunyi, counterfactual, bias, dan kualitas bukti',
    tagline: 'Pertanyaan yang benar lebih berharga dari jawaban cepat.',
    model: 'Hermes / Nous reasoning models',
    strengths: ['Assumption audit', 'Causal reasoning', 'Counter-arguments', 'Long-context synthesis'],
    surfaces: {
      cli: {
        binary: 'hermes',
        command: 'hermes reason --depth deep --prompt "<prompt>"',
        env: ['NOUS_API_KEY', 'LYRA_HERMES_BIN'],
        note: 'Extended reasoning; cocok untuk debate & verifier round.',
      },
      desktop: { app: 'Hermes Console', note: 'Graph view, belief ledger, hypothesis board.' },
    },
    capabilities: { everyday: 0.72, code: 0.74, analysis: 0.98, cyber: 0.88 },
    weight: 1.04,
    latencyHint: 300,
  },
  {
    id: 'codex',
    name: 'Codex',
    vendor: 'OpenAI',
    codename: 'EXECUTOR',
    glyph: '⬡',
    color: '#8de9c0',
    colorSoft: 'rgba(141,233,192,.18)',
    role: 'Eksekutor & Verifikator Sandbox',
    lens: 'implementasi konkret, langkah dapat dijalankan, dan verifikasi terukur',
    tagline: 'Setiap rencana harus berujung pada sesuatu yang bisa diuji.',
    model: 'Codex (via `codex exec`)',
    strengths: ['Patch generation', 'Sandbox execution', 'Reproduction steps', 'Verification'],
    surfaces: {
      cli: {
        binary: 'codex',
        command: 'codex exec --full-auto "<prompt>"',
        env: ['OPENAI_API_KEY', 'LYRA_CODEX_BIN'],
        note: 'Headless exec di sandbox; patch & test result dikirim ke bus.',
      },
      desktop: { app: 'Codex Desktop', note: 'Task queue, diff review, approval gate.' },
    },
    capabilities: { everyday: 0.78, code: 0.96, analysis: 0.79, cyber: 0.83 },
    weight: 1.02,
    latencyHint: 220,
  },
];

export const AGENT_MAP: Record<HarnessId, HarnessProfile> = Object.fromEntries(
  AGENTS.map((a) => [a.id, a]),
) as Record<HarnessId, HarnessProfile>;

export const SPEAKER_COLOR: Record<string, string> = {
  lyra: '#e8c77b',
  user: '#f3ede0',
  system: '#8b93a8',
  policy: '#ff9e9e',
  ...Object.fromEntries(AGENTS.map((a) => [a.id, a.color])),
};

export function capabilityScore(agent: HarnessProfile, pillar: PillarId): number {
  return agent.capabilities[pillar] * agent.weight;
}
