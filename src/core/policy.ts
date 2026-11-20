import type { PillarId, PolicyVerdict, Settings } from './types';

export const LAB_SCOPES = ['lab.local', 'sandbox.internal', 'dummy.target', 'ctf.local', 'localhost', '127.0.0.1'];

const BLOCK_PATTERNS = [
  /\b(?:buat|buatkan|write|generate|berikan|kirim)\s+(?:payload|exploit|malware|ransomware|keylogger|backdoor|shellcode)\b/i,
  /\b(?:bypass|tembus|crack|deface|dump)\s+(?:auth|login|password|database|hash|server)\b/i,
  /\b(?:ddos|dos)\s+(?:nyata|real|live|production)\b/i,
  /\b(?:target|serang)\s+(?:nyata|asli|produksi|production|[a-z0-9-]+\.(?:com|net|org|id|io))\b/i,
  /\b(?:curi|steal|exfiltrate)\s+(?:kredensial|credential|data|token)\b/i,
];

const LAB_PATTERNS = /\b(?:simulasi|simulate|lab|tabletop|exercise|drill|red.?team|purple.?team|war.?game|ctf|credential stuffing|skenario)\b/i;
const DEFENSIVE_PATTERNS = /\b(?:threat model|stride|hardening|triage|deteksi|detection|log|incident|playbook|kontrol|patch|audit)\b/i;

const DOMAIN_RE = /\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|id|co|dev|app|gov|edu)\b/gi;
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

/**
 * Cyber Policy Guard. Pilar cybersecurity di Lyra bersifat DEFENSIF.
 * Modul lab hanya simulasi tertutup pada target dummy + persetujuan eksplisit.
 * Tidak ada payload, exploit, atau koneksi ke target nyata yang dihasilkan.
 */
export class CyberPolicy {
  constructor(private settings: Settings) {}

  update(settings: Settings): void {
    this.settings = settings;
  }

  evaluate(pillar: PillarId, prompt: string, opts: { approved?: boolean; scope?: string } = {}): PolicyVerdict {
    const notes: string[] = [];
    const redactions: string[] = [];
    let sanitized = prompt;

    if (pillar !== 'cyber') {
      return {
        allowed: true,
        requiresApproval: false,
        level: 'safe',
        scope: 'general',
        sanitized: prompt,
        notes: ['Pilar non-cyber: tidak ada gate khusus.'],
        redactions,
      };
    }

    // Klausa negasi ("tanpa payload atau target nyata", "without real target")
    // adalah penegas defensif — jangan sampai memicu false positive.
    let checkText = prompt;
    for (const re of [/\b(?:tanpa|without|jangan|hindari|tidak)\b[^.,;]{0,90}/gi]) {
      checkText = checkText.replace(re, ' ');
    }
    const blocked = BLOCK_PATTERNS.filter((re) => re.test(checkText));
    if (blocked.length) {
      return {
        allowed: false,
        requiresApproval: false,
        level: 'blocked',
        scope: 'denied',
        sanitized: prompt,
        notes: [
          'Permintaan ditolak: terdeteksi permintaan kemampuan ofensif nyata.',
          'Lyra hanya menyediakan analisis defensif, hardening, dan simulasi tertutup.',
        ],
        redactions,
      };
    }

    const isLab = LAB_PATTERNS.test(prompt);
    const level: PolicyVerdict['level'] = isLab ? 'lab' : DEFENSIVE_PATTERNS.test(prompt) ? 'guarded' : 'safe';
    const scope = opts.scope ?? this.settings.labScope ?? 'lab.local';

    // Redaksi target nyata (IP/domain) → diganti placeholder dummy.
    if (this.settings.strictRedaction) {
      const domains = [...new Set(prompt.match(DOMAIN_RE) ?? [])].filter((d) => !LAB_SCOPES.includes(d.toLowerCase()));
      const ips = [...new Set(prompt.match(IPV4_RE) ?? [])].filter((ip) => !LAB_SCOPES.includes(ip));
      for (const d of domains) {
        sanitized = sanitized.split(d).join('[domain-redacted]');
        redactions.push(`domain ${d} → [domain-redacted]`);
      }
      for (const ip of ips) {
        sanitized = sanitized.split(ip).join('[ip-redacted]');
        redactions.push(`IP ${ip} → [ip-redacted]`);
      }
    }
    if (redactions.length) notes.push(`Redaksi otomatis aktif: ${redactions.length} target disamarkan.`);

    if (level === 'lab') {
      notes.push('Mode LAB: simulasi tabletop pada target dummy, tanpa payload atau koneksi eksternal.');
      const scopeOk = LAB_SCOPES.includes(scope.toLowerCase());
      if (!scopeOk) {
        return {
          allowed: false,
          requiresApproval: false,
          level: 'blocked',
          scope,
          sanitized,
          notes: [...notes, `Scope "${scope}" bukan target lab yang diizinkan. Pilih: ${LAB_SCOPES.join(', ')}`],
          redactions,
        };
      }
      const approved = Boolean(opts.approved ?? this.settings.labApproved);
      if (!this.settings.labEnabled || !approved) {
        return {
          allowed: false,
          requiresApproval: true,
          level: 'lab',
          scope,
          sanitized,
          notes: [
            ...notes,
            'Menunggu persetujuan eksplisit pengguna untuk simulasi lab.',
            `Aktifkan lab + setujui scope "${scope}" sebelum menjalankan.`,
          ],
          redactions,
        };
      }
      notes.push(`Persetujuan terverifikasi untuk scope "${scope}".`);
    } else {
      notes.push('Mode DEFENSIF: threat model / triage / hardening, tanpa tindakan ofensif.');
    }

    return {
      allowed: true,
      requiresApproval: false,
      level,
      scope,
      sanitized,
      notes: [...notes, 'Semua keluaran melewati audit trail (channel: audit).'],
      redactions,
    };
  }

  static auditLines(v: PolicyVerdict): string[] {
    return [
      `policy.level=${v.level}`,
      `policy.allowed=${v.allowed}`,
      `policy.scope=${v.scope}`,
      `policy.redactions=${v.redactions.length}`,
      ...v.notes.map((n) => `note: ${n}`),
    ];
  }
}
