"use client";

import { useT, useL } from "@/lib/locale-store";
import { ShieldCheck, Layers, History, Hand } from "lucide-react";
import { SectionHeader } from "@/components/ui/primitives";

const ITEMS = [
  { k: "safety.i1", icon: Layers },
  { k: "safety.i2", icon: History },
  { k: "safety.i3", icon: ShieldCheck },
  { k: "safety.i4", icon: Hand },
];

export default function Safety() {
  const { t } = useT();
  const { l } = useL();

  return (
    <section className="relative overflow-hidden py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_15%_40%,rgba(224,138,82,0.06),transparent_70%)]" />
      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHeader eyebrow={t("safety.eyebrow")} title={t("safety.title")} body={t("safety.body")} />
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-gold/15 bg-gold/[0.035] px-4 py-3">
              <ShieldCheck className="h-4 w-4 shrink-0 text-gold-bright" />
              <span className="font-mono text-[10px] leading-relaxed tracking-[0.14em] text-sand/70 uppercase">
                {l({ id: "izin lebih penting daripada kecepatan", en: "permission outranks speed" })}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ITEMS.map((it, i) => (
              <div
                key={it.k}
                className="group relative overflow-hidden rounded-xl border border-gold/12 bg-white/[0.018] p-5 transition-all duration-500 hover:border-gold/32 hover:bg-white/[0.035]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/22 bg-gold/[0.06]">
                  <it.icon className="h-4 w-4 text-gold-bright" />
                </div>
                <p className="mt-4 text-[12.5px] leading-relaxed text-sand/72">{t(it.k)}</p>
                <span className="absolute right-4 top-4 font-mono text-[9px] tracking-[0.2em] text-gold/22">
                  0{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
