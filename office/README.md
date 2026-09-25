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
