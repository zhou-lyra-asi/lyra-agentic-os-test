import { AGENTS, AGENT_MAP, PILLARS, capabilityScore } from './agents';
import { invokeLive } from './adapters';
import type { AdapterStatus } from './adapters';
import type { Blackboard } from './blackboard';
import type { MessageBus } from './bus';
import type { CyberPolicy } from './policy';
import {
  analyse,
  buildChecklist,
  classify,
  critique,
  makeContext,
  synthesise,
  vote,
  type AnalysisContext,
} from './reasoning';
import type {
  Artifact,
  ConsensusResult,
  Critique,
  Finding,
  HarnessId,
  OSState,
  Phase,
  PillarId,
  RunOptions,
  RunResult,
  Settings,
  TaskNode,
  Vote,
} from './types';
import { round, sleep, truncate, uid } from './util';

export interface RunHost {
  bus: MessageBus;
  board: Blackboard;
  policy: CyberPolicy;
  settings: Settings;
  adapters: AdapterStatus[];
  emit(patch: Partial<OSState>): void;
}

function phase(host: RunHost, p: Phase): void {
  host.emit({ phase: p });
}

function ctrl(host: RunHost, p: Phase, subject: string, body: string, from: 'lyra' | 'system' | 'policy' = 'lyra'): void {
  host.bus.publish({ from, to: 'broadcast', channel: 'control', phase: p, subject, body });
}

export async function runMission(host: RunHost, prompt: string, options: RunOptions = {}): Promise<RunResult> {
  const started = Date.now();
  const pace = options.pace ?? host.settings.pace ?? 140;
  const tick = (k = 1) => sleep(pace * k);
  const aborted = () => Boolean(options.signal?.aborted);
  const runId = host.bus.newRun();
  host.board.reset(runId);

  host.emit({
    running: true,
    phase: 'intake',
    prompt,
    runId,
    pillar: null,
    messages: [],
    tasks: [],
    findings: [],
    critiques: [],
    artifacts: [],
    consensus: null,
    lastResult: null,
    policy: null,
  });

  ctrl(host, 'intake', 'Misi diterima', `Lyra menerima permintaan: "${truncate(prompt, 120)}"`);
  host.bus.publish({ from: 'user', to: 'lyra', channel: 'task', phase: 'intake', subject: 'Directive', body: prompt });
  await tick(0.35);

  // ── 1 · Klasifikasi ────────────────────────────────────────────
  phase(host, 'classify');
  const detected = classify(prompt);
  const pillar: PillarId = options.pillar ?? detected.pillar;
  host.emit({ pillar });
  ctrl(host, 'classify', 'Routing intent', `${PILLARS[pillar].label} terpilih. ${detected.reason}`);
  host.bus.publish({
    from: 'lyra', to: 'broadcast', channel: 'system', phase: 'classify', subject: 'Intent scores',
    body: (Object.keys(detected.scores) as PillarId[]).map((p) => `${p}:${detected.scores[p]}`).join(' · '),
  });
  await tick(0.7);
  if (aborted()) return blocked(host, runId, pillar, prompt, started, 'Misi dibatalkan oleh pengguna.');

  // ── 2 · Policy gate ─────────────────────────────────────────────
  phase(host, 'policy');
  const verdict = host.policy.evaluate(pillar, prompt, {
    approved: options.labApproved ?? host.settings.labApproved,
    scope: options.labScope ?? host.settings.labScope,
  });
  host.emit({ policy: verdict });
  for (const line of [`policy.level=${verdict.level}`, `policy.scope=${verdict.scope}`, ...verdict.notes]) {
    host.bus.publish({ from: 'policy', to: 'broadcast', channel: 'audit', phase: 'policy', subject: 'Policy gate', body: line });
  }
  await tick(0.55);
  if (!verdict.allowed) {
    const reason = verdict.requiresApproval
      ? `Simulasi lab membutuhkan persetujuan eksplisit untuk scope "${verdict.scope}".`
      : 'Permintaan ditolak oleh Cyber Policy Guard (lihat audit trail).';
    return blocked(host, runId, pillar, prompt, started, reason, verdict);
  }

  // ── 3 · Perencanaan (DAG) ───────────────────────────────────────
  phase(host, 'plan');
  const ctx: AnalysisContext = makeContext(prompt, pillar, verdict, runId);
  const ordered = [...AGENTS].sort((a, b) => capabilityScore(b, pillar) - capabilityScore(a, pillar));
  const tasks: TaskNode[] = ordered.map((a, i) => ({
    id: `T${i + 1}`,
    title: `${a.codename} · ${a.role}`,
    brief: `Selidiki "${truncate(prompt, 70)}" melalui lensa ${a.lens}. Keluarkan temuan terstruktur beserta risiko.`,
    pillar,
    assignee: a.id,
    deps: i === 0 ? ['plan'] : ['plan', `T${i}`],
    status: 'pending',
  }));
  host.board.tasks = tasks;
  host.emit({ tasks: tasks.slice() });
  ctrl(host, 'plan', 'Dekomposisi misi', `${tasks.length} work item · DAG: plan → ${tasks.map((t) => t.id).join(' → ')} · fan-out paralel setelah delegasi.`);
  await tick(0.8);

  // ── 4 · Delegasi ────────────────────────────────────────────────
  phase(host, 'delegate');
  for (const t of tasks) {
    if (aborted()) return blocked(host, runId, pillar, prompt, started, 'Misi dibatalkan saat delegasi.');
    host.bus.publish({
      from: 'lyra', to: t.assignee, channel: 'task', phase: 'delegate', subject: t.id,
      body: t.brief, refs: t.deps,
    });
    await tick(0.22);
  }

  // ── 5 · Eksekusi paralel ────────────────────────────────────────
  phase(host, 'execute');
  const useLive = Boolean(options.live) && host.adapters.some((a) => a.available);
  const findings: Finding[] = [];
  const taskStates = tasks.map((t) => ({ ...t }));

  const runTask = async (task: TaskNode, index: number): Promise<void> => {
    const agent = AGENT_MAP[task.assignee];
    taskStates[index].status = 'running';
    host.emit({ tasks: taskStates.map((t) => ({ ...t })) });
    await tick(0.35 + (agent.latencyHint / 1000) * (index % 2 ? 1.25 : 0.8));

    let finding = analyse(ctx, agent, task.id);

    if (useLive && host.adapters.find((a) => a.id === agent.id)?.available) {
      const live = await invokeLive(agent.id, task.brief, 45000);
      if (live.ok) {
        finding = {
          ...finding,
          sections: [
            ...finding.sections,
            {
              heading: `${finding.sections.length + 1} · Live harness · ${agent.name}`,
              lines: live.output.split('\n').filter(Boolean).slice(0, 6).map((l) => l.slice(0, 220)),
            },
          ],
          confidence: Math.min(0.98, finding.confidence + 0.03),
        };
        host.bus.publish({
          from: agent.id, to: 'lyra', channel: 'audit', phase: 'execute', subject: 'Live adapter',
          body: `${agent.name} merespons dalam ${live.durationMs}ms · ${live.output.length} karakter diterima di blackboard.`,
        });
      } else {
        host.bus.publish({
          from: agent.id, to: 'lyra', channel: 'audit', phase: 'execute', subject: 'Adapter fallback',
          body: `${agent.name}: ${live.error ?? 'tidak ada respons'} → fallback ke Local Council engine.`,
        });
      }
    }

    taskStates[index].status = 'done';
    taskStates[index].confidence = finding.confidence;
    taskStates[index].summary = truncate(finding.thesis, 96);
    findings.push(finding);
    host.board.findings.push(finding);
    host.board.addFact(agent.name, finding.thesis, finding.confidence);
    finding.risks.forEach((r) => host.board.flag(r));

    host.bus.publish({
      from: agent.id, to: 'broadcast', channel: 'finding', phase: 'execute', subject: `${task.id} · temuan`,
      body: finding.thesis, confidence: finding.confidence, refs: [task.id],
      meta: { sections: finding.sections.length, signals: finding.signals.length, words: finding.wordCount },
    });
    for (const s of finding.sections.slice(0, 2)) {
      host.bus.publish({
        from: agent.id, to: 'broadcast', channel: 'finding', phase: 'execute', subject: s.heading,
        body: s.lines.join(' '), confidence: finding.confidence, refs: [task.id],
      });
    }
    host.emit({ tasks: taskStates.map((t) => ({ ...t })), findings: findings.slice() });
  };

  await Promise.all(tasks.map((t, i) => runTask(t, i)));
  if (aborted()) return blocked(host, runId, pillar, prompt, started, 'Misi dibatalkan saat eksekusi.');
  await tick(0.3);

  // ── 6 · Debate round ────────────────────────────────────────────
  phase(host, 'debate');
  const critiques: Critique[] = [];
  for (let i = 0; i < AGENTS.length; i++) {
    const reviewer = AGENTS[i];
    const target = findings[i % findings.length];
    if (!target) continue;
    const c = critique(ctx, reviewer, target);
    critiques.push(c);
    host.bus.publish({
      from: reviewer.id, to: target.agent, channel: 'critique', phase: 'debate',
      subject: `Kritik → ${AGENT_MAP[target.agent].codename}`, body: c.challenge,
      confidence: c.score, meta: { disagreement: c.disagreement },
    });
    host.emit({ critiques: critiques.slice() });
    await tick(0.32);
  }

  // ── 7 · Konsensus berbobot ──────────────────────────────────────
  phase(host, 'consensus');
  const votes: Vote[] = critiques.map((c) => vote(ctx, AGENT_MAP[c.reviewer], c.target, c));
  host.board.votes = votes;
  const totals = new Map<HarnessId, { sum: number; weight: number }>();
  for (const v of votes) {
    const cur = totals.get(v.target) ?? { sum: 0, weight: 0 };
    cur.sum += v.score * v.weight;
    cur.weight += v.weight;
    totals.set(v.target, cur);
    host.bus.publish({
      from: v.voter, to: v.target, channel: 'vote', phase: 'consensus', subject: 'Weighted vote',
      body: `${(v.score * 100).toFixed(0)}% · bobot ${v.weight.toFixed(2)} · ${truncate(v.reason, 90)}`,
      confidence: v.score,
    });
  }
  for (const [id, v] of totals) {
    const self = AGENT_MAP[id];
    totals.set(id, { sum: v.sum + capabilityScore(self, pillar) * 0.82, weight: v.weight + self.weight });
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1].sum / b[1].weight - a[1].sum / a[1].weight);
  const winner = ranked[0]?.[0] ?? ordered[0].id;
  const score = round(ranked[0] ? ranked[0][1].sum / ranked[0][1].weight : 0);
  const avg = votes.length ? votes.reduce((s, v) => s + v.score, 0) / votes.length : 0;
  const variance = votes.length ? votes.reduce((s, v) => s + (v.score - avg) ** 2, 0) / votes.length : 0;
  const conflicts = critiques.filter((c) => c.disagreement).length;
  const agreement = round(1 - Math.min(1, Math.sqrt(variance) * 2.4 + conflicts * 0.055), 3);
  const consensus: ConsensusResult = {
    winner,
    score,
    agreement,
    conflicts,
      resolution:
      conflicts > 0
        ? `${conflicts} reservasi dicatat, bukan dihapus. Lyra menggabungkan ${AGENT_MAP[winner].codename} sebagai kerangka utama dan menurunkan bobot klaim tanpa bukti pembeda.`
        : `Debat konvergen tanpa reservasi berarti; ${AGENT_MAP[winner].codename} memimpin sintesis final.`,
    votes,
  };
  host.emit({ consensus });
  host.board.decide('consensus.winner', winner);
  ctrl(host, 'consensus', 'Konsensus tercapai', `Pemenang ${AGENT_MAP[winner].name} · skor ${(score * 100).toFixed(1)}% · agreement ${(agreement * 100).toFixed(0)}% · ${conflicts} konflik.`);
  await tick(0.55);

  // ── 8 · Sintesis & artefak ──────────────────────────────────────
  phase(host, 'synthesize');
  const brief = synthesise(ctx, findings, critiques, votes, consensus, Date.now() - started);
  const artifacts: Artifact[] = [
    { id: uid('art'), title: 'Council Brief · Markdown', kind: 'brief', content: brief, ts: Date.now() },
    { id: uid('art'), title: 'Execution Checklist', kind: 'checklist', content: buildChecklist(ctx, findings), ts: Date.now() },
    {
      id: uid('art'), title: 'Run Trace · JSON', kind: 'trace',
      content: JSON.stringify({
        runId, pillar, prompt, verdict,
        tasks: taskStates,
        findings: findings.map((f) => ({ agent: f.agent, confidence: f.confidence, thesis: f.thesis, signals: f.signals })),
        critiques, votes, consensus,
        durationMs: Date.now() - started,
      }, null, 2), ts: Date.now(),
    },
  ];
  artifacts.forEach((a) => {
    host.board.addArtifact(a);
    host.bus.publish({ from: 'lyra', to: 'broadcast', channel: 'artifact', phase: 'synthesize', subject: a.title, body: `${a.content.length} karakter · ${a.kind}` });
  });
  host.emit({ artifacts: host.board.artifacts.slice() });
  await tick(0.35);

  const result: RunResult = {
    ok: true,
    runId,
    pillar,
    prompt,
    brief,
    consensus,
    findings,
    tasks: taskStates,
    durationMs: Date.now() - started,
  };

  phase(host, 'complete');
  // LyraOS menurunkan metrik (runs / messages / avgConfidence / uptime) dari state.
  host.emit({ running: false, lastResult: result });
  ctrl(host, 'complete', 'Misi selesai', `Sintesis final siap · ${artifacts.length} artefak · ${findings.length} temuan · ${(result.durationMs / 1000).toFixed(1)}s.`);
  return result;
}

function blocked(
  host: RunHost, runId: string, pillar: PillarId, prompt: string, started: number,
  reason: string, verdict?: OSState['policy'],
): RunResult {
  phase(host, 'blocked');
  host.bus.publish({ from: 'policy', to: 'broadcast', channel: 'control', phase: 'blocked', subject: 'Misi ditahan', body: reason });
  const brief = verdict
    ? `# LYRA · Policy Gate\n\n${reason}\n\n## Audit\n\n${verdict.notes.map((n) => `- ${n}`).join('\n')}\n`
    : `# LYRA · Misi Dihentikan\n\n${reason}\n`;
  const artifact: Artifact = { id: uid('art'), title: 'Policy Decision', kind: 'policy', content: brief, ts: Date.now() };
  host.board.addArtifact(artifact);
  host.emit({ running: false, artifacts: host.board.artifacts.slice(), lastResult: null });
  return { ok: false, runId, pillar, prompt, brief, consensus: null, findings: [], tasks: [], durationMs: Date.now() - started, blockedReason: reason };
}
