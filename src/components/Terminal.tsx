import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Command, CornerDownLeft, TerminalSquare } from 'lucide-react';
import { os } from '../core';
import { useOS } from '../hooks';

interface TLine { id: number; kind: 'sys' | 'input' | 'out' | 'ok' | 'err' | 'gold'; text: string }

const WELCOME = [
  '✧  LYRA AGENTIC OS · command surface  ✧',
  '   Local Council aktif · 4 harness terhubung · ketik `help`',
  '   Web / Desktop / CLI memakai kernel yang sama.',
];

const QUICK = ['help', 'agents', 'missions', 'status', 'adapters', 'mission code-auth --fast', 'doctor', 'model'];

let seq = 0;
const mk = (kind: TLine['kind'], text: string): TLine => ({ id: ++seq, kind, text });

export function LyraTerminal({ full = false }: { full?: boolean }) {
  const s = useOS();
  const [lines, setLines] = useState<TLine[]>(() => WELCOME.map((t) => mk('sys', t)));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  const classifyLine = (text: string): TLine['kind'] => {
    if (text === '@@CLEAR@@') return 'sys';
    if (text.startsWith('✓') || text.startsWith('◆')) return 'ok';
    if (text.startsWith('■') || text.startsWith('Perintah tidak') || text.startsWith('✗')) return 'err';
    if (text.startsWith('▶') || text.startsWith('#') || text.startsWith('LYRA')) return 'gold';
    return 'out';
  };

  const execute = async (raw: string) => {
    const cmd = raw.trim();
    if (!cmd || busy) return;
    setCmdHistory((h) => [cmd, ...h].slice(0, 40));
    setHIndex(-1);
    setInput('');
    setLines((l) => [...l, mk('input', cmd)]);
    if (cmd === 'clear' || cmd === 'cls') { setLines([]); return; }
    setBusy(true);
    try {
      const out = await os.command(cmd);
      if (out.includes('@@CLEAR@@')) { setLines([]); return; }
      setLines((l) => [...l, ...out.map((t) => mk(classifyLine(t), t))]);
    } catch (err) {
      setLines((l) => [...l, mk('err', `✗ ${err instanceof Error ? err.message : String(err)}`)]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className={`terminal ${full ? 'terminal--full' : ''}`} onClick={() => inputRef.current?.focus()}>
      <div className="terminal__bar">
        <TerminalSquare size={13} />
        <b>lyra@agentic-os</b>
        <span>~/harness</span>
        <i>{s.phase}</i>
        <span className="terminal__mode">mode:{s.settings.mode}</span>
      </div>

      <div className="terminal__screen" ref={scrollRef}>
        {lines.map((l) => (
          <div key={l.id} className={`tline tline--${l.kind}`}>
            {l.kind === 'input' && <span className="tline__prompt">lyra ›</span>}
            <span>{l.text}</span>
          </div>
        ))}
        {busy && <div className="tline tline--sys"><span className="terminal__cursor" /> menjalankan orkestrasi…</div>}
      </div>

      <div className="terminal__quick">
        {QUICK.map((q) => <button key={q} onClick={() => void execute(q)}><ChevronRight size={11} />{q}</button>)}
      </div>

      <div className="terminal__entry">
        <span className="terminal__prompt">✧ lyra ›</span>
        <input
          ref={inputRef}
          value={input}
          placeholder="ketik perintah… (help)"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); void execute(input); }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              const i = Math.min(cmdHistory.length - 1, hIndex + 1);
              if (i >= 0) { setHIndex(i); setInput(cmdHistory[i]); }
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              const i = Math.max(-1, hIndex - 1);
              setHIndex(i);
              setInput(i >= 0 ? cmdHistory[i] : '');
            }
          }}
        />
        <button onClick={() => void execute(input)} title="Jalankan"><CornerDownLeft size={14} /></button>
      </div>

      {full && (
        <div className="terminal__foot">
          <Command size={12} /> Ctrl+K kembali ke Nexus · ↑/↓ riwayat · <code>npm run lyra</code> untuk CLI Node asli
        </div>
      )}
    </div>
  );
}
