import type { Artifact, Finding, TaskNode, Vote } from './types';

export interface Fact {
  id: string;
  source: string;
  statement: string;
  confidence: number;
  ts: number;
}

/** Shared memory yang bisa dibaca ke-4 harness + Lyra. */
export class Blackboard {
  facts: Fact[] = [];
  artifacts: Artifact[] = [];
  tasks: TaskNode[] = [];
  findings: Finding[] = [];
  votes: Vote[] = [];
  decisions: { key: string; value: string; ts: number }[] = [];
  riskFlags: string[] = [];

  reset(runId: string): void {
    this.facts = [];
    this.artifacts = [];
    this.tasks = [];
    this.findings = [];
    this.votes = [];
    this.decisions = [];
    this.riskFlags = [];
    this.decide('run.id', runId);
  }

  addFact(source: string, statement: string, confidence: number): Fact {
    const f = { id: `f-${this.facts.length + 1}`, source, statement, confidence, ts: Date.now() };
    this.facts.push(f);
    return f;
  }

  addArtifact(a: Artifact): void {
    this.artifacts = [a, ...this.artifacts].slice(0, 12);
  }

  decide(key: string, value: string): void {
    this.decisions = [...this.decisions.filter((d) => d.key !== key), { key, value, ts: Date.now() }];
  }

  flag(flag: string): void {
    if (!this.riskFlags.includes(flag)) this.riskFlags.push(flag);
  }

  snapshot(): Record<string, unknown> {
    return {
      facts: this.facts.length,
      artifacts: this.artifacts.length,
      decisions: Object.fromEntries(this.decisions.map((d) => [d.key, d.value])),
      riskFlags: this.riskFlags.slice(),
      avgConfidence: this.findings.length
        ? this.findings.reduce((s, f) => s + f.confidence, 0) / this.findings.length
        : 0,
    };
  }
}
