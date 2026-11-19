"use client";

import { useEffect } from "react";
import { useMission } from "./mission-store";
import { SCENARIOS } from "./missions";
import { useLocale } from "./locale-store";

/** Drives the simulated mission forward on a timer. */
export function useMissionRunner() {
  const running = useMission((s) => s.running);
  const cursor = useMission((s) => s.cursor);
  const scenarioId = useMission((s) => s.scenarioId);
  const speed = useMission((s) => s.speed);
  const gateOpen = useMission((s) => s.gateOpen);
  const tick = useMission((s) => s.tick);
  const pushLog = useMission((s) => s.pushLog);
  const locale = useLocale((s) => s.locale);

  useEffect(() => {
    if (!running || gateOpen) return;
    const s = SCENARIOS.find((x) => x.id === scenarioId)!;
    const step = s.steps[cursor];
    const delay = step ? Math.max(420, step.ms / speed) : 700 / speed;

    const id = setTimeout(() => {
      tick();
      // emit the harness "reasoning" texture after each step
      const next = s.steps[cursor + 1];
      if (next && next.kind === "think") {
        pushLog({ agent: next.agent, kind: "think", text: `↳ reasoning · ${next.title[locale]}` });
      }
    }, delay);

    return () => clearTimeout(id);
  }, [running, cursor, scenarioId, speed, gateOpen, tick, pushLog, locale]);
}
