# Kantor AI — Dashboard (Fase 2)

Dashboard panel yang membaca folder companies/*/planning/ dan aktivitas hooks Claude Code.
Tanpa dependency eksternal — cukup Node.js (sudah ada, v24+).

## Jalankan

```bash
node office/server.mjs
```

Buka http://localhost:4545

## Cara kerja

1. `.claude/settings.json` mendaftarkan hooks (SessionStart, PreToolUse, PostToolUse, SubagentStart, SubagentStop, Stop, dst).
2. Tiap event, Claude Code menjalankan `office/hooks/track.mjs`, yang menulis satu baris JSON ke `office/data/events.jsonl`.
3. `office/server.mjs` membaca file itu plus file Markdown di `companies/*/planning/` untuk menyusun status tiap agen dan progres roadmap.
4. `office/public/` adalah dashboard-nya: kartu agen (kerja/istirahat), tab Roadmap, Keputusan, Output, Bukti QA. Auto-refresh tiap 5 detik.

## Yang perlu kamu tahu

- Server harus jalan supaya dashboard bisa dibuka, tapi hooks tetap mencatat ke file walau server mati — jadi tidak ada data hilang.
- Nama dan warna tiap peran ada di `office/roster.json`, ubah sesuka hati.
- Bukti QA (screenshot) dibaca dari `companies/<slug>/planning/qa/bukti/`. QA subagent perlu menyimpan screenshot ke situ.
- Mau diakses dari HP atau dibagikan sementara: pakai Cloudflare Tunnel, sama seperti contoh yang kamu lihat:
  `cloudflared tunnel --url http://localhost:4545`
- Fase 3 (kerja malam otomatis, briefing terjadwal) belum termasuk di sini.

## Fase 2b — visual kantor

`office/public/office.js` menggambar kantor isometrik di canvas, tanpa library.
- Tiap peran punya meja tetap; Orkestrator meja besar di kanan.
- Status "kerja": duduk di meja, layar menyala, tangan mengetik, gelembung berisi aktivitas terakhir.
- Status "istirahat": jalan ke sofa dan mesin kopi, pegang gelas, sesekali ngobrol.
- Peran yang belum pernah aktif tampil abu-abu di mejanya.
- Papan tulis di dinding kiri menampilkan progres roadmap perusahaan yang sedang dipilih.
Posisi meja dan kalimat obrolan bisa diubah di bagian atas `office.js`.

## Fase 3 — kerja terjadwal

Dua tugas terdaftar di Scheduled Tasks aplikasi desktop Claude (menu Routines/Scheduled tasks):
- `kantor-ai-briefing-pagi`: Senin–Jumat 07.30, menulis hq/jurnal/YYYY-MM-DD.md.
- `kantor-ai-kerja-malam`: belum dijadwalkan (manual). Melanjutkan plan berstatus "Siap" lewat developer→qa, berhenti di BLOKIR, tidak pernah deploy. Beri jadwal (mis. 23.00) setelah kamu yakin alurnya jalan.
Catatan: tugas ini jalan selama aplikasi desktop Claude terbuka. Kalau aplikasi tertutup saat jadwalnya tiba, tugas dijalankan saat aplikasi dibuka lagi. Untuk benar-benar 24 jam tanpa laptop, pindahkan ke Claude Code Routines (cloud) setelah proyek ini masuk repo GitHub.

## Kesadaran kuota

Hook `StopFailure` dicatat oleh track.mjs. Kalau giliran terakhir gagal karena API dan belum ada aktivitas sukses setelahnya,
dashboard menampilkan banner "kuota habis, lanjut sekitar pukul …" dan semua karakter pergi ngopi. Pulih otomatis saat ada aktivitas baru.

## Telegram (pintu masuk dari HP)

1. Buat bot lewat @BotFather di Telegram, salin token.
2. Kirim pesan apa pun ke bot itu, lalu ambil chat id kamu (misal lewat @userinfobot).
3. Jalankan di terminal terpisah:
   ```bash
   TELEGRAM_BOT_TOKEN=<token> TELEGRAM_CHAT_ID=<chat id> node office/telegram.mjs
   ```
4. Kirim `/status` untuk ringkasan, atau perintah biasa seperti `/kickoff xavortree: ...`.
   Item BLOKIR baru di KEPUTUSAN.md otomatis dikirim ke Telegram maksimal 1 menit setelah muncul.

Catatan keamanan: bot hanya menerima chat id yang kamu tentukan. Perintah dijalankan dengan `claude -p --dangerously-skip-permissions`
supaya tidak berhenti minta izin; aturan CLAUDE.md tetap berlaku (tidak deploy, tidak kirim pesan keluar tanpa "ya" CEO).
Kalau mau lebih ketat, tambahkan `CLAUDE_SAFE=1` dan perintah yang butuh izin akan ditolak.
Butuh CLI Claude Code yang sudah login (`claude auth login`).

## Ruang rapat (Fase 2c)

Tata letak kantor: ruang kerja (11 meja), ruang rapat berdinding kaca di kanan atas, sudut istirahat di kanan bawah.
Rapat dianggap berlangsung bila: notulen di companies/<p>/meetings/ baru ditulis dalam 12 menit terakhir, ATAU minimal 2 peran subagen sedang bekerja bersamaan.
Peserta pindah ke meja rapat, Orkestrator di kepala meja, papan "Ruang Rapat" menampilkan judul dan jumlah peserta. Selesai rapat, semua kembali ke meja atau sofa.

Peran subagen generik (misal dipanggil dari aplikasi desktop sebagai "general-purpose") ditebak dari file yang DITULIS:
BRD → Business Analyst, PRD/TIMELINE → PM, FD/TDD/plans → Architect, AI-SPEC → AI Engineer, qa/ → QA, hq/jurnal → Chief of Staff.
Perusahaan ditebak dari path companies/<slug>/ di file atau perintah yang disentuh.

Uji tanpa mengganggu data asli: `OFFICE_EVENTS=/path/events-uji.jsonl OFFICE_PORT=4546 node office/server.mjs`

## Kantor 3D (office3d.js) — Fase 2d

Pengganti canvas 2D bila WebGL tersedia. Three.js 0.170 dari CDN jsdelivr (import map di index.html), aset CC0:
- `public/assets/furniture/` Kenney Furniture Kit (140 model GLB), `public/assets/characters/` Kenney Mini Characters (12 karakter beranimasi: idle, walk, sit, interact, emote). Kredit di `public/assets/CREDITS.md`.
- Kamera ortografik isometrik, bisa diputar dan di-zoom (OrbitControls). Bayangan aktif.
- Tata letak sama dengan office.js: 11 meja, ruang rapat kaca, sudut istirahat. Karakter per peran memakai model berbeda; label nama dan gelembung memakai CSS2DRenderer (HTML di atas canvas).
- Animasi: kerja = duduk + sesekali "interact" (mengetik), jalan = walk, rapat = duduk di meja rapat, istirahat = ke sofa (duduk) atau berdiri idle.
- Papan roadmap dan papan ruang rapat digambar sebagai tekstur canvas.
- Kalau WebGL gagal, `#office3d` disembunyikan dan canvas 2D lama tampil lagi. Debug dari konsol: `window.office3d`.
Menyesuaikan posisi: ubah SEATS / MEETING_SEATS / BREAK_SPOTS di atas office3d.js (grid meter, x ke kanan, y ke bawah layar).

## Studio 3D (studio.html)

Halaman terpisah untuk mengerjakan visual tanpa dashboard: http://localhost:4545/studio.html
- Tombol skenario: Semua kerja, Campur, Rapat, Semua istirahat, Kuota habis (data contoh, tidak menyentuh data asli).
- Mode bench untuk melihat arah hadap dan pivot model: `studio.html?zoom=3&bench=desk,chairDesk,character-male-a`
  Panah biru = +z model. Aturan: karakter dan kursi menghadap +z pada rotasi 0; chairModernCushion menghadap +x.
- Semua model dipusatkan ke tengah alas bounding box (fitXZ), jadi koordinat SEATS adalah titik tengah benda.
index.html memakai office3d.js yang sama, jadi perbaikan di studio otomatis masuk ke dashboard.

## Kantor 3D v2 — interior prosedural (menggantikan versi aset Kenney)

`office3d.js` sekarang membangun semua benda dan orang dari kode dengan ukuran nyata dalam meter. Tidak ada file model lagi,
jadi posisi, arah hadap, dan tinggi duduk presisi. Folder `assets/` (Kenney) tidak dipakai lagi dan boleh dihapus.

Isi ruangan (x -9..9, z -6..6; dinding belakang berjendela, dinding kanan):
- Area kerja: 10 meja gaming dua baris (baris A menghadap jendela, baris B menghadap kamera) + meja besar Orkestrator.
  Tiap meja: 2 atau 3 monitor dengan layar sesuai peran (kode, dokumen, grafik, tes), keyboard RGB, strip RGB, bias light, kursi gaming berwarna peran.
- Ruang meeting kaca berbingkai hitam: meja panjang, 7 kursi, laptop dan notes, lampu gantung, TV besar untuk presentasi.
- Pojok kopi: kabinet, mesin kopi, microwave, kulkas, meja bar dengan 2 stool, lampu gantung.
- Lounge: sofa 3 dudukan, 2 armchair, meja kopi, karpet, lampu lantai, rak buku pembatas, kucing kantor yang jalan-jalan.
- Pojok main: 2 bean bag dan mesin arcade.
- Papan: Papan Tugas (kanban dari data plan/QA), Roadmap (persen), Papan Status (tiap agen), jam dinding, TV presentasi.
- Tema Otomatis/Terang/Gelap (malam 18.00–06.00): jendela kota malam dengan lampu gedung, lampu gantung dan lampu lantai menyala.

Orang: badan prosedural bersendi (pinggul, lutut, bahu, siku, kepala), baju warna peran, gaya rambut, kacamata, headset.
Pose: mengetik, duduk santai, rapat (sesekali gestur), presentasi (menunjuk TV), ngopi (menyeruput), bean bag (main HP), arcade.
Jalan memakai A* di peta halangan 20 cm supaya tidak menembus meja dan kaca.

Studio: `studio.html` (tombol skenario). Debug: `window.office3d` (camera, controls, actors, SPOTS, setTheme).
Menggeser tata letak: ubah ROW_X, spot("desk:…"), MEET_IDS, dan rest(...) di bagian TITIK (SPOT).

## Kotak perintah (dashboard → Orkestrator)

Di halaman Overview ada kotak "Perintah ke tim". Pilih perusahaan, ketik perintah (misal `/briefing` atau `/kickoff xavortree: ...`), Kirim.
- Server menjalankan `claude -p` di root proyek, satu perintah dalam satu waktu, sisanya antre. Hasil tampil di bawah kotak, bisa dihentikan.
- Riwayat disimpan di `office/data/commands.jsonl`.
- Perlu kunci akses: `OFFICE_TOKEN` di `office/.env` (dibuat otomatis saat server pertama jalan). Dashboard menanyakannya sekali lalu mengingatnya di browser itu.
- `CLAUDE_SAFE=1` membuat perintah jalan tanpa bypass izin (perintah yang butuh izin akan gagal).

## Keamanan jaringan

Server kini hanya mendengar di `127.0.0.1` (sebelumnya semua antarmuka). Untuk membuka dari jaringan lain: `OFFICE_HOST=0.0.0.0`,
tapi cara yang disarankan adalah Tailscale (di bawah), supaya dashboard tidak pernah terbuka ke internet publik.

## Akses dari HP (Tailscale)

1. Pasang Tailscale di Mac (tailscale.com/download) dan di HP, login dengan akun yang sama.
2. Di Mac, jalankan sekali: `tailscale serve --bg 4545`
3. Buka alamat `https://<nama-mac>.<tailnet>.ts.net` di HP. Hanya perangkat di tailnet-mu yang bisa membukanya.
4. Saat pertama mengirim perintah dari HP, masukkan OFFICE_TOKEN.
Mematikan: `tailscale serve --https=443 off`.

## Lapor dari Antigravity atau tool lain

Tool di luar Claude Code bisa muncul sebagai karakter di kantor lewat `POST /api/event`:

```bash
curl -X POST http://localhost:4545/api/event \
  -H "Authorization: Bearer $OFFICE_TOKEN" -H "Content-Type: application/json" \
  -d '{"agent_type":"frontend","company":"xavortree","summary":"Antigravity: rapikan layout","source":"antigravity"}'
```

Field: `agent_type` wajib (id peran di roster, misal backend, frontend, data), `company` (slug folder), `summary` (teks gelembung),
`status` opsional (`selesai` atau `istirahat` membuat karakter berhenti kerja), `source` (nama tool).
Di Antigravity, tambahkan aturan: "setiap mulai dan selesai tugas, jalankan curl di atas dengan ringkasan satu kalimat".

## Telegram dan dashboard disatukan (2026-09-25)

Bot Telegram tidak lagi menjalankan `claude -p` sendiri. Sekarang dia mengirim perintah ke antrean yang sama
dengan kotak perintah dashboard (`POST /api/command`), jadi hanya ADA SATU antrean, tidak ada dua sesi Kai
yang bisa bentrok mengubah file yang sama.

Setiap perintah selesai — dari Telegram MAUPUN dashboard — hasilnya otomatis dikirim ke Telegram
(`notifyTelegram` di server.mjs), asal `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` ada di `office/.env`.
Jadi kamu bisa kirim perintah dari HP atau dari laptop, hasilnya tetap masuk ke Telegram-mu.

Perintah bebas: tidak ada batasan jenis tugas. Bisa "ringkas dokumen X", "analisa Y", "buatkan Z" —
semuanya diteruskan apa adanya ke Kai, yang memanggil peran yang sesuai.

## Rahasia & kredensial — konvensi

Tiga tempat, beda kegunaan:
1. **macOS Keychain** — untuk token command-line (GitHub, dll). Diatur lewat `git config --global credential.helper osxkeychain` (sudah aktif). Sekali masuk lewat prompt terminal, tersimpan otomatis.
2. **`office/.env`** — untuk kredensial yang dibaca sistem Kantor AI saat jalan (`OFFICE_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`). File mode 600, ada di `.gitignore`, tidak pernah ikut commit.
3. **`.env` di dalam folder kode tiap project klien** (`companies/<p>/code/<repo>/.env`) — rahasia milik project itu (API key pihak ketiga, dll). Selalu ada `.env.example` sebagai contoh format tanpa nilai asli.

**Aturan emas: jangan pernah tempel token/password di percakapan chat dengan Claude.** Kalau sebuah kredensial pernah muncul di chat, anggap bocor dan revoke, walau Claude tidak menyimpannya. Ketik atau tempel langsung ke terminal/file, bukan ke chat.

Untuk mengingat kredensial jangka panjang (bukan yang dipakai sistem), pakai password manager (1Password/Bitwarden), bukan catatan teks biasa.

## Auto-restart (launchd) — Fase 0.1 GO-LIVE.md

Dashboard dan bot Telegram sekarang dikelola `launchd`, bukan dijalankan manual. Kalau Mac restart
atau prosesnya crash, keduanya hidup sendiri dalam hitungan detik. Sudah diuji nyata: proses dibunuh
paksa (`kill -9`), launchd menghidupkan ulang dalam 3 detik.

File: `~/Library/LaunchAgents/com.kantorai.dashboard.plist` dan `com.kantorai.telegram.plist` (di luar repo, khusus Mac ini).
Log: `office/data/dashboard.log` dan `office/data/telegram-bridge.log`.

Perintah berguna:
```bash
launchctl list | grep kantorai              # cek status, PID
launchctl kickstart -k gui/$(id -u)/com.kantorai.dashboard   # restart paksa (setelah ubah server.mjs)
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.kantorai.dashboard.plist   # matikan total
```

**Karena sekarang dikelola launchd, JANGAN pakai `./office/restart.sh` atau `node office/server.mjs` manual lagi** —
itu akan bentrok port dengan proses launchd. Kalau perlu restart setelah ubah kode server, pakai `launchctl kickstart -k` di atas.

## Widget pemakaian (Fase 0.3 GO-LIVE.md)

Sidebar dashboard menampilkan "Aksi hari ini / minggu" per perusahaan — dihitung dari jumlah event
PreToolUse/PostToolUse di `office/data/events.jsonl`. Ini BUKAN biaya token asli (kita tidak menghitung
token), cuma indikator kasar seberapa sibuk tim di perusahaan itu. Endpoint: `/api/state` field `usage`.

## Penjadwal lokal (pengganti Scheduled Tasks Claude)

Rutinitas berjalan di server.mjs sendiri, gratis dan lokal. Daftarnya di `office/jadwal.json`
(id, jam, hari 0=Minggu, diam, perintah). Status per hari di `office/data/jadwal-state.json`.

- Dicek tiap 30 detik. Kalau Mac tidur saat jamnya, tugas dikejar sampai 3 jam setelahnya; lewat dari itu ditandai "terlewat".
- `diam: true` berarti tidak ada notifikasi selesai ke Telegram (laporan pagi/malam sudah dikirim bot lewat jurnal).
- Lihat status: `GET /api/jadwal`. Ubah jadwal: edit jadwal.json lalu `launchctl kickstart -k gui/$(id -u)/com.kantorai.dashboard`.
- Empat Scheduled Tasks di aplikasi Claude sudah dinonaktifkan (tidak dihapus).
- Syarat: Mac menyala dan tidak tidur pada jam tugas (atau bangun dalam 3 jam).

## Eksekutor tugas: API langsung vs CLI Claude Code

Server bisa menjalankan tugas dengan dua cara:

- **api** (target akhir, tanpa aplikasi Claude Code sama sekali): pakai `@anthropic-ai/claude-agent-sdk`
  langsung ke Claude API. Butuh `ANTHROPIC_API_KEY` diisi di `office/.env`. Tools bawaan (baca/tulis file,
  jalankan perintah) tetap jalan karena SDK ini pakai harness yang sama dengan Claude Code, cuma lewat API key,
  bukan login aplikasi.
- **cli** (cara lama, fallback): pakai binary `claude` di terminal, butuh app Claude Code login.

Otomatis pilih **api** begitu `ANTHROPIC_API_KEY` terisi di `.env`. Paksa salah satu dengan `CLAUDE_EXECUTOR=api`
atau `CLAUDE_EXECUTOR=cli` di `.env`. Dependency `@anthropic-ai/claude-agent-sdk` ada di `office/package.json`,
pasang dengan `npm install` di folder `office/`.

## Eksekutor Antigravity CLI (agy) — pakai langganan Google Pro

Selain "cli" (Claude Code) dan "api" (Claude API), ada eksekutor ketiga: **agy** (Antigravity CLI,
`~/.local/bin/agy`), pakai langganan Google Pro, model Gemini (atau Claude lewat routing Antigravity
sendiri). Tidak butuh API key tambahan, tapi tetap butuh Mac ini login Google via `agy` sekali
(`agy` di terminal, ikuti browser login).

Bedanya dengan cli/api: agy TIDAK baca format `.claude/agents/*.md` secara otomatis. Server
menyiasati ini dengan cara:
- **Tugas satu-langkah** (laporan pagi, diskusi pagi, riset, dll): kirim instruksi lengkap sebagai
  satu prompt ke agy, sama seperti cli/api.
- **Kerja malam** (butuh estafet pemilik plan → QA, berulang sampai PASS): diorkestrasi manual di
  `office/server.mjs` (`jalankanKerjaMalamAgy`) — baca file `.claude/agents/<peran>.md` sendiri lalu
  tempelkan sebagai instruksi peran, panggil agy berkali-kali (pemilik plan, lalu QA, ulang maks 3
  ronde per plan). Bukan Task tool bawaan seperti di Claude Code.

Pilih eksekutor per jadwal lewat field `"executor": "agy"` di `office/jadwal.json` (default: `cli`
kalau field ini tidak ada). Untuk perintah manual dari dashboard/API, kirim `"executor": "agy"` di
body POST `/api/command`.

Status sekarang: laporan-pagi, diskusi-pagi, kerja-malam pakai agy. rekap-malam tetap di cli karena
ada langkah `git commit && git push` yang belum diuji lewat agy.

Keterbatasan yang belum tertutup: tombol "hentikan" di dashboard baru bisa memutus proses agy yang
sedang jalan saat itu (satu panggilan), belum bisa membatalkan seluruh sisa estafet kerja-malam
secara instan kalau sedang di antara dua panggilan.

## Login dashboard (Basic Auth di seluruh server)

Sejak dashboard bisa dibuka lewat link tunnel publik (Cloudflare dll), SELURUH server (termasuk
tampilan baca-baca, bukan cuma kotak perintah) wajib login HTTP Basic Auth: username bebas,
password = `OFFICE_TOKEN` di `office/.env`. Berlaku juga untuk akses dari Mac ini sendiri, karena
lewat tunnel tidak bisa dibedakan mana request yang datang dari luar.

Browser mengingat login ini sendiri sekali per sesi, jadi tidak akan minta berkali-kali. Bot
Telegram dan permintaan dari dashboard yang sudah pakai token (format `Bearer ...`) tetap diterima
tanpa perlu login Basic terpisah.
