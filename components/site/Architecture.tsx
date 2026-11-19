"use client";

import { useState } from "react";
import clsx from "clsx";
import { Monitor, BrainCircuit, GitBranch, PlugZap, Server, Lock, Database, ScrollText, Route } from "lucide-react";
import { useT, useL } from "@/lib/locale-store";
import { SectionHeader } from "@/components/ui/primitives";

const LAYERS = [
  {
    key: "arch.layer1",
    desc: "arch.layer1.d",
    icon: Monitor,
    accent: "#d6b079",
    chips: ["Desktop", "CLI", "Web Console"],
  },
  {
    key: "arch.layer2",
    desc: "arch.layer2.d",
    icon: BrainCircuit,
    accent: "#f2d8a6",
    chips: ["Intent Compiler", "Mission Router", "Memory Fabric", "Policy Gate", "Artifact Ledger"],
  },
  {
    key: "arch.layer3",
    desc: "arch.layer3.d",
    icon: GitBranch,
    accent: "#8fe3d8",
    chips: ["Task Contract", "Handoff", "Cross-Verify", "Conflict Resolution"],
  },
  {
    key: "arch.layer4",
    desc: "arch.layer4.d",
    icon: PlugZap,
    accent: "#b8adf5",
    chips: ["claude-code", "antigravity", "hermes", "codex"],
  },
  {
    key: "arch.layer5",
    desc: "arch.layer5.d",
    icon: Server,
    accent: "#e08a52",
    chips: ["Models", "Tools", "MCP", "Sandbox", "Vault"],
  },
];

const CORE_MODULES = [
  { icon: Route, name: "Mission Router", note: { id: "memilih harness per misi", en: "picks the harness per mission" } },
  { icon: Database, name: "Memory Fabric", note: { id: "fakta & keputusan bersama", en: "shared facts & decisions" } },
  { icon: Lock, name: "Policy Gate", note: { id: "izin per alat, per langkah", en: "per-tool, per-step permission" } },
  { icon: ScrollText, name: "Artifact Ledger", note: { id: "bukti yang tak bisa dihapus", en: "append-only evidence" } },
];

export default function Architecture() {
  const { t } = useT();
  const { l } = useL();
  const [active, setActive] = useState(1);

  return (
    <section id="arsitektur" className="relative overflow-hidden py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(143,227,216,0.05),transparent_70%)]" />
      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
        <SectionHeader eyebrow={t("arch.eyebrow")} title={t("arch.title")} body={t("arch.body")} />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* stack */}
          <div className="relative">
            <div className="absolute inset-y-0 left-[27px] w-px bg-gradient-to-b from-transparent via-gold/25 to-transparent sm:left-[31px]" />
            <div className="space-y-3">
              {LAYERS.map((layer, i) => {
                const isActive = active === i;
                return (
                  <button
                    key={layer.key}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className={clsx(
                      "group relative flex w-full items-start gap-4 rounded-2xl p-4 text-left transition-all duration-500 sm:gap-5 sm:p-5",
                      isActive ? "glass-strong" : "border border-transparent hover:bg-gold/[0.035]"
                    )}
                    style={{
                      borderColor: isActive ? `${layer.accent}3a` : undefined,
                      boxShadow: isActive ? `0 20px 60px -34px ${layer.accent}88` : undefined,
                    }}
                  >
                    <span
                      className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-500"
                      style={{
                        borderColor: `${layer.accent}${isActive ? "66" : "2b"}`,
                        background: `linear-gradient(160deg, ${layer.accent}${isActive ? "26" : "0d"}, transparent)`,
                        boxShadow: isActive ? `0 0 26px -10px ${layer.accent}` : undefined,
                      }}
                    >
                      <layer.icon className="h-4.5 w-4.5" style={{ color: layer.accent, width: 18, height: 18 }} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[9px] tracking-[0.26em] text-mist/45">L{5 - i}</span>
                        <h3 className="display text-[19px] text-ivory/92">{t(layer.key)}</h3>
                      </div>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-sand/60">{t(layer.desc)}</p>

                      <div
                        className={clsx(
                          "grid overflow-hidden transition-all duration-500",
                          isActive ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        )}
                      >
                        <div className="flex min-h-0 flex-wrap gap-1.5">
                          {layer.chips.map((c) => (
                            <span
                              key={c}
                              className="rounded border px-2 py-0.5 font-mono text-[9.5px] tracking-wider"
                              style={{ borderColor: `${layer.accent}33`, color: layer.accent }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* dataflow annotation */}
            <div className="mt-6 flex items-center gap-3 pl-1 font-mono text-[9.5px] tracking-[0.2em] text-gold/45 uppercase">
              <span className="h-1.5 w-1.5 rotate-45 bg-gold/60" />
              {l({ id: "niat turun jadi misi · bukti naik jadi keputusan", en: "intent flows down as missions · evidence flows up as decisions" })}
            </div>
          </div>

          {/* core breakdown */}
          <div className="glass grain relative overflow-hidden rounded-xl2 p-6 sm:p-7">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/10 blur-[70px]" />
            <div className="relative">
              <div className="eyebrow">Lyra Core</div>
              <h3 className="display mt-3 text-[26px] text-ivory/95">
                {l({ id: "Lima organ, satu disiplin", en: "Five organs, one discipline" })}
              </h3>

              <div className="mt-6 space-y-2.5">
                {CORE_MODULES.map((m, i) => (
                  <div
                    key={m.name}
                    className="group flex items-center gap-3.5 rounded-xl border border-gold/10 bg-white/[0.015] p-3.5 transition-colors duration-400 hover:border-gold/28 hover:bg-white/[0.035]"
                    style={{ animation: `riseIn .6s cubic-bezier(.16,1,.3,1) ${i * 90}ms both` }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/20 bg-gold/[0.06]">
                      <m.icon className="h-3.5 w-3.5 text-gold-bright" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-ivory/88">{m.name}</div>
                      <div className="text-[11px] text-mist/60">{l(m.note)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-gold/20 p-4">
                <div className="font-mono text-[9px] tracking-[0.24em] text-gold/60 uppercase">
                  {l({ id: "Kontrak misi", en: "Mission contract" })}
                </div>
                <pre className="mt-2 overflow-x-auto font-mono text-[10.5px] leading-relaxed text-sand/70">
{`{
  "intent": "migrate auth → passkey",
  "mode": "code",
  "routes": [
    { "agent": "claude", "task": "map + plan" },
    { "agent": "codex",  "task": "execute"  },
    { "agent": "antigravity", "task": "verify" },
    { "agent": "hermes", "task": "remember" }
  ],
  "proof": "required",
  "gate": "human-on-write"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
