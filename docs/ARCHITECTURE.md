# Arsitektur Lyra Agentic OS

Dokumen ini menjelaskan **bagaimana 4 harness benar-benar bekerja sama**, bukan sekadar tampilan.

## 1. Prinsip desain

1. **Satu kernel, banyak surface.** `LyraOS` (`src/core/os.ts`) tidak bergantung React/DOM. Website memakai `useSyncExternalStore`, CLI memakai api yang sama, Desktop shell memakai komponen yang sama. Tidak ada "versi demo" yang terpisah.
2. **Semua komunikasi lewat bus.** Tidak ada agent yang memanggil agent lain secara langsung. Setiap temuan, kritik, suara, artefak, dan keputusan policy adalah `Envelope` dengan `correlationId`, `from`, `to`, `channel`, `phase`, `confidence`, dan `refs`.
3. **Shared blackboard, bukan memori tersembunyi.** Fakta, artefak, task DAG, vote, decisions, dan risk flags bisa dibaca seluruh harness.
4. **Keputusan bisa diaudit.** Konflik tidak dihapus; ia dicatat, diturunkan bobotnya, dan muncul di Council Brief.
5. **Deterministik dulu.** Tanpa kunci API, engine Local Council menghasilkan keluaran yang reproducible dari `hash(prompt|pillar|runId)`.

## 2. Komponen inti

| File | Tanggung jawab |
|---|---|
| `types.ts` | Kontrak bersama: `HarnessId`, `Envelope`, `TaskNode`, `Finding`, `Critique`, `Vote`, `Artifact`, `PolicyVerdict`, `OSState`, `RunResult`. |
| `agents.ts` | Profil 4 harness: vendor, codename, lensa reasoning, matriks kapabilitas per pilar, bobot, **surface CLI + Desktop**, env vars. |
| `bus.ts` | `MessageBus`: `publish`, `subscribe`, `newRun`, history (cap 600), sequence number per run. |
| `blackboard.ts` | `Blackboard`: facts, artifacts, tasks, findings, votes, decisions, risk flags, `snapshot()`. |
| `policy.ts` | `CyberPolicy`: klasifikasi `safe / guarded / lab / blocked`, allow-list scope, redaksi, approval gate, audit lines. |
| `reasoning.ts` | `classify`, `analyse`, `critique`, `vote`, `synthesise`, `buildChecklist`. Tokenisasi prompt → entities → temuan terstruktur per lensa agent. |
| `adapters.ts` | `probe` / `probeAll` / `resolveMode` / `invokeLive`. Dynamic import `node:child_process` hanya di Node; `execFile` tanpa shell. |
| `orchestrator.ts` | `runMission(host, prompt, options)` — mesin 10 fase. |
| `os.ts` | `LyraOS`: state immutable, `run`, `command`, `exportTranscript`, settings, adapter refresh, metrik. |
| `missions.ts` | 12 preset (4 pilar × 3). |

## 3. Protokol orkestrasi

```
intake      terima prompt, publish directive user→lyra
classify    skor keyword per pilar (bobot term, max 3 kemunculan) → pillar + alasan
policy      CyberPolicy.evaluate → audit lines; bila !allowed → phase blocked + artefak keputusan
plan        DAG: 4 TaskNode, diurutkan capabilityScore(agent, pillar), deps plan→T1→…
delegate    kirim envelope 'task' lyra→masing-masing harness (pulse ke node 3D)
execute     Promise.all 4 task (paralel, latency berbeda) → analyse() / invokeLive()
            → finding + 2 section ke bus, facts & risk flags ke blackboard
debate      setiap harness mengkritik temuan harness lain (rotasi) → Critique + disagree flag
consensus   vote berbobot: Σ(score × weight) / Σ(weight) + bonus kepakaran pemenang
            agreement = 1 − min(1, 2.4·σ + 0.055·conflicts)
synthesize  Council Brief MD + Checklist + Run Trace JSON → artefak
complete    RunResult + metrik
```

### Konsensus berbobot

- `weight(agent) = agent.weight × capabilityScore(agent, pillar)`.
- Setiap kritik menghasilkan `Vote(voter → target, score, weight, reason)`.
- Pemenang = skor rata-rata tertimbang tertinggi; **bukan** suara terbanyak.
- `disagreement` (score < 0.64) dihitung sebagai konflik terbuka dan menurunkan `agreement`.
- Lyra tidak menghapus reservasi: resolusi menjelaskan penurunan bobot klaim tanpa bukti pembeda.

### Channel bus

`control` · `task` · `finding` · `critique` · `vote` · `artifact` · `audit` · `system`

Visual Nexus memetakan `from`/`to` setiap envelope menjadi pulse pada node 3D dan particle yang mengalir di energy link. Jadi denyutnya sinkron dengan pesan nyata.

## 4. Reasoning engine (mode sim)

Bukan template statis: setiap prompt diolah menjadi `keywords()` (stopwords ID+EN), `extractEntities()` (URL, IP, path, camelCase identifier, angka, kutipan), dan konteks berseed. Dari situ:

- **Everyday**: dekomposisi maksud, rancangan berlapis + fallback hari buruk, metrik & aturan berhenti.
- **Code**: peta modul/invariant, failure mode berurutan (write skew, retry, rollback data), urutan perubahan aman, verifikasi konkurensi.
- **Analysis**: asumsi A/B, 4 hipotesis saingan, eksperimen pembeda, confidence ledger, kill signal.
- **Cyber**: trust boundary, STRIDE defensif, korelasi deteksi, playbook, hardening berurutan.

Lensa tiap agent (`lens`, `strengths`, rotasi section ber-seed) membuat 4 temuan berbeda secara substansi, bukan cuma ganti nama.

## 5. Adapter nyata

```
settings.mode = sim | auto | live
probe(binary --version)  → available + alasan
invokeLive(id, prompt)   → execFile(binary, args, {timeout, maxBuffer, env})
                           tanpa shell; prompt sebagai argumen (aman dari injeksi)
```

| Harness | Binary default | Argumen |
|---|---|---|
| Claude Code | `claude` | `-p <prompt> --output-format json` |
| Antigravity | `ag` | `run --task <prompt> --json` |
| Hermes | `hermes` | `reason --depth deep --prompt <prompt>` |
| Codex | `codex` | `exec --full-auto <prompt>` |

Override lewat `LYRA_<ID>_BIN`. Respons live ditambahkan sebagai section ekstra pada `Finding`, dan kegagalan selalu dicatat di channel `audit` sebelum fallback ke Local Council. Browser tidak pernah melakukan spawn — hanya CLI Node yang bisa.

## 6. Surface

- **Nexus / Web**: R3F Canvas + HUD glass + command bar + council stream. `Scene3D` membaca `.bin` point-cloud dan depth grid.
- **Desktop shell**: window manager (drag, z-index, minimize, maximize, resize), taskbar, launcher, 8 aplikasi. Jendela Nexus memakai `Scene3D compact` dengan kamera & densitas titik disesuaikan.
- **CLI**: `LyraTerminal` memanggil `os.command()`; `src/cli/lyra.ts` membungkus kernel yang sama dengan ANSI color, `--stream` (subscribe bus), dan REPL. `desktop/main.cjs` menyediakan wrapper Electron opsional untuk memuat `dist/`.

## 7. Ekstensi yang disiapkan

- `RunOptions.signal` → abort di boundary fase.
- `RunResult` lengkap → bisa dikirim ke penyimpanan eksternal.
- `Blackboard.decide()` → fondasi memori lintas sesi.
- `MessageBus.correlationId` → fondasi multi-turn / traced delegation.
- `Artifact` → ekspor MD/JSON, mudah ditambah PDF/HTML.

## 8. Batasan jujur rilis ini

- Mode live bergantung pada binary pihak ketiga yang **tidak** dibundel; tanpa itu, sim deterministic yang jalan.
- Model 3D Lyra adalah rekonstruksi holografik (point-cloud + bas-relief), bukan karakter GLTF rigged dengan skeleton.
- Belum ada persistensi server; sesi tersimpan di memori + `localStorage` untuk settings, transkrip diekspor manual.
