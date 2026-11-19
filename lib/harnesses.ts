export type HarnessId = "claude" | "antigravity" | "hermes" | "codex";

export type Localized = { id: string; en: string };

export type Harness = {
  id: HarnessId;
  name: string;
  vendor: string;
  vendorLong: string;
  signature: string;
  accent: string;
  accentSoft: string;
  glow: string;
  mark: string;
  role: Localized;
  summary: Localized;
  strengths: Localized[];
  surfaces: string[];
  handle: string;
  protocol: string;
  /** 0..1 — used for the radar chart */
  traits: { depth: number; speed: number; autonomy: number; memory: number; verification: number };
};

export const HARNESSES: Harness[] = [
  {
    id: "claude",
    name: "Claude Code",
    vendor: "Anthropic",
    vendorLong: "Anthropic",
    signature: "Architect of caution",
    accent: "#d9855f",
    accentSoft: "#f0c4a8",
    glow: "rgba(217,133,95,0.45)",
    mark: "C",
    role: {
      id: "Arsitek & Pengulas",
      en: "Architect & Reviewer",
    },
    summary: {
      id: "Membaca basis kode besar tanpa panik, menyusun rencana bertahap, lalu memeriksa hasil kerja harness lain dengan sabar dan tekstual.",
      en: "Reads very large codebases without panic, drafts staged plans, then reviews other harnesses' work patiently and in plain text.",
    },
    strengths: [
      { id: "Penalaran panjang & multi-langkah", en: "Long, multi-step reasoning" },
      { id: "Subagent untuk pencarian luas", en: "Subagents for wide searches" },
      { id: "Review diff yang teliti", en: "Meticulous diff review" },
      { id: "Integrasi MCP & Agent SDK", en: "MCP and Agent SDK integration" },
    ],
    surfaces: ["CLI", "Desktop", "IDE", "SDK"],
    handle: "@claude-code",
    protocol: "MCP · Agent SDK",
    traits: { depth: 0.96, speed: 0.55, autonomy: 0.74, memory: 0.6, verification: 0.88 },
  },
  {
    id: "antigravity",
    name: "Antigravity",
    vendor: "Google",
    vendorLong: "Google DeepMind",
    signature: "Inspector of evidence",
    accent: "#7fa8ec",
    accentSoft: "#c2d8ff",
    glow: "rgba(127,168,236,0.45)",
    mark: "A",
    role: {
      id: "Verifikator Visual & Manajer Agen",
      en: "Visual Verifier & Agent Manager",
    },
    summary: {
      id: "Tidak percaya pada kata-kata. Ia menjalankan aplikasinya, mengambil screenshot, merekam browser, lalu menyodorkan artefak sebagai bukti.",
      en: "Does not trust words. It runs the app, takes screenshots, records the browser, and hands over artifacts as proof.",
    },
    strengths: [
      { id: "Artifact: rencana, walkthrough, rekaman", en: "Artifacts: plans, walkthroughs, recordings" },
      { id: "Kontrol browser untuk verifikasi nyata", en: "Browser control for real verification" },
      { id: "Banyak agen paralel lintas workspace", en: "Parallel agents across workspaces" },
      { id: "Knowledge base dari kerja lampau", en: "Knowledge base from past work" },
    ],
    surfaces: ["Desktop IDE", "CLI", "SDK", "Manager"],
    handle: "@antigravity",
    protocol: "Artifacts · ACP",
    traits: { depth: 0.8, speed: 0.72, autonomy: 0.9, memory: 0.68, verification: 0.98 },
  },
  {
    id: "hermes",
    name: "Hermes",
    vendor: "Nous Research",
    vendorLong: "Nous Research",
    signature: "Keeper of continuity",
    accent: "#6fd3ad",
    accentSoft: "#b7f1dc",
    glow: "rgba(111,211,173,0.42)",
    mark: "H",
    role: {
      id: "Ahli Memori & Penumbuh Skill",
      en: "Memory Keeper & Skill Grower",
    },
    summary: {
      id: "Setelah tugas berat selesai, ia menulis skill baru, memperbaikinya saat dipakai, dan menyimpan ingatan yang tak hilang antar sesi.",
      en: "After a hard task it writes a new skill, improves it through use, and keeps memory that survives between sessions.",
    },
    strengths: [
      { id: "Memori persisten & pencarian sesi", en: "Persistent memory & session search" },
      { id: "Skill mandiri (SKILL.md) yang menguat", en: "Self-authored skills that compound" },
      { id: "Bebas model & provider", en: "Model and provider agnostic" },
      { id: "Gateway pesan multi-kanal", en: "Multi-channel messaging gateway" },
    ],
    surfaces: ["CLI", "Desktop", "IDE (ACP)", "Messaging"],
    handle: "@hermes",
    protocol: "ACP · OpenAI-compatible",
    traits: { depth: 0.82, speed: 0.66, autonomy: 0.86, memory: 0.99, verification: 0.7 },
  },
  {
    id: "codex",
    name: "Codex",
    vendor: "OpenAI",
    vendorLong: "OpenAI",
    signature: "Executor of contracts",
    accent: "#b8adf5",
    accentSoft: "#ded8ff",
    glow: "rgba(184,173,245,0.42)",
    mark: "X",
    role: {
      id: "Pelaksana Cepat & Disiplin Kontrak",
      en: "Fast Executor & Contract Disciplinarian",
    },
    summary: {
      id: "Diberi kontrak tugas yang jelas, ia mengeksekusi cepat dan rapi — patch kecil, uji langsung, tanpa drama.",
      en: "Given a clear task contract it executes fast and cleanly — small patches, immediate tests, no drama.",
    },
    strengths: [
      { id: "Iterasi cepat pada perubahan terfokus", en: "Fast iteration on focused changes" },
      { id: "Disiplin patch & uji otomatis", en: "Patch discipline and automated tests" },
      { id: "Paralel di cloud maupun lokal", en: "Parallel in cloud or local" },
      { id: "Kontrak tugas yang ketat", en: "Tight task contracts" },
    ],
    surfaces: ["CLI", "IDE", "Cloud", "App"],
    handle: "@codex",
    protocol: "MCP · Responses API",
    traits: { depth: 0.72, speed: 0.97, autonomy: 0.8, memory: 0.55, verification: 0.82 },
  },
];

export const harnessById = (id: HarnessId) => HARNESSES.find((h) => h.id === id)!;

export type ModeId = "everyday" | "code" | "analysis" | "cyber";

export const MODES: {
  id: ModeId;
  name: Localized;
  accent: string;
  icon: string;
  blurb: Localized;
}[] = [
  {
    id: "everyday",
    name: { id: "Everyday Help", en: "Everyday Help" },
    accent: "#e6c493",
    icon: "spark",
    blurb: {
      id: "Hidup sehari-hari, diurus dengan rapi.",
      en: "Daily life, handled with care.",
    },
  },
  {
    id: "code",
    name: { id: "Code", en: "Code" },
    accent: "#8fb7f2",
    icon: "code",
    blurb: { id: "Bangun, perbaiki, buktikan.", en: "Build, fix, prove." },
  },
  {
    id: "analysis",
    name: { id: "Deeper Analysis", en: "Deeper Analysis" },
    accent: "#9ad9c4",
    icon: "chart",
    blurb: { id: "Cari akar, bukan gejala.", en: "Find the root, not the symptom." },
  },
  {
    id: "cyber",
    name: { id: "Cyber", en: "Cyber" },
    accent: "#f0917a",
    icon: "shield",
    blurb: { id: "Bertahan sebelum diserang.", en: "Defend before the strike." },
  },
];

export const modeById = (id: ModeId) => MODES.find((m) => m.id === id)!;
