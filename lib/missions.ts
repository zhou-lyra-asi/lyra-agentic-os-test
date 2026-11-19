import type { HarnessId, Localized, ModeId } from "./harnesses";

export type StepKind =
  | "think"
  | "tool"
  | "verify"
  | "handoff"
  | "approval"
  | "artifact"
  | "done";

export type Step = {
  id: string;
  agent: HarnessId;
  kind: StepKind;
  title: Localized;
  detail: Localized;
  /** simulated latency in ms */
  ms: number;
  tokens: number;
  confidence?: number;
  artifact?: { name: string; kind: "diff" | "screenshot" | "log" | "doc" | "test"; meta: string };
  gate?: { reason: Localized };
};

export type Scenario = {
  id: string;
  mode: ModeId;
  intent: Localized;
  plan: Localized[];
  steps: Step[];
  outcome: Localized;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "passkeys",
    mode: "code",
    intent: {
      id: "Migrasikan autentikasi tiga repo dari password ke passkey, tanpa memutus sesi aktif.",
      en: "Migrate authentication across three repos from passwords to passkeys without breaking live sessions.",
    },
    plan: [
      { id: "Petakan alur auth di tiga repo", en: "Map the auth flow across three repos" },
      { id: "Rancang skema ganda password + passkey", en: "Design a dual password + passkey scheme" },
      { id: "Implementasi bertahap per repo", en: "Implement incrementally, repo by repo" },
      { id: "Uji sesi aktif & rollback", en: "Test live sessions and rollback" },
      { id: "Verifikasi visual + laporan bukti", en: "Visual verification plus an evidence report" },
    ],
    steps: [
      {
        id: "s1",
        agent: "claude",
        kind: "think",
        title: { id: "Memetakan alur autentikasi", en: "Mapping the authentication flow" },
        detail: {
          id: "Membaca 412 berkas, menemukan 3 titik masuk auth dan 1 jalur lama yang masih dipakai seluler.",
          en: "Read 412 files, found 3 auth entry points and 1 legacy path still used by mobile.",
        },
        ms: 1500,
        tokens: 18420,
        confidence: 0.93,
      },
      {
        id: "s2",
        agent: "claude",
        kind: "handoff",
        title: { id: "Menulis kontrak migrasi", en: "Writing the migration contract" },
        detail: {
          id: "Kontrak tugas: skema ganda, feature flag per repo, rollback dalam satu perintah. Diserahkan ke Codex.",
          en: "Task contract: dual scheme, per-repo feature flag, one-command rollback. Handed to Codex.",
        },
        ms: 1200,
        tokens: 6210,
        artifact: {
          name: "migration-contract.md",
          kind: "doc",
          meta: "14 acceptance criteria",
        },
      },
      {
        id: "s3",
        agent: "codex",
        kind: "tool",
        title: { id: "Menulis adaptor passkey", en: "Writing the passkey adapter" },
        detail: {
          id: "Patch 6 berkas di repo inti. Uji unit langsung dijalankan: 88 lulus, 0 gagal.",
          en: "Patched 6 files in the core repo. Unit tests ran immediately: 88 passed, 0 failed.",
        },
        ms: 1800,
        tokens: 22410,
        confidence: 0.9,
        artifact: { name: "auth/passkey-adapter.diff", kind: "diff", meta: "+312 −47" },
      },
      {
        id: "s4",
        agent: "codex",
        kind: "tool",
        title: { id: "Migrasi repo klien & admin", en: "Migrating client and admin repos" },
        detail: {
          id: "Dua repo diperbarui berurutan, masing-masing di belakang feature flag terpisah.",
          en: "Two repos updated in sequence, each behind its own feature flag.",
        },
        ms: 1600,
        tokens: 19880,
        artifact: { name: "test-report.xml", kind: "test", meta: "264 assertions" },
      },
      {
        id: "s5",
        agent: "antigravity",
        kind: "verify",
        title: { id: "Menjalankan aplikasi & login nyata", en: "Running the app for a real login" },
        detail: {
          id: "Browser digerakkan: login password lama, registrasi passkey, login passkey. Tiga sesi aktif tidak terputus.",
          en: "Browser driven end to end: legacy password login, passkey enrollment, passkey login. Three live sessions stayed intact.",
        },
        ms: 1700,
        tokens: 14320,
        confidence: 0.97,
        artifact: { name: "login-walkthrough.webm", kind: "screenshot", meta: "00:38 · 1440p" },
      },
      {
        id: "s6",
        agent: "antigravity",
        kind: "verify",
        title: { id: "Menemukan celah rollback", en: "Found a rollback gap" },
        detail: {
          id: "Rollback gagal pada repo admin karena flag dibaca sebelum migrasi skema. Dikembalikan ke Codex.",
          en: "Rollback failed on the admin repo because the flag was read before the schema migration. Sent back to Codex.",
        },
        ms: 1400,
        tokens: 9760,
        artifact: { name: "rollback-failure.log", kind: "log", meta: "line 214" },
      },
      {
        id: "s7",
        agent: "codex",
        kind: "tool",
        title: { id: "Memperbaiki urutan rollback", en: "Fixing rollback ordering" },
        detail: {
          id: "Urutan dibalik, flag dipindahkan setelah migrasi. Uji rollback kini lulus di ketiga repo.",
          en: "Ordering inverted, flag moved after migration. Rollback tests now pass in all three repos.",
        },
        ms: 1300,
        tokens: 8120,
        confidence: 0.95,
        artifact: { name: "rollback-ordering.diff", kind: "diff", meta: "+58 −31" },
      },
      {
        id: "s8",
        agent: "hermes",
        kind: "artifact",
        title: { id: "Menulis skill & memori", en: "Writing skill and memory" },
        detail: {
          id: "Skill baru: `passkey-migration-dual-scheme`. Memori: flag harus selalu dibaca setelah migrasi skema.",
          en: "New skill: `passkey-migration-dual-scheme`. Memory: flags must always be read after schema migration.",
        },
        ms: 1200,
        tokens: 5480,
        artifact: {
          name: "~/.hermes/skills/passkey-migration/SKILL.md",
          kind: "doc",
          meta: "reusable · v1",
        },
      },
      {
        id: "s9",
        agent: "claude",
        kind: "done",
        title: { id: "Ringkasan akhir", en: "Final summary" },
        detail: {
          id: "Migrasi selesai di 3 repo, 0 sesi terputus, rollback teruji. Semua klaim punya artefak.",
          en: "Migration complete across 3 repos, 0 sessions dropped, rollback proven. Every claim has an artifact.",
        },
        ms: 1000,
        tokens: 4210,
        confidence: 0.96,
      },
    ],
    outcome: {
      id: "Passkey aktif di semua repo dengan jalur mundur yang sudah terbukti — bukan diasumsikan.",
      en: "Passkeys live in every repo with a rollback path that was proven, not assumed.",
    },
  },
  {
    id: "latency",
    mode: "analysis",
    intent: {
      id: "Kenapa p99 API checkout naik 340ms sejak Selasa? Cari akarnya, bukan gejalanya.",
      en: "Why did checkout API p99 climb 340ms since Tuesday? Find the root, not the symptom.",
    },
    plan: [
      { id: "Kumpulkan metrik & korelasi waktu", en: "Gather metrics and time correlations" },
      { id: "Isolasi perubahan Selasa", en: "Isolate Tuesday's changes" },
      { id: "Reproduksi di lingkungan terkendali", en: "Reproduce in a controlled environment" },
      { id: "Uji hipotesis satu per satu", en: "Test hypotheses one at a time" },
      { id: "Usulkan perbaikan + bukti", en: "Propose a fix with proof" },
    ],
    steps: [
      {
        id: "l1",
        agent: "hermes",
        kind: "think",
        title: { id: "Menarik ingatan proyek", en: "Pulling project memory" },
        detail: {
          id: "Memori 4 bulan lalu: pola serupa muncul saat index komposit ditambahkan tanpa ANALYZE.",
          en: "Memory from four months ago: a similar pattern appeared when a composite index was added without ANALYZE.",
        },
        ms: 1200,
        tokens: 7800,
        confidence: 0.72,
      },
      {
        id: "l2",
        agent: "codex",
        kind: "tool",
        title: { id: "Mengumpulkan jejak & metrik", en: "Collecting traces and metrics" },
        detail: {
          id: "180 ribu span checkout dianalisis. Lonjakan terkonsentrasi pada 1 kueri: `cart_items` join.",
          en: "180k checkout spans analysed. The spike concentrates on one query: the `cart_items` join.",
        },
        ms: 1600,
        tokens: 31200,
        artifact: { name: "trace-flamegraph.svg", kind: "screenshot", meta: "p99 window" },
      },
      {
        id: "l3",
        agent: "antigravity",
        kind: "verify",
        title: { id: "Reproduksi di staging", en: "Reproducing in staging" },
        detail: {
          id: "Beban 2x produksi diputar ulang. p99 naik 331ms — dalam margin 3% dari keluhan asli.",
          en: "2x production load replayed. p99 rose 331ms — within 3% of the original complaint.",
        },
        ms: 1700,
        tokens: 12600,
        confidence: 0.94,
        artifact: { name: "staging-load-report.html", kind: "log", meta: "60 min run" },
      },
      {
        id: "l4",
        agent: "claude",
        kind: "think",
        title: { id: "Menyusun tiga hipotesis", en: "Forming three hypotheses" },
        detail: {
          id: "H1 index usang, H2 N+1 pada keranjang, H3 koneksi pool jenuh. Masing-masing diberi uji pembeda.",
          en: "H1 stale index, H2 cart N+1, H3 connection pool saturation. Each gets a discriminating test.",
        },
        ms: 1500,
        tokens: 15800,
        confidence: 0.88,
      },
      {
        id: "l5",
        agent: "codex",
        kind: "tool",
        title: { id: "Menguji ketiga hipotesis", en: "Testing all three hypotheses" },
        detail: {
          id: "H2 dan H3 gugur (nol perubahan). H1 terkonfirmasi: statistik tabel basi 6 hari.",
          en: "H2 and H3 eliminated (zero delta). H1 confirmed: table statistics stale for six days.",
        },
        ms: 1500,
        tokens: 18400,
        artifact: { name: "hypothesis-matrix.csv", kind: "doc", meta: "3 tested · 1 confirmed" },
      },
      {
        id: "l6",
        agent: "antigravity",
        kind: "verify",
        title: { id: "Membuktikan perbaikan", en: "Proving the fix" },
        detail: {
          id: "ANALYZE dijalankan di staging: p99 turun ke 412ms, di bawah baseline lama. Screenshot dashboard dilampirkan.",
          en: "ANALYZE run in staging: p99 dropped to 412ms, below the old baseline. Dashboard screenshot attached.",
        },
        ms: 1500,
        tokens: 9900,
        confidence: 0.97,
        artifact: { name: "p99-after-analyze.png", kind: "screenshot", meta: "412ms p99" },
      },
      {
        id: "l7",
        agent: "hermes",
        kind: "artifact",
        title: { id: "Menyimpan pelajaran", en: "Storing the lesson" },
        detail: {
          id: "Aturan baru: setiap migrasi index wajib diikuti ANALYZE, dicek otomatis sebelum deploy.",
          en: "New rule: every index migration must be followed by ANALYZE, auto-checked before deploy.",
        },
        ms: 1100,
        tokens: 4600,
        artifact: { name: "MEMORY.md", kind: "doc", meta: "+1 invariant" },
      },
      {
        id: "l8",
        agent: "claude",
        kind: "done",
        title: { id: "Laporan akar masalah", en: "Root-cause report" },
        detail: {
          id: "Akar masalah: statistik basi setelah migrasi index. Dampak: +340ms p99. Biaya perbaikan: satu perintah.",
          en: "Root cause: stale statistics after an index migration. Impact: +340ms p99. Fix cost: one command.",
        },
        ms: 1000,
        tokens: 5100,
        confidence: 0.96,
      },
    ],
    outcome: {
      id: "Akar masalah ditemukan dan dibuktikan dengan reproduksi — bukan tebakan yang terdengar pintar.",
      en: "Root cause found and proven by reproduction — not a clever-sounding guess.",
    },
  },
  {
    id: "supply",
    mode: "cyber",
    intent: {
      id: "Audit rantai pasok dependensi aplikasi pembayaran kami. Hanya baca, jangan ubah apa pun.",
      en: "Audit the dependency supply chain of our payments app. Read-only, change nothing.",
    },
    plan: [
      { id: "Inventaris semua dependensi transitif", en: "Inventory every transitive dependency" },
      { id: "Pindai typosquatting & paket terbengkalai", en: "Scan for typosquatting and abandoned packages" },
      { id: "Cek integritas lockfile & tanda tangan", en: "Check lockfile integrity and signatures" },
      { id: "Gerbang persetujuan manusia sebelum tulis", en: "Human approval gate before any write" },
      { id: "Laporan temuan dengan tingkat risiko", en: "Findings report with risk tiers" },
    ],
    steps: [
      {
        id: "c1",
        agent: "hermes",
        kind: "think",
        title: { id: "Memuat kebijakan keamanan", en: "Loading the security policy" },
        detail: {
          id: "Mode Cyber aktif. Wewenang: baca-saja. Setiap tool yang menulis dimatikan di tingkat protokol.",
          en: "Cyber mode active. Authority: read-only. Every mutating tool is disabled at the protocol level.",
        },
        ms: 1200,
        tokens: 6900,
        confidence: 0.99,
      },
      {
        id: "c2",
        agent: "codex",
        kind: "tool",
        title: { id: "Menyusun SBOM", en: "Building the SBOM" },
        detail: {
          id: "1.284 paket, 37.912 berkas lockfile. Semua hash dicocokkan dengan registry resmi.",
          en: "1,284 packages, 37,912 lockfile entries. Every hash matched against the official registry.",
        },
        ms: 1600,
        tokens: 26800,
        artifact: { name: "sbom.cyclonedx.json", kind: "doc", meta: "1,284 components" },
      },
      {
        id: "c3",
        agent: "claude",
        kind: "think",
        title: { id: "Membaca pola anomali", en: "Reading anomaly patterns" },
        detail: {
          id: "Tiga paket mencurigakan: nama mirip paket populer, maintainer baru, rilis 11 hari lalu.",
          en: "Three suspicious packages: names one edit away from popular ones, new maintainers, released 11 days ago.",
        },
        ms: 1500,
        tokens: 17200,
        confidence: 0.9,
      },
      {
        id: "c4",
        agent: "antigravity",
        kind: "verify",
        title: { id: "Memeriksa riwayat rilis", en: "Inspecting release history" },
        detail: {
          id: "Artefak: timeline rilis, diff manifest, dan screenshot halaman registry. Dua paket terbukti typosquat.",
          en: "Artifacts: release timeline, manifest diff, registry page screenshots. Two packages confirmed typosquats.",
        },
        ms: 1700,
        tokens: 13400,
        artifact: { name: "registry-timeline.png", kind: "screenshot", meta: "3 packages" },
      },
      {
        id: "c5",
        agent: "codex",
        kind: "tool",
        title: { id: "Menelusuri postinstall", en: "Tracing postinstall scripts" },
        detail: {
          id: "Ditemukan skrip postinstall yang menghubungi domain eksternal. Tidak dieksekusi — hanya dianalisis statis.",
          en: "Found a postinstall script calling an external domain. Not executed — static analysis only.",
        },
        ms: 1500,
        tokens: 15900,
        artifact: { name: "postinstall-trace.log", kind: "log", meta: "static only" },
      },
      {
        id: "c6",
        agent: "hermes",
        kind: "approval",
        title: { id: "Gerbang persetujuan", en: "Approval gate" },
        detail: {
          id: "Lyra meminta izin untuk MENULIS berkas karantina dan membuat pull request perbaikan lockfile.",
          en: "Lyra requests permission to WRITE a quarantine file and open a lockfile-fix pull request.",
        },
        ms: 900,
        tokens: 2100,
        gate: {
          reason: {
            id: "Tindakan ini mengubah repositori. Mode Cyber mewajibkan persetujuan manusia per langkah.",
            en: "This action mutates the repository. Cyber mode requires per-step human approval.",
          },
        },
      },
      {
        id: "c7",
        agent: "claude",
        kind: "done",
        title: { id: "Laporan temuan", en: "Findings report" },
        detail: {
          id: "2 kritis (typosquat), 1 tinggi (postinstall), 9 sedang, 31 rendah. Semua dengan bukti dan langkah mitigasi.",
          en: "2 critical (typosquats), 1 high (postinstall), 9 medium, 31 low. All with evidence and mitigations.",
        },
        ms: 1000,
        tokens: 7300,
        confidence: 0.95,
        artifact: { name: "supply-chain-findings.md", kind: "doc", meta: "43 findings" },
      },
    ],
    outcome: {
      id: "Dua paket berbahaya teridentifikasi tanpa satu pun perintah destruktif dijalankan.",
      en: "Two malicious packages identified without running a single destructive command.",
    },
  },
  {
    id: "kyoto",
    mode: "everyday",
    intent: {
      id: "Rencanakan 5 hari di Kyoto untuk dua orang, budget 18 juta, musim gugur, tidak suka keramaian.",
      en: "Plan five days in Kyoto for two, 18 million rupiah budget, autumn, allergic to crowds.",
    },
    plan: [
      { id: "Kumpulkan preferensi & batasan", en: "Gather preferences and constraints" },
      { id: "Susun kerangka hari & rute", en: "Draft day skeleton and routes" },
      { id: "Periksa jam buka & reservasi", en: "Check opening hours and reservations" },
      { id: "Hitung anggaran & cadangan", en: "Compute budget and buffer" },
      { id: "Rapikan jadi dokumen siap bawa", en: "Polish into a carry-ready document" },
    ],
    steps: [
      {
        id: "k1",
        agent: "hermes",
        kind: "think",
        title: { id: "Membaca preferensi lama", en: "Reading past preferences" },
        detail: {
          id: "Dari memori: kamu membenci antrean pagi, suka berjalan kaki, dan selalu butuh 1 hari santai.",
          en: "From memory: you hate morning queues, love walking, and always need one slow day.",
        },
        ms: 1100,
        tokens: 5200,
        confidence: 0.91,
      },
      {
        id: "k2",
        agent: "claude",
        kind: "think",
        title: { id: "Menyusun kerangka 5 hari", en: "Drafting the five-day skeleton" },
        detail: {
          id: "Higashiyama sebelum jam 7, Arashiyama di hari kerja, satu hari tanpa rencana di hari ke-4.",
          en: "Higashiyama before 7am, Arashiyama on a weekday, one unplanned day on day four.",
        },
        ms: 1300,
        tokens: 11200,
        confidence: 0.89,
      },
      {
        id: "k3",
        agent: "antigravity",
        kind: "verify",
        title: { id: "Memeriksa jadwal nyata", en: "Checking real schedules" },
        detail: {
          id: "Jam buka 14 tempat diperiksa langsung, 2 tutup pada tanggal yang direncanakan. Rute disesuaikan.",
          en: "Opening hours for 14 places checked live; two are closed on the planned dates. Routes adjusted.",
        },
        ms: 1500,
        tokens: 9800,
        artifact: { name: "opening-hours-check.png", kind: "screenshot", meta: "14 places" },
      },
      {
        id: "k4",
        agent: "codex",
        kind: "tool",
        title: { id: "Menghitung anggaran", en: "Computing the budget" },
        detail: {
          id: "Transportasi 3,1 juta, tiket 2,4 juta, makan 4,2 juta, penginapan 6,9 juta, cadangan 1,4 juta.",
          en: "Transport 3.1M, tickets 2.4M, food 4.2M, lodging 6.9M, buffer 1.4M.",
        },
        ms: 1200,
        tokens: 6400,
        confidence: 0.94,
        artifact: { name: "budget.csv", kind: "doc", meta: "18.0M total" },
      },
      {
        id: "k5",
        agent: "hermes",
        kind: "artifact",
        title: { id: "Menyimpan itinerari", en: "Saving the itinerary" },
        detail: {
          id: "Dokumen siap bawa: satu halaman per hari, peta luring, dan tombol darurat untuk dua kontak.",
          en: "Carry-ready doc: one page per day, offline map, and an emergency card with two contacts.",
        },
        ms: 1100,
        tokens: 4800,
        artifact: { name: "kyoto-autumn-itinerary.pdf", kind: "doc", meta: "8 pages" },
      },
      {
        id: "k6",
        agent: "claude",
        kind: "done",
        title: { id: "Selesai", en: "Done" },
        detail: {
          id: "Rencana siap. Dua tempat diganti karena tutup, anggaran sisa 400 ribu di bawah batas.",
          en: "Plan ready. Two venues swapped for closures, budget landed 400k under the cap.",
        },
        ms: 900,
        tokens: 3100,
        confidence: 0.95,
      },
    ],
    outcome: {
      id: "Itinerari yang benar-benar bisa dijalankan, dengan cadangan untuk hal yang tutup di hari itu.",
      en: "An itinerary you can actually walk, with fallbacks for whatever is closed that day.",
    },
  },
];

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id)!;
