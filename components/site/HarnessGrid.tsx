"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowUpRight, Monitor, Terminal, Hexagon } from "lucide-react";
import { useT, useL } from "@/lib/locale-store";
import { HARNESSES, type Harness } from "@/lib/harnesses";
import { SectionHeader, Pill } from "@/components/ui/primitives";

const TRAIT_LABELS: Record<string, { id: string; en: string }> = {
  depth: { id: "Kedalaman", en: "Depth" },
  speed: { id: "Kecepatan", en: "Speed" },
  autonomy: { id: "Otonomi", en: "Autonomy" },
  memory: { id: "Memori", en: "Memory" },
  verification: { id: "Verifikasi", en: "Verification" },
};

function Radar({ h }: { h: Harness }) {
  const keys = Object.keys(h.traits) as (keyof Harness["traits"])[];
  const cx = 60;
  const cy = 60;
  const r = 42;
  const pts = keys.map((k, i) => {
    const a = (i / keys.length) * Math.PI * 2 - Math.PI / 2;
    const v = h.traits[k];
    return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v];
  });
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox="0 0 120 120" className="h-[120px] w-[120px]">
      {rings.map((ring) => (
        <circle
          key={ring}
          cx={cx}
          cy={cy}
          r={r * ring}
          fill="none"
          stroke="rgba(214,176,121,0.14)"
          strokeWidth="0.5"
        />
      ))}
      {keys.map((k, i) => {
        const a = (i / keys.length) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            key={k}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(a) * r}
            y2={cy + Math.sin(a) * r}
            stroke="rgba(214,176,121,0.1)"
            strokeWidth="0.5"
          />
        );
      })}
      <polygon
        points={pts.map((p) => p.join(",")).join(" ")}
        fill={`${h.accent}22`}
        stroke={h.accent}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill={h.accent} />
      ))}
    </svg>
  );
}

function HarnessCard({ h, index }: { h: Harness; index: number }) {
  const { t } = useT();
  const { l } = useL();
  const [open, setOpen] = useState(false);

  return (
    <article
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl2 p-6 transition-all duration-500 sm:p-7"
      style={{
        background: `linear-gradient(165deg, ${h.accent}12, rgba(10,8,16,0.72) 46%, rgba(6,5,9,0.9))`,
        border: `1px solid ${open ? h.accent + "55" : "rgba(214,176,121,0.13)"}`,
        boxShadow: open ? `0 30px 80px -40px ${h.glow}, inset 0 1px 0 rgba(255,245,230,0.07)` : "none",
      }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-[64px] transition-opacity duration-700"
        style={{ background: h.glow, opacity: open ? 0.5 : 0.22 }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl border"
            style={{ borderColor: `${h.accent}44`, background: `${h.accent}10` }}
          >
            <span className="font-display text-[19px] font-medium" style={{ color: h.accentSoft }}>
              {h.mark}
            </span>
          </div>
          <div>
            <h3 className="display text-[22px] leading-none text-ivory/95">{h.name}</h3>
            <div className="mt-1.5 font-mono text-[9.5px] tracking-[0.2em] text-mist/60 uppercase">{h.vendor}</div>
          </div>
        </div>
        <span className="font-mono text-[10px] tracking-[0.2em] text-gold/25">0{index + 1}</span>
      </div>

      <div className="relative mt-4">
        <Pill accent={h.accent}>{h.signature}</Pill>
      </div>

      <div className="relative mt-5 flex items-start gap-4">
        <p className="flex-1 text-[13px] leading-relaxed text-sand/70">{l(h.summary)}</p>
        <div className="shrink-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100">
          <Radar h={h} />
        </div>
      </div>

      {/* expanded detail */}
      <div
        className={clsx(
          "relative grid overflow-hidden transition-all duration-500",
          open ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0">
          <div className="border-t border-gold/10 pt-4">
            <div className="font-mono text-[9.5px] tracking-[0.24em] text-gold/60 uppercase">{t("harness.role")}</div>
            <div className="mt-1.5 text-[13.5px] text-ivory/85">{l(h.role)}</div>

            <div className="mt-4 font-mono text-[9.5px] tracking-[0.24em] text-gold/60 uppercase">
              {t("harness.strength")}
            </div>
            <ul className="mt-2 grid gap-1.5">
              {h.strengths.map((s) => (
                <li key={s.en} className="flex items-start gap-2 text-[12.5px] leading-snug text-sand/65">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rotate-45" style={{ background: h.accent }} />
                  {l(s)}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-gold/10 pt-3">
              <div className="flex flex-wrap gap-1.5">
                {h.surfaces.map((s) => (
                  <span
                    key={s}
                    className="rounded border border-gold/15 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-mist/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <span className="font-mono text-[9px] tracking-wider text-gold/40">{h.protocol}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-gold/10 pt-3.5">
        <div className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.16em] text-mist/55">
          <Terminal className="h-3 w-3" />
          <Monitor className="h-3 w-3" />
          <span className="text-gold/50">{l({ id: "Desktop + CLI", en: "Desktop + CLI" })}</span>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.16em] text-gold/50 uppercase">
          <Hexagon className="h-3 w-3" />
          {l({ id: "terhubung", en: "linked" })}
          <ArrowUpRight className="h-3 w-3 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}

export default function HarnessGrid() {
  const { t } = useT();
  return (
    <section id="harnesses" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <SectionHeader eyebrow={t("harness.eyebrow")} title={t("harness.title")} body={t("harness.body")} />
        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {HARNESSES.map((h, i) => (
            <HarnessCard key={h.id} h={h} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
