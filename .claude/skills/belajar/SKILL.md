---
name: belajar
description: Protokol riset dan sharing pengetahuan harian. Argumen opsional <perusahaan>; tanpa argumen jalan untuk semua perusahaan yang formasinya mengaktifkan peran peneliti.
---
# Belajar (riset & sharing pengetahuan harian)

Peserta: peneliti saja. Ringan, tidak memanggil peran lain.
Output: companies/<p>/docs/pengetahuan/BASIS.md (entri baru ditambahkan, bukan ditimpa).

Langkah orkestrator:
1. Tentukan daftar perusahaan: argumen yang diberikan, atau semua companies/* yang ada.
2. Untuk tiap perusahaan, panggil peneliti sekali. Jangan panggil peran lain, ini bukan kickoff.
3. Setelah selesai, tidak perlu lapor panjang ke CEO — cukup satu baris ringkasan per perusahaan (kalau dipanggil manual). Kalau dipanggil dari tugas terjadwal, tidak perlu melapor ke CEO sama sekali kecuali ada temuan yang menurut Peneliti penting (tandai [PENTING] di entri BASIS.md kalau begitu, dan itu boleh disebut di /briefing besok).
