# Cyber Policy Guard

Pilar **Cyber Defense** di Lyra dirancang *secure-by-default*. Tujuan kemampuan "cyber tingkat tinggi" di sini adalah **ketahanan, deteksi, dan respons**, bukan ofensi.

## Level keputusan

| Level | Makna | Contoh |
|---|---|---|
| `safe` | Pilar non-cyber, atau pertanyaan umum. | `run "rancang ritual pagi"` |
| `guarded` | Analisis defensif: threat model, triage, hardening, playbook. | `mission cyber-threat-model` |
| `lab` | Simulasi tabletop / drill / red-team exercise. Butuh approval + scope dummy. | `mission cyber-lab` |
| `blocked` | Permintaan kemampuan ofensif nyata atau scope terlarang. | payload, exploit, target produksi |

## Yang tidak pernah dihasilkan

- Payload, exploit, shellcode, malware, ransomware, keylogger, backdoor.
- Bypass autentikasi, cracking kredensial, defacement, exfiltrasi data.
- Serangan DoS/DDoS ke target nyata.
- Koneksi ke target produksi / domain / IP publik dari dalam simulasi.

`BLOCK_PATTERNS` menolak permintaan semacam ini sebelum orkestrasi dimulai. Penolakan tetap menghasilkan artefak keputusan dan audit trail — tidak ada silent drop.

## Lab simulasi: 3 gerbang

1. **Scope allow-list**: `lab.local`, `sandbox.internal`, `dummy.target`, `ctf.local`, `localhost`, `127.0.0.1`. Scope lain → `blocked`.
2. **`labEnabled` + `labApproved`**: keduanya harus aktif. Mengganti scope otomatis mereset approval.
3. **Redaksi otomatis** (`strictRedaction`): IP dan domain nyata di prompt diganti `[ip-redacted]` / `[domain-redacted]`, dengan catatan jumlah redaksi di audit.

Di UI, gerbang ini ada di jendela **Cyber Lab**: 3 toggle, dropdown scope, tombol *Setujui simulasi*, evaluator policy, dan daftar audit. Dari Nexus, mencoba preset `cyber-lab` tanpa approval akan membuka jendela itu dengan toast penjelasan — bukan diam-diam menjalankan.

## Yang tersedia (defensif)

- **STRIDE** dengan trust boundary: klien → edge → auth → service → storage → webhook.
- **Triage**: korelasi 401/200, baseline harian, pembeda false positive, playbook isolasi → rotasi → verifikasi log → postmortem.
- **Hardening berurutan**: rate-limit/lockout, validasi unggahan, tanda tangan webhook + replay protection + egress allow-list, uji kontrol lewat tabletop.
- **Deteksi**: sinyal, metrik, correlation id, immutable audit log.

## Audit trail

Setiap evaluasi mem-publish envelope `channel: audit`, `from: policy`:

```
policy.level=guarded
policy.allowed=true
policy.scope=lab.local
policy.redactions=0
note: Mode DEFENSIF: threat model / triage / hardening, tanpa tindakan ofensif.
note: Semua keluaran melewati audit trail (channel: audit).
```

Audit bisa difilter di Council Stream, dilihat di Cyber Lab, atau diekspor lewat `export md` / `export json`.

## Catatan implementasi

Policy berada di **kernel**, bukan di UI. Artinya CLI, Desktop, dan Web tunduk pada aturan yang sama; melewati tombol UI tidak bisa mem-bypass gate. `CyberPolicy.evaluate()` murni, deterministik, dan mudah diuji:

```bash
npm run lyra -- policy "Simulasi tabletop pada lab.local"
npm run lyra -- policy "Buat payload exploit untuk example.com" --approve
```
