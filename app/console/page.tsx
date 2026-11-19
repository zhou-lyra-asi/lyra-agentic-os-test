"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import {
  Terminal, Send, Play, Pause, RotateCcw, Lock, Check, X, CircleDot,
  Layers, Network, FileCode2, Database, ShieldHalf, Settings2, Search,
  ArrowLeft, Languages, Sparkles, Code2, LineChart, ChevronRight, Cpu,
} from "lucide-react";
import { useT, useL, useLocale } from "@/lib/locale-store";
import { useMission, type useMissionState } from "@/lib/mission-store";
import { SCENARIOS } from "@/lib/missions";
import { HARNESSES, MODES, harnessById, type HarnessId } from "@/lib/harnesses";
import { useMissionRunner } from "@/lib/use-runner";
import { LyraMark } from "@/components/site/Nav";

type Tab = "console" | "missions" | "graph" | "artifacts" | "memory" | "policy";

const MODE_ICON = { spark: Sparkles, code: Code2, chart: LineChart, shield: ShieldHalf };

export default function ConsolePage() {
  const { t } = useT();
  const { l } = useL();
  const locale = useLocale((s) => s.locale);
  const toggleLocale = useLocale((s) => s.toggle);
  const m = useMission();
  useMissionRunner();

  const [tab, setTab] = useState<Tab>("console");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const scenario = useMemo(() => SCENARIOS.find((s) => s.id === m.scenarioId)!, [m.scenarioId]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [m.logs.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") setPaletteOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        m.run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [m]);

  const done = m.steps.filter((s) => s.status === "done").length;
  const progress = (done / m.steps.length) * 100;

  const DOCK: { id: Tab; label: string; icon: typeof Terminal }[] = [
    { id: "console", label: t("os.dock.console"), icon: Terminal },
    { id: "missions", label: t("os.dock.missions"), icon: Layers },
    { id: "graph", label: t("os.dock.graph"), icon: Network },
    { id: "artifacts", label: t("os.dock.artifacts"), icon: FileCode2 },
    { id: "memory", label: t("os.dock.memory"), icon: Database },
    { id: "policy", label: t("os.dock.policy"), icon: ShieldHalf },
  ];

  return (
    <div className="relative flex h-[100svh] flex-col overflow-hidden bg-void">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_78%_8%,rgba(214,176,121,0.09),transparent_70%),radial-gradient(40%_40%_at_8%_95%,rgba(143,227,216,0.05),transparent_70%)]" />

      {/* top bar */}
      <header className="relative z-30 flex items-center justify-between border-b border-gold/12 bg-obsidian/70 px-4 py-2.5 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5">
            <LyraMark size={26} />
            <span className="display text-[16px] text-ivory">Lyra</span>
          </Link>
          <span className="hidden font-mono text-[9px] tracking-[0.22em] text-gold/45 sm:block">
            {t("os.title").toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-full border border-gold/15 p-0.5 md:flex">
            {MODES.map((md) => {
              const Icon = MODE_ICON[md.icon as keyof typeof MODE_ICON];
              const sc = SCENARIOS.find((s) => s.mode === md.id);
              const on = scenario.mode === md.id;
              return (
                <button
                  key={md.id}
                  disabled={!sc}
                  onClick={() => sc && m.setScenario(sc.id)}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] uppercase transition-all",
                    on ? "text-[#1a1208]" : "text-mist/55 hover:text-sand/85",
                    !sc && "opacity-25"
                  )}
                  style={on ? { background: md.accent } : undefined}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {l(md.name)}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-gold/15 px-2.5 py-1.5 text-[10px] text-mist/60 transition-colors hover:border-gold/35 hover:text-sand/85"
          >
            <Search className="h-3 w-3" />
            <span className="hidden sm:inline">⌘K</span>
          </button>
          <button
            onClick={toggleLocale}
            className="flex h-7 items-center gap-1 rounded-lg border border-gold/15 px-2 font-mono text-[9px] tracking-[0.16em] text-gold/70 hover:border-gold/40"
          >
            <Languages className="h-3 w-3" />
            {t("lang.switch")}
          </button>
          <Link
            href="/"
            className="flex h-7 items-center gap-1.5 rounded-lg border border-gold/15 px-2 font-mono text-[9px] tracking-[0.14em] text-mist/60 uppercase hover:border-gold/40 hover:text-sand"
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline">{t("os.back")}</span>
          </Link>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1">
        {/* dock rail */}
        <nav className="flex w-[56px] shrink-0 flex-col items-center gap-1 border-r border-gold/10 bg-obsidian/40 py-3 sm:w-[68px]">
          {DOCK.map((d) => {
            const on = tab === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setTab(d.id)}
                className={clsx(
                  "group relative flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 sm:w-12",
                  on ? "bg-gold/[0.12] text-gold-bright" : "text-mist/45 hover:bg-white/[0.04] hover:text-sand/80"
                )}
              >
                {on && <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-gold" />}
                <d.icon className="h-4 w-4" />
                <span className="hidden font-mono text-[7px] tracking-wider uppercase sm:block">
                  {d.label.slice(0, 7)}
                </span>
              </button>
            );
          })}
          <div className="mt-auto">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl text-mist/35 hover:text-sand/70">
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </nav>

        {/* main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {tab === "console" && (
            <ConsoleView
              scenario={scenario}
              m={m}
              locale={locale}
              logEndRef={logEndRef}
              progress={progress}
              done={done}
            />
          )}
          {tab === "missions" && <MissionsView m={m} />}
          {tab === "graph" && <GraphView m={m} />}
          {tab === "artifacts" && <ArtifactsView m={m} />}
          {tab === "memory" && <MemoryView />}
          {tab === "policy" && <PolicyView />}
        </div>

        {/* right rail */}
        <aside className="hidden w-[268px] shrink-0 flex-col border-l border-gold/10 bg-obsidian/40 xl:flex">
          <div className="border-b border-gold/10 px-4 py-3">
            <div className="font-mono text-[8.5px] tracking-[0.24em] text-gold/55 uppercase">{t("os.activeAgent")}</div>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
            {HARNESSES.map((h) => {
              const isActive = m.activeAgent === h.id;
              const count = m.steps.filter(
                (s) => s.status === "done" && scenario.steps.find((x) => x.id === s.stepId)?.agent === h.id
              ).length;
              return (
                <div
                  key={h.id}
                  className="rounded-xl border p-2.5 transition-all duration-500"
                  style={{
                    borderColor: isActive ? `${h.accent}66` : "rgba(214,176,121,0.09)",
                    background: isActive ? `${h.accent}10` : "rgba(255,255,255,0.012)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-md border text-[10px]"
                      style={{ borderColor: `${h.accent}44`, color: h.accentSoft }}
                    >
                      {h.mark}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11.5px] text-ivory/85">{h.name}</div>
                      <div className="truncate font-mono text-[8px] tracking-wider text-mist/45">{h.vendor}</div>
                    </div>
                    {isActive ? (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute h-full w-full animate-ping rounded-full" style={{ background: h.accent }} />
                        <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: h.accent }} />
                      </span>
                    ) : (
                      <span className="font-mono text-[8.5px] text-mist/35">{count}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gold/10 p-3.5">
            <div className="flex items-center justify-between font-mono text-[8.5px] tracking-[0.18em] text-mist/50 uppercase">
              <span>{t("os.timeline")}</span>
              <span className="text-gold/70">{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ember via-gold to-gold-bright transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3.5 flex items-center gap-1.5 font-mono text-[8px] tracking-[0.14em] text-mist/35 uppercase">
              <Cpu className="h-2.5 w-2.5" />
              {l({ id: "simulasi lokal", en: "local simulation" })}
            </div>
          </div>
        </aside>
      </div>

      {/* status bar */}
      <div className="relative z-20 flex items-center justify-between border-t border-gold/10 bg-obsidian/70 px-4 py-1.5 font-mono text-[8.5px] tracking-[0.16em] text-mist/40 uppercase backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className={clsx("h-1.5 w-1.5 rounded-full", m.running ? "bg-halo" : m.finished ? "bg-gold" : "bg-mist/40")} />
            {m.running ? t("os.running") : m.finished ? t("os.complete") : t("live.idle")}
          </span>
          <span className="hidden sm:inline">{scenario.mode.toUpperCase()}</span>
          <span className="hidden md:inline">{done}/{m.steps.length} · {l({ id: "langkah", en: "steps" })}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">ESC · ⌘K</span>
          <span>LYRA v0.1 AUREA</span>
        </div>
      </div>

      {paletteOpen && (
        <Palette
          onClose={() => setPaletteOpen(false)}
          query={query}
          setQuery={setQuery}
          onTab={(tb) => {
            setTab(tb);
            setPaletteOpen(false);
          }}
          onScenario={(id) => {
            m.setScenario(id);
            m.reset();
            setTab("console");
            setPaletteOpen(false);
          }}
          onRun={() => {
            m.reset();
            setTimeout(() => m.run(), 60);
            setPaletteOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Console                                                            */
/* ------------------------------------------------------------------ */
function ConsoleView({
  scenario,
  m,
  locale,
  logEndRef,
  progress,
  done,
}: {
  scenario: (typeof SCENARIOS)[number];
  m: useMissionState;
  locale: "id" | "en";
  logEndRef: React.RefObject<HTMLDivElement | null>;
  progress: number;
  done: number;
}) {
  const { t } = useT();
  const { l } = useL();
  const [intent, setIntent] = useState("");

  const suggestions = SCENARIOS.slice(0, 3).map((s) => s.intent[locale]);

  return (
    <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_320px]">
      <div className="flex min-h-0 flex-col">
        {/* composer */}
        <div className="border-b border-gold/10 p-4 sm:p-5">
          <div className="font-mono text-[8.5px] tracking-[0.24em] text-gold/55 uppercase">{t("os.compose")}</div>
          <div className="mt-2 flex items-end gap-2 rounded-xl border border-gold/18 bg-black/30 p-2.5 transition-colors focus-within:border-gold/45">
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder={t("os.compose.ph")}
              rows={2}
              className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1 text-[13px] leading-relaxed text-ivory/90 placeholder:text-mist/35 focus:outline-none"
            />
            <button
              onClick={() => {
                m.reset();
                setTimeout(() => m.run(), 60);
                setIntent("");
              }}
              className="flex h-9 items-center gap-2 rounded-lg bg-gradient-to-b from-gold-bright to-gold px-3.5 text-[10px] font-medium tracking-[0.12em] text-[#231708] uppercase transition-all hover:shadow-[0_0_26px_-8px_rgba(242,216,166,0.75)]"
            >
              <Send className="h-3 w-3" />
              {t("os.dispatch")}
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[8px] tracking-[0.18em] text-mist/35 uppercase">{t("os.suggest")}</span>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setIntent(s)}
                className="max-w-[240px] truncate rounded-full border border-gold/12 px-2.5 py-1 text-[10px] text-mist/55 transition-colors hover:border-gold/35 hover:text-sand/85"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* plan strip */}
        <div className="border-b border-gold/10 px-4 py-2.5 sm:px-5">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[8.5px] tracking-[0.24em] text-gold/55 uppercase">{t("os.plan")}</div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={m.running ? m.pause : m.run}
                disabled={m.finished}
                className="flex items-center gap-1.5 rounded-md border border-gold/25 px-2 py-1 font-mono text-[8.5px] tracking-[0.14em] text-gold-bright uppercase transition-colors hover:border-gold/55 disabled:opacity-30"
              >
                {m.running ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
                {m.running ? t("os.running") : t("live.run")}
              </button>
              <button
                onClick={m.reset}
                className="flex items-center gap-1 rounded-md border border-gold/15 px-2 py-1 font-mono text-[8.5px] tracking-[0.14em] text-mist/55 uppercase hover:border-gold/35"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                {t("live.reset")}
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {scenario.plan.map((p, i) => {
              const revealed = m.planRevealed > i;
              return (
                <span
                  key={p.en}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] transition-all duration-500",
                    revealed ? "border-gold/20 bg-gold/[0.045] text-sand/78" : "border-gold/[0.07] text-mist/25"
                  )}
                >
                  <span className="font-mono text-[8px] text-gold/60">{i + 1}</span>
                  {l(p)}
                </span>
              );
            })}
          </div>
        </div>

        {/* log */}
        <div ref={logEndRef ? undefined : undefined} className="relative min-h-0 flex-1">
          <div className="scroll-thin h-full overflow-y-auto px-4 py-3 font-mono text-[11px] leading-[1.85] sm:px-5">
            {m.logs.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <div className="text-[11px] text-mist/40">{t("os.empty")}</div>
                <div className="font-mono text-[9px] tracking-[0.16em] text-mist/25 uppercase">⌘↵ to run</div>
              </div>
            )}
            {m.logs.map((line) => {
              const h = line.agent === "lyra" ? null : harnessById(line.agent as HarnessId);
              const isGate = line.kind === "gate";
              return (
                <div key={line.id} className="flex items-start gap-2">
                  <span className="w-[74px] shrink-0 truncate text-[10px]" style={{ color: h ? h.accent : "#d6b079" }}>
                    {line.agent === "lyra" ? "lyra.core" : h?.handle}
                  </span>
                  <span className="text-mist/22">│</span>
                  <span className={clsx("min-w-0 flex-1 break-words", isGate ? "text-ember" : "text-sand/72")}>
                    {line.text}
                  </span>
                </div>
              );
            })}
            {m.running && (
              <div className="flex items-center gap-2 pt-1">
                <span className="animate-blink text-gold/80">▌</span>
                <span className="text-[10px] text-mist/40">
                  {m.activeAgent === "lyra" ? "lyra.core" : harnessById(m.activeAgent).name} · {l({ id: "berpikir", en: "thinking" })}
                </span>
              </div>
            )}
            <div ref={logEndRef} />
          </div>
          {/* gate overlay */}
          {m.gateOpen && m.gateStep && (
            <div className="absolute inset-x-3 bottom-3 animate-rise rounded-xl border border-ember/45 bg-[#1a0f0a]/95 p-3.5 backdrop-blur">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-ember" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-ember uppercase">{t("os.approval")}</span>
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-sand/75">{l(m.gateStep.detail)}</p>
              <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-ember/70">{l(m.gateStep.gate!.reason)}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => m.resolveGate("approved")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ember/90 py-1.5 text-[10.5px] font-medium tracking-[0.1em] text-[#1a0d05] uppercase hover:bg-ember"
                >
                  <Check className="h-3 w-3" />
                  {t("os.approve")}
                </button>
                <button
                  onClick={() => m.resolveGate("denied")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ember/40 py-1.5 text-[10.5px] tracking-[0.1em] text-ember/85 uppercase hover:bg-ember/10"
                >
                  <X className="h-3 w-3" />
                  {t("os.deny")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* step detail column */}
      <div className="hidden min-h-0 flex-col border-l border-gold/10 lg:flex">
        <div className="border-b border-gold/10 px-4 py-3">
          <div className="font-mono text-[8.5px] tracking-[0.24em] text-gold/55 uppercase">{t("os.timeline")}</div>
        </div>
        <div className="scroll-thin flex-1 space-y-1.5 overflow-y-auto p-3">
          {scenario.steps.map((st, i) => {
            const run = m.steps.find((x) => x.stepId === st.id)!;
            const h = harnessById(st.agent);
            const state = run.status;
            const isNext = i === m.cursor && !m.finished;
            return (
              <div
                key={st.id}
                className={clsx(
                  "rounded-lg border p-2.5 transition-all duration-500",
                  state === "done" ? "border-gold/12 bg-white/[0.018]" : isNext ? "border-gold/30 bg-gold/[0.04]" : "border-transparent opacity-45"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-md border font-mono text-[8px]"
                    style={{ borderColor: `${h.accent}44`, color: h.accentSoft }}
                  >
                    {st.kind === "approval" ? "!" : state === "done" ? "✓" : h.mark}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-ivory/82">{l(st.title)}</span>
                </div>
                {state === "done" && (
                  <div className="mt-1.5 space-y-1 pl-7">
                    <div className="text-[10px] leading-snug text-sand/55">{l(st.detail)}</div>
                    <div className="flex items-center gap-2 font-mono text-[8px] tracking-wider text-mist/35">
                      <span>{st.tokens.toLocaleString(locale === "id" ? "id-ID" : "en-US")} {t("os.tokens")}</span>
                      {st.confidence && <span>· {Math.round(st.confidence * 100)}% {t("os.confidence")}</span>}
                    </div>
                    {st.artifact && (
                      <div className="mt-1 flex items-center gap-1.5 rounded border border-halo/20 bg-halo/[0.05] px-1.5 py-1 font-mono text-[8.5px] text-halo/80">
                        <FileCode2 className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{st.artifact.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="border-t border-gold/10 p-3">
          <div className="flex items-center justify-between font-mono text-[8px] tracking-[0.16em] text-mist/45 uppercase">
            <span>{done}/{scenario.steps.length}</span>
            <span className="text-gold/60">{Math.round(progress)}%</span>
          </div>
          <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-white/8">
            <div className="h-full bg-gradient-to-r from-ember to-gold-bright transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Missions                                                           */
/* ------------------------------------------------------------------ */
function MissionsView({ m }: { m: useMissionState }) {
  const { t } = useT();
  const { l } = useL();
  const { locale } = useLocale();

  return (
    <div className="scroll-thin flex-1 overflow-y-auto p-5 sm:p-7">
      <h2 className="display text-3xl text-ivory/95">{t("os.dock.missions")}</h2>
      <p className="mt-1.5 text-[12.5px] text-sand/55">
        {l({ id: "Empat misi contoh, satu per mode penalaran.", en: "Four example missions, one per reasoning mode." })}
      </p>
      <div className="mt-6 grid gap-3 xl:grid-cols-2">
        {SCENARIOS.map((s) => {
          const mode = MODES.find((x) => x.id === s.mode)!;
          const agents = [...new Set(s.steps.map((x) => x.agent))];
          const active = s.id === m.scenarioId;
          return (
            <button
              key={s.id}
              onClick={() => {
                m.setScenario(s.id);
                m.reset();
              }}
              className={clsx(
                "group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-400 hover:-translate-y-0.5",
                active ? "border-gold/40 bg-gold/[0.05]" : "border-gold/12 bg-white/[0.015] hover:border-gold/30"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className="rounded-full border px-2 py-0.5 font-mono text-[8.5px] tracking-[0.18em] uppercase"
                  style={{ borderColor: `${mode.accent}55`, color: mode.accent, background: `${mode.accent}12` }}
                >
                  {l(mode.name)}
                </span>
                <span className="font-mono text-[8.5px] text-mist/35">{s.steps.length} {l({ id: "langkah", en: "steps" })}</span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-ivory/85">{s.intent[locale]}</p>
              <div className="mt-3 flex items-center gap-1.5">
                {agents.map((a) => {
                  const h = harnessById(a);
                  return (
                    <span
                      key={a}
                      className="flex h-5 w-5 items-center justify-center rounded border font-mono text-[8px]"
                      style={{ borderColor: `${h.accent}44`, color: h.accentSoft }}
                    >
                      {h.mark}
                    </span>
                  );
                })}
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-gold/40 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Graph                                                              */
/* ------------------------------------------------------------------ */
function GraphView({ m }: { m: useMissionState }) {
  const { l } = useL();
  const { t } = useT();
  const { locale } = useLocale();
  const scenario = SCENARIOS.find((s) => s.id === m.scenarioId)!;

  const counts = HARNESSES.map((h) => ({
    h,
    n: scenario.steps.filter((s) => s.agent === h.id).length,
  }));

  // handoff edges ordered by time
  const edges: { from: HarnessId; to: HarnessId }[] = [];
  for (let i = 1; i < scenario.steps.length; i++) {
    const a = scenario.steps[i - 1].agent;
    const b = scenario.steps[i].agent;
    if (a !== b) edges.push({ from: a, to: b });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="display text-3xl text-ivory/95">{t("os.dock.graph")}</h2>
          <p className="mt-1.5 max-w-lg text-[12.5px] leading-relaxed text-sand/55">
            {l({
              id: "Peta siapa menyerahkan apa kepada siapa. Titik terang = langkah yang sudah selesai.",
              en: "A map of who hands what to whom. Bright dots are completed steps.",
            })}
          </p>
        </div>
        <span className="font-mono text-[9px] tracking-[0.16em] text-gold/50 uppercase">
          {edges.length} {l({ id: "handoff", en: "handoffs" })}
        </span>
      </div>

      <div className="relative mt-6 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-gold/12 bg-black/25">
        <svg viewBox="0 0 600 380" className="h-full w-full max-h-[520px]">
          <defs>
            <radialGradient id="coreGlow">
              <stop offset="0%" stopColor="#f2d8a6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f2d8a6" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* core */}
          <circle cx="300" cy="190" r="86" fill="url(#coreGlow)" opacity="0.28" />
          <circle cx="300" cy="190" r="34" fill="none" stroke="rgba(214,176,121,0.5)" strokeWidth="0.8" />
          <circle cx="300" cy="190" r="42" fill="none" stroke="rgba(214,176,121,0.2)" strokeWidth="0.6" strokeDasharray="2 4" />
          <text x="300" y="188" textAnchor="middle" fill="#f2d8a6" fontSize="11" fontFamily="var(--font-display)" letterSpacing="1">
            LYRA
          </text>
          <text x="300" y="200" textAnchor="middle" fill="rgba(207,193,172,0.5)" fontSize="6" letterSpacing="2">
            CORE
          </text>

          {/* nodes */}
          {counts.map(({ h, n }, i) => {
            const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
            const x = 300 + Math.cos(a) * 148;
            const y = 190 + Math.sin(a) * 118;
            const active = m.activeAgent === h.id;
            return (
              <g key={h.id}>
                <line
                  x1="300"
                  y1="190"
                  x2={x}
                  y2={y}
                  stroke={h.accent}
                  strokeWidth={active ? 1.4 : 0.6}
                  opacity={active ? 0.75 : 0.22}
                  className={active ? "edge-flow" : undefined}
                />
                <circle cx={x} cy={y} r={active ? 26 : 22} fill={h.accent} opacity="0.09" />
                <circle cx={x} cy={y} r="17" fill="#0a0810" stroke={h.accent} strokeWidth={active ? 1.4 : 0.8} opacity={active ? 1 : 0.65} />
                <text x={x} y={y + 4} textAnchor="middle" fill={h.accentSoft} fontSize="11" fontFamily="var(--font-display)">
                  {h.mark}
                </text>
                <text x={x} y={y + 34} textAnchor="middle" fill="rgba(207,193,172,0.75)" fontSize="7.5" letterSpacing="0.8">
                  {h.name.toUpperCase()}
                </text>
                <text x={x} y={y + 45} textAnchor="middle" fill="rgba(154,143,134,0.5)" fontSize="6">
                  {n} {locale === "id" ? "langkah" : "steps"}
                </text>
              </g>
            );
          })}

          {/* step ticks around core */}
          {scenario.steps.map((s, i) => {
            const a = (i / scenario.steps.length) * Math.PI * 2;
            const done = m.steps[i]?.status === "done";
            const h = harnessById(s.agent);
            return (
              <circle
                key={s.id}
                cx={300 + Math.cos(a) * 58}
                cy={190 + Math.sin(a) * 58}
                r={done ? 2.6 : 1.6}
                fill={done ? h.accent : "rgba(154,143,134,0.25)"}
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {edges.slice(0, 9).map((e, i) => {
          const f = harnessById(e.from);
          const tt = harnessById(e.to);
          return (
            <span
              key={`${e.from}-${e.to}-${i}`}
              className="flex items-center gap-1 rounded border border-gold/12 px-1.5 py-0.5 font-mono text-[8.5px]"
              style={{ color: "#9a8f86" }}
            >
              <span style={{ color: f.accent }}>{f.mark}</span>
              <span>→</span>
              <span style={{ color: tt.accent }}>{tt.mark}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Artifacts                                                          */
/* ------------------------------------------------------------------ */
function ArtifactsView({ m }: { m: useMissionState }) {
  const { t } = useT();
  const { l } = useL();
  const scenario = SCENARIOS.find((s) => s.id === m.scenarioId)!;
  const produced = scenario.steps.filter(
    (s) => s.artifact && m.steps.find((x) => x.stepId === s.id)?.status === "done"
  );
  const pending = scenario.steps.filter(
    (s) => s.artifact && m.steps.find((x) => x.stepId === s.id)?.status !== "done"
  );

  return (
    <div className="scroll-thin flex-1 overflow-y-auto p-5 sm:p-7">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="display text-3xl text-ivory/95">{t("os.artifacts")}</h2>
          <p className="mt-1.5 text-[12.5px] text-sand/55">
            {l({
              id: "Bukti yang dihasilkan misi ini. Kosong berarti belum terbukti.",
              en: "Evidence produced by this mission. Empty means not yet proven.",
            })}
          </p>
        </div>
        <span className="font-mono text-[9px] tracking-[0.16em] text-gold/55 uppercase">
          {produced.length}/{produced.length + pending.length}
        </span>
      </div>

      {produced.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-gold/15 p-10 text-center text-[12px] text-mist/40">
          {t("os.noArtifacts")}
        </div>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {produced.map((s) => {
          const h = harnessById(s.agent);
          return (
            <div key={s.id} className="animate-rise rounded-xl border border-gold/14 bg-white/[0.018] p-4">
              <div className="flex items-center justify-between">
                <span
                  className="rounded border px-1.5 py-0.5 font-mono text-[8px] tracking-[0.16em] uppercase"
                  style={{ borderColor: `${h.accent}44`, color: h.accent }}
                >
                  {s.artifact!.kind}
                </span>
                <span className="font-mono text-[8px] text-mist/35">{h.mark}</span>
              </div>
              <div className="mt-3 flex items-start gap-2">
                <FileCode2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-halo/70" />
                <span className="break-all font-mono text-[10.5px] leading-relaxed text-ivory/82">{s.artifact!.name}</span>
              </div>
              <div className="mt-2 font-mono text-[8.5px] tracking-wider text-mist/45">{s.artifact!.meta}</div>
              <p className="mt-2 text-[10.5px] leading-snug text-sand/55">{l(s.detail)}</p>
            </div>
          );
        })}
        {pending.map((s) => (
          <div key={s.id} className="rounded-xl border border-dashed border-gold/10 p-4 opacity-40">
            <div className="font-mono text-[8px] tracking-[0.16em] text-mist/40 uppercase">
              {l({ id: "menunggu", en: "pending" })}
            </div>
            <div className="mt-3 font-mono text-[10.5px] text-mist/45">???</div>
            <div className="mt-2 font-mono text-[8.5px] text-mist/30">{s.artifact!.kind}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Memory                                                            */
/* ------------------------------------------------------------------ */
const MEMORY = [
  {
    tier: "invariant",
    color: "#f0917a",
    items: [
      { id: "Flag kebijakan harus dibaca setelah migrasi skema.", en: "Policy flags must be read after schema migration." },
      { id: "Setiap migrasi index wajib diikuti ANALYZE.", en: "Every index migration must be followed by ANALYZE." },
      { id: "Tidak ada penulisan di mode Cyber tanpa izin eksplisit.", en: "No writes in Cyber mode without explicit approval." },
    ],
  },
  {
    tier: "project",
    color: "#d6b079",
    items: [
      { id: "Repo inti: auth-service, auth-client, auth-admin.", en: "Core repos: auth-service, auth-client, auth-admin." },
      { id: "Beban puncak checkout: 21:00–23:00 WIB.", en: "Checkout peak load: 21:00–23:00 local time." },
      { id: "Staging mencerminkan produksi dalam margin 3%.", en: "Staging mirrors production within 3%." },
    ],
  },
  {
    tier: "preference",
    color: "#8fe3d8",
    items: [
      { id: "Pengguna lebih suka penjelasan singkat dan bukti konkret.", en: "User prefers short explanations and concrete evidence." },
      { id: "Gunakan Bahasa Indonesia untuk ringkasan akhir.", en: "Use Indonesian for final summaries." },
      { id: "Jangan pernah menjalankan perintah destruktif tanpa konfirmasi.", en: "Never run destructive commands without confirmation." },
    ],
  },
];

function MemoryView() {
  const { t } = useT();
  const { l } = useL();
  return (
    <div className="scroll-thin flex-1 overflow-y-auto p-5 sm:p-7">
      <h2 className="display text-3xl text-ivory/95">{t("os.dock.memory")}</h2>
      <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-sand/55">
        {l({
          id: "Memory Fabric berlapis. Harness boleh membaca semua lapis, tetapi hanya boleh mengusulkan perubahan — bukan menulis langsung.",
          en: "A tiered Memory Fabric. Harnesses may read every tier, but may only propose changes — never write directly.",
        })}
      </p>
      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        {MEMORY.map((tier) => (
          <div key={tier.tier} className="rounded-xl border border-gold/12 bg-white/[0.015] p-4">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tier.color }} />
              <span className="font-mono text-[8.5px] tracking-[0.22em] uppercase" style={{ color: tier.color }}>
                {tier.tier}
              </span>
            </div>
            <div className="mt-3.5 space-y-2.5">
              {tier.items.map((it) => (
                <div key={it.en} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rotate-45" style={{ background: tier.color, opacity: 0.6 }} />
                  <span className="text-[11.5px] leading-relaxed text-sand/70">{l(it)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-gold/10 bg-black/25 p-4">
        <div className="font-mono text-[8.5px] tracking-[0.22em] text-gold/55 uppercase">
          {l({ id: "jejak perubahan", en: "change trail" })}
        </div>
        <div className="mt-2.5 space-y-1.5 font-mono text-[10px] text-mist/55">
          <div><span className="text-halo/70">hermes</span> · proposed invariant · <span className="text-sand/60">+1</span></div>
          <div><span className="text-gold/70">human</span> · approved · <span className="text-sand/60">12m ago</span></div>
          <div><span className="text-[#b8adf5]">codex</span> · proposed project fact · <span className="text-sand/60">+1</span></div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Policy                                                            */
/* ------------------------------------------------------------------ */
const POLICY = [
  { tool: "read_file", scope: "all", risk: "low", allow: true },
  { tool: "write_file", scope: "workspace", risk: "medium", allow: true },
  { tool: "run_shell", scope: "sandbox", risk: "medium", allow: true },
  { tool: "network_egress", scope: "allowlist", risk: "medium", allow: true },
  { tool: "git_push", scope: "branch", risk: "high", allow: false },
  { tool: "deploy_prod", scope: "none", risk: "critical", allow: false },
  { tool: "delete_repo", scope: "none", risk: "critical", allow: false },
];

function PolicyView() {
  const { t } = useT();
  const { l } = useL();
  return (
    <div className="scroll-thin flex-1 overflow-y-auto p-5 sm:p-7">
      <h2 className="display text-3xl text-ivory/95">{t("os.dock.policy")}</h2>
      <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-sand/55">
        {l({
          id: "Izin diberikan per alat, bukan per agen. Agen yang paling pintar pun tidak bisa melewati gerbang ini.",
          en: "Permission is granted per tool, not per agent. Even the smartest agent cannot cross this gate.",
        })}
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-gold/12">
        <div className="grid grid-cols-[1.6fr_1fr_0.7fr_0.7fr] gap-2 border-b border-gold/10 bg-white/[0.025] px-4 py-2.5 font-mono text-[8px] tracking-[0.2em] text-mist/50 uppercase">
          <span>{l({ id: "alat", en: "tool" })}</span>
          <span>{l({ id: "cakupan", en: "scope" })}</span>
          <span>{l({ id: "risiko", en: "risk" })}</span>
          <span className="text-right">{l({ id: "izin", en: "permit" })}</span>
        </div>
        {POLICY.map((p) => (
          <div
            key={p.tool}
            className="grid grid-cols-[1.6fr_1fr_0.7fr_0.7fr] items-center gap-2 border-b border-gold/[0.06] px-4 py-2.5 last:border-0 hover:bg-white/[0.015]"
          >
            <span className="font-mono text-[10.5px] text-ivory/80">{p.tool}</span>
            <span className="font-mono text-[9.5px] text-mist/55">{p.scope}</span>
            <span
              className="font-mono text-[8.5px] tracking-wider uppercase"
              style={{
                color:
                  p.risk === "critical" ? "#f0917a" : p.risk === "high" ? "#e6b06a" : p.risk === "medium" ? "#8fe3d8" : "#6fd3ad",
              }}
            >
              {p.risk}
            </span>
            <span className="flex justify-end">
              {p.allow ? (
                <Check className="h-3.5 w-3.5 text-[#6fd3ad]" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-[#f0917a]/70" />
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-ember/20 bg-ember/[0.05] p-4">
          <div className="font-mono text-[8.5px] tracking-[0.2em] text-ember uppercase">
            {l({ id: "gerbang manusia", en: "human gate" })}
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-sand/65">{t("cap.cyber.note")}</p>
        </div>
        <div className="rounded-xl border border-gold/12 bg-white/[0.015] p-4">
          <div className="font-mono text-[8.5px] tracking-[0.2em] text-gold/55 uppercase">
            {l({ id: "audit", en: "audit" })}
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-sand/65">
            {l({
              id: "Setiap keputusan tercatat append-only: siapa, kapan, alat apa, atas izin siapa.",
              en: "Every decision is append-only: who, when, which tool, on whose authority.",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Palette                                                           */
/* ------------------------------------------------------------------ */
function Palette({
  onClose,
  query,
  setQuery,
  onTab,
  onScenario,
  onRun,
}: {
  onClose: () => void;
  query: string;
  setQuery: (v: string) => void;
  onTab: (t: Tab) => void;
  onScenario: (id: string) => void;
  onRun: () => void;
}) {
  const { t } = useT();
  const { l } = useL();

  const commands = [
    { label: l({ id: "Jalankan misi", en: "Run mission" }), hint: "⌘↵", run: onRun },
    { label: l({ id: "Buka Konsol", en: "Open console" }), run: () => onTab("console") },
    { label: l({ id: "Buka Graf Misi", en: "Open mission graph" }), run: () => onTab("graph") },
    { label: l({ id: "Buka Artefak", en: "Open artifacts" }), run: () => onTab("artifacts") },
    { label: l({ id: "Buka Memori", en: "Open memory" }), run: () => onTab("memory") },
    { label: l({ id: "Buka Kebijakan", en: "Open policy" }), run: () => onTab("policy") },
    ...SCENARIOS.map((s) => ({
      label: `${l({ id: "Misi:", en: "Mission:" })} ${s.intent.id.slice(0, 44)}…`,
      run: () => onScenario(s.id),
    })),
  ];

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[14vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-strong w-full max-w-lg overflow-hidden rounded-xl border border-gold/25 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-gold/12 px-4 py-3">
          <Search className="h-4 w-4 text-gold/60" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("os.palette.ph")}
            className="flex-1 bg-transparent text-[13px] text-ivory/90 placeholder:text-mist/35 focus:outline-none"
          />
          <span className="rounded border border-gold/20 px-1.5 py-0.5 font-mono text-[8.5px] text-mist/50">ESC</span>
        </div>
        <div className="scroll-thin max-h-[46vh] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-[11.5px] text-mist/40">
              {l({ id: "Tidak ada perintah.", en: "No commands." })}
            </div>
          )}
          {filtered.map((c, i) => (
            <button
              key={c.label + i}
              onClick={c.run}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] text-sand/75 transition-colors hover:bg-gold/[0.09] hover:text-ivory"
            >
              <ChevronRight className="h-3 w-3 text-gold/40" />
              <span className="flex-1 truncate">{c.label}</span>
              {"hint" in c && c.hint && <span className="font-mono text-[9px] text-mist/40">{c.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
