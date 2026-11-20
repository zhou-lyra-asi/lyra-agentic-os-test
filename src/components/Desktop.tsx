import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  Activity, Box, Check, ChevronRight, CircleDot, Copy, Cpu, Download, FileJson, FileText,
  Fingerprint, FolderOpen, Layers3, Maximize2, Monitor, Orbit, Play, ScrollText, Settings2,
  ShieldCheck, Sparkles, Terminal as TerminalIcon, X, type LucideIcon,
} from 'lucide-react';
import { AGENTS, AGENT_MAP, LAB_SCOPES, MISSIONS, PILLARS, os } from '../core';
import type { HarnessId, PillarId } from '../core/types';
import { downloadFile, useOS } from '../hooks';
import { CouncilStream } from './Chrome';
import { Markdown } from './Markdown';
import { Scene3D } from './Scene3D';
import { LyraTerminal } from './Terminal';

export type WindowId = 'nexus' | 'council' | 'terminal' | 'brief' | 'agents' | 'dossier' | 'archive' | 'cyber' | 'settings';

export interface WindowRequest { id: WindowId; agentId?: HarnessId; nonce: number }

const APPS: { id: WindowId; label: string; title: string; icon: LucideIcon; color: string }[] = [
  { id: 'nexus', label: 'Nexus 3D', title: 'Lyra Nexus · 3D Council', icon: Orbit, color: '#e8c77b' },
  { id: 'council', label: 'Council', title: 'Council Stream · Message Bus', icon: Activity, color: '#8de9c0' },
  { id: 'terminal', label: 'Terminal', title: 'Lyra CLI · Harness Console', icon: TerminalIcon, color: '#7bdff2' },
  { id: 'brief', label: 'Artefak', title: 'Council Brief & Artefak', icon: FileText, color: '#f6dfa8' },
  { id: 'agents', label: 'Harness', title: 'Agent Matrix · 4 Harness', icon: Cpu, color: '#b69cff' },
  { id: 'archive', label: 'Arsip Lyra', title: 'Arsip Lyra · Rekonstruksi 3D', icon: FolderOpen, color: '#e8a87c' },
  { id: 'cyber', label: 'Cyber Lab', title: 'Cyber Policy & Lab Simulasi', icon: ShieldCheck, color: '#7bdff2' },
  { id: 'settings', label: 'Settings', title: 'Kernel Settings & Adapters', icon: Settings2, color: '#c8cede' },
];

interface Win {
  key: string;
  id: WindowId;
  title: string;
  x: number; y: number; w: number; h: number;
  z: number; min: boolean; max: boolean;
  agentId?: HarnessId;
}

function rectFor(id: WindowId) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const vh = typeof window !== 'undefined' ? Math.max(600, window.innerHeight - 58) : 842;
  const base: Record<WindowId, [number, number, number, number]> = {
    nexus: [0.15, 0.09, 0.52, 0.62],
    council: [0.68, 0.09, 0.29, 0.66],
    terminal: [0.15, 0.71, 0.52, 0.2],
    brief: [0.28, 0.13, 0.52, 0.7],
    agents: [0.19, 0.12, 0.62, 0.72],
    dossier: [0.32, 0.14, 0.42, 0.7],
    archive: [0.2, 0.11, 0.6, 0.74],
    cyber: [0.24, 0.12, 0.52, 0.72],
    settings: [0.26, 0.13, 0.48, 0.72],
  };
  const [fx, fy, fw, fh] = base[id];
  return {
    x: Math.max(8, Math.round(vw * fx)),
    y: Math.max(8, Math.round(vh * fy)),
    w: Math.round(Math.min(vw * fw, 980)),
    h: Math.round(Math.min(vh * fh, 760)),
  };
}

// ────────────────────────────────────────────────────────────────
export function Desktop({ request }: { request: WindowRequest | null }) {
  const [wins, setWins] = useState<Win[]>(() => {
    const make = (id: WindowId, z: number): Win => ({ key: id, id, title: APPS.find((a) => a.id === id)!.title, ...rectFor(id), z, min: false, max: false });
    return [make('nexus', 1), make('council', 2), make('terminal', 3)];
  });
  const zc = useRef(3);
  const [drag, setDrag] = useState<{ key: string; dx: number; dy: number } | null>(null);
  const [launcher, setLauncher] = useState(false);

  const open = (id: WindowId, agentId?: HarnessId) => {
    const key = `${id}:${agentId ?? ''}`;
    const app = APPS.find((a) => a.id === id);
    const title = id === 'dossier' && agentId ? `${AGENT_MAP[agentId].name} · Dossier` : app?.title ?? id;
    const z = ++zc.current;
    setWins((prev) => {
      const found = prev.find((w) => w.key === key);
      if (found) return prev.map((w) => (w.key === key ? { ...w, min: false, z, title } : w));
      return [...prev, { key, id, title, ...rectFor(id), z, min: false, max: false, agentId }];
    });
    setLauncher(false);
  };

  useEffect(() => {
    if (request) open(request.id, request.agentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.nonce]);

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      setWins((prev) => prev.map((w) => w.key === drag.key
        ? { ...w, x: Math.max(0, e.clientX - drag.dx), y: Math.max(4, Math.min(window.innerHeight - 118, e.clientY - drag.dy)) }
        : w));
    };
    const up = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag]);

  const focus = (key: string) => {
    const z = ++zc.current;
    setWins((p) => p.map((w) => (w.key === key ? { ...w, z } : w)));
  };

  return (
    <div className="desktop">
      <div className="desktop__wallpaper" />
      <div className="desktop__glow" />
      <div className="desktop__watermark">
        <span>LYRA</span>
        <i>AGENTIC OS · DESKTOP SURFACE</i>
      </div>

      {wins.filter((w) => !w.min).map((w) => (
        <section
          key={w.key}
          className={`window glass ${w.max ? 'window--max' : ''}`}
          style={{
            left: w.max ? 12 : w.x, top: w.max ? 46 : w.y,
            width: w.max ? 'calc(100vw - 24px)' : w.w,
            height: w.max ? 'calc(100vh - 108px)' : w.h,
            zIndex: w.z,
          }}
          onPointerDown={() => focus(w.key)}
        >
          <header
            className="window__bar"
            onPointerDown={(e) => {
              if (w.max) return;
              focus(w.key);
              setDrag({ key: w.key, dx: e.clientX - w.x, dy: e.clientY - w.y });
            }}
            onDoubleClick={() => setWins((p) => p.map((x) => x.key === w.key ? { ...x, max: !x.max } : x))}
          >
            <span className="window__dot" style={{ background: APPS.find((a) => a.id === w.id)?.color }} />
            <b>{w.title}</b>
            <span className="window__id">lyra://{w.id}{w.agentId ? `/${w.agentId}` : ''}</span>
            <div className="window__controls">
              <button title="Minimize" onClick={() => setWins((p) => p.map((x) => x.key === w.key ? { ...x, min: true } : x))}><span>—</span></button>
              <button title="Maximize" onClick={() => setWins((p) => p.map((x) => x.key === w.key ? { ...x, max: !x.max } : x))}><Maximize2 size={11} /></button>
              <button title="Close" className="is-close" onClick={() => setWins((p) => p.filter((x) => x.key !== w.key))}><X size={12} /></button>
            </div>
          </header>
          <div className="window__body">
            <WindowBody id={w.id} agentId={w.agentId} open={open} />
          </div>
        </section>
      ))}

      {launcher && (
        <div className="launcher glass" onMouseLeave={() => setLauncher(false)}>
          <div className="launcher__head"><span className="eyebrow">LYRA · APPLICATIONS</span><b>8 surfaces, 1 kernel</b></div>
          <div className="launcher__grid">
            {APPS.map((a) => (
              <button key={a.id} onClick={() => open(a.id)} style={{ '--c': a.color } as CSSProperties}>
                <a.icon size={20} /><b>{a.label}</b><i>{a.title}</i>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="taskbar glass">
        <button className={`taskbar__start ${launcher ? 'active' : ''}`} onClick={() => setLauncher((v) => !v)}>
          <span>✧</span> LYRA
        </button>
        <span className="taskbar__sep" />
        {APPS.map((a) => {
          const running = wins.some((w) => w.id === a.id);
          return (
            <button key={a.id} className={`taskbar__app ${running ? 'running' : ''}`} onClick={() => open(a.id)} title={a.title}>
              <a.icon size={15} style={{ color: a.color }} />
              <span>{a.label}</span>
            </button>
          );
        })}
        <span className="taskbar__spacer" />
        <span className="taskbar__status"><CircleDot size={11} /> 4 harness · {os.getSnapshot().settings.mode}</span>
        <span className="taskbar__clock">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
function WindowBody({ id, agentId, open }: { id: WindowId; agentId?: HarnessId; open: (id: WindowId, agentId?: HarnessId) => void }) {
  switch (id) {
    case 'nexus': return <NexusBody open={open} />;
    case 'council': return <div className="body-council"><CouncilStream compact onOpenWindow={(x) => open(x as WindowId)} /></div>;
    case 'terminal': return <LyraTerminal />;
    case 'brief': return <BriefBody />;
    case 'agents': return <AgentsBody open={open} />;
    case 'dossier': return <DossierBody id={agentId ?? 'claude-code'} open={open} />;
    case 'archive': return <ArchiveBody />;
    case 'cyber': return <CyberBody />;
    case 'settings': return <SettingsBody />;
    default: return null;
  }
}

function NexusBody({ open }: { open: (id: WindowId, agentId?: HarnessId) => void }) {
  return (
    <div className="nexus-embed">
      <Scene3D compact onSelectAgent={(a) => open('dossier', a)} />
      <div className="nexus-embed__hud">
        <Sparkles size={13} /> Nexus 3D · klik node harness untuk membuka dossier
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
function BriefBody() {
  const s = useOS();
  const [tab, setTab] = useState(0);
  const art = s.artifacts[tab];
  return (
    <div className="brief-body">
      <div className="pane-toolbar">
        <div className="tabs">
          {s.artifacts.length ? s.artifacts.map((a, i) => (
            <button key={a.id} className={tab === i ? 'active' : ''} onClick={() => setTab(i)}>
              {a.kind === 'trace' ? <FileJson size={12} /> : <FileText size={12} />} {a.kind}
            </button>
          )) : <span className="tabs__empty">belum ada artefak</span>}
        </div>
        {art && (
          <div className="pane-actions">
            <button onClick={() => void navigator.clipboard?.writeText(art.content)}><Copy size={12} /> Salin</button>
            <button onClick={() => downloadFile(`lyra-${art.kind}-${art.id}.${art.kind === 'trace' ? 'json' : 'md'}`, art.content)}><Download size={12} /> Unduh</button>
          </div>
        )}
      </div>
      <div className="brief-body__scroll">
        {art ? (
          <Markdown text={art.content} />
        ) : (
          <div className="empty-state">
            <ScrollText size={30} />
            <h3>Belum ada Council Brief</h3>
            <p>Jalankan sebuah misi untuk menghasilkan brief, checklist, dan run trace dari deliberasi 4 harness.</p>
            <button onClick={() => void os.run(MISSIONS.find((m) => m.id === 'code-auth')!.prompt, { pillar: 'code' })}>
              <Play size={13} /> Jalankan preset · Audit modul auth
            </button>
          </div>
        )}
        {s.consensus && (
          <div className="brief-consensus">
            <b>Konsensus</b> · {AGENT_MAP[s.consensus.winner].name} · agreement {(s.consensus.agreement * 100).toFixed(0)}% · {s.consensus.conflicts} konflik
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
function CapBars({ agent }: { agent: (typeof AGENTS)[number] }) {
  return (
    <div className="cap-bars">
      {(Object.keys(PILLARS) as PillarId[]).map((p) => (
        <div key={p} className="cap-bar" title={`${PILLARS[p].label}: ${(agent.capabilities[p] * 100).toFixed(0)}%`}>
          <span>{PILLARS[p].short}</span>
          <b style={{ width: `${agent.capabilities[p] * 100}%`, background: agent.color }} />
          <i>{(agent.capabilities[p] * 100).toFixed(0)}</i>
        </div>
      ))}
    </div>
  );
}

function AgentsBody({ open }: { open: (id: WindowId, agentId?: HarnessId) => void }) {
  const s = useOS();
  return (
    <div className="agents-body">
      <div className="body-intro">
        <span className="eyebrow">AGENT MATRIX · 4 HARNESSES / 2 SURFACES</span>
        <p>Setiap harness punya <b>CLI</b> dan <b>Desktop</b>; Lyra menyatukannya lewat message bus, blackboard, dan konsensus berbobot.</p>
      </div>
      <div className="agent-grid">
        {AGENTS.map((a) => {
          const adapter = os.adapters.find((x) => x.id === a.id);
          const finding = s.findings.find((f) => f.agent === a.id);
          return (
            <article key={a.id} className="agent-card" style={{ '--c': a.color } as CSSProperties}>
              <header>
                <span className="agent-card__glyph">{a.glyph}</span>
                <div><b>{a.name}</b><i>{a.vendor} · {a.codename}</i></div>
                <span className={`agent-card__live ${adapter?.available ? 'on' : ''}`}>{adapter?.available ? 'LIVE' : 'SIM'}</span>
              </header>
              <p className="agent-card__role">{a.role}</p>
              <blockquote>“{a.tagline}”</blockquote>
              <CapBars agent={a} />
              <div className="agent-card__surfaces">
                <div><Monitor size={12} /><code>{a.surfaces.desktop.app}</code></div>
                <div><TerminalIcon size={12} /><code>{a.surfaces.cli.command}</code></div>
              </div>
              <footer>
                <span>{finding ? `confidence ${(finding.confidence * 100).toFixed(0)}%` : 'belum bertugas'}</span>
                <button onClick={() => open('dossier', a.id)}>Dossier <ChevronRight size={12} /></button>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function DossierBody({ id, open }: { id: HarnessId; open: (id: WindowId, agentId?: HarnessId) => void }) {
  const s = useOS();
  const a = AGENT_MAP[id];
  const finding = s.findings.find((f) => f.agent === id);
  const critiques = s.critiques.filter((c) => c.target === id);
  return (
    <div className="dossier" style={{ '--c': a.color } as CSSProperties}>
      <header className="dossier__head">
        <span className="dossier__glyph">{a.glyph}</span>
        <div>
          <span className="eyebrow">{a.vendor} · HARNESS DOSSIER</span>
          <h2>{a.name}</h2>
          <p><b>{a.codename}</b> — {a.role}</p>
        </div>
      </header>
      <blockquote className="dossier__quote">“{a.tagline}”</blockquote>

      <div className="dossier__section">
        <span className="eyebrow">LENSA REASONING</span>
        <p>{a.lens}.</p>
        <div className="chip-row">{a.strengths.map((x) => <span key={x}>{x}</span>)}</div>
      </div>

      <div className="dossier__section">
        <span className="eyebrow">CAPABILITIES</span>
        <CapBars agent={a} />
      </div>

      <div className="dossier__section">
        <span className="eyebrow">DUA SURFACE · SATU PROTOKOL</span>
        <div className="surface-table">
          <div><em><Monitor size={12} /> DESKTOP</em><b>{a.surfaces.desktop.app}</b><p>{a.surfaces.desktop.note}</p></div>
          <div><em><TerminalIcon size={12} /> CLI</em><code>{a.surfaces.cli.command}</code><p>{a.surfaces.cli.note}</p></div>
        </div>
        <div className="chip-row"><span>env: {a.surfaces.cli.env.join(' · ')}</span></div>
      </div>

      <div className="dossier__section">
        <span className="eyebrow">TEMUAN SESI INI</span>
        {finding ? (
          <>
            <p className="dossier__thesis">{finding.thesis}</p>
            {finding.sections.slice(0, 2).map((sec) => (
              <div key={sec.heading} className="dossier__finding"><b>{sec.heading}</b><p>{sec.lines.slice(0, 2).join(' ')}</p></div>
            ))}
            <div className="chip-row">{critiques.map((c, i) => <span key={i}>{AGENT_MAP[c.reviewer].codename}: {(c.score * 100).toFixed(0)}%{c.disagreement ? ' ⚠' : ''}</span>)}</div>
          </>
        ) : <p className="dim">Belum ada temuan. Jalankan misi terlebih dahulu.</p>}
      </div>

      <button className="dossier__cta" onClick={() => open('terminal')}><TerminalIcon size={13} /> Kirim tugas lewat CLI</button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
function ArchiveBody() {
  const [meta, setMeta] = useState<any>(null);
  useEffect(() => { void fetch('/models/lyra-meta.json').then((r) => r.json()).then(setMeta).catch(() => {}); }, []);
  const cards = [
    { src: '/lyra/card-01.jpg', title: 'Moonlit Fantasy Romance Retreat', tag: 'Malam · rembulan · mawar' },
    { src: '/lyra/card-02.jpg', title: 'Sunset Fantasy Empress', tag: 'Senja · empress · emas' },
    { src: '/lyra/card-03.jpg', title: 'Golden Blindfold at Sunset', tag: 'Blindfold · cahaya · rahasia' },
  ];
  return (
    <div className="archive">
      <div className="archive__hero">
        <img src="/lyra/lyra-prime.jpg" alt="Lyra Prime" />
        <div>
          <span className="eyebrow">LYRA PRIME · 3D REFERENCE</span>
          <h2>Satu wajah,<br /><em>tiga dunia.</em></h2>
          <p>Ketiga referensimu dilebur menjadi satu karakter 3D yang konsisten, lalu direkonstruksi ulang menjadi point-cloud dan relief mesh yang benar-benar berputar di WebGL.</p>
          <div className="archive__badges">
            <span><Box size={12} /> {meta?.points?.toLocaleString() ?? '28.200'} titik</span>
            <span><Layers3 size={12} /> relief {meta?.reliefGrid?.join('×') ?? '72×96'}</span>
            <span><Fingerprint size={12} /> deterministik</span>
          </div>
        </div>
      </div>

      <div className="archive__grid">
        {cards.map((c) => (
          <figure key={c.src}><img src={c.src} alt={c.title} /><figcaption><b>{c.title}</b><i>{c.tag}</i></figcaption></figure>
        ))}
      </div>

      <div className="archive__model">
        <div>
          <span className="eyebrow">PIPELINE REKONSTRUKSI</span>
          <h3>Dari piksel menjadi volume</h3>
          <p>Luminance + edge energy + elliptical volume prior + posterior shell membentuk kedalaman. Warna didorong ke palet champagne-gold. Semua deterministik (seed tetap), sehingga build bisa direproduksi.</p>
          <code>python3 scripts/build_lyra_model.py</code>
        </div>
        <div className="archive__download">
          <a href="/models/lyra-pointcloud.ply" download><Download size={15} /> Unduh model 3D (.ply)</a>
          <a href="/models/lyra-meta.json" target="_blank" rel="noreferrer"><FileJson size={15} /> Metadata</a>
          <span>PLY binary · vertex + RGB · bisa dibuka di Meshlab / Blender / CloudCompare</span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
function CyberBody() {
  const s = useOS();
  const [test, setTest] = useState('Simulasi tabletop credential stuffing pada lab.local');
  const [verdict, setVerdict] = useState<string[]>([]);
  const audits = useMemo(() => s.messages.filter((m) => m.channel === 'audit').slice(-14), [s.messages]);
  const st = s.settings;

  const check = () => {
    const v = os.policy.evaluate('cyber', test, { approved: st.labApproved, scope: st.labScope });
    setVerdict([
      `level=${v.level} · allowed=${v.allowed} · approval=${v.requiresApproval} · scope=${v.scope}`,
      ...v.notes.map((n) => `· ${n}`),
      ...v.redactions.map((r) => `· redaksi ${r}`),
    ]);
  };

  return (
    <div className="cyber">
      <div className="body-intro">
        <span className="eyebrow">CYBER POLICY GUARD · DEFENSIVE + APPROVED LAB</span>
        <p>Pilar cyber bersifat <b>defensif</b>: threat modeling, triage, hardening, deteksi. Lab simulasi hanya berjalan pada target dummy dengan persetujuan eksplisit — tanpa payload maupun exploit nyata.</p>
      </div>

      <div className="cyber__grid">
        <div className="cyber__controls glass-inner">
          <span className="eyebrow">KONTROL SESI</span>
          {[
            { key: 'labEnabled' as const, label: 'Aktifkan modul lab', desc: 'Mengizinkan simulasi tabletop tertutup' },
            { key: 'labApproved' as const, label: 'Persetujuan eksplisit', desc: 'Harus aktif untuk setiap scope baru' },
            { key: 'strictRedaction' as const, label: 'Redaksi target nyata', desc: 'IP/domain otomatis disamarkan' },
          ].map((t) => (
            <label key={t.key} className="toggle-row">
              <span><b>{t.label}</b><i>{t.desc}</i></span>
              <button className={`toggle ${st[t.key] ? 'on' : ''}`} onClick={() => os.updateSettings({ [t.key]: !st[t.key] })}><span /></button>
            </label>
          ))}
          <label className="scope-row">
            <span className="eyebrow">LAB SCOPE</span>
            <select value={st.labScope} onChange={(e) => os.updateSettings({ labScope: e.target.value, labApproved: false })}>
              {LAB_SCOPES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <button className="cyber__approve" onClick={() => os.updateSettings({ labEnabled: true, labApproved: true })}>
            <Check size={13} /> Setujui simulasi untuk {st.labScope}
          </button>
          <div className="cyber__state">
            <span className={`status-pill ${st.labApproved && st.labEnabled ? 'ok' : 'warn'}`}>
              {st.labApproved && st.labEnabled ? 'LAB ARMED' : 'LAB LOCKED'}
            </span>
            <span>policy sesi: {s.policy?.level ?? 'safe'}</span>
          </div>
        </div>

        <div className="cyber__test glass-inner">
          <span className="eyebrow">UJI POLICY TANPA MENJALANKAN MISI</span>
          <textarea rows={3} value={test} onChange={(e) => setTest(e.target.value)} />
          <button onClick={check}><ShieldCheck size={13} /> Evaluasi</button>
          <div className="cyber__verdict">
            {verdict.length ? verdict.map((v, i) => <p key={i}>{v}</p>) : <p className="dim">Hasil evaluasi akan muncul di sini.</p>}
          </div>
          <div className="cyber__rules">
            <b>Yang tidak pernah dilakukan:</b>
            <span>✕ payload / exploit / malware</span>
            <span>✕ koneksi ke target nyata</span>
            <span>✕ pengambilan kredensial</span>
            <span>✓ audit trail untuk setiap keputusan</span>
          </div>
        </div>
      </div>

      <div className="cyber__audit">
        <span className="eyebrow">AUDIT TRAIL · CHANNEL audit</span>
        {audits.length ? audits.map((m) => (
          <p key={m.id}><i>{new Date(m.ts).toLocaleTimeString('id-ID', { hour12: false })}</i> <b>{m.subject}</b> {m.body}</p>
        )) : <p className="dim">Belum ada audit. Jalankan misi cyber untuk mengisi trail.</p>}
        <button onClick={() => void os.run(MISSIONS.find((m) => m.id === 'cyber-lab')!.prompt, {
          pillar: 'cyber', labApproved: st.labApproved, labScope: st.labScope,
        })}><Play size={12} /> Jalankan tabletop preset (mengikuti gate di atas)</button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
function SettingsBody() {
  const s = useOS();
  const [copied, setCopied] = useState(false);
  const envSnippet = `VITE_LYRA_MODE=auto\nLYRA_CLAUDE_BIN=claude\nLYRA_ANTIGRAVITY_BIN=ag\nLYRA_HERMES_BIN=hermes\nLYRA_CODEX_BIN=codex\n# ANTHROPIC_API_KEY=… (jangan commit)`;
  return (
    <div className="settings">
      <div className="body-intro">
        <span className="eyebrow">KERNEL SETTINGS · BERLAKU DI WEB / DESKTOP / CLI</span>
        <p>Mode <b>sim</b> memakai Local Council deterministik (tanpa kunci). Mode <b>auto/live</b> memanggil binary CLI asli bila tersedia di PATH; bila gagal, otomatis fallback ke sim dan dicatat di audit.</p>
      </div>

      <div className="settings__row">
        <span className="eyebrow">EXECUTION MODE</span>
        <div className="seg">
          {(['sim', 'auto', 'live'] as const).map((m) => (
            <button key={m} className={s.settings.mode === m ? 'active' : ''} onClick={() => os.updateSettings({ mode: m })}>{m}</button>
          ))}
        </div>
      </div>

      <div className="settings__row">
        <span className="eyebrow">PACE · {s.settings.pace}ms / langkah</span>
        <input type="range" min={0} max={400} step={20} value={s.settings.pace}
          onChange={(e) => os.updateSettings({ pace: Number(e.target.value) })} />
      </div>

      <div className="settings__row">
        <span className="eyebrow">LIVE ADAPTERS</span>
        <div className="adapter-list">
          {AGENTS.map((a) => {
            const ad = os.adapters.find((x) => x.id === a.id);
            return (
              <div key={a.id} className="adapter-row" style={{ '--c': a.color } as CSSProperties}>
                <span className={`adapter-dot ${ad?.available ? 'on' : ''}`} />
                <b>{a.name}</b>
                <code>{ad?.binary ?? a.surfaces.cli.binary}</code>
                <i>{ad?.reason ?? 'memeriksa…'}</i>
              </div>
            );
          })}
        </div>
      </div>

      <div className="settings__row">
        <span className="eyebrow">.ENV LOCAL</span>
        <div className="code-block"><pre>{envSnippet}</pre>
          <button onClick={() => { void navigator.clipboard?.writeText(envSnippet); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      <div className="settings__row settings__actions">
        <button onClick={() => downloadFile('lyra-transcript.md', os.exportTranscript('md'))}><Download size={13} /> Transkrip MD</button>
        <button onClick={() => downloadFile('lyra-session.json', os.exportTranscript('json'), 'application/json')}><FileJson size={13} /> Session JSON</button>
        <button onClick={() => void os.refreshAdapters()}><Activity size={13} /> Refresh adapters</button>
      </div>
    </div>
  );
}
