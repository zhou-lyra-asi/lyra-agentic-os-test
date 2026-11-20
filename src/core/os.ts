import { AGENTS, AGENT_MAP, PILLARS } from './agents';
import { MISSIONS } from './missions';
import { probeAll, type AdapterStatus } from './adapters';
import { Blackboard } from './blackboard';
import { MessageBus } from './bus';
import { CyberPolicy, LAB_SCOPES } from './policy';
import { runMission, type RunHost } from './orchestrator';
import type { OSState, PillarId, RunOptions, RunResult, Settings } from './types';
import { formatTime, round, truncate, uid } from './util';

const STORAGE_KEY = 'lyra.os.settings.v1';

const DEFAULT_SETTINGS: Settings = {
  mode: 'auto',
  pace: 140,
  labEnabled: false,
  labApproved: false,
  labScope: 'lab.local',
  requireApproval: true,
  strictRedaction: true,
};

function loadSettings(): Settings {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch { /* ignore */ }
  const pace = typeof process !== 'undefined' && process.env?.LYRA_PACE ? Number(process.env.LYRA_PACE) : 140;
  const mode = (typeof process !== 'undefined' && process.env?.LYRA_MODE) as Settings['mode'] | undefined;
  return { ...DEFAULT_SETTINGS, pace: Number.isFinite(pace) ? pace : 140, mode: mode && ['sim', 'live', 'auto'].includes(mode) ? mode : 'auto' };
}

/**
 * LyraOS — kernel tunggal untuk Web, Desktop shell, dan CLI.
 * Framework-agnostic: React memakai useSyncExternalStore, CLI memakai API yang sama.
 */
export class LyraOS implements RunHost {
  readonly bus = new MessageBus();
  readonly board = new Blackboard();
  readonly policy: CyberPolicy;
  readonly startedAt = Date.now();
  readonly sessionId = uid('lyra-session');

  settings: Settings;
  adapters: AdapterStatus[] = [];

  private state: OSState;
  private listeners = new Set<() => void>();
  private pulseSeq = 0;
  private runningGuard = false;

  constructor() {
    this.settings = loadSettings();
    this.policy = new CyberPolicy(this.settings);
    this.state = {
      sessionId: this.sessionId,
      phase: 'idle',
      running: false,
      pillar: null,
      prompt: '',
      runId: null,
      messages: [],
      tasks: [],
      findings: [],
      critiques: [],
      artifacts: [],
      consensus: null,
      lastResult: null,
      pulses: [],
      policy: null,
      metrics: { runs: 0, messages: 0, avgConfidence: 0, uptime: 0 },
      settings: this.settings,
      startedAt: this.startedAt,
    };

    this.bus.subscribe((env) => {
      this.setState((prev) => ({
        messages: [...prev.messages, env].slice(-320),
        pulses: env.from === 'system' ? prev.pulses : [
          ...prev.pulses,
          { id: ++this.pulseSeq, from: env.from, to: env.to, channel: env.channel, ts: env.ts },
        ].slice(-28),
        metrics: { ...prev.metrics, messages: this.bus.history.length, uptime: Date.now() - this.startedAt },
      }));
    });

    void this.refreshAdapters();
  }

  // ── useSyncExternalStore contract ──────────────────────────────
  getSnapshot = (): OSState => this.state;
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private setState(patch: Partial<OSState> | ((prev: OSState) => Partial<OSState>)): void {
    const p = typeof patch === 'function' ? patch(this.state) : patch;
    const prev = this.state;
    const findings = p.findings ?? prev.findings;
    const metrics = {
      runs: prev.metrics.runs + (p.running === true && !prev.running ? 1 : 0),
      messages: this.bus.history.length,
      avgConfidence: p.findings
        ? round(findings.reduce((s, f) => s + f.confidence, 0) / Math.max(1, findings.length), 3)
        : prev.metrics.avgConfidence,
      uptime: Date.now() - this.startedAt,
    };
    this.state = { ...prev, ...p, metrics };
    for (const fn of this.listeners) fn();
  }

  emit(patch: Partial<OSState>): void {
    this.setState(patch);
  }

  // ── Adapters ───────────────────────────────────────────────────
  async refreshAdapters(): Promise<AdapterStatus[]> {
    this.adapters = await probeAll();
    return this.adapters;
  }

  updateSettings(patch: Partial<Settings>): Settings {
    this.settings = { ...this.settings, ...patch };
    this.policy.update(this.settings);
    this.setState({ settings: this.settings });
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch { /* ignore */ }
    return this.settings;
  }

  // ── Mission ────────────────────────────────────────────────────
  async run(prompt: string, options: RunOptions = {}): Promise<RunResult> {
    if (this.runningGuard) {
      return {
        ok: false, runId: this.state.runId ?? '-', pillar: options.pillar ?? 'analysis', prompt,
        brief: 'Sebuah misi masih berjalan. Tunggu sampai selesai atau kirim `abort`.', consensus: null,
        findings: [], tasks: [], durationMs: 0, blockedReason: 'Concurrent run rejected',
      };
    }
    if (!prompt.trim()) {
      return {
        ok: false, runId: '-', pillar: options.pillar ?? 'analysis', prompt, brief: 'Prompt kosong.',
        consensus: null, findings: [], tasks: [], durationMs: 0, blockedReason: 'Empty prompt',
      };
    }
    // Persetujuan eksplisit dari CLI/UI sekaligus mengaktifkan modul lab
    // untuk sesi ini (tanpa itu gate tetap mengunci walau --approve dipakai).
    if (options.labApproved) this.updateSettings({ labEnabled: true, labApproved: true });
    this.runningGuard = true;
    await this.refreshAdapters();
    try {
      const live = options.live ?? (this.settings.mode === 'live' || (this.settings.mode === 'auto' && this.adapters.some((a) => a.available)));
      return await runMission(this, prompt, { ...options, live });
    } finally {
      this.runningGuard = false;
    }
  }

  abort(): void {
    this.bus.publish({ from: 'user', to: 'lyra', channel: 'control', phase: this.state.phase, subject: 'Abort', body: 'Pengguna meminta penghentian.' });
  }

  // ── Export ─────────────────────────────────────────────────────
  exportTranscript(format: 'md' | 'json' = 'md'): string {
    const s = this.state;
    if (format === 'json') {
      return JSON.stringify({
        sessionId: s.sessionId, exportedAt: new Date().toISOString(), settings: s.settings,
        policy: s.policy, pillar: s.pillar, prompt: s.prompt, consensus: s.consensus,
        tasks: s.tasks, findings: s.findings, critiques: s.critiques,
        messages: this.bus.history, adapters: this.adapters,
      }, null, 2);
    }
    const lines = [
      `# Lyra Agentic OS · Session Transcript`, ``,
      `**Session** \`${s.sessionId}\` · **Export** ${new Date().toLocaleString('id-ID')} · **Runs** ${s.metrics.runs}`,
      ``, `---`, ``,
      ...this.bus.history.map((m) =>
        `\`${formatTime(m.ts)}\` **${m.from} → ${m.to}** \`[${m.channel}/${m.phase}]\` **${m.subject}**  \n${m.body}${m.confidence !== undefined ? `  \n_confidence ${(m.confidence * 100).toFixed(0)}%_` : ''}`,
      ),
    ];
    if (s.lastResult) lines.push(``, `---`, ``, s.lastResult.brief);
    return lines.join('\n');
  }

  exportArtifact(index: number): { name: string; content: string } | null {
    const a = this.state.artifacts[index];
    if (!a) return null;
    const ext = a.kind === 'trace' ? 'json' : 'md';
    return { name: `lyra-${a.kind}-${a.id}.${ext}`, content: a.content };
  }

  // ── Command interpreter (dipakai terminal GUI **dan** CLI asli) ──
  async command(line: string): Promise<string[]> {
    const raw = line.trim();
    if (!raw) return [];
    const tokens = raw.match(/"[^"]*"|'[^']*'|\S+/g)?.map((t) => t.replace(/^["']|["']$/g, '')) ?? [];
    const cmd = tokens[0]?.toLowerCase() ?? '';
    const rest = tokens.slice(1);
    const flag = (name: string): string | undefined => {
      const t = rest.find((x) => x.startsWith(`--${name}=`));
      return t ? t.slice(name.length + 3) : undefined;
    };
    const has = (name: string) => rest.some((x) => x === `--${name}`);

    switch (cmd) {
      case 'help':
        return [
          'LYRA AGENTIC OS · command surface',
          '──────────────────────────────────────────────────────────',
          '  run <prompt>            jalankan misi ke 4 harness (--pillar= --live --fast --approve --scope=)',
          '  mission <id>            jalankan preset; lihat `missions`',
          '  agents                  matriks kapabilitas 4 harness',
          '  harness <id>            detail surface CLI + Desktop satu harness',
          '  pillars                 4 pilar domain',
          '  missions [pillar]       daftar preset misi',
          '  adapters                status binary/env adapter nyata',
          '  policy <prompt>         uji Cyber Policy Guard tanpa menjalankan misi',
          '  status                  fase, metrik, dan konsensus terakhir',
          '  brief                   ringkasan Council Brief terakhir',
          '  export [md|json]        transkrip sesi',
          '  settings                konfigurasi aktif',
          '  set <key> <value>       mode|pace|lab|scope|redaction',
          '  lab approve             setujui simulasi pada scope aktif',
          '  doctor                  pemeriksaan lingkungan',
          '  clear                   bersihkan layar terminal',
          '  model                   info rekonstruksi 3D Lyra',
          '──────────────────────────────────────────────────────────',
          'Tips: ketik `mission code-auth` atau `run "audit modul auth" --pillar=code`.',
        ];

      case 'agents': {
        const out: string[] = [];
        out.push('HARNESS                VENDOR          CODE  ANALY  CYBER  DAY   SURFACES');
        for (const a of AGENTS) {
          const c = a.capabilities;
          out.push(
            `${a.name.padEnd(22)} ${a.vendor.padEnd(15)} ${c.code.toFixed(2)}  ${c.analysis.toFixed(2)}   ${c.cyber.toFixed(2)}   ${c.everyday.toFixed(2)}  cli + desktop`,
          );
        }
        out.push('', 'Bobot konsensus: ' + AGENTS.map((a) => `${a.codename}=${a.weight}`).join(' · '));
        return out;
      }

      case 'harness': {
        const id = rest[0] as keyof typeof AGENT_MAP;
        const a = AGENT_MAP[id];
        if (!a) return [`Harness tidak dikenal: ${rest[0] ?? '(kosong)'}`, `Pilih: ${AGENTS.map((x) => x.id).join(', ')}`];
        return [
          `${a.glyph} ${a.name} · ${a.vendor} · "${a.codename}"`,
          `  Role       : ${a.role}`,
          `  Lens       : ${a.lens}`,
          `  Model      : ${a.model}`,
          `  CLI        : ${a.surfaces.cli.command}`,
          `  CLI note   : ${a.surfaces.cli.note}`,
          `  Desktop    : ${a.surfaces.desktop.app} — ${a.surfaces.desktop.note}`,
          `  Env        : ${a.surfaces.cli.env.join(', ')}`,
          `  Strengths  : ${a.strengths.join(', ')}`,
        ];
      }

      case 'pillars':
        return (Object.keys(PILLARS) as PillarId[]).map(
          (p) => `${PILLARS[p].glyph} ${p.padEnd(10)} ${PILLARS[p].label.padEnd(20)} ${PILLARS[p].description}`,
        );

      case 'missions': {
        const pillar = rest[0] as PillarId | undefined;
        const list = pillar ? MISSIONS.filter((m) => m.pillar === pillar) : MISSIONS;
        return [
          ...list.map((m) => `${m.id.padEnd(22)} [${m.pillar.padEnd(8)}] ★${m.complexity}  ${m.title}`),
          '',
          `${list.length} preset · jalankan dengan: mission <id>`,
        ];
      }

      case 'adapters': {
        const list = await this.refreshAdapters();
        const mode = this.settings.mode;
        return [
          `Mode: ${mode} · Live aktif bila binary tersedia.`,
          ...list.map((a) => `${a.available ? '●' : '○'} ${a.name.padEnd(14)} ${a.binary.padEnd(12)} ${a.reason}`),
          '',
          'Aktifkan: isi .env.local + pastikan binary ada di PATH, lalu `set mode live`.',
        ];
      }

      case 'policy': {
        if (has('approve')) this.updateSettings({ labEnabled: true, labApproved: true });
        const policyPrompt = rest.filter((x) => !x.startsWith('--')).join(' ') || 'threat model untuk layanan login';
        const v = this.policy.evaluate('cyber', policyPrompt, {
          approved: has('approve') || this.settings.labApproved,
          scope: flag('scope') ?? this.settings.labScope,
        });
        return [
          `level=${v.level}  allowed=${v.allowed}  approval=${v.requiresApproval}  scope=${v.scope}`,
          ...v.notes.map((n) => `  · ${n}`),
          ...v.redactions.map((r) => `  · redaksi: ${r}`),
          `sanitized: ${truncate(v.sanitized, 120)}`,
        ];
      }

      case 'status': {
        const s = this.state;
        return [
          `session   ${s.sessionId}`,
          `phase     ${s.phase}${s.running ? ' (running)' : ''}`,
          `pillar    ${s.pillar ?? '—'}`,
          `runs      ${s.metrics.runs} · messages ${s.metrics.messages} · avgConfidence ${(s.metrics.avgConfidence * 100).toFixed(0)}%`,
          `findings  ${s.findings.length} · critiques ${s.critiques.length} · artifacts ${s.artifacts.length}`,
          `consensus ${s.consensus ? `${AGENT_MAP[s.consensus.winner].name} ${(s.consensus.score * 100).toFixed(1)}% · agreement ${(s.consensus.agreement * 100).toFixed(0)}%` : '—'}`,
          `mode      ${s.settings.mode} · pace ${s.settings.pace}ms · lab ${s.settings.labEnabled ? 'on' : 'off'}`,
        ];
      }

      case 'brief': {
        const b = this.state.lastResult?.brief;
        if (!b) return ['Belum ada Council Brief. Jalankan `mission code-auth` dulu.'];
        return b.split('\n').slice(0, 46).concat('', '… (brief lengkap ada di panel Artefak / `export md`)');
      }

      case 'export':
        return [`Transkrip siap (${formatTime(Date.now())}).`, ...this.exportTranscript(rest[0] === 'json' ? 'json' : 'md').split('\n').slice(0, 40)];

      case 'settings':
        return [
          `mode=${this.settings.mode} pace=${this.settings.pace}ms`,
          `labEnabled=${this.settings.labEnabled} labApproved=${this.settings.labApproved} labScope=${this.settings.labScope}`,
          `requireApproval=${this.settings.requireApproval} strictRedaction=${this.settings.strictRedaction}`,
          `scope allow-list: ${LAB_SCOPES.join(', ')}`,
        ];

      case 'set': {
        const key = rest[0];
        const value = rest[1];
        if (!key || value === undefined) return ['Usage: set <mode|pace|lab|scope|redaction> <value>'];
        if (key === 'mode' && ['sim', 'live', 'auto'].includes(value)) this.updateSettings({ mode: value as Settings['mode'] });
        else if (key === 'pace') this.updateSettings({ pace: Math.max(0, Math.min(1000, Number(value) || 0)) });
        else if (key === 'lab') this.updateSettings({ labEnabled: value === 'on' || value === 'true' });
        else if (key === 'scope') this.updateSettings({ labScope: value, labApproved: false });
        else if (key === 'redaction') this.updateSettings({ strictRedaction: value === 'on' || value === 'true' });
        else return [`Key tidak dikenal: ${key}`];
        return [`✓ ${key} → ${value}`];
      }

      case 'lab': {
        if (rest[0] === 'approve') {
          if (!LAB_SCOPES.includes(this.settings.labScope)) return [`Scope "${this.settings.labScope}" tidak diizinkan.`, `Pilih: ${LAB_SCOPES.join(', ')}`];
          this.updateSettings({ labEnabled: true, labApproved: true });
          return [`✓ Lab disetujui untuk scope "${this.settings.labScope}" (berlaku sesi ini).`];
        }
        if (rest[0] === 'scope' && rest[1]) {
          if (!LAB_SCOPES.includes(rest[1])) return [`Scope ditolak. Allow-list: ${LAB_SCOPES.join(', ')}`];
          this.updateSettings({ labScope: rest[1], labApproved: false });
          return [`✓ scope → ${rest[1]} · persetujuan direset, jalankan \`lab approve\`.`];
        }
        return ['Usage: lab approve | lab scope <target>'];
      }

      case 'doctor': {
        await this.refreshAdapters();
        return [
          `node       ${typeof process !== 'undefined' ? process.version : 'browser runtime'}`,
          `session    ${this.sessionId}`,
          `mode       ${this.settings.mode}`,
          `adapters   ${this.adapters.filter((a) => a.available).length}/${this.adapters.length} live binary`,
          `settings   ${typeof localStorage !== 'undefined' ? 'localStorage tersedia' : 'CLI (tanpa localStorage)'}`,
          `model      public/models/lyra-pointcloud.bin · jalankan \`npm run model\` untuk rebuild`,
          '✓ Kernel siap. Tanpa API key pun Local Council berjalan penuh.',
        ];
      }

      case 'model':
        try {
          const res = await fetch('/models/lyra-meta.json');
          if (!res.ok) throw new Error('fetch failed');
          const m = await res.json();
          return [
            `Lyra · Holographic Reconstruction ${m.version}`,
            `points     ${m.points.toLocaleString()} (${m.surfacePoints.toLocaleString()} surface + ${m.haloPoints.toLocaleString()} halo)`,
            `relief     ${m.reliefGrid.join('×')} depth grid`,
            `source     ${m.source}`,
            `references ${m.references.join(' · ')}`,
            `pipeline   ${m.pipeline}`,
            `download   /models/${m.download}`,
          ];
        } catch {
          return [
            'Lyra · Holographic Reconstruction (CLI mode)',
            'points     28.200 · relief 72×96 · PLY 413 KB',
            'source     3 referensi pengguna + Lyra Prime',
            'build      python3 scripts/build_lyra_model.py (npm run model)',
            'download   public/models/lyra-pointcloud.ply',
          ];
        }

      case 'clear':
        return ['@@CLEAR@@'];

      case 'mission': {
        const m = MISSIONS.find((x) => x.id === rest[0]);
        if (!m) return [`Preset tidak ditemukan: ${rest[0] ?? '(kosong)'}`, 'Lihat daftar: missions'];
        return this.runAndReport(m.prompt, {
          pillar: m.pillar,
          pace: has('fast') ? 0 : undefined,
          labApproved: has('approve') || undefined,
          labScope: flag('scope'),
        });
      }

      case 'run': {
        const words = rest.filter((x) => !x.startsWith('--'));
        const prompt = words.join(' ');
        return this.runAndReport(prompt, {
          pillar: (flag('pillar') as PillarId) || undefined,
          live: has('live') || undefined,
          pace: has('fast') ? 0 : undefined,
          labApproved: has('approve') || undefined,
          labScope: flag('scope'),
        });
      }

      case 'abort':
        this.abort();
        return ['Permintaan abort dikirim ke bus.'];

      default:
        return [`Perintah tidak dikenal: ${cmd}`, 'Ketik `help` untuk daftar perintah.'];
    }
  }

  private async runAndReport(prompt: string, opts: RunOptions): Promise<string[]> {
    const r = await this.run(prompt, opts);
    const lines: string[] = [];
    lines.push(`▶ ${truncate(prompt, 100)}`);
    if (!r.ok) {
      lines.push(`■ DITAHAN: ${r.blockedReason ?? 'policy gate'}`);
      return lines;
    }
    const c = r.consensus;
    lines.push(`✓ ${r.runId} · ${PILLARS[r.pillar].label} · ${(r.durationMs / 1000).toFixed(1)}s · ${r.findings.length} temuan`);
    if (c) lines.push(`◆ konsensus ${AGENT_MAP[c.winner].name} ${(c.score * 100).toFixed(1)}% · agreement ${(c.agreement * 100).toFixed(0)}% · ${c.conflicts} konflik`);
    lines.push('', ...r.brief.split('\n').slice(0, 12), '', '… brief lengkap: `brief`, panel Artefak, atau `export md`');
    return lines;
  }
}

export const os = new LyraOS();
