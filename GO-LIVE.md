# Rencana Go-Live — Team Dimitri

Ditulis 2026-09-26. Tujuan: dari "kokpit yang bagus" jadi sistem yang benar-benar terbukti bisa dipakai
untuk pekerjaan nyata, tanpa loncat ke integrasi besar sebelum fondasinya teruji.

Prinsip: **satu orang** yang menerima semua request dan follow-up (CEO/Dimitri). Tidak ada tim manusia
di dalam sistem ini. Setiap fase harus SELESAI dan TERBUKTI sebelum lanjut ke fase berikutnya — jangan
mengerjakan dua fase sekaligus, itu yang bikin kerja jadi tidak terverifikasi.

---

## Fase 0 — Fondasi tidak boleh rapuh (bisa mulai sekarang, tidak butuh keputusan bisnis)

Tujuan: sistem tidak mati sendiri, dan CEO bisa lihat biayanya.

| # | Item | Siapa | Selesai kalau |
|---|---|---|---|
| 0.1 | Auto-restart dashboard + bot Telegram saat Mac restart/crash (launchd) | AI | Mac di-restart, keduanya hidup sendiri dalam 1 menit tanpa disentuh |
| 0.2 | Docker/OrbStack terpasang | **CEO** | `docker compose config` jalan tanpa error |
| 0.3 | Widget biaya di dashboard: total aksi & sesi per hari/minggu per perusahaan | AI | Angka kelihatan di Overview, bukan cuma di file event mentah |
| 0.4 | Google Drive tersambung ulang (atau resmi dicoret dari rencana) | **CEO** lalu AI | Satu dokumen berhasil disalin ke Drive, atau CEO putuskan tidak perlu |
| 0.5 | Perpustakaan SOP + PELAJARAN.md, semua peran wajib cek SOP sebelum kerja | AI | SOP pertama lahir dari kejadian nyata |
| 0.6 | Laporan pagi dan rekap malam di jurnal harian, dikirim otomatis ke Telegram | AI | Pesan pagi dan malam benar-benar sampai di HP CEO |
| 0.7 | Folder proyek bisa dibuka sebagai vault Obsidian (HOME.md) | AI, lalu **CEO** membuka | CEO bisa baca jurnal dan keputusan dari Obsidian |

Status 2026-09-26: 0.1, 0.2, dan 0.3 selesai dan teruji (Docker via OrbStack, `docker compose` terpasang dan jalan). Jadwal dipindah ke penjadwal lokal di server.mjs. 0.5, 0.6, 0.7 selesai dibangun (0.6 menunggu kiriman pertama terverifikasi besok 06:00). 0.4 menunggu CEO.

Terinspirasi dari cara kerja @teguhgunaw: fondasi file teks + jadwal, satu manajer (HQ = Kai), SOP yang tumbuh
dari kerja nyata, ingatan di file bukan di sesi, laporan 2x sehari ke chat. Yang TIDAK ditiru: sesi per klien yang
nyala terus (belum ada aliran kerja yang membutuhkannya) dan VPS (baru masuk akal setelah Fase 1).

---

## Fase 1 — Satu project nyata, selesai total (pembuktian paling penting)

Tujuan: buktikan pipeline BRD→PRD→FD→TDD→plan→**kode jalan**→QA PASS (bukan bersyarat) bisa selesai
untuk sesuatu yang **CEO sendiri yang minta**, bukan ide bikinan tim.

Aturan keras: tim TIDAK BOLEH mengusulkan project. CEO yang membawa kebutuhan — sekecil apa pun.

| # | Item | Siapa | Selesai kalau |
|---|---|---|---|
| 1.1 | CEO bawa satu kebutuhan nyata (klien, atau tugas internal, ringan pun boleh) | **CEO** | Ada deskripsi konkret, bukan eksplorasi |
| 1.2 | /kickoff resmi, dokumen sampai plan pertama | AI | Plan pertama berstatus Siap |
| 1.3 | Plan dikerjakan sampai QA PASS penuh (bukan bersyarat) | AI | Semua AC teruji nyata, bukan "menunggu Docker" |
| 1.4 | /rilis sampai ada sesuatu yang benar-benar bisa dipakai/dilihat CEO | AI + CEO ("ya" wajib) | CEO buka/pakai hasilnya sendiri, bukan cuma baca laporan |

Belum bisa dimulai — menunggu 1.1 dari CEO.

---

## Fase 2 — Operasional harian terbukti, bukan cuma terjadwal

Tujuan: fitur otomatis (kerja malam, briefing, diskusi pagi) punya rekam jejak nyata, bukan cuma "aktif di jadwal".

| # | Item | Siapa | Selesai kalau |
|---|---|---|---|
| 2.1 | Kerja malam jalan minimal 3 malam berturut dengan hasil terverifikasi | AI (otomatis) | CEO cek paginya, hasilnya masuk akal dan tidak ngawur |
| 2.2 | Briefing pagi dan diskusi pagi terbukti dibaca dan berguna | CEO menilai | CEO bilang "ini membantu", bukan diabaikan |
| 2.3 | Kalau ada masalah dari 2.1/2.2 (kerja ngawur, tema tidak relevan), diperbaiki | AI | Tidak berulang di 3 kejadian berikutnya |

Belum bisa dinilai — menunggu Fase 1 selesai (kerja malam butuh plan nyata untuk dilanjutkan).

---

## Fase 3 — Fleksibel untuk perusahaan baru (skalabilitas struktur)

Tujuan: nambah perusahaan baru (misal usaha 3D printing) jadi cepat dan konsisten, bukan ditulis tangan tiap kali.

| # | Item | Siapa | Selesai kalau |
|---|---|---|---|
| 3.1 | Protokol `/perusahaan-baru` — scaffolding folder otomatis | AI | **Selesai hari ini** |
| 3.2 | Template CLAUDE.md perusahaan yang konsisten (tanpa asumsi tim manusia) | AI | **Selesai hari ini** |
| 3.3 | Dashboard & kantor 3D otomatis menampilkan perusahaan baru tanpa ubah kode | AI | Sudah begitu dari awal (server baca folder companies/ secara dinamis) |
| 3.4 | Uji nyata: tambah satu perusahaan baru sungguhan pakai `/perusahaan-baru` | **CEO** memicu | Folder jadi, dashboard menampilkannya, tanpa error |

3.1-3.3 selesai di sesi ini (2026-09-26). 3.4 menunggu CEO benar-benar punya perusahaan baru untuk dicoba — jangan dites dengan perusahaan fiktif, itu mengulang kesalahan project fiktif sebelumnya.

---

## Fase 4 — Baru pikirkan integrasi besar (uang, klien eksternal, deployment produksi)

Tujuan: hanya dikerjakan **setelah** Fase 1 dan 2 terbukti, dan **hanya untuk kebutuhan yang nyata muncul**,
bukan dipasang di muka "siapa tahu perlu".

Kandidat, urutan tergantung kebutuhan nyata yang muncul duluan:
- VPS kecil supaya tim tetap jalan walau laptop ditutup (paling awal di antara semua ini, begitu Fase 1 punya pekerjaan harian)
- Integrasi akuntansi (QuickBooks/Xero) — kalau ada transaksi nyata yang perlu dicatat
- Deployment produksi sungguhan (bukan staging) untuk hasil Fase 1 yang mau dijual/dipakai orang lain
- Kanal komunikasi klien eksternal (email masuk otomatis, form) — kalau ada klien yang butuh akses langsung, bukan lewat CEO terus
- Monitoring uptime untuk sistem yang sudah live ke publik

Tidak ada checklist detail di sini dulu — detailnya baru masuk akal ditulis setelah tahu kebutuhan nyatanya apa.

---

## Cara pakai dokumen ini

- Update status tabel di atas tiap kali sebuah item selesai, jangan biarkan basi.
- Kalau ada fase yang mau dilompati, itu keputusan CEO — tulis alasannya di sini, jangan diam-diam.
- Dokumen ini tentang KESIAPAN SISTEM, beda dengan roadmap project di `companies/<p>/planning/ROADMAP.md` yang isinya pekerjaan project itu sendiri.
