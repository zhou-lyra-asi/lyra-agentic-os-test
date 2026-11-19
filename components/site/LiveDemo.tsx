"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import Link from "next/link";
import { Play, RotateCcw, Lock, ArrowRight, CircleDot } from "lucide-react";
import { useT, useL, useLocale } from "@/lib/locale-store";
import { useMission } from "@/lib/mission-store";
import { SCENARIOS } from "@/lib/missions";
import { HARNESSES, harnessById } from "@/lib/harnesses";
import { SectionHeader, GoldButton } from "@/components/ui/primitives";
import { useMissionRunner } from "@/lib/use-runner";

export default function LiveDemo() {
  const { t } = useT();
  const { l } = useL();
  const locale = useLocale((s) => s.locale);
  const m = useMission();
  const logRef = useRef<HTMLDivElement>(null);
  useMissionRunner();

  const scenario = SCENARIOS.find((s) => s.id === m.scenarioId)!;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [m.logs.length]);

  const active = HARNESSES.find((h) => h.id === m.activeAgent);
  const progress = m.steps.filter((s) => s.status === "done").length / m.steps.length;

  return (
    <section id="live" className="relative overflow-hidden py-24 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(214,176,121,0.07),transparent_68%)] blur-3xl" />
      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader eyebrow={t("live.eyebrow")} title={t("live.title")} body={t("live.body")} />
          <div className="hidden lg:block">
            <GoldButton href="/console">{t("live.cta")}</GoldButton>
          </div>
        </div>

        <div className="glass-strong grain relative mt-12 overflow-hidden rounded-xl2">
          {/* title bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/12 px-5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e0564a]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#e0b04a]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#6fd3ad]/70" />
              <span className="ml-2 font-mono text-[10px] tracking-[0.2em] text-mist/50">LYRA://CONSOLE</span>
            </div>
            <div className="flex items-center gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => m.setScenario(s.id)}
                  className={clsx(
                    "rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] uppercase transition-colors",
                    m.scenarioId === s.id
                      ? "border-gold/45 bg-gold/10 text-gold-bright"
                      : "border-gold/12 text-mist/55 hover:border-gold/30 hover:text-sand/80"
                  )}
                >
                  {s.mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px]">
            {/* left: intent + plan + log */}
            <div className="border-b border-gold/10 p-5 lg:border-b-0 lg:border-r">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08]">
                  <CircleDot className="h-3 w-3 text-gold-bright" />
                </div>
                <div>
                  <div className="font-mono text-[9px] tracking-[0.24em] text-gold/60 uppercase">{t("os.mission")}</div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ivory/88">{l(scenario.intent)}</p>
                </div>
              </div>

              {/* plan */}
              <div className="mt-5 grid gap-1.5 sm:grid-cols-2">
                {scenario.plan.map((p, i) => {
                  const revealed = m.planRevealed > i;
                  return (
                    <div
                      key={p.en}
                      className={clsx(
                        "flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-all duration-500",
                        revealed ? "border-gold/18 bg-white/[0.022]" : "border-transparent bg-transparent"
                      )}
                    >
                      <span
                        className={clsx(
                          "font-mono text-[9px]",
                          revealed ? "text-gold/70" : "text-mist/25"
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={clsx("text-[11.5px] leading-snug", revealed ? "text-sand/75" : "text-mist/25")}>
                        {l(p)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* log */}
              <div
                ref={logRef}
                className="mt-5 h-[230px] overflow-y-auto rounded-lg border border-gold/10 bg-black/35 p-3 font-mono text-[11px] leading-relaxed"
              >
                {m.logs.length === 0 && (
                  <div className="flex h-full items-center justify-center text-[11px] text-mist/40">{t("os.empty")}</div>
                )}
                {m.logs.map((line) => {
                  const h = line.agent === "lyra" ? null : harnessById(line.agent);
                  return (
                    <div key={line.id} className="flex items-start gap-2 py-[2px]">
                      <span className="shrink-0 text-mist/30">›</span>
                      <span className="w-[86px] shrink-0 truncate" style={{ color: h ? h.accent : "#d6b079" }}>
                        {line.agent === "lyra" ? "lyra.core" : h?.handle}
                      </span>
                      <span className="min-w-0 flex-1 break-words text-sand/70">{line.text}</span>
                    </div>
                  );
                })}
                {m.running && (
                  <div className="flex items-center gap-2 pt-1 text-gold/70">
                    <span className="animate-blink">▌</span>
                    <span className="text-mist/40">{active ? active.name : "lyra"}</span>
                  </div>
                )}
              </div>

              {/* controls */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={m.running ? m.pause : m.run}
                  disabled={m.finished}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold-bright to-gold px-4 py-2 text-[11px] font-medium tracking-[0.1em] text-[#231708] uppercase transition-all hover:shadow-[0_0_28px_-8px_rgba(242,216,166,0.7)] disabled:opacity-35"
                >
                  <Play className="h-3 w-3" />
                  {m.finished ? t("live.done") : m.running ? t("live.thinking") : t("live.run")}
                </button>
                <button
                  onClick={m.reset}
                  className="inline-flex items-center gap-2 rounded-full border border-gold/25 px-4 py-2 text-[11px] tracking-[0.1em] text-sand/75 uppercase transition-colors hover:border-gold/55 hover:text-ivory"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t("live.reset")}
                </button>
                <div className="ml-auto flex items-center gap-2 font-mono text-[9.5px] tracking-[0.16em] text-mist/45 uppercase">
                  <span>{l({ id: "kecepatan", en: "speed" })}</span>
                  {[1, 2, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => m.setSpeed(s)}
                      className={clsx(
                        "rounded px-1.5 py-0.5 transition-colors",
                        m.speed === s ? "bg-gold/18 text-gold-bright" : "text-mist/45 hover:text-sand/80"
                      )}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* right: agents */}
            <div className="p-5">
              <div className="font-mono text-[9px] tracking-[0.24em] text-gold/60 uppercase">{t("os.agents")}</div>
              <div className="mt-3 space-y-2">
                {HARNESSES.map((h) => {
                  const isActive = m.activeAgent === h.id && (m.running || m.gateOpen);
                  const doneCount = m.steps.filter(
                    (s) => s.status === "done" && scenario.steps.find((x) => x.id === s.stepId)?.agent === h.id
                  ).length;
                  return (
                    <div
                      key={h.id}
                      className="relative flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-500"
                      style={{
                        borderColor: isActive ? `${h.accent}66` : "rgba(214,176,121,0.1)",
                        background: isActive ? `${h.accent}12` : "rgba(255,255,255,0.012)",
                        boxShadow: isActive ? `0 0 34px -16px ${h.accent}` : undefined,
                      }}
                    >
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg border text-[12px]"
                        style={{ borderColor: `${h.accent}44`, color: h.accentSoft }}
                      >
                        {h.mark}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-ivory/85">{h.name}</span>
                          <span className="font-mono text-[9px] text-mist/45">{doneCount}×</span>
                        </div>
                        <div className="mt-0.5 font-mono text-[8.5px] tracking-wider text-mist/45">
                          {l(h.role)}
                        </div>
                      </div>
                      {isActive && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: h.accent }} />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: h.accent }} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* progress */}
              <div className="mt-5">
                <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.16em] text-mist/50 uppercase">
                  <span>{t("os.timeline")}</span>
                  <span className="text-gold/70">{Math.round(progress * 100)}%</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-ember via-gold to-gold-bright transition-all duration-700"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>

              {/* gate */}
              <div
                className={clsx(
                  "mt-4 overflow-hidden rounded-xl border transition-all duration-500",
                  m.gateOpen ? "border-ember/45 bg-ember/[0.08] p-3.5 opacity-100" : "border-transparent p-0 opacity-0"
                )}
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-ember" />
                  <span className="font-mono text-[9.5px] tracking-[0.2em] text-ember uppercase">{t("os.approval")}</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-sand/70">
                  {m.gateStep ? l(m.gateStep.gate!.reason) : ""}
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => m.resolveGate("approved")}
                    className="flex-1 rounded-lg bg-ember/90 py-1.5 text-[10.5px] font-medium tracking-[0.1em] text-[#1a0d05] uppercase transition-colors hover:bg-ember"
                  >
                    {t("os.approve")}
                  </button>
                  <button
                    onClick={() => m.resolveGate("denied")}
                    className="flex-1 rounded-lg border border-ember/40 py-1.5 text-[10.5px] tracking-[0.1em] text-ember/85 uppercase transition-colors hover:bg-ember/10"
                  >
                    {t("os.deny")}
                  </button>
                </div>
              </div>

              {m.finished && (
                <div className="mt-4 animate-rise rounded-xl border border-halo/25 bg-halo/[0.06] p-3.5">
                  <div className="font-mono text-[9px] tracking-[0.2em] text-halo uppercase">
                    {l({ id: "hasil", en: "outcome" })}
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-sand/78">{l(scenario.outcome)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gold/10 px-5 py-2.5">
            <span className="font-mono text-[9px] tracking-[0.16em] text-mist/40">{t("os.demoNote")}</span>
            <Link
              href="/console"
              className="group flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.18em] text-gold/70 uppercase hover:text-gold-bright"
            >
              {t("live.cta")}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="mt-8 flex justify-center lg:hidden">
          <GoldButton href="/console">{t("live.cta")}</GoldButton>
        </div>
      </div>
    </section>
  );
}
