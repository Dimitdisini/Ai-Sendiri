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
- `kantor-ai-briefing-pagi`: Senin–Jumat 07.30, menulis hq/briefings/YYYY-MM-DD.md.
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
BRD → Business Analyst, PRD/TIMELINE → PM, FD/TDD/plans → Architect, AI-SPEC → AI Engineer, qa/ → QA, hq/briefings → Chief of Staff.
Perusahaan ditebak dari path companies/<slug>/ di file atau perintah yang disentuh.

Uji tanpa mengganggu data asli: `OFFICE_EVENTS=/path/events-uji.jsonl OFFICE_PORT=4546 node office/server.mjs`
