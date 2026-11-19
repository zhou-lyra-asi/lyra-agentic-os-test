"use client";

import Link from "next/link";
import { useT, useL } from "@/lib/locale-store";
import { LyraMark } from "./Nav";
import { HARNESSES } from "@/lib/harnesses";

export default function Footer() {
  const { t } = useT();
  const { l } = useL();

  return (
    <footer className="relative overflow-hidden border-t border-gold/12 bg-obsidian/60">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="mx-auto max-w-[1320px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <LyraMark size={32} />
              <div>
                <div className="display text-[19px] text-ivory">Lyra</div>
                <div className="font-mono text-[8.5px] tracking-[0.3em] text-gold/55">AGENTIC OS</div>
              </div>
            </div>
            <p className="mt-5 max-w-sm font-display text-[17px] italic leading-relaxed text-sand/55">
              “{t("footer.quote")}”
            </p>
            <p className="mt-4 text-[11.5px] leading-relaxed text-mist/45">{t("footer.tag")}</p>
          </div>

          <div>
            <div className="font-mono text-[9px] tracking-[0.26em] text-gold/55 uppercase">
              {l({ id: "Harness", en: "Harnesses" })}
            </div>
            <ul className="mt-4 space-y-2">
              {HARNESSES.map((h) => (
                <li key={h.id}>
                  <a
                    href="#harnesses"
                    className="flex items-center gap-2 text-[12.5px] text-sand/60 transition-colors hover:text-ivory"
                  >
                    <span className="h-1 w-1 rounded-full" style={{ background: h.accent }} />
                    {h.name}
                    <span className="font-mono text-[9px] text-mist/35">{h.vendor}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-mono text-[9px] tracking-[0.26em] text-gold/55 uppercase">
              {l({ id: "Jelajahi", en: "Explore" })}
            </div>
            <ul className="mt-4 space-y-2">
              {[
                { href: "#arsitektur", k: "nav.arch" },
                { href: "#kapabilitas", k: "nav.capability" },
                { href: "#jalur", k: "nav.path" },
                { href: "/console", k: "nav.console" },
              ].map((it) => (
                <li key={it.k}>
                  <Link href={it.href} className="text-[12.5px] text-sand/60 transition-colors hover:text-ivory">
                    {t(it.k)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gold/10 pt-6">
          <p className="text-[10.5px] leading-relaxed text-mist/40">{t("footer.disclaimer")}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[9.5px] tracking-[0.14em] text-mist/35 uppercase">
            <span>© {new Date().getFullYear()} Lyra Agentic OS · v0.1 Aurea</span>
            <span>{t("footer.rights")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
