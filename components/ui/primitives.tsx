"use client";

import clsx from "clsx";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  body,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  body?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <div className="flex items-center gap-3" style={{ justifyContent: align === "center" ? "center" : undefined }}>
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold/70" />
        <span className="eyebrow">{eyebrow}</span>
        <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold/70" />
      </div>
      <h2 className="display mt-5 text-[clamp(2rem,4.4vw,3.5rem)] text-ivory/95">{title}</h2>
      {body && <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-sand/70" style={{ marginInline: align === "center" ? "auto" : undefined }}>{body}</p>}
    </div>
  );
}

export function GoldButton({
  children,
  href,
  onClick,
  variant = "solid",
  className,
  icon = true,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "solid" | "ghost" | "outline";
  className?: string;
  icon?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base =
    "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full px-6 py-3 text-[12.5px] font-medium tracking-[0.12em] uppercase transition-all duration-500 disabled:opacity-40 disabled:pointer-events-none";
  const styles = {
    solid:
      "bg-gradient-to-b from-gold-bright to-gold text-[#231708] hover:shadow-[0_0_44px_-6px_rgba(242,216,166,0.55)] hover:brightness-105",
    outline:
      "border border-gold/35 text-gold-bright hover:border-gold/70 hover:bg-gold/[0.06] hover:shadow-[0_0_32px_-14px_rgba(214,176,121,0.8)]",
    ghost: "text-sand/75 hover:text-ivory",
  }[variant];

  const inner = (
    <>
      <span className="relative z-10">{children}</span>
      {icon && (
        <ArrowUpRight className="relative z-10 h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      )}
      {variant === "solid" && (
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={clsx(base, styles, className)}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={clsx(base, styles, className)}>
      {inner}
    </button>
  );
}

export function Pill({ children, accent, className }: { children: ReactNode; accent?: string; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.16em] uppercase",
        className
      )}
      style={{
        borderColor: accent ? `${accent}44` : "rgba(214,176,121,0.22)",
        color: accent ?? "var(--color-gold)",
        background: accent ? `${accent}0f` : "rgba(214,176,121,0.05)",
      }}
    >
      {children}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return (
    <div className={clsx("relative h-px w-full", className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gold/70" />
    </div>
  );
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={clsx("animate-rise", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
