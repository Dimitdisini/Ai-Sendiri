---
name: sop-dokumen-ceo
description: SOP menerima dokumen panjang dari CEO (BRD/PRD/spesifikasi) lewat paste teks di chat. Pakai saat CEO mulai menempel dokumen panjang (kickoff, revisi, atau event) supaya tidak terpotong tanpa disadari.
---
# SOP: menerima dokumen panjang dari CEO

## Kapan dipakai
Setiap kali CEO menempel teks panjang (BRD, PRD, spesifikasi produk) langsung di chat/dashboard, bukan sebagai file.

## Langkah
1. Di awal kickoff atau /event, minta CEO kirim dokumen sebagai file utuh (upload, atau link Google Drive) kalau memungkinkan — bukan paste. Ini pencegahan utama.
2. Kalau CEO tetap paste teks: setelah menulis BRD/dokumen, cek apakah teks terlihat berhenti di tengah kalimat, di tengah daftar bernomor (FR-xx), atau di tengah heading tanpa penutup. Tanda-tanda: nomor urut loncat atau berhenti ganjil, kalimat terakhir tidak lengkap.
3. Kalau terindikasi terpotong: tandai eksplisit di dokumen `[BUTUH KONFIRMASI CEO: teks tampak terpotong di bagian X]`, jangan mengarang lanjutannya, dan masukkan sebagai pertanyaan ke CEO di bagian akhir.
4. Kalau CEO lalu mengirim lanjutan di pesan berikutnya: cocokkan dengan penanda terakhir di dokumen (mis. nomor FR terakhir, judul bagian terakhir), sambung tanpa mengubah isi yang sudah ada, lalu naikkan nomor versi dokumen.
5. Setelah semua bagian yang diketahui terpotong terisi, hapus tanda [BUTUH KONFIRMASI CEO] untuk bagian itu saja; pertahankan tanda untuk hal lain yang memang belum dijawab (budget, diagram, persona, dll).

## Jangan
- Jangan mengarang isi bagian yang terpotong (diagram, angka, daftar) hanya supaya dokumen terlihat lengkap.
- Jangan langsung lanjut ke PRD/FD/TDD kalau BRD masih ditandai terpotong pada bagian scope inti.

## Asal-usul
2026-09-26: BRD gocean-b2b dan BRD ecommerce-d2c (Xavortree) sama-sama terpotong di tengah paste CEO — gocean-b2b di bagian 1.3, ecommerce-d2c di tengah FR-16 — dan CEO mengirim lanjutannya di pesan terpisah setelahnya.
