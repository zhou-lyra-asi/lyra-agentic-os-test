#!/usr/bin/env tsx
// ═══════════════════════════════════════════════════════════════
//  lyra · CLI surface of Lyra Agentic OS
//  Kernel yang SAMA dengan website & Desktop shell.
//    npm run lyra -- help
//    npm run lyra -- run "audit modul auth" --pillar=code --stream
//    npm run lyra -- mission cyber-lab --approve --stream
//    npm run lyra -- doctor
//    npm run lyra            (REPL interaktif)
// ═══════════════════════════════════════════════════════════════
import { AGENT_MAP, os, SPEAKER_COLOR } from '../core/index';

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  gold: '\x1b[38;5;222m', blue: '\x1b[38;5;111m', green: '\x1b[38;5;115m',
  red: '\x1b[38;5;204m', violet: '\x1b[38;5;183m', cyan: '\x1b[38;5;117m',
};

function paint(s: string, color: keyof typeof C): string {
  return `${C[color]}${s}${C.reset}`;
}

function hexToAnsi(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `\x1b[38;2;${(n >> 16) & 255};${(n >> 8) & 255};${n & 255}m`;
}

function banner(): string[] {
  return [
    '',
    paint('        ✧  L Y R A   A G E N T I C   O S  ✧', 'gold'),
    paint('   Different Worlds · Same Desire · One Harness', 'dim'),
    paint('   Claude Code ⟷ Antigravity ⟷ Hermes ⟷ Codex', 'dim'),
    paint(`   session ${os.sessionId}  ·  mode ${os.settings.mode}  ·  ketik help`, 'dim'),
    '',
  ];
}

function printLines(lines: string[]): void {
  for (const l of lines) console.log(l === '@@CLEAR@@' ? '\x1b[2J\x1b[H' : l);
}

async function execute(line: string, stream = false): Promise<void> {
  if (line.trim() === 'exit' || line.trim() === 'quit') {
    console.log(paint('Sampai jumpa, sobat. ✧', 'gold'));
    process.exit(0);
  }
  let unsub: (() => void) | undefined;
  if (stream) {
    unsub = os.bus.subscribe((env) => {
      const color = SPEAKER_COLOR[env.from] ?? '#c9c9c9';
      const label = `${hexToAnsi(color)}${env.from.padEnd(12)}${C.reset}`;
      const ch = paint(`[${env.channel}/${env.phase}]`, 'dim');
      const subject = paint(env.subject.slice(0, 46), 'bold');
      console.log(`${C.dim}${new Date(env.ts).toLocaleTimeString('id-ID', { hour12: false })}${C.reset} ${label} ${ch} ${subject} ${C.dim}${env.body.slice(0, 110)}${C.reset}`);
    });
  }
  try {
    const lines = await os.command(line);
    printLines(lines.map((l) =>
      l.startsWith('✓') ? paint(l, 'green') :
      l.startsWith('■') || l.startsWith('Perintah tidak') ? paint(l, 'red') :
      l.startsWith('▶') || l.startsWith('◆') ? paint(l, 'gold') :
      l.startsWith('#') ? paint(l, 'bold') : l,
    ));
  } catch (err) {
    console.log(paint(`✗ ${err instanceof Error ? err.message : String(err)}`, 'red'));
  } finally {
    unsub?.();
  }
  console.log();
}

async function repl(): Promise<void> {
  const { createInterface } = await import('node:readline');
  printLines(banner());
  const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: paint('lyra › ', 'gold') });
  rl.prompt();
  rl.on('line', async (line) => {
    if (line.trim() === 'exit' || line.trim() === 'quit') { rl.close(); return; }
    await execute(line, false);
    rl.prompt();
  });
  rl.on('close', () => { console.log(paint('\n✧ session closed', 'dim')); process.exit(0); });
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (!argv.length) { await repl(); return; }
  const stream = argv.includes('--stream');
  const args = argv.filter((a) => a !== '--stream');
  const line = args.join(' ');
  if (args[0] === 'help' || args[0] === 'agents' || args[0] === 'pillars') printLines(banner());
  await execute(line, stream && ['run', 'mission'].includes(args[0]));
  if (args[0] === 'doctor') {
    const live = os.adapters.filter((a) => a.available);
    console.log(paint(`   live binaries: ${live.length ? live.map((a) => a.name).join(', ') : 'tidak ada — Local Council aktif'}`, 'dim'));
    console.log(paint(`   consensus winner terakhir: ${os.getSnapshot().consensus ? AGENT_MAP[os.getSnapshot().consensus!.winner].name : '—'}`, 'dim'));
  }
}

void main();
