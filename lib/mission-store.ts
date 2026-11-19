"use client";

import { create } from "zustand";
import { SCENARIOS, type Scenario, type Step } from "./missions";
import type { HarnessId } from "./harnesses";

export type StepRun = {
  stepId: string;
  status: "queued" | "active" | "done" | "blocked" | "skipped";
  at: number;
};

export type LogLine = {
  id: string;
  agent: HarnessId | "lyra";
  kind: "plan" | "think" | "step" | "tool" | "verify" | "handoff" | "gate" | "artifact" | "done" | "system";
  text: string;
  ts: number;
};

export type useMissionState = {
  scenarioId: string;
  running: boolean;
  finished: boolean;
  cursor: number;
  startedAt: number | null;
  steps: StepRun[];
  logs: LogLine[];
  activeAgent: HarnessId | "lyra";
  gateOpen: boolean;
  gateStep: Step | null;
  gateResolved: "approved" | "denied" | null;
  speed: number;
  planRevealed: number;

  setScenario: (id: string) => void;
  run: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  resolveGate: (v: "approved" | "denied") => void;
  setSpeed: (s: number) => void;
  pushLog: (l: Omit<LogLine, "id" | "ts">) => void;
};

const scenario = (): Scenario => SCENARIOS[0];

function initialSteps(s: Scenario): StepRun[] {
  return s.steps.map((st) => ({ stepId: st.id, status: "queued", at: 0 }));
}

export const useMission = create<useMissionState>()((set, get) => ({
  scenarioId: SCENARIOS[0].id,
  running: false,
  finished: false,
  cursor: 0,
  startedAt: null,
  steps: initialSteps(SCENARIOS[0]),
  logs: [],
  activeAgent: "lyra",
  gateOpen: false,
  gateStep: null,
  gateResolved: null,
  speed: 1,
  planRevealed: 0,

  setScenario: (id) => {
    const s = SCENARIOS.find((x) => x.id === id) ?? SCENARIOS[0];
    set({
      scenarioId: s.id,
      running: false,
      finished: false,
      cursor: 0,
      startedAt: null,
      steps: initialSteps(s),
      logs: [],
      activeAgent: "lyra",
      gateOpen: false,
      gateStep: null,
      gateResolved: null,
      planRevealed: 0,
    });
  },

  run: () => {
    const st = get();
    if (st.finished) return;
    if (st.cursor === 0 && st.logs.length === 0) {
      const s = SCENARIOS.find((x) => x.id === st.scenarioId)!;
      set({
        logs: [
          {
            id: "sys-plan",
            agent: "lyra",
            kind: "plan",
            text: `Intent compiled → ${s.plan.length} mission phases → routing to 4 harnesses`,
            ts: Date.now(),
          },
        ],
        planRevealed: s.plan.length,
        startedAt: Date.now(),
      });
    }
    set({ running: true });
  },

  pause: () => set({ running: false }),

  reset: () => {
    const s = SCENARIOS.find((x) => x.id === get().scenarioId)!;
    set({
      running: false,
      finished: false,
      cursor: 0,
      startedAt: null,
      steps: initialSteps(s),
      logs: [],
      activeAgent: "lyra",
      gateOpen: false,
      gateStep: null,
      gateResolved: null,
      planRevealed: 0,
    });
  },

  tick: () => {
    const st = get();
    const s = SCENARIOS.find((x) => x.id === st.scenarioId)!;
    if (!st.running || st.gateOpen) return;

    if (st.cursor >= s.steps.length) {
      set({
        running: false,
        finished: true,
        activeAgent: "lyra",
        logs: [
          ...st.logs,
          {
            id: `done-${Date.now()}`,
            agent: "lyra",
            kind: "done",
            text: s.outcome.id,
            ts: Date.now(),
          },
        ],
      });
      return;
    }

    const step = s.steps[st.cursor];
    const steps = st.steps.map((x) =>
      x.stepId === step.id ? { ...x, status: "done" as const, at: Date.now() } : x
    );

    const log: LogLine = {
      id: `${step.id}-${Date.now()}`,
      agent: step.agent,
      kind: step.kind === "approval" ? "gate" : step.kind,
      text:
        step.kind === "handoff"
          ? `⇄ handoff → ${step.title.id}`
          : step.artifact
            ? `◆ ${step.artifact.name}`
            : step.title.id,
      ts: Date.now(),
    };

    const nextCursor = st.cursor + 1;
    const nextStep = s.steps[nextCursor];
    const isGate = step.kind === "approval";

    set({
      cursor: nextCursor,
      steps,
      logs: [...st.logs, log],
      activeAgent: nextStep ? nextStep.agent : "lyra",
      gateOpen: isGate,
      gateStep: isGate ? step : null,
    });
  },

  resolveGate: (v) => {
    const st = get();
    set({
      gateOpen: false,
      gateResolved: v,
      logs: [
        ...st.logs,
        {
          id: `gate-${Date.now()}`,
          agent: "lyra",
          kind: "system",
          text: v === "approved" ? "✓ human approval granted — write unlocked" : "✕ denied — mission halted at gate",
          ts: Date.now(),
        },
      ],
      running: v === "approved",
    });
  },

  setSpeed: (speed) => set({ speed }),

  pushLog: (l) => set({ logs: [...get().logs, { ...l, id: `manual-${Date.now()}`, ts: Date.now() }] }),
}));

export { SCENARIOS };
