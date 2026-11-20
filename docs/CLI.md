# `lyra` · CLI Reference

CLI memakai **kernel yang sama** dengan website & Desktop. Jalankan lewat `npm run lyra -- <perintah>`, atau `npx tsx src/cli/lyra.ts`. Tanpa argumen → REPL interaktif.

```bash
npm run lyra -- help
npm run lyra -- run "audit modul auth" --pillar=code --stream
npm run lyra -- mission code-migration --fast
npm run lyra -- doctor
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `help` | Daftar perintah. |
| `run <prompt>` | Jalankan misi. Flag: `--pillar=everyday\|code\|analysis\|cyber`, `--live`, `--fast`, `--approve`, `--scope=<target>`, `--stream`. |
| `mission <id>` | Jalankan preset dari `missions`. `missions [pillar]` menampilkan daftar. |
| `agents` | Matriks kapabilitas + bobot konsensus. |
| `harness <id>` | Detail satu harness: lensa, CLI command, Desktop app, env, strengths. |
| `pillars` | 4 pilar domain. |
| `missions [pillar]` | 12 preset (kompleksitas ★1–★5). |
| `adapters` | Status binary & env (hanya nama env yang ditampilkan, bukan nilainya). |
| `policy <prompt>` | Uji Cyber Policy Guard tanpa menjalankan misi. |
| `status` | Fase, metrik, konsensus terakhir, mode. |
| `brief` | 46 baris pertama Council Brief terakhir. |
| `export [md\|json]` | Transkrip sesi. |
| `settings` | Konfigurasi aktif + scope allow-list. |
| `set <key> <value>` | `mode sim\|auto\|live`, `pace <ms>`, `lab on\|off`, `scope <target>`, `redaction on\|off`. |
| `lab approve` | Setujui simulasi pada scope aktif (reset otomatis bila scope diganti). |
| `lab scope <target>` | Ganti scope; hanya allow-list yang diterima. |
| `doctor` | Versi Node, adapters, localStorage, aset model. |
| `model` | Metadata rekonstruksi 3D Lyra. |
| `clear` / `cls` | Bersihkan terminal. |
| `abort` | Kirim sinyal abort ke bus. |
| `exit` / `quit` | Keluar dari REPL. |

## Streaming

`--stream` membuat CLI subscribe ke `MessageBus` dan mencetak setiap envelope secara real-time dengan warna per harness:

```
16.40.12  lyra         [control/intake]     Misi diterima  Lyra menerima permintaan…
16.40.12  claude-code  [finding/execute]    T1 · temuan   ARCHITECT menilai…
16.40.13  hermes       [critique/debate]    Kritik → …    ORACLE menantang…
16.40.13  codex        [vote/consensus]     Weighted vote  82% · bobot 1.02 …
```

## Contoh alur cyber yang aman

```bash
npm run lyra -- policy "Simulasi tabletop pada lab.local"
# level=lab  allowed=false  approval=true  → butuh persetujuan

npm run lyra -- lab scope lab.local
npm run lyra -- lab approve
npm run lyra -- mission cyber-lab --approve --stream
# policy gate lolos → 4 harness menjalankan tabletop defensif
```

## Perbedaan CLI Node vs terminal in-browser

| | CLI Node (`npm run lyra`) | Terminal di website |
|---|---|---|
| Kernel | `LyraOS` | `LyraOS` (instance sama per tab) |
| Spawn binary asli | ✅ | ❌ (browser tidak boleh spawn proses) |
| `localStorage` | ❌ | ✅ settings |
| Warna | ANSI | CSS |
| REPL | ✅ | ✅ (input + ↑/↓ riwayat) |
