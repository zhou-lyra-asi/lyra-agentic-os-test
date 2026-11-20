import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowUpRight, ChevronRight, Clock3, Command, Cpu, Download, FileText,
  Fingerprint, Layers3, Monitor, Orbit, Play, ScrollText, Settings2, ShieldCheck,
  Sparkles, Terminal as TerminalIcon, Zap,
} from 'lucide-react';
import { AGENTS, AGENT_MAP, MISSIONS, PILLARS, os } from '../core';
import type { Channel, HarnessId, OSState, PillarId } from '../core/types';
import { formatTime } from '../core/util';
import { downloadFile, useClock, useOS } from '../hooks';

export type Mode = 'nexus' | 'desktop' | 'cli';

const PHASE_LABELS: { key: OSState['phase']; label: string }[] = [
  { key: 'intake', label: 'Intake' },
  { key: 'classify', label: 'Classify' },
  { key: 'policy', label: 'Policy' },
  { key: 'plan', label: 'Plan' },
  { key: 'delegate', label: 'Delegate' },
  { key: 'execute', label: 'Execute' },
  { key: 'debate', label: 'Debate' },
  { key: 'consensus', label: 'Consensus' },
  { key: 'synthesize', label: 'Synthesize' },
  { key: 'complete', label: 'Complete' },
];

// ────────────────────────────────────────────────────────────────
export function TopBar({
  mode, setMode, onOpenWindow,
}: { mode: Mode; setMode: (m: Mode) => void; onOpenWindow: (id: string) => void }) {
  const s = useOS();
  const now = useClock();
  return (
    <header className="topbar">
      <div className="brand" onClick={() => onOpenWindow('archive')} title="Buka Arsip Lyra">
        <span className="brand__sigil">✧</span>
        <span className="brand__text">
          <b>LYRA</b>
          <i>AGENTIC OS</i>
        </span>
      </div>

      <div className="topbar__center">
        <span className={`live-dot ${s.running ? 'is-live' : ''}`} />
        <span className="topbar__status">
          {s.running ? `COUNCIL DELIBERATING · ${s.phase.toUpperCase()}` : 'COUNCIL ONLINE'}
        </span>
        <span className="topbar__divider" />
        <div className="harness-dots">
          {AGENTS.map((a) => (
            <span key={a.id} className="harness-dot" style={{ '--c': a.color } as React.CSSProperties} title={`${a.name} · ${a.vendor}`}>
              {a.glyph}
            </span>
          ))}
        </div>
      </div>

      <div className="topbar__right">
        <div className="mode-switch" role="tablist">
          {(['nexus', 'desktop', 'cli'] as Mode[]).map((m) => (
            <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)} role="tab" aria-selected={mode === m}>
              {m === 'nexus' ? <Orbit size={13} /> : m === 'desktop' ? <Monitor size={13} /> : <TerminalIcon size={13} />}
              {m.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="topbar__clock"><Clock3 size={12} /> {now.toLocaleTimeString('id-ID', { hour12: false })}</span>
        <button className="icon-btn" title="Pengaturan" onClick={() => onOpenWindow('settings')}><Settings2 size={16} /></button>
      </div>
    </header>
  );
}

// ────────────────────────────────────────────────────────────────
export function LeftRail({
  pillar, setPillar, onPreset, onOpenWindow,
}: {
  pillar: PillarId;
  setPillar: (p: PillarId) => void;
  onPreset: (prompt: string, run?: boolean) => void;
  onOpenWindow: (id: string) => void;
}) {
  const s = useOS();
  const presets = useMemo(() => MISSIONS.filter((m) => m.pillar === pillar), [pillar]);
  return (
    <aside className="left-rail glass">
      <div className="rail-head">
        <span className="eyebrow">MISSION PILLARS</span>
        <span className="rail-head__line" />
      </div>
      <div className="pillar-list">
        {(Object.keys(PILLARS) as PillarId[]).map((p) => (
          <button
            key={p}
            className={`pillar-card ${pillar === p ? 'is-active' : ''}`}
            style={{ '--pillar': PILLARS[p].color } as React.CSSProperties}
            onClick={() => setPillar(p)}
          >
            <span className="pillar-card__glyph">{PILLARS[p].glyph}</span>
            <span className="pillar-card__body">
              <b>{PILLARS[p].label}</b>
              <i>{PILLARS[p].description}</i>
            </span>
            <ChevronRight size={14} className="pillar-card__chev" />
          </button>
        ))}
      </div>

      <div className="rail-head rail-head--spaced">
        <span className="eyebrow">MISSION LIBRARY</span>
        <span className="rail-head__count">{presets.length}</span>
      </div>
      <div className="preset-list">
        {presets.map((m) => (
          <div key={m.id} className="preset" onClick={() => onPreset(m.prompt)}>
            <div className="preset__top">
              <span className="preset__stars">{'★'.repeat(m.complexity)}<span>{'☆'.repeat(5 - m.complexity)}</span></span>
              <button
                className="preset__play" title="Jalankan langsung"
                onClick={(e) => { e.stopPropagation(); onPreset(m.prompt, true); }}
              ><Play size={11} fill="currentColor" /></button>
            </div>
            <b>{m.title}</b>
            <i>{m.hint}</i>
          </div>
        ))}
      </div>

      <button className="archive-teaser" onClick={() => onOpenWindow('archive')}>
        <img src="/lyra/avatar-prime.png" alt="Lyra" />
        <span>
          <em>ARSIP LYRA</em>
          <b>3 referensi → 1 model 3D</b>
          <i>Buka galeri & unduh PLY</i>
        </span>
        <ArrowUpRight size={15} />
      </button>

      <div className="rail-metrics">
        <span><Activity size={12} /> {s.metrics.runs} runs</span>
        <span><Cpu size={12} /> {s.metrics.avgConfidence ? (s.metrics.avgConfidence * 100).toFixed(0) : 0}%</span>
      </div>
    </aside>
  );
}

// ────────────────────────────────────────────────────────────────
const CHANNEL_COLOR: Record<Channel, string> = {
  control: '#e8c77b', task: '#f3ede0', finding: '#8de9c0', critique: '#e8a87c',
  vote: '#b69cff', artifact: '#7bdff2', audit: '#ff9e9e', system: '#8b93a8',
};

export function CouncilStream({ onOpenWindow, compact = false }: { onOpenWindow: (id: string) => void; compact?: boolean }) {
  const s = useOS();
  const [filter, setFilter] = useState<'all' | 'findings' | 'debate' | 'audit'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const msgs = useMemo(() => {
    const base = s.messages.slice(-140);
    if (filter === 'all') return base;
    if (filter === 'findings') return base.filter((m) => m.channel === 'finding' || m.channel === 'artifact');
    if (filter === 'debate') return base.filter((m) => m.channel === 'critique' || m.channel === 'vote');
    return base.filter((m) => m.channel === 'audit' || m.channel === 'control');
  }, [s.messages, filter]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  const c = s.consensus;
  return (
    <section className={`council glass ${compact ? 'council--compact' : ''}`}>
      <div className="council__head">
        <div>
          <span className="eyebrow">COUNCIL STREAM</span>
          <h3><span className={`live-dot ${s.running ? 'is-live' : ''}`} /> Message Bus</h3>
        </div>
        <span className="council__seq">#{s.messages.length}</span>
      </div>

      <div className="council__filters">
        {([['all', 'Semua'], ['findings', 'Temuan'], ['debate', 'Debat'], ['audit', 'Audit']] as const).map(([k, label]) => (
          <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>

      <div className="council__stream" ref={scrollRef}>
        {msgs.length === 0 && (
          <div className="council__empty">
            <Sparkles size={22} />
            <p>Belum ada pesan di bus.</p>
            <span>Kirim perintah di bawah untuk memulai deliberasi 4 harness.</span>
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className="msg" style={{ '--ch': CHANNEL_COLOR[m.channel] } as React.CSSProperties}>
            <div className="msg__meta">
              <span className="msg__time">{formatTime(m.ts)}</span>
              <span className="msg__from" style={{ color: m.from === 'lyra' ? '#e8c77b' : AGENT_MAP[m.from as HarnessId]?.color ?? '#c8cede' }}>
                {m.from === 'lyra' ? 'LYRA' : AGENT_MAP[m.from as HarnessId]?.codename ?? m.from.toUpperCase()}
              </span>
              <span className="msg__arrow">→</span>
              <span className="msg__to">{m.to === 'broadcast' ? 'ALL' : AGENT_MAP[m.to as HarnessId]?.codename ?? String(m.to).toUpperCase()}</span>
              <span className="msg__ch">{m.channel}</span>
            </div>
            <div className="msg__subject">{m.subject}</div>
            <div className="msg__body">{m.body}</div>
            {m.confidence !== undefined && (
              <div className="msg__conf"><span style={{ width: `${m.confidence * 100}%` }} /><i>{(m.confidence * 100).toFixed(0)}%</i></div>
            )}
          </div>
        ))}
      </div>

      <div className="consensus-card">
        <div className="consensus-card__head">
          <span className="eyebrow">WEIGHTED CONSENSUS</span>
          <span className="consensus-card__badge">{c ? 'TERCAPAI' : 'MENUNGGU'}</span>
        </div>
        {c ? (
          <>
            <div className="consensus-card__winner">
              <span className="consensus-ring" style={{ '--pct': `${c.agreement * 100}%`, '--c': AGENT_MAP[c.winner].color } as React.CSSProperties}>
                <b>{(c.agreement * 100).toFixed(0)}%</b>
              </span>
              <div>
                <em>agreement</em>
                <strong style={{ color: AGENT_MAP[c.winner].color }}>{AGENT_MAP[c.winner].name}</strong>
                <i>{(c.score * 100).toFixed(1)}% skor · {c.conflicts} konflik terbuka</i>
              </div>
            </div>
            <div className="vote-bars">
              {c.votes.map((v, i) => (
                <div key={i} className="vote-bar" title={`${AGENT_MAP[v.voter].codename} → ${AGENT_MAP[v.target].codename}: ${(v.score * 100).toFixed(0)}%`}>
                  <span>{AGENT_MAP[v.voter].codename.slice(0, 4)}</span>
                  <b style={{ width: `${v.score * 100}%`, background: AGENT_MAP[v.voter].color }} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="consensus-card__idle">Debat 4 harness akan muncul di sini setelah misi dijalankan.</p>
        )}
      </div>

      <div className="board-stats">
        <span><Layers3 size={12} /> {s.findings.length} temuan</span>
        <span><Fingerprint size={12} /> {s.critiques.length} kritik</span>
        <span><ScrollText size={12} /> {s.artifacts.length} artefak</span>
        <span><ShieldCheck size={12} /> {s.policy?.level ?? 'safe'}</span>
      </div>

      <div className="council__actions">
        <button onClick={() => onOpenWindow('brief')} disabled={!s.lastResult}><FileText size={13} /> Brief</button>
        <button onClick={() => downloadFile('lyra-transcript.md', os.exportTranscript('md'))}><Download size={13} /> Ekspor</button>
        <button onClick={() => onOpenWindow('cyber')}><ShieldCheck size={13} /> Policy</button>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────
export function PhaseTracker() {
  const s = useOS();
  const idx = PHASE_LABELS.findIndex((p) => p.key === s.phase);
  return (
    <div className="phase-tracker glass">
      <span className="eyebrow">HARNESS PHASE</span>
      <div className="phase-tracker__bar">
        {PHASE_LABELS.map((p, i) => (
          <span key={p.key} className={i < idx ? 'done' : i === idx ? 'active' : ''} title={p.label} />
        ))}
      </div>
      <div className="phase-tracker__label">
        <b>{s.phase.toUpperCase()}</b>
        {s.running && <i>memproses…</i>}
      </div>
    </div>
  );
}

export function SceneHud({ onOpenWindow }: { onOpenWindow: (id: string) => void }) {
  const s = useOS();
  return (
    <>
      <div className="scene-title">
        <span className="scene-title__orn">✧ ─────────── ✧</span>
        <h1>LYRA</h1>
        <p>DIFFERENT WORLDS · SAME DESIRE</p>
        <span className="scene-title__sub">Satu harness, empat kecerdasan, satu keputusan yang bisa diaudit.</span>
      </div>
      <div className="scene-hint">
        <Orbit size={13} /> drag untuk mengorbit · scroll untuk zoom · klik node untuk dossier
      </div>
      <button className="lyra-orb-btn" onClick={() => onOpenWindow('archive')} title="Rekonstruksi 3D Lyra">
        <img src="/lyra/avatar-prime.png" alt="Lyra" />
        <span><b>LYRA PRIME</b><i>28.200 titik · PLY</i></span>
      </button>
      <PhaseTracker />
      {s.policy && (
        <div className={`policy-chip policy-chip--${s.policy.level}`}>
          <ShieldCheck size={13} /> policy: {s.policy.level} · {s.policy.scope}
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────
export function CommandBar({
  value, setValue, onRun, busy,
}: {
  value: string;
  setValue: (v: string) => void;
  onRun: (runImmediately?: boolean) => void;
  busy: boolean;
}) {
  const s = useOS();
  return (
    <div className="command-wrap">
      <div className={`command-bar glass ${busy ? 'is-busy' : ''}`}>
        <span className="command-bar__sigil">✧</span>
        <div className="command-bar__input">
          <textarea
            rows={1}
            value={value}
            placeholder="Perintahkan Lyra… mis. “audit modul auth dan rancang migrasi tanpa downtime”"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onRun(true); }
            }}
          />
          <span className="command-bar__hint">Enter ↵ jalankan · Shift+Enter baris baru</span>
        </div>
        <div className="command-bar__quick">
          <span className="eyebrow">PILAR</span>
          {(Object.keys(PILLARS) as PillarId[]).map((p) => (
            <button key={p} title={PILLARS[p].label} onClick={() => setValue(value.trim() ? value : MISSIONS.find((m) => m.pillar === p)!.prompt)}>
              {PILLARS[p].glyph}
            </button>
          ))}
        </div>
        <button className="run-btn" onClick={() => onRun(true)} disabled={busy || !value.trim()}>
          {busy ? <><span className="spinner" /> MEMPROSES</> : <><Zap size={15} fill="currentColor" /> JALANKAN</>}
        </button>
      </div>
      <div className="command-foot">
        <span><Command size={11} /> Ctrl+K terminal</span>
        <span><TerminalIcon size={11} /> <code>npm run lyra -- run "…" --stream</code></span>
        <span><Activity size={11} /> {s.metrics.messages} pesan · mode {s.settings.mode}</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
export function BootOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const lines = [
    'Menyalakan inti Lyra…',
    'Memuat rekonstruksi 3D · 28.200 titik',
    'Menghubungkan Claude Code · Antigravity · Hermes · Codex',
    'Message bus & blackboard sinkron',
    'Dewan siap bersidang ✧',
  ];
  useEffect(() => {
    const t = window.setInterval(() => setStep((s) => Math.min(lines.length, s + 1)), 430);
    const done = window.setTimeout(onDone, 2550);
    return () => { window.clearInterval(t); window.clearTimeout(done); };
  }, [onDone]);
  return (
    <div className="boot">
      <div className="boot__halo"><img src="/lyra/avatar-prime.png" alt="Lyra" /></div>
      <div className="boot__text">
        <span className="eyebrow">LYRA AGENTIC OS · v0.1</span>
        <h1>Different Worlds,<br /><em>Same Desire.</em></h1>
        <div className="boot__lines">
          {lines.slice(0, step).map((l, i) => <p key={i}><span>✓</span> {l}</p>)}
        </div>
        <div className="boot__bar"><span style={{ width: `${(step / lines.length) * 100}%` }} /></div>
      </div>
      <button className="boot__skip" onClick={onDone}>Lewati ×</button>
    </div>
  );
}

export function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return <div className="toast glass"><Sparkles size={14} /> {text}</div>;
}
