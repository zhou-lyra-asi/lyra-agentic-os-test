import type { MissionPreset } from './types';

export const MISSIONS: MissionPreset[] = [
  {
    id: 'day-ritual',
    pillar: 'everyday',
    title: 'Ritual pagi 45 menit',
    prompt:
      'Rancang ritual pagi 45 menit untuk kerja fokus yang padat: aku punya rapat 09.00, mudah terdistraksi, dan ingin sempat membaca. Sertakan urutan, durasi, fallback saat telat, dan cara mengukurnya selama 2 minggu.',
    hint: 'Perencanaan adaptif + pengukuran',
    complexity: 2,
  },
  {
    id: 'day-inbox',
    pillar: 'everyday',
    title: 'Sistem inbox-zero pribadi',
    prompt:
      'Bangun sistem inbox-zero untuk 3 kanal (email, chat tim, notifikasi) dengan aturan triage, template balasan, dan otomasi yang tidak membuat aku kehilangan konteks penting.',
    hint: 'Triage, template, otomasi',
    complexity: 3,
  },
  {
    id: 'day-decision',
    pillar: 'everyday',
    title: 'Keputusan biaya vs waktu',
    prompt:
      'Aku harus memilih antara menyewa jasa atau membangun sendiri sebuah alat internal, dengan budget terbatas dan deadline 6 minggu. Bantu aku membuat kerangka keputusan yang jujur beserta kriteria berhenti.',
    hint: 'Decision framework + stop criteria',
    complexity: 3,
  },
  {
    id: 'code-auth',
    pillar: 'code',
    title: 'Audit modul autentikasi',
    prompt:
      'Audit arsitektur modul auth pada layanan Node/TypeScript: session, refresh token, RBAC, dan boundary dengan service lain. Temukan failure mode, usulkan urutan refactor yang aman, dan strategi pengujiannya.',
    hint: 'Arsitektur, failure mode, test plan',
    complexity: 4,
  },
  {
    id: 'code-race',
    pillar: 'code',
    title: 'Race condition pipeline data',
    prompt:
      'Pipeline ETL kami sesekali menulis duplikat saat retry bersamaan. Bedah kemungkinan penyebab, rancang reproduksi deterministik, dan susun perbaikan idempoten plus regression test.',
    hint: 'Reproduksi + idempotensi',
    complexity: 4,
  },
  {
    id: 'code-migration',
    pillar: 'code',
    title: 'Migrasi bertahap tanpa downtime',
    prompt:
      'Susun rencana migrasi skema database bertahap tanpa downtime untuk tabel orders, lengkap dengan dual-write, backfill, verifikasi, dan rollback yang benar-benar aman.',
    hint: 'Dual-write, backfill, rollback',
    complexity: 5,
  },
  {
    id: 'analysis-tradeoff',
    pillar: 'analysis',
    title: 'Trade-off platform terbuka',
    prompt:
      'Bedah trade-off jangka panjang membangun platform terbuka vs tertutup untuk ekosistem developer kecil: insentif, biaya koordinasi, lock-in, dan efek jaringan. Sertakan asumsi yang paling rapuh.',
    hint: 'Causal map + asumsi rapuh',
    complexity: 4,
  },
  {
    id: 'analysis-metric',
    pillar: 'analysis',
    title: 'Metrik yang menyesatkan',
    prompt:
      'Retention naik 12% setelah perubahan onboarding, tapi keluhan pengguna juga naik. Bangun analisis mengapa kedua sinyal bisa benar bersamaan, hipotesis alternatif, dan eksperimen pembeda.',
    hint: 'Hipotesis saingan + eksperimen',
    complexity: 5,
  },
  {
    id: 'analysis-forecast',
    pillar: 'analysis',
    title: 'Keputusan di bawah ketidakpastian',
    prompt:
      'Evaluasi keputusan ekspansi dengan data yang tidak lengkap dan 3 skenario makro. Buat confidence ledger, pre-mortem, dan sinyal awal yang harus membatalkan keputusan.',
    hint: 'Pre-mortem + kill signals',
    complexity: 5,
  },
  {
    id: 'cyber-threat-model',
    pillar: 'cyber',
    title: 'Threat model layanan publik',
    prompt:
      'Buat threat model STRIDE untuk layanan publik dengan login, upload file, dan webhook. Fokus pada pertahanan: trust boundary, kontrol pencegahan, deteksi, dan urutan hardening.',
    hint: 'STRIDE defensif + prioritas kontrol',
    complexity: 4,
  },
  {
    id: 'cyber-triage',
    pillar: 'cyber',
    title: 'Triage log anomali',
    prompt:
      'Triage anomali log: lonjakan 401 dari satu ASN, diikuti 200 pada endpoint admin di luar jam kerja. Susun hipotesis, bukti yang dibutuhkan, playbook respons, dan cara membedakan false positive.',
    hint: 'Deteksi, korelasi, playbook',
    complexity: 4,
  },
  {
    id: 'cyber-lab',
    pillar: 'cyber',
    title: 'Lab simulasi: tabletop exercise',
    prompt:
      'Jalankan tabletop exercise simulasi untuk target lab.local: skenario credential stuffing pada lingkungan dummy. Uji kesiapan deteksi & respons tim, tanpa payload atau target nyata.',
    hint: 'Simulasi tertutup · butuh approval',
    complexity: 5,
  },
];

export const MISSION_BY_PILLAR = (pillar: string) => MISSIONS.filter((m) => m.pillar === pillar);
