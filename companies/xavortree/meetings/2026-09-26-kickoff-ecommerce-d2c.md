# Kickoff — ecommerce-d2c
Tanggal: 2026-09-26 | Perusahaan: Xavortree | Peserta: business-analyst, analyst | Dipimpin: Orkestrator

## Konteks
CEO menempel BRD miliknya sendiri lewat dashboard (kode dokumen BRD-ECOM-2026-V1, v1.0) untuk project baru **Modern Web E-Commerce Platform (D2C & Retail)** — target MVP 6-8 minggu. Ini project terpisah dari gocean-b2b (klien PT Gocean, B2B cold-chain seafood, 24 bulan) yang masih menunggu teks lengkap.

Sesuai sop-validasi-kebutuhan: kebutuhan nyata (CEO sendiri menulis dokumen berkode resmi), kickoff sah dijalankan.

Teks CEO **terpotong lagi** — kedua kalinya setelah gocean-b2b — berhenti di tengah FR-16 (Modul 5, Payment Gateway QRIS). Modul 6 dst (kalau ada), NFR, arsitektur, budget, timeline rinci per minggu, matriks risiko, dan acceptance criteria belum diterima. BRD ditulis status **Draft**, bagian hilang ditandai eksplisit, tidak dikarang.

## Pembahasan per peran
- **Business-analyst**: menulis companies/xavortree/docs/ecommerce-d2c/BRD.md. Info dokumen, latar belakang, 4 tujuan bisnis, dan FR-01–FR-16 (Modul 1-5) disalin utuh dari teks CEO. Bagian yang belum diterima ditandai [BUTUH KONFIRMASI CEO]. Estimasi awal L.
- **Analyst**: menambahkan Catatan Analyst. Estimasi ukuran **L** (5 modul standar e-commerce wajar untuk MVP 6-8 minggu, bukan XL seperti gocean-b2b) — bisa turun ke M kalau pakai platform headless, tetap L/lebih kalau custom dari nol. Pertanyaan teknis kunci: modul admin/backoffice (disebut tersirat di FR-15 tapi belum didefinisikan), pilihan custom build vs headless commerce, status akun RajaOngkir/Biteship dan Midtrans/Xendit/Tripay, siapa mengisi konten katalog. Risiko: timeline agresif untuk custom build, approval merchant pihak ketiga di luar kendali tim, repo kode masih BLOKIR, tiga titik teknis rawan meleset (ID wilayah alamat vs vendor ongkir, idempoten webhook, reservasi stok saat menunggu bayar).

## Keputusan
| # | Keputusan | Jenis | Rekomendasi | Status |
|---|---|---|---|---|
| 1 | Kickoff ecommerce-d2c dijalankan sebagai project terpisah dari gocean-b2b | Disetujui (permintaan CEO langsung via dashboard) | - | Selesai |
| 2 | Status BRD internal = Draft sampai teks lengkap/konfirmasi diterima | ASUMSI | Tunggu jawaban CEO sebelum lanjut PRD/FD | Menunggu CEO |
| 3 | Ekspansi B2B Grosir tidak masuk MVP | ASUMSI | Kunci sebagai fase berikutnya, CEO bisa membatalkan | Diterapkan |

## Tindak lanjut
| Siapa | Apa | File output | Tenggat |
|---|---|---|---|
| CEO | Jawab apakah FR-16 akhir scope atau teks terpotong; kalau terpotong, upload file BRD lengkap | companies/xavortree/docs/ecommerce-d2c/ | Sebelum lanjut PRD/FD |
| CEO | Jawab: toko untuk brand sendiri atau klien Xavortree? | - | Sebelum PRD |
| pm + analyst | Susun PRD, TIMELINE, FD, TDD setelah BRD lengkap disetujui | docs/ecommerce-d2c/{PRD,TIMELINE,FD,TDD}.md | Setelah BRD lengkap |

## Pertanyaan untuk CEO (maks 3)
1. Apakah FR-16 (QRIS) memang akhir scope MVP, atau teks BRD terpotong (lagi)? A) Terpotong — upload file BRD lengkap (PDF/DOCX/txt) ke companies/xavortree/docs/ecommerce-d2c/. B) FR-16 memang akhir — tim susun sendiri NFR/budget/risiko/AC. Rekomendasi: **A**, karena ini kejadian kedua (setelah gocean-b2b) dan upload file mencegah terpotong lagi.
2. Toko ini untuk brand milik CEO sendiri, atau untuk klien Xavortree (seperti gocean-b2b)? A) Brand sendiri. B) Klien — perlu nama klien, kontrak, dan budget. Rekomendasi: jawab sebelum PRD karena menentukan siapa pemegang akun payment gateway/ongkir dan batas budget.
3. Kapan mulai daftar akun merchant payment gateway (Midtrans/Xendit/Tripay) dan API ongkir (RajaOngkir/Biteship)? A) Mulai sekarang, paralel dengan PRD. B) Tunggu PRD disetujui. Rekomendasi: **A**, karena verifikasi merchant bisa memakan sebagian besar jendela 6-8 minggu.

## Pelajaran
- Teks panjang yang ditempel lewat dashboard sudah dua kali terpotong (gocean-b2b, lalu ecommerce-d2c). Usulan SOP: dokumen CEO >2 halaman sebaiknya diupload sebagai file ke docs/<slug>/, bukan ditempel di chat/dashboard.
