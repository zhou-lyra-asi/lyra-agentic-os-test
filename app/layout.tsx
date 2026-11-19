import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/300.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/300-italic.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/300.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lyra Agentic OS — Empat Harness, Satu Jiwa",
  description:
    "Sistem operasi agentic yang menyatukan Claude Code, Antigravity, Hermes, dan Codex dalam satu harness terintegrasi — untuk desktop dan CLI.",
  applicationName: "Lyra Agentic OS",
  keywords: [
    "Lyra Agentic OS",
    "agentic operating system",
    "Claude Code",
    "Antigravity",
    "Hermes",
    "Codex",
    "multi-agent",
    "AI harness",
  ],
  openGraph: {
    title: "Lyra Agentic OS — Empat Harness, Satu Jiwa",
    description:
      "Claude Code, Antigravity, Hermes dan Codex bekerja dalam satu harness terintegrasi di bawah Lyra.",
    images: ["/assets/lyra-og.jpg"],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/assets/lyra-og.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#060509",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
