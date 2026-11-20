// ═══════════════════════════════════════════════════════════════
//  LYRA AGENTIC OS · Core contracts
//  Satu set tipe yang dipakai bersama oleh Web / Desktop / CLI.
// ═══════════════════════════════════════════════════════════════

export type HarnessId = 'claude-code' | 'antigravity' | 'hermes' | 'codex';
export type SpeakerId = HarnessId | 'lyra' | 'user' | 'system' | 'policy';
export type PillarId = 'everyday' | 'code' | 'analysis' | 'cyber';
export type SurfaceMode = 'web' | 'desktop' | 'cli';

export type Channel =
  | 'control'
  | 'task'
  | 'finding'
  | 'critique'
  | 'vote'
  | 'artifact'
  | 'audit'
  | 'system';

export type Phase =
  | 'idle'
  | 'intake'
  | 'classify'
  | 'policy'
  | 'plan'
  | 'delegate'
  | 'execute'
  | 'debate'
  | 'consensus'
  | 'synthesize'
  | 'complete'
  | 'blocked';

export interface HarnessProfile {
  id: HarnessId;
  name: string;
  vendor: string;
  codename: string;
  glyph: string;
  color: string;
  colorSoft: string;
  role: string;
  lens: string;
  tagline: string;
  model: string;
  strengths: string[];
  surfaces: {
    cli: { binary: string; command: string; env: string[]; note: string };
    desktop: { app: string; note: string };
  };
  capabilities: Record<PillarId, number>;
  weight: number;
  latencyHint: number;
}

export interface Envelope {
  id: string;
  seq: number;
  ts: number;
  from: SpeakerId;
  to: SpeakerId | 'broadcast';
  channel: Channel;
  phase: Phase;
  subject: string;
  body: string;
  correlationId: string;
  confidence?: number;
  refs?: string[];
  meta?: Record<string, string | number | boolean>;
}

export interface TaskNode {
  id: string;
  title: string;
  brief: string;
  pillar: PillarId;
  assignee: HarnessId;
  deps: string[];
  status: 'pending' | 'running' | 'done' | 'blocked';
  confidence?: number;
  summary?: string;
}

export interface Finding {
  taskId: string;
  agent: HarnessId;
  pillar: PillarId;
  thesis: string;
  sections: { heading: string; lines: string[] }[];
  signals: string[];
  risks: string[];
  confidence: number;
  wordCount: number;
}

export interface Critique {
  reviewer: HarnessId;
  target: HarnessId;
  challenge: string;
  endorsement: string;
  score: number;
  disagreement: boolean;
}

export interface Vote {
  voter: HarnessId;
  target: HarnessId;
  score: number;
  weight: number;
  reason: string;
}

export interface Artifact {
  id: string;
  title: string;
  kind: 'brief' | 'checklist' | 'trace' | 'policy' | 'plan';
  content: string;
  ts: number;
}

export interface MissionPreset {
  id: string;
  pillar: PillarId;
  title: string;
  prompt: string;
  hint: string;
  complexity: 1 | 2 | 3 | 4 | 5;
}

export interface PolicyVerdict {
  allowed: boolean;
  requiresApproval: boolean;
  level: 'safe' | 'guarded' | 'lab' | 'blocked';
  scope: string;
  sanitized: string;
  notes: string[];
  redactions: string[];
}

export interface Settings {
  mode: 'sim' | 'live' | 'auto';
  pace: number;
  labEnabled: boolean;
  labApproved: boolean;
  labScope: string;
  requireApproval: boolean;
  strictRedaction: boolean;
}

export interface Pulse {
  id: number;
  from: SpeakerId;
  to: SpeakerId | 'broadcast';
  channel: Channel;
  ts: number;
}

export interface ConsensusResult {
  winner: HarnessId;
  score: number;
  agreement: number;
  conflicts: number;
  resolution: string;
  votes: Vote[];
}

export interface RunOptions {
  pillar?: PillarId;
  live?: boolean;
  labApproved?: boolean;
  labScope?: string;
  pace?: number;
  signal?: AbortSignal;
}

export interface RunResult {
  ok: boolean;
  runId: string;
  pillar: PillarId;
  prompt: string;
  brief: string;
  consensus: ConsensusResult | null;
  findings: Finding[];
  tasks: TaskNode[];
  durationMs: number;
  blockedReason?: string;
}

export interface OSState {
  sessionId: string;
  phase: Phase;
  running: boolean;
  pillar: PillarId | null;
  prompt: string;
  runId: string | null;
  messages: Envelope[];
  tasks: TaskNode[];
  findings: Finding[];
  critiques: Critique[];
  artifacts: Artifact[];
  consensus: ConsensusResult | null;
  lastResult: RunResult | null;
  pulses: Pulse[];
  policy: PolicyVerdict | null;
  metrics: { runs: number; messages: number; avgConfidence: number; uptime: number };
  settings: Settings;
  startedAt: number;
}
