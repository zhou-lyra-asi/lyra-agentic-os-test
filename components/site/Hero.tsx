"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { useT } from "@/lib/locale-store";
import { GoldButton } from "@/components/ui/primitives";

const LyraScene = dynamic(() => import("@/components/three/LyraScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_35%,rgba(201,138,69,0.14),transparent_70%)]" />,
});

export default function Hero() {
  const { t } = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="relative h-[100svh] min-h-[680px] w-full overflow-hidden">
      {/* 3D layer */}
      <div className="absolute inset-0">
        <LyraScene />
      </div>

      {/* legibility scrims */}
      <div className="pointer-events-none absolute inset-0 vignette" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-void via-void/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[42%] bg-gradient-to-r from-void/88 via-void/40 to-transparent" />

      {/* copy */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1320px] flex-col justify-center px-5 pt-24 sm:px-8">
        <div className="max-w-[640px]">
          <div
            className="flex items-center gap-2.5 opacity-0"
            style={{ animation: mounted ? "riseIn .8s cubic-bezier(.16,1,.3,1) .1s both" : undefined }}
          >
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/80" />
            <span className="eyebrow flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              {t("hero.badge")}
            </span>
          </div>

          <h1 className="display mt-6 text-[clamp(3rem,7.6vw,5.6rem)]">
            <span
              className="block ivory-text"
              style={{ animation: mounted ? "riseIn 1s cubic-bezier(.16,1,.3,1) .18s both" : undefined, opacity: 0 }}
            >
              {t("hero.title1")}
            </span>
            <span
              className="mt-1 block italic gold-text"
              style={{ animation: mounted ? "riseIn 1s cubic-bezier(.16,1,.3,1) .32s both" : undefined, opacity: 0 }}
            >
              {t("hero.title2")}
            </span>
          </h1>

          <p
            className="mt-7 max-w-[540px] text-[15.5px] leading-[1.75] text-sand/78"
            style={{ animation: mounted ? "riseIn .9s cubic-bezier(.16,1,.3,1) .48s both" : undefined, opacity: 0 }}
          >
            {t("hero.sub")}
          </p>

          <div
            className="mt-9 flex flex-wrap items-center gap-3"
            style={{ animation: mounted ? "riseIn .9s cubic-bezier(.16,1,.3,1) .6s both" : undefined, opacity: 0 }}
          >
            <GoldButton href="/console">{t("hero.cta")}</GoldButton>
            <GoldButton href="#arsitektur" variant="outline">
              {t("hero.cta2")}
            </GoldButton>
          </div>

          <div
            className="mt-12 grid max-w-[520px] grid-cols-2 gap-x-6 gap-y-5 border-t border-gold/12 pt-7 sm:grid-cols-4"
            style={{ animation: mounted ? "riseIn 1s cubic-bezier(.16,1,.3,1) .72s both" : undefined, opacity: 0 }}
          >
            {[
              { v: "04", k: "hero.stat.harness" },
              { v: "02", k: "hero.stat.surface" },
              { v: "01", k: "hero.stat.memory" },
              { v: "04", k: "hero.stat.mode" },
            ].map((s) => (
              <div key={s.k}>
                <div className="display text-3xl gold-text">{s.v}</div>
                <div className="mt-1 text-[10.5px] leading-snug tracking-[0.1em] text-mist/70 uppercase">{t(s.k)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* scroll cue */}
      <div className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-center">
        <div className="font-mono text-[9px] tracking-[0.3em] text-gold/45 uppercase">{t("hero.scroll")}</div>
        <ChevronDown className="mx-auto mt-2 h-4 w-4 animate-bounce text-gold/50" />
      </div>

      {/* corner marks */}
      <div className="pointer-events-none absolute inset-6 hidden lg:block">
        {[
          "left-0 top-0 border-l border-t",
          "right-0 top-0 border-r border-t",
          "left-0 bottom-0 border-l border-b",
          "right-0 bottom-0 border-r border-b",
        ].map((c) => (
          <span key={c} className={`absolute h-5 w-5 border-gold/25 ${c}`} />
        ))}
      </div>
    </section>
  );
}
