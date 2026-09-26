---
name: sop-qa-tanpa-alat
description: SOP QA ketika alat yang dibutuhkan acceptance criteria tidak tersedia di mesin (misal Docker). Pakai saat QA atau DevOps menemukan AC yang tidak bisa dijalankan.
---
# SOP: QA saat alat tidak tersedia

## Kapan dipakai
Saat sebuah AC butuh alat yang tidak terpasang (Docker, database, perangkat keras).

## Langkah
1. Jangan menginstal alat sendiri. Catat alat yang kurang sebagai BLOKIR di KEPUTUSAN.md.
2. Tandai AC itu "TIDAK DAPAT DIUJI (butuh <alat>)", bukan PASS dan bukan FAIL.
3. Jalankan pemeriksaan pengganti yang benar-benar bisa: validasi statis konfigurasi, uji unit, menyuntik kesalahan sengaja untuk membuktikan pemeriksa bekerja.
4. Verdict "PASS BERSYARAT" hanya kalau semua AC yang bisa diuji lulus. Sebutkan AC mana yang wajib diuji ulang setelah alat tersedia.
5. Simpan log pemeriksaan pengganti di planning/qa/bukti/<plan>/.

## Jangan
- Jangan menulis PASS untuk AC yang tidak dijalankan.
- Jangan menandai plan Selesai di ROADMAP selama masih PASS bersyarat.

## Asal-usul
2026-09-26: QA plan 010 Xavortree, Docker tidak terpasang. AC6-AC7 PASS, AC1-AC5 tidak dapat diuji, pemeriksa compose dibuktikan dengan 5 kesalahan sengaja.
