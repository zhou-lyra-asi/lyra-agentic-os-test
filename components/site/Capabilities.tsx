"use client";

import { useState } from "react";
import clsx from "clsx";
import { Sparkles, Code2, LineChart, ShieldHalf, ArrowRight } from "lucide-react";
import { useT, useL } from "@/lib/locale-store";
import { SectionHeader } from "@/components/ui/primitives";
import { MODES } from "@/lib/harnesses";

const ICONS = { spark: Sparkles, code: Code2, chart: LineChart, shield: ShieldHalf };

export default function Capabilities() {
  const { t } = useT();
  const { l } = useL();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <section id="kapabilitas" className="relative overflow-hidden py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <SectionHeader eyebrow={t("cap.eyebrow")} title={t("cap.title")} body={t("cap.body")} />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {MODES.map((m, i) => {
            const Icon = ICONS[m.icon as keyof typeof ICONS] ?? Sparkles;
            const dim = hover !== null && hover !== m.id;
            return (
              <div
                key={m.id}
                onMouseEnter={() => setHover(m.id)}
                onMouseLeave={() => setHover(null)}
                className={clsx(
                  "group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-500",
                  dim ? "opacity-45" : "opacity-100"
                )}
                style={{
                  borderColor: hover === m.id ? `${m.accent}55` : "rgba(214,176,121,0.12)",
                  background:
                    hover === m.id
                      ? `linear-gradient(170deg, ${m.accent}16, rgba(10,8,16,0.85))`
                      : "linear-gradient(170deg, rgba(255,244,226,0.028), rgba(10,8,16,0.72))",
                  boxShadow: hover === m.id ? `0 30px 80px -46px ${m.accent}` : undefined,
                  transform: hover === m.id ? "translateY(-4px)" : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl border"
                    style={{ borderColor: `${m.accent}3d`, background: `${m.accent}12` }}
                  >
                    <Icon className="h-[18px] w-[18px]" style={{ color: m.accent }} />
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.26em] text-gold/25">0{i + 1}</span>
                </div>

                <h3 className="display mt-6 text-[23px] text-ivory/94">{l(m.name)}</h3>
                <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-sand/62">{t(`cap.${m.id}.d`)}</p>

                <div className="mt-4 flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.2em] uppercase" style={{ color: m.accent }}>
                  {l(m.blurb)}
                  <ArrowRight className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
                </div>

                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${m.accent}, transparent)`, opacity: hover === m.id ? 0.8 : 0.15 }}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-ember/20 bg-ember/[0.055] px-5 py-4">
          <ShieldHalf className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
          <p className="text-[12.5px] leading-relaxed text-sand/70">{t("cap.cyber.note")}</p>
        </div>
      </div>
    </section>
  );
}
