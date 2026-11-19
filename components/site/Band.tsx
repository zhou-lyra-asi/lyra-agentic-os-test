"use client";

import { useT } from "@/lib/locale-store";

export default function Band() {
  const { t } = useT();
  const items = [t("band.a"), t("band.b"), t("band.c"), t("band.d")];
  const row = [...items, ...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-gold/12 bg-obsidian/60 py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-void to-transparent" />
      <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
        {row.map((it, i) => (
          <span key={i} className="flex items-center gap-10 font-mono text-[10px] tracking-[0.28em] text-sand/45 uppercase">
            {it}
            <span className="h-1 w-1 rotate-45 bg-gold/50" />
          </span>
        ))}
      </div>
    </div>
  );
}
