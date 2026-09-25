---
name: ide
description: Eksplorasi ide bebas (belum tentu jadi project). Argumen <perusahaan>: <topik atau pertanyaan>. Dipakai untuk "coba pikirkan X", bukan kickoff resmi.
---
# Ide (eksplorasi ringan)

Beda dengan /kickoff: ini BUKAN komitmen membangun sesuatu, cuma eksplorasi apakah sebuah arah layak dipikirkan lebih jauh.
Peserta: business-analyst (wajib), peneliti (kalau butuh riset pasar/teknologi), analyst (kalau ada pertanyaan teknis mendasar).
Jangan panggil PM, Developer, QA — itu baru relevan setelah CEO bilang "lanjut" lewat /kickoff.

Langkah:
1. business-analyst menulis BRD ke companies/<p>/docs/<slug>/BRD.md, header ditandai "(eksplorasi)" di judul, status "Draft v0.1 (tanggal)".
   Fokus BRD eksplorasi: siapa yang bayar/butuh, apakah ada bukti permintaan nyata (bukan cuma teori), dan 2-3 pertanyaan yang paling menentukan layak-tidaknya.
2. Kalau ada pertanyaan pasar/teknologi yang perlu dijawab, panggil peneliti atau analyst untuk riset singkat, hasilnya dirujuk di BRD.
3. Daftarkan di lab/IDE.md: baris baru dengan status "Draft — menunggu CEO".
4. Ke CEO: ringkasan 5 baris + link BRD. TIDAK perlu 3 pertanyaan format BLOKIR seperti kickoff — cukup satu pertanyaan: "lanjut, tunda, atau tolak?"

Kalau CEO bilang lanjut: jalankan /kickoff <perusahaan>: <ringkasan dari BRD eksplorasi ini> seperti biasa (BRD yang sudah ada dipakai sebagai draft awal, PM tinggal melanjutkan ke PRD), lalu ubah status di lab/IDE.md jadi "Diterima".
Kalau CEO bilang tunda/tolak: ubah status di lab/IDE.md sesuai, BRD tetap disimpan sebagai riwayat.
