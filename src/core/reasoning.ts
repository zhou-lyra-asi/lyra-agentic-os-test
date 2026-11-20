import { AGENTS, AGENT_MAP, PILLARS, capabilityScore } from './agents';
import type {
  Critique,
  Finding,
  HarnessId,
  HarnessProfile,
  PillarId,
  PolicyVerdict,
  RunResult,
  Vote,
} from './types';
import { clamp, extractEntities, hash, keywords, pick, rng, round, truncate, wordCount } from './util';

export interface AnalysisContext {
  prompt: string;
  sanitized: string;
  pillar: PillarId;
  kw: string[];
  entities: ReturnType<typeof extractEntities>;
  verdict: PolicyVerdict;
  runId: string;
  seed: number;
}

const PILLAR_HINTS: Record<PillarId, [string, number][]> = {
  everyday: [['pagi', 3], ['rapat', 2], ['inbox', 4], ['jadwal', 3], ['ritual', 3], ['budget', 2], ['sewa', 2], ['balasan', 2], ['notifikasi', 2], ['kebiasaan', 3], ['hari', 1], ['minggu', 1]],
  code: [['refactor', 4], ['typescript', 3], ['database', 4], ['pipeline', 4], ['auth', 4], ['test', 3], ['migrasi', 4], ['schema', 4], ['race', 4], ['idempoten', 4], ['etl', 4], ['patch', 3], ['endpoint', 3], ['node', 2], ['rollback', 4], ['downtime', 4], ['modul', 2], ['kode', 2]],
  analysis: [['trade-off', 5], ['asumsi', 4], ['hipotesis', 4], ['skenario', 4], ['retention', 4], ['keputusan', 3], ['pre-mortem', 5], ['causal', 4], ['confidence', 3], ['makro', 3], ['efek jaringan', 4], ['eksperimen', 3], ['bias', 3], ['epistemik', 4]],
  cyber: [['threat model', 6], ['stride', 6], ['hardening', 5], ['triage', 5], ['anomali', 5], ['log', 3], ['webhook', 3], ['upload', 2], ['401', 3], ['asn', 3], ['incident', 4], ['playbook', 5], ['lab', 4], ['simulasi', 5], ['tabletop', 6], ['deteksi', 4], ['kontrol', 3], ['credential stuffing', 5], ['sandbox', 3], ['defensif', 4]],
};

export function classify(prompt: string): { pillar: PillarId; scores: Record<PillarId, number>; reason: string } {
  const text = prompt.toLowerCase();
  const scores = { everyday: 0, code: 0, analysis: 0, cyber: 0 } as Record<PillarId, number>;
  const hits: Record<PillarId, string[]> = { everyday: [], code: [], analysis: [], cyber: [] };
  for (const p of Object.keys(PILLAR_HINTS) as PillarId[]) {
    for (const [term, weight] of PILLAR_HINTS[p]) {
      const occurrences = text.split(term).length - 1;
      if (occurrences > 0) {
        scores[p] += weight * Math.min(occurrences, 3);
        hits[p].push(term);
      }
    }
  }
  const ranked = (Object.keys(scores) as PillarId[]).sort((a, b) => scores[b] - scores[a]);
  const pillar = ranked[0];
  const reason = hits[pillar].length
    ? `Sinyal dominan: ${hits[pillar].slice(0, 4).join(', ')} (bobot ${scores[pillar]}).`
    : `Tidak ada sinyal tajam; jatuh ke ${PILLARS[pillar].label} sebagai default analitis.`;
  return { pillar, scores, reason };
}

export function makeContext(prompt: string, pillar: PillarId, verdict: PolicyVerdict, runId: string): AnalysisContext {
  return {
    prompt,
    sanitized: verdict.sanitized,
    pillar,
    kw: keywords(verdict.sanitized),
    entities: extractEntities(verdict.sanitized),
    verdict,
    runId,
    seed: hash(`${prompt}|${pillar}|${runId}`),
  };
}

function primary(ctx: AnalysisContext): string {
  return ctx.kw.slice(0, 3).join(' · ') || 'sistem';
}

function targetList(ctx: AnalysisContext): string {
  const parts = [
    ...ctx.entities.paths,
    ...ctx.entities.identifiers,
    ...ctx.entities.numbers.slice(0, 2).map((n) => `ambang ${n}`),
  ];
  return parts.length ? [...new Set(parts)].slice(0, 3).join(', ') : `${primary(ctx)} (dan dependensinya)`;
}

function riskLines(ctx: AnalysisContext, pillar: PillarId): string[] {
  const p = primary(ctx);
  const base: Record<PillarId, string[]> = {
    everyday: [
      `Rencana terlalu kaku: ${p} bisa berubah tanpa pemberitahuan.`,
      'Otomasi yang menyembunyikan konteks justru menambah beban kognitif.',
      'Metrik kepatuhan mudah diganti oleh metrik hasil yang nyata.',
    ],
    code: [
      `Perubahan pada ${p} berisiko melanggar invariant yang tidak terdokumentasi.`,
      'Retry bersamaan tanpa kunci idempotensi memicu double-write.',
      'Rollback yang hanya mengembalikan kode (bukan data) meninggalkan state setengah migrasi.',
    ],
    analysis: [
      `Asumsi paling rapuh: ${p} dianggap stabil sepanjang periode pengamatan.`,
      'Korelasi yang terlihat bisa berupa collider atau selection bias.',
      'Confidence tinggi tanpa eksperimen pembeda hanyalah narasi yang rapi.',
    ],
    cyber: [
      `Trust boundary di ${p} kemungkinan lebih luas dari yang didokumentasikan.`,
      'Alert fatigue dapat membuat sinyal awal terlewat sebelum eskalasi.',
      'Kontrol pencegahan tanpa deteksi tidak memberi bukti saat insiden.',
    ],
  };
  return base[pillar].slice(0, 2 + (ctx.seed % 2));
}

function sectionsFor(ctx: AnalysisContext, agent: HarnessProfile): { heading: string; lines: string[] }[] {
  const p = primary(ctx);
  const t = targetList(ctx);
  const lens = agent.lens;
  const r = rng(ctx.seed ^ hash(agent.id));
  const n = ctx.entities.numbers[0] ?? '45';
  const quoted = ctx.entities.quoted[0] ?? truncate(ctx.prompt, 54);

  const banks: Record<PillarId, { heading: string; lines: string[] }[]> = {
    everyday: [
      { heading: 'Membedah maksud', lines: [
        `Inti permintaan: "${quoted}" → bukan sekadar jadwal, melainkan sistem yang tahan hari buruk.`,
        `Variabel yang benar-benar bisa dikendalikan: ${ctx.kw.slice(0, 3).join(', ') || 'durasi, urutan, dan gangguan'}.`,
        `Dari kacamata ${agent.codename}, prioritasnya adalah ${lens}.`,
      ]},
      { heading: 'Rancangan berlapis', lines: [
        `Blok utama ${n} menit dipecah menjadi 3 fase: masuk, fokus, tutup; setiap fase punya sinyal selesai.`,
        `Fallback: versi 12 menit untuk hari telat, versi 0 menit (cukup satu catatan) untuk hari chaos.`,
        `Urutan diputuskan oleh energi, bukan jam: ${p} diletakkan pada jendela paling stabil.`,
      ]},
      { heading: 'Pengukuran & koreksi', lines: [
        `Catat 3 angka harian: mulai, selesai, dan gangguan; jangan catat mood (terlalu bias).`,
        `Evaluasi minggu pertama untuk baseline, minggu kedua untuk satu perubahan saja.`,
        `Aturan berhenti: bila kepatuhan < 50% dua minggu, desain ulang pemicunya, bukan menambah niat.`,
      ]},
      { heading: 'Yang sering terlewat', lines: [
        `Titik gesekan ada pada transisi, bukan pada aktivitas: siapkan ${t} sebelum malam sebelumnya.`,
        'Otomasi hanya untuk pengingat; keputusan tetap dikembalikan ke pengguna.',
      ]},
    ],
    code: [
      { heading: 'Peta modul & kontrak', lines: [
        `Unit terdampak: ${t}. Boundary yang harus dijaga: input → state → side-effect.`,
        `Invariant untuk ${p}: operasi yang sama dengan input sama harus menghasilkan state yang sama.`,
        `${agent.codename} memeriksa terlebih dahulu ${lens}.`,
      ]},
      { heading: 'Failure mode berurutan', lines: [
        `Skenario 1: dua proses membaca state lama sebelum commit → write skew pada ${ctx.kw[0] ?? 'tabel'}.`,
        `Skenario 2: retry setelah timeout server mengira gagal, padahal commit sudah terjadi.`,
        `Skenario 3: rollback kode tanpa kompensasi data meninggalkan kolom setengah terisi.`,
      ]},
      { heading: 'Urutan perubahan aman', lines: [
        `Langkah 1: kunci kontrak dengan characterization test pada ${t} (belum ada perubahan perilaku).`,
        `Langkah 2: tambahkan kunci idempotensi / dedupe key sebelum menyentuh jalur tulis.`,
        `Langkah 3: dual-write + backfill terukur, dengan feature flag per tahap dan metrik ${n}.`,
        `Langkah 4: verifikasi shadow-read, baru alihkan traffic; rollback tetap satu flag.`,
      ]},
      { heading: 'Verifikasi', lines: [
        `Regression test deterministik: jalankan konkurensi 2/8/32 worker dengan seed tetap.`,
        `Assertion: jumlah baris akhir = 1, tidak ada duplikat, dan log korelasi lengkap.`,
        `Observability: counter untuk retry, dedupe hit, dan durasi commit per endpoint.`,
      ]},
    ],
    analysis: [
      { heading: 'Kerangka & asumsi', lines: [
        `Pertanyaan yang sebenarnya: "${quoted}" — ini soal mekanisme, bukan soal angka ${n}.`,
        `Asumsi A: ${ctx.kw[0] ?? 'sinyal'} diukur konsisten; Asumsi B: populasi tidak berubah.`,
        `${agent.codename} menantang ${lens} sebelum menerima kesimpulan apa pun.`,
      ]},
      { heading: 'Hipotesis saingan', lines: [
        `H1 · Efek nyata: perubahan ${p} menggeser perilaku pengguna yang memang bertahan.`,
        `H2 · Seleksi: pengguna yang bertahan justru lebih termotivasi dan lebih vokal mengeluh.`,
        `H3 · Instrumentasi: definisi metrik berubah saat rilis, sehingga deret tidak sebanding.`,
        `H4 · Musiman / faktor luar yang kebetulan searah dengan periode pengamatan.`,
      ]},
      { heading: 'Eksperimen pembeda', lines: [
        `Uji H2 dengan kohort matched: bandingkan keluhan pada grup dengan paparan sama.`,
        `Uji H3 dengan backfill definisi lama; bila lonjakan hilang, masalahnya instrumentasi.`,
        `Eksperimen acak terkontrol pada ${t} dengan durasi cukup untuk efek mingguan.`,
      ]},
      { heading: 'Confidence ledger', lines: [
        `Bukti kuat: dua sinyal yang bertentangan (naiknya metrik & naiknya keluhan).`,
        `Bukti lemah: narasi kausal tunggal tanpa counterfactual.`,
        `Kill signal: bila H3 terkonfirmasi, seluruh keputusan turunan dibatalkan.`,
      ]},
    ],
    cyber: [
      { heading: 'Scope & trust boundary', lines: [
        `Aset: ${t}. Mode: ${ctx.verdict.level === 'lab' ? `simulasi lab pada ${ctx.verdict.scope}` : 'analisis defensif, tanpa target nyata'}.`,
        `Boundary yang diperiksa: klien → edge → auth → ${ctx.kw[0] ?? 'service'} → penyimpanan → webhook keluar.`,
        `${agent.codename} menyoroti ${lens}.`,
      ]},
      { heading: 'STRIDE ringkas (defensif)', lines: [
        `Spoofing: sesi/refresh token tanpa binding perangkat → mitigasi rotasi + device fingerprint.`,
        `Tampering: ${p} menerima input tak tervalidasi → schema allow-list + canonicalisasi.`,
        `Repudiation: jejak audit tidak lengkap → log terstruktur dengan correlation id & immutable store.`,
        `Info leak / DoS / Elevation: rate limit adaptif, kuota upload, dan prinsip least privilege.`,
      ]},
      { heading: 'Deteksi & respons', lines: [
        `Sinyal: lonjakan 401 dari satu ASN, diikuti 200 pada endpoint sensitif di luar jam kerja (ambang ${n}).`,
        `Korelasi yang dibutuhkan: request id, session id, dan hasil dari kontrol yang sama pada jam normal.`,
        `Playbook: isolasi kredensial → rotasi → verifikasi cakupan log → postmortem tanpa blame.`,
        `False positive dibedakan lewat baseline harian dan ada/tidaknya perubahan deploy.`,
      ]},
      { heading: 'Hardening berurutan', lines: [
        `1 · Kunci rate-limit + lockout progresif pada jalur autentikasi.`,
        `2 · Validasi konten + antimalware + isolasi penyimpanan untuk unggahan.`,
        `3 · Tanda tangan webhook, replay protection, dan daftar tujuan keluar (egress allow-list).`,
        `4 · Uji kontrol dengan tabletop, bukan dengan trafik nyata; catat temuan di audit trail.`,
      ]},
    ],
  };

  const sections = banks[ctx.pillar].map((s, i) => ({
    heading: `${i + 1} · ${s.heading}`,
    lines: s.lines.map((line) => line.replace(/\s+/g, ' ').trim()),
  }));

  // Variasi deterministik per agent: rotasi urutan + sisipan lensa, tetap reproducible.
  const offset = Math.floor(r() * 2);
  if (offset === 1 && sections.length > 3) {
    const third = sections.splice(2, 1)[0];
    sections.push(third);
  }
  sections[0].lines.push(`Catatan lensa ${agent.name}: ${pick(agent.strengths, r)}.`);
  return sections;
}

export function analyse(ctx: AnalysisContext, agent: HarnessProfile, taskId: string): Finding {
  const r = rng(ctx.seed ^ hash(agent.id) ^ 0x9e37);
  const sections = sectionsFor(ctx, agent);
  const cap = clamp(capabilityScore(agent, ctx.pillar), 0, 1.2);
  const complexityPenalty = Math.min(ctx.kw.length, 10) * 0.006;
  const confidence = round(clamp(0.62 + cap * 0.27 - complexityPenalty + (r() - 0.5) * 0.09, 0.45, 0.96));
  const thesis = `${agent.codename} menilai "${primary(ctx)}" paling aman diselesaikan lewat ${agent.lens.split(',')[0]}; ${truncate(ctx.prompt, 78)}`;
  const text = sections.map((s) => `${s.heading} ${s.lines.join(' ')}`).join(' ');
  return {
    taskId,
    agent: agent.id,
    pillar: ctx.pillar,
    thesis,
    sections,
    signals: [
      ...ctx.kw.slice(0, 4).map((k) => `token:${k}`),
      ...ctx.entities.numbers.slice(0, 2).map((n) => `angka:${n}`),
      ...ctx.entities.paths.slice(0, 1).map((p) => `path:${p}`),
    ],
    risks: riskLines(ctx, ctx.pillar),
    confidence,
    wordCount: wordCount(`${thesis} ${text}`),
  };
}

export function critique(ctx: AnalysisContext, reviewer: HarnessProfile, target: Finding): Critique {
  const r = rng(ctx.seed ^ hash(reviewer.id) ^ hash(target.agent) ^ 0x51ed);
  const targetAgent = AGENT_MAP[target.agent];
  const section = target.sections[Math.floor(r() * target.sections.length)];
  const weak = pick(
    [
      'mengandaikan observability sudah ada',
      'tidak mendefinisikan kondisi gagal',
      'mencampur korelasi dengan sebab',
      'belum punya rollback yang diuji',
      'terlalu bergantung pada satu baseline',
      'mengabaikan biaya koordinasi antar tim',
    ],
    r,
  );
  const expertiseBonus = capabilityScore(reviewer, ctx.pillar) > 0.9 ? 0.03 : 0;
  const score = round(clamp(0.58 + (r() - 0.4) * 0.5 + expertiseBonus, 0.42, 0.97));
  const disagreement = score < 0.64;
  return {
    reviewer: reviewer.id,
    target: target.agent,
    challenge: `${reviewer.codename} menantang ${targetAgent.codename}: bagian "${section.heading}" ${weak}. Dari lensa ${reviewer.lens.split(',')[0]}, perlu pembuktian sebelum diterima.`,
    endorsement: `${reviewer.codename} menguatkan: ${truncate(section.lines[0] ?? target.thesis, 112)}`,
    score,
    disagreement,
  };
}

export function vote(ctx: AnalysisContext, voter: HarnessProfile, target: HarnessId, c: Critique): Vote {
  return {
    voter: voter.id,
    target,
    score: c.score,
    weight: round(voter.weight * capabilityScore(voter, ctx.pillar), 3),
    reason: c.disagreement ? `Reservasi: ${c.challenge.slice(0, 90)}…` : `Dukungan: ${c.endorsement.slice(0, 90)}…`,
  };
}

export function synthesise(
  ctx: AnalysisContext,
  findings: Finding[],
  critiques: Critique[],
  votes: Vote[],
  consensus: RunResult['consensus'],
  durationMs: number,
): string {
  const date = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
  const p = primary(ctx);
  const winner = consensus ? AGENT_MAP[consensus.winner] : AGENTS[0];
  const lines: string[] = [
    `# LYRA · Council Brief`,
    ``,
    `**Run** \`${ctx.runId}\` · **Pilar** ${PILLARS[ctx.pillar].label} · **Waktu** ${date} · **Durasi** ${(durationMs / 1000).toFixed(1)}s`,
    ``,
    `> ${ctx.prompt}`,
    ``,
    `## 1 · Keputusan Lyra`,
    ``,
    `Dewan menyelesaikan **${p}** dengan memadukan ${findings.length} perspektif independen. Arah utama diambil dari **${winner.name} (${winner.codename})**, bukan karena paling vokal, melainkan karena bobot kepakaran tertinggi untuk pilar ini setelah melalui round kritik.`,
    ``,
    consensus
      ? `Tingkat kesepakatan **${(consensus.agreement * 100).toFixed(0)}%** · ${consensus.conflicts} konflik terbuka · skor pemenang **${(consensus.score * 100).toFixed(1)}%**. ${consensus.resolution}`
      : `Belum ada konsensus terekam.`,
    ``,
    `## 2 · Temuan per harness`,
    ``,
  ];

  for (const f of findings) {
    const a = AGENT_MAP[f.agent];
    lines.push(`### ${a.glyph} ${a.name} · ${a.codename} — confidence ${(f.confidence * 100).toFixed(0)}%`, ``);
    lines.push(f.thesis, ``);
    for (const s of f.sections.slice(0, 3)) {
      lines.push(`**${s.heading}**`, ``);
      for (const l of s.lines.slice(0, 3)) lines.push(`- ${l}`);
      lines.push(``);
    }
    lines.push(`*Sinyal:* ${f.signals.join(' · ') || '—'}`, ``);
  }

  lines.push(`## 3 · Debat & resolusi konflik`, ``);
  for (const c of critiques) {
    const rev = AGENT_MAP[c.reviewer];
    const tgt = AGENT_MAP[c.target];
    lines.push(`- **${rev.codename} → ${tgt.codename}** (${(c.score * 100).toFixed(0)}%${c.disagreement ? ' · ⚠ disagree' : ''}): ${c.challenge}`);
  }
  lines.push(``);
  if (consensus && consensus.conflicts > 0) {
    lines.push(`Lyra menurunkan bobot klaim yang tidak punya bukti pembeda dan mempertahankan langkah yang bisa diverifikasi. Konflik tidak dihapus — ia dicatat agar keputusan bisa diaudit ulang.`, ``);
  }

  lines.push(`## 4 · Rencana aksi (berurutan)`, ``);
  const actions = [
    `Kunci ruang lingkup & invariant: ${targetList(ctx)}. Tulis definisi "selesai" yang bisa diuji.`,
    `Jalankan langkah paling kecil yang menghasilkan bukti (bukan opini) untuk ${p}.`,
    `Terapkan perubahan bertahap dengan flag; ukur ${ctx.entities.numbers[0] ?? 'metrik utama'} sebelum/sesudah.`,
    `Verifikasi lewat round kritik kedua: ${findings.length} harness meninjau ulang hasilnya.`,
    `Simpan artefak, audit trail, dan kill signal; evaluasi ulang bila asumsi awal berubah.`,
  ];
  actions.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  lines.push(``);

  lines.push(`## 5 · Keamanan & audit`, ``);
  lines.push(`- Level kebijakan: **${ctx.verdict.level}** · scope: \`${ctx.verdict.scope}\` · diizinkan: ${ctx.verdict.allowed ? 'ya' : 'tidak'}.`);
  ctx.verdict.notes.forEach((n) => lines.push(`- ${n}`));
  if (ctx.verdict.redactions.length) ctx.verdict.redactions.forEach((r) => lines.push(`- Redaksi: ${r}`));
  lines.push(`- Suara terekam: ${votes.length} · pesan bus: dapat diekspor sebagai JSON/Markdown.`, ``);

  lines.push(`---`, ``, `*Dihasilkan oleh Lyra Agentic OS · Local Council (deterministik, tanpa kunci API). Aktifkan adapter nyata lewat \`.env.local\` untuk menggantikan engine ini per harness.*`);
  return lines.join('\n');
}

export function buildChecklist(ctx: AnalysisContext, findings: Finding[]): string {
  const lines = [`# Checklist · ${PILLARS[ctx.pillar].label}`, ``, `> ${truncate(ctx.prompt, 110)}`, ``];
  findings.forEach((f) => {
    lines.push(`## ${AGENT_MAP[f.agent].name}`, ``);
    f.sections.forEach((s) => {
      lines.push(`- [ ] ${s.heading.replace(/^\d+ · /, '')}: ${truncate(s.lines[0] ?? '', 110)}`);
    });
    f.risks.forEach((r) => lines.push(`- [ ] Risiko: ${r}`));
    lines.push(``);
  });
  return lines.join('\n');
}
