"use client";

import { useT, useL } from "@/lib/locale-store";
import { HARNESSES } from "@/lib/harnesses";
import { Divider, SectionHeader } from "@/components/ui/primitives";
import { Eye, Brain, FileCheck2 } from "lucide-react";

export default function Converge() {
  const { t } = useT();
  const { l } = useL();

  const principles = [
    { icon: Eye, title: t("converge.p1.title"), body: t("converge.p1.body") },
    { icon: Brain, title: t("converge.p2.title"), body: t("converge.p2.body") },
    { icon: FileCheck2, title: t("converge.p3.title"), body: t("converge.p3.body") },
  ];

  return (
    <section id="manifesto" className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gold/[0.05] blur-[120px]" />
      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
        <SectionHeader eyebrow={t("converge.eyebrow")} title={t("converge.title")} body={t("converge.body")} align="center" />

        {/* signature line */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {HARNESSES.map((h, i) => (
            <span key={h.id} className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: h.accent }}>
                {h.name}
              </span>
              <span className="text-gold/30">{i < 3 ? "/" : ""}</span>
            </span>
          ))}
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {principles.map((p, i) => (
            <div
              key={p.title}
              className="group glass grain relative overflow-hidden rounded-xl2 p-7 transition-all duration-500 hover:border-gold/30 hover:shadow-[0_24px_70px_-30px_rgba(224,138,82,0.45)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.06]">
                  <p.icon className="h-4 w-4 text-gold-bright" />
                </div>
                <span className="font-mono text-[10px] tracking-[0.3em] text-gold/30">0{i + 1}</span>
              </div>
              <h3 className="display mt-6 text-2xl text-ivory/92">{p.title}</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-sand/65">{p.body}</p>
              <div className="absolute inset-x-7 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>
          ))}
        </div>

        <div className="mt-20">
          <Divider />
        </div>

        {/* whisper quote */}
        <p className="mx-auto mt-20 max-w-2xl text-center font-display text-[clamp(1.35rem,2.6vw,2rem)] font-light italic leading-[1.5] text-ivory/60">
          “{l({ id: "Ia tidak melihat dengan mata, jadi tidak ada yang bisa menipunya dengan penampilan.", en: "She does not see with eyes, so nothing can fool her with appearances." })}”
        </p>
      </div>
    </section>
  );
}
