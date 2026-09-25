---
name: diskusi-pagi
description: Diskusi pagi bertema, dijadwalkan harian. Peneliti temukan 1 tema AI/software/teknologi relevan, 3-4 peran paling relevan memberi pandangan singkat dari sudut kerjanya masing-masing. Argumen opsional <perusahaan>; tanpa argumen jalan untuk semua perusahaan.
---
# Diskusi Pagi (tema + sudut pandang lintas peran)

Tujuan: bukan basa-basi harian, tapi satu tema tajam yang benar-benar membantu tim bekerja lebih baik hari itu.
Biaya dijaga: HANYA peneliti + 3-4 peran relevan yang dipanggil, TIDAK semua 11 peran, TIDAK setiap hari untuk semua kalau tidak ada tema kuat.

Langkah orkestrator, per perusahaan:
1. Panggil peneliti: temukan 1 tema hari ini (bukan daftar berita, satu topik spesifik) yang relevan ke bidang perusahaan (baca companies/<p>/CLAUDE.md). Peneliti menulis ringkasan tema 3-5 kalimat plus sumber.
   Kalau peneliti tidak menemukan tema yang benar-benar layak dibahas (bukan sekadar ada, tapi PENTING), berhenti di sini. Tulis di BASIS.md seperti biasa (protokol /belajar), JANGAN paksakan diskusi. Diskusi kosong lebih buruk daripada tidak ada diskusi.
2. Kalau ada tema layak: orkestrator memilih 3-4 peran YANG PALING RELEVAN dengan tema itu (bukan acak, bukan semua). Contoh: tema soal model AI baru -> ai-engineer, analyst, backend. Tema soal tren pasar -> business-analyst, pm. Jangan pernah memanggil lebih dari 4 peran untuk ini.
3. Panggil tiap peran terpilih SATU KALI, SATU GILIRAN, dengan instruksi ketat: "Baca ringkasan tema ini: [tema]. Beri pandanganmu dari sudut kerjamu sebagai [peran], maksimal 3 kalimat: apa artinya buat pekerjaanmu, dan satu hal konkret yang bisa dilakukan tim karena ini." Tidak ada bolak-balik, tidak ada perdebatan antar peran — ini kumpulan sudut pandang, bukan chat panjang.
4. Tulis semuanya ke companies/<p>/meetings/YYYY-MM-DD-diskusi-pagi.md: tema, ringkasan, lalu pandangan tiap peran (nama - 3 kalimat).
5. Tambahkan satu baris penutup di companies/<p>/docs/pengetahuan/BASIS.md yang menaut ke notulen ini (bukan duplikat isi).
6. JANGAN lapor panjang ke CEO. Kalau dijalankan dari tugas terjadwal: tidak perlu melapor ke CEO sama sekali, notulen cukup ada di file. Kalau dipanggil manual: satu baris ringkasan + tautan file.

Batasan biaya: total pemanggilan per perusahaan per hari untuk protokol ini maksimal 5 (1 peneliti + maks 4 peran). Tidak ada iterasi ulang, tidak ada ronde kedua.
