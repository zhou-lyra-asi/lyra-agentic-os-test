"use client";

import clsx from "clsx";
import { useT, useL } from "@/lib/locale-store";
import { SectionHeader, GoldButton } from "@/components/ui/primitives";

const VERSIONS = [
  { t: "path.v1.t", d: "path.v1.d", state: "now" },
  { t: "path.v2.t", d: "path.v2.d", state: "next" },
  { t: "path.v3.t", d: "path.v3.d", state: "later" },
  { t: "path.v4.t", d: "path.v4.d", state: "later" },
];

export default function Roadmap() {
  const { t } = useT();
  const { l } = useL();

  return (
    <section id="jalur" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <SectionHeader eyebrow={t("path.eyebrow")} title={t("path.title")} body={t("path.body")} />

        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-[26px] h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
          <div className="grid gap-8 md:grid-cols-4">
            {VERSIONS.map((v, i) => {
              const isNow = v.state === "now";
              return (
                <div key={v.t} className="relative">
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        "relative z-10 flex h-[52px] w-[52px] items-center justify-center rounded-full border transition-all duration-500",
                        isNow
                          ? "border-gold/60 bg-gradient-to-b from-gold/25 to-gold/[0.06] shadow-[0_0_44px_-12px_rgba(242,216,166,0.75)]"
                          : "border-gold/20 bg-void"
                      )}
                    >
                      {isNow && <span className="absolute inset-0 animate-pulse-glow rounded-full bg-gold/15" />}
                      <span
                        className={clsx(
                          "font-mono text-[11px]",
                          isNow ? "text-gold-bright" : "text-mist/45"
                        )}
                      >
                        0{i + 1}
                      </span>
                    </span>
                    <span
                      className={clsx(
                        "rounded-full border px-2 py-0.5 font-mono text-[8.5px] tracking-[0.2em] uppercase",
                        isNow
                          ? "border-halo/40 bg-halo/10 text-halo"
                          : "border-gold/15 text-mist/45"
                      )}
                    >
                      {t(`path.state.${v.state}`)}
                    </span>
                  </div>

                  <h3
                    className={clsx(
                      "display mt-5 text-[21px]",
                      isNow ? "gold-text" : "text-ivory/80"
                    )}
                  >
                    {t(v.t)}
                  </h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-sand/60">{t(v.d)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="relative mt-24 overflow-hidden rounded-xl2 border border-gold/20 p-8 sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_-20%,rgba(224,138,82,0.18),transparent_65%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.5]">
            <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/12" />
            <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/[0.07]" />
          </div>
          <div className="relative mx-auto max-w-xl text-center">
            <h2 className="display text-[clamp(2rem,4.6vw,3.4rem)] ivory-text">{t("cta.title")}</h2>
            <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-sand/70">{t("cta.body")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <GoldButton href="/console">{t("cta.button")}</GoldButton>
              <GoldButton href="#harnesses" variant="ghost" icon={false}>
                {l({ id: "lihat empat harness", en: "meet the four harnesses" })}
              </GoldButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
