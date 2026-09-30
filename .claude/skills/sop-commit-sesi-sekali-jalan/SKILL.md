---
name: sop-commit-sesi-sekali-jalan
description: SOP commit git di akhir sesi orkestrator sekali-jalan (jadwal cron, tombol dashboard, kerja-malam, rekap-malam/pagi) supaya perubahan file di companies/ atau office/ tidak menumpuk uncommitted. Pakai di setiap giliran sekali-jalan yang mengubah file, sebelum giliran itu dianggap selesai.
---
# SOP: commit git di akhir sesi sekali-jalan

Kapan dipakai: setiap kali orkestrator (atau subagen yang dipanggilnya) mengubah file di `companies/` atau `office/` dalam sesi yang berjalan sekali-jalan (dari jadwal cron, tombol dashboard, atau bot Telegram) -- tidak ada giliran lanjutan di sesi yang sama untuk membereskan git nanti.

## Langkah
1. Sebelum giliran ditutup, jalankan `git status --short` untuk melihat file yang berubah pada giliran ini (dan sisa dari giliran sebelumnya yang belum ter-commit).
2. Kalau ada perubahan pada `companies/` atau `office/` yang merupakan hasil kerja giliran ini (plan, QA report, KEPUTUSAN.md, notulen, kode, dll.), `git add` file-file itu lalu buat commit dengan pesan singkat yang menyebut perusahaan/plan/protokolnya.
3. Kalau ada sisa uncommitted dari sesi SEBELUMNYA (bukan hasil giliran ini) yang masih menumpuk, sertakan juga dalam commit ini (atau commit terpisah) alih-alih dibiarkan menumpuk lagi -- kecuali file itu jelas belum final/sengaja ditahan (misal draft yang eksplisit belum siap), catat alasannya di Kesehatan sistem bila ditahan.
4. Kalau commit gagal (hook, konflik, dll.), catat di Kesehatan sistem/jurnal, jangan pakai `--no-verify` atau cara pintas lain.

## Jangan
- Jangan menutup giliran sekali-jalan dengan file penting (plan, QA, KEPUTUSAN.md) masih berstatus uncommitted tanpa alasan yang dicatat.
- Jangan mengandalkan "sesi berikutnya akan commit" -- sesi berikutnya punya pekerjaannya sendiri dan sering tidak menyadari ada sisa dari sesi lain.

## Asal-usul
2026-09-30: rekap-malam menemukan 7 file (KEPUTUSAN.md, plan 015, QA r1, test-plan, bukti QA, notulen diskusi pagi, office/telegram_team.mjs) masih uncommitted lebih dari 24 jam sejak sesi kerja-malam/QA 2026-09-29, menumpuk risiko hilang kalau working tree rusak atau ter-reset.
