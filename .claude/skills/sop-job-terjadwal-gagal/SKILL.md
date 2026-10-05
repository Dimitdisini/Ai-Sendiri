---
name: sop-job-terjadwal-gagal
description: SOP mengecek perintah terjadwal (jadwal cron, origin "jadwal") yang gagal atau macet di office/data/commands.jsonl. Pakai di setiap /briefing dan /rekap-malam, sebelum menulis bagian Kesehatan sistem.
---
# SOP: job terjadwal gagal atau macet

## Kapan dipakai
Setiap kali menulis bagian "Kesehatan sistem" untuk /briefing atau /rekap-malam. Juga saat CEO atau sesi lain melaporkan laporan pagi/malam tidak muncul.

## Langkah
1. Cek `office/data/commands.jsonl` untuk perintah dengan `origin: "jadwal"` pada hari berjalan (field `created`, epoch ms). Satu perintah bisa punya beberapa baris (antre, jalan, lalu selesai atau gagal): status yang berlaku adalah BARIS TERAKHIR per `id`, bukan baris pertama. Catat semua yang berstatus akhir `gagal`, dengan isi `output` (biasanya error singkat seperti "interrupted" atau "context canceled").
1b. Cek `office/data/jadwal-state.json` untuk jadwal hari ini yang berstatus "terlewat" dan tidak punya baris apa pun di `commands.jsonl`. Ini job yang TIDAK PERNAH dibuat (bukan gagal), jadi tidak akan muncul di langkah 1. Catat di Kesehatan sistem sebagai "terlewat" dengan jam jadwalnya.
2. Cek juga perintah APA SAJA (bukan cuma hari ini) yang masih berstatus `jalan` lebih dari 1 jam sejak `started`/`created` -- ini tanda job macet, bukan cuma gagal bersih.
3. Tulis temuan di "Kesehatan sistem": perintah mana, jam berapa, error apa, dan kalau ada yang macet, sudah berapa lama.
4. Kalau menemukan job macet (`jalan` berkepanjangan): JANGAN restart dashboard/launchd untuk "membersihkannya" di tengah rekap-malam/briefing itu sendiri -- restart akan ikut mematikan proses sesi yang sedang menjalankan rekap/briefing ini juga (server yang sama). Cukup catat di Kesehatan sistem dan biarkan CEO atau sesi devops terpisah yang memutuskan restart (lihat sop-layanan-kantor) di waktu yang aman.
5. Kalau ini kejadian PERTAMA, cukup catat di PELAJARAN.md tanpa tindakan lebih. Kalau pola yang sama TERULANG (lihat PELAJARAN.md untuk kejadian sebelumnya), naikkan jadi item yang disebut eksplisit ke CEO lewat "Butuh keputusanmu" atau usulan prioritas -- karena kegagalan berulang berarti ada penyebab sistemik (bukan sekali apes) yang butuh investigasi devops.

## Jangan
- Jangan diam-diam melewatkan kegagalan job terjadwal karena "toh sesi ini sendiri berhasil jalan" -- kegagalan sesi SEBELUMNYA tetap harus terlihat di jurnal walau sesi ini sukses.
- Jangan mengedit `office/data/commands.jsonl` secara manual untuk "menutup" job macet -- file itu ditulis terus oleh proses server yang berjalan; edit manual bisa race condition dengan write berikutnya. Tutup job lewat mekanisme server yang ada (restart terkontrol, lihat sop-layanan-kantor), bukan edit file langsung.

## Asal-usul
2026-09-28: laporan pagi (error: interrupted) dan diskusi pagi (connection reset) gagal berurutan di hari yang sama, belum dijadikan SOP karena baru satu kejadian.
2026-10-05: laporan pagi tidak pernah dibuat sama sekali (tidak ada baris di commands.jsonl, hanya "terlewat" di jadwal-state.json); langkah 1b ditambahkan. Juga ditemukan bahwa commands.jsonl menulis banyak baris per perintah, jadi status dibaca dari baris terakhir per id (langkah 1).
2026-10-02: pola yang sama persis terulang (laporan pagi "interrupted", diskusi pagi "context canceled"), ditambah job kerja-malam 2026-09-27 yang masih "jalan" ~5 hari tanpa pernah ditutup -- dua kejadian cukup untuk jadi SOP tetap.
