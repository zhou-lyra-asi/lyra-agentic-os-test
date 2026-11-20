import { useCallback, useEffect, useState } from 'react';
import { Activity, Cpu, Orbit, ShieldCheck, TerminalSquare, Zap } from 'lucide-react';
import { MISSIONS, PILLARS, os } from './core';
import type { HarnessId, PillarId } from './core/types';
import { BootOverlay, CommandBar, CouncilStream, LeftRail, SceneHud, Toast, TopBar, type Mode } from './components/Chrome';
import { Desktop, type WindowId, type WindowRequest } from './components/Desktop';
import { LyraTerminal } from './components/Terminal';
import { Scene3D } from './components/Scene3D';
import { useOS, useToast } from './hooks';

export default function App() {
  const s = useOS();
  const { toast, show } = useToast();
  const [mode, setMode] = useState<Mode>('nexus');
  const [pillar, setPillar] = useState<PillarId>('code');
  const [command, setCommand] = useState('');
  const [request, setRequest] = useState<WindowRequest | null>(null);
  const [booting, setBooting] = useState(() => {
    try { return sessionStorage.getItem('lyra.booted') !== '1'; } catch { return true; }
  });

  const openWindow = useCallback((id: WindowId | string, agentId?: HarnessId) => {
    const wid = id as WindowId;
    setRequest({ id: wid, agentId, nonce: Date.now() + Math.random() });
    setMode('desktop');
  }, []);

  const finishBoot = useCallback(() => {
    setBooting(false);
    try { sessionStorage.setItem('lyra.booted', '1'); } catch { /* ignore */ }
  }, []);

  const run = useCallback(async (prompt?: string) => {
    const text = (prompt ?? command).trim();
    if (!text || s.running) return;
    if (/tabletop|simulasi lab|credential stuffing/i.test(text) && !(s.settings.labEnabled && s.settings.labApproved)) {
      openWindow('cyber');
      show('Simulasi lab membutuhkan persetujuan eksplisit — buka Cyber Lab ✧');
      return;
    }
    show('Dewan mulai bersidang · 4 harness menerima tugas');
    const r = await os.run(text, { pillar });
    if (!r.ok) show(`Ditahan oleh policy: ${r.blockedReason ?? 'gate'}`);
    else show(`Selesai · konsensus ${r.consensus ? (r.consensus.agreement * 100).toFixed(0) : 0}% · ${r.findings.length} temuan ✧`);
  }, [command, s.running, s.settings, pillar, openWindow, show]);

  const onPreset = useCallback((prompt: string, runNow?: boolean) => {
    setCommand(prompt);
    if (runNow) void run(prompt);
    else show('Preset dimuat ke command bar · tekan JALANKAN');
  }, [run, show]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMode((m) => (m === 'cli' ? 'nexus' : 'cli'));
      }
      if (e.key === 'Escape' && mode === 'cli') setMode('nexus');
      if (e.key === '`' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openWindow('terminal');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, openWindow]);

  return (
    <div className={`app app--${mode}`}>
      <TopBar mode={mode} setMode={setMode} onOpenWindow={openWindow} />

      <main className="app-main">
        {mode === 'nexus' && (
          <div className="nexus">
            <div className="scene-layer">
              <Scene3D onSelectAgent={(id) => openWindow('dossier', id)} />
            </div>
            <div className="ui-layer">
              <LeftRail pillar={pillar} setPillar={setPillar} onPreset={onPreset} onOpenWindow={openWindow} />
              <SceneHud onOpenWindow={openWindow} />
              <CouncilStream onOpenWindow={openWindow} />
              <CommandBar value={command} setValue={setCommand} onRun={(now) => { if (now) void run(); }} busy={s.running} />
            </div>
          </div>
        )}

        {mode === 'desktop' && <Desktop request={request} />}

        {mode === 'cli' && <CliPage onOpenWindow={openWindow} />}
      </main>

      {booting && <BootOverlay onDone={finishBoot} />}
      <Toast text={toast} />
    </div>
  );
}

function CliPage({ onOpenWindow }: { onOpenWindow: (id: string) => void }) {
  const s = useOS();
  return (
    <div className="cli-page">
      <LyraTerminal full />
      <aside className="cli-side">
        <div className="cli-side__head">
          <TerminalSquare size={20} />
          <div><span className="eyebrow">CLI SURFACE</span><b>lyra@agentic-os</b></div>
        </div>
        <p>Perintah di sini memanggil <b>kernel yang sama</b> dengan Nexus 3D dan Desktop shell. Untuk proses native (spawn CLI asli), jalankan di terminalmu:</p>
        <div className="cli-side__code"><code>npm run lyra -- run "audit modul auth" --stream</code></div>

        <div className="cli-side__stats">
          <span><Activity size={13} /> <b>{s.metrics.runs}</b> runs</span>
          <span><Cpu size={13} /> <b>{s.metrics.messages}</b> pesan</span>
          <span><Zap size={13} /> <b>{(s.metrics.avgConfidence * 100).toFixed(0)}%</b> conf</span>
        </div>

        <span className="eyebrow">SURFACE LAIN</span>
        <div className="cli-side__links">
          <button onClick={() => onOpenWindow('nexus')}><Orbit size={14} /> Nexus 3D</button>
          <button onClick={() => onOpenWindow('agents')}><Cpu size={14} /> Agent Matrix</button>
          <button onClick={() => onOpenWindow('cyber')}><ShieldCheck size={14} /> Cyber Policy</button>
          <button onClick={() => onOpenWindow('settings')}><Activity size={14} /> Adapters</button>
        </div>

        <span className="eyebrow">PRESET CEPAT</span>
        <div className="cli-side__presets">
          {MISSIONS.slice(0, 5).map((m) => (
            <button key={m.id} onClick={() => void os.command(`mission ${m.id} --fast`)}>
              <i>{PILLARS[m.pillar].glyph}</i> {m.title}
            </button>
          ))}
        </div>
        <span className="cli-side__hint">Ctrl+K keluar · ↑/↓ riwayat · `help` untuk daftar perintah</span>
      </aside>
    </div>
  );
}
