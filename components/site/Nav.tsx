"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Languages } from "lucide-react";
import { useLocale, useT } from "@/lib/locale-store";
import { GoldButton } from "@/components/ui/primitives";
import clsx from "clsx";

const LINKS = [
  { key: "nav.harness", href: "#harnesses" },
  { key: "nav.arch", href: "#arsitektur" },
  { key: "nav.capability", href: "#kapabilitas" },
  { key: "nav.path", href: "#jalur" },
  { key: "nav.console", href: "/console" },
];

export default function Nav() {
  const { t } = useT();
  const toggle = useLocale((s) => s.toggle);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <header
        className={clsx(
          "fixed inset-x-0 top-0 z-50 transition-all duration-700",
          scrolled ? "py-2.5" : "py-5"
        )}
      >
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <LyraMark />
            <div className="leading-none">
              <div className="display text-[19px] tracking-[0.02em] text-ivory">Lyra</div>
              <div className="mt-0.5 font-mono text-[8.5px] tracking-[0.3em] text-gold/60">AGENTIC OS</div>
            </div>
          </Link>

          <nav
            className={clsx(
              "hidden items-center gap-1 rounded-full px-2 py-1.5 transition-all duration-500 lg:flex",
              scrolled ? "glass" : "border border-transparent"
            )}
          >
            {LINKS.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className="rounded-full px-3.5 py-1.5 text-[12.5px] text-sand/70 transition-colors duration-300 hover:bg-gold/[0.07] hover:text-ivory"
              >
                {t(l.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label={t("lang.label")}
              className="flex h-9 items-center gap-1.5 rounded-full border border-gold/20 px-3 font-mono text-[10px] tracking-[0.18em] text-gold/80 transition-colors hover:border-gold/50 hover:text-gold-bright"
            >
              <Languages className="h-3 w-3" />
              {t("lang.switch")}
            </button>
            <GoldButton href="/console" className="hidden sm:inline-flex !px-5 !py-2.5 !text-[11px]">
              {t("nav.enter")}
            </GoldButton>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/20 text-gold/80 lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* mobile sheet */}
      <div
        className={clsx(
          "fixed inset-0 z-40 flex flex-col justify-center bg-void/95 px-8 backdrop-blur-2xl transition-all duration-500 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="space-y-1">
          {LINKS.map((l, i) => (
            <Link
              key={l.key}
              href={l.href}
              onClick={() => setOpen(false)}
              className="display flex items-baseline gap-4 border-b border-gold/10 py-4 text-4xl text-ivory/85 transition-colors hover:text-gold-bright"
            >
              <span className="font-mono text-[10px] tracking-widest text-gold/40">0{i + 1}</span>
              {t(l.key)}
            </Link>
          ))}
        </div>
        <div className="mt-10">
          <GoldButton href="/console">{t("nav.enter")}</GoldButton>
        </div>
      </div>
    </>
  );
}

export function LyraMark({ size = 34 }: { size?: number }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size} className="relative z-10">
        <defs>
          <linearGradient id="lg-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7e3bd" />
            <stop offset="55%" stopColor="#d6b079" />
            <stop offset="100%" stopColor="#8a6a38" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill="none" stroke="url(#lg-gold)" strokeWidth="0.7" opacity="0.6" />
        <circle cx="20" cy="20" r="14.2" fill="none" stroke="url(#lg-gold)" strokeWidth="0.5" opacity="0.32" />
        <path
          d="M20 6.4c1.5 5.3 3.6 8 8.6 9.6-5 1.6-7.1 4.3-8.6 9.6-1.5-5.3-3.6-8-8.6-9.6 5-1.6 7.1-4.3 8.6-9.6Z"
          fill="url(#lg-gold)"
          opacity="0.95"
        />
        <path d="M20 27.6v6" stroke="url(#lg-gold)" strokeWidth="0.8" opacity="0.7" />
        <circle cx="20" cy="35" r="1.1" fill="url(#lg-gold)" opacity="0.8" />
      </svg>
      <span className="absolute inset-0 -z-0 rounded-full bg-gold/25 blur-lg" />
    </span>
  );
}
