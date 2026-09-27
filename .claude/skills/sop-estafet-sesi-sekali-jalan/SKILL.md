---
name: sop-estafet-sesi-sekali-jalan
description: SOP memanggil subagen saat sesi orkestrator berjalan sebagai sesi sekali-jalan (perintah dijadwalkan, perintah manual dashboard, rekap malam/pagi) tanpa giliran lanjutan yang bisa menerima notifikasi background. Pakai setiap kali estafet modul (analyst -> developer -> QA) atau tugas lain yang butuh subagen dijalankan di luar sesi interaktif panjang.
---
# SOP: panggil subagen di sesi sekali-jalan

Kapan dipakai: setiap kali orkestrator dipanggil sebagai satu perintah berdiri sendiri (dari jadwal cron, tombol dashboard, atau bot Telegram) yang akan berakhir begitu balasan ini terkirim -- tidak ada sesi lanjutan di percakapan yang sama untuk menerima notifikasi latar belakang.

## Langkah
1. Sebelum memanggil peran (backend, frontend, analyst, devops, qa, dll.), sadari bahwa giliran ini SATU KALI JALAN -- tidak ada giliran berikutnya di sesi ini yang bisa menunggu notifikasi.
2. Panggil subagen dengan mode **foreground** (tunggu hasilnya sebelum giliran ini selesai), bukan `run_in_background: true`. Kalau tools yang tersedia tidak punya opsi foreground yang jelas, pilih cara yang hasilnya diterima SEBELUM giliran ini dianggap selesai.
3. Jangan mengerjakan analisis, dokumen, kode, atau uji sendiri sebagai jalan pintas hanya karena delegasi background "kelihatan tidak akan sempat balik". Itu tetap melanggar aturan dasar (lihat CLAUDE.md root, bagian "Siapa siapa").
4. Kalau ternyata tidak ada cara memanggil subagen secara foreground dengan tools yang tersedia di sesi itu, BLOKIR pekerjaan itu dan laporkan ke CEO alih-alih mengerjakan sendiri sebagai orkestrator.

## Jangan
- Jangan memanggil subagen di mode background lalu langsung menganggap tugas selesai/lanjut di giliran yang sama -- hasilnya tidak akan pernah masuk ke giliran sekali-jalan ini.
- Jangan mengambil alih pekerjaan developer/QA/analyst sendiri dengan alasan "supaya progres tidak macet".

## Asal-usul
2026-09-27: plan 015 (gocean-b2b, Xavortree) dikerjakan langsung oleh sesi orkestrator dengan Write/Bash, bukan oleh subagen devops. Handback plan mencatat alasan: sesi itu dijalankan sebagai perintah sekali-jalan tanpa giliran lanjutan, jadi delegasi subagen versi background dianggap "selalu salah dalam mode ini" dan diganti dengan mengerjakan sendiri -- padahal solusi yang benar adalah memanggil subagen secara foreground, bukan mengerjakan sendiri maupun memanggil background.
