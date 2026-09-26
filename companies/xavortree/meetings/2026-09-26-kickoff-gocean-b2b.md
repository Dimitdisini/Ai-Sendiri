# Kickoff — gocean-b2b
Tanggal: 2026-09-26 | Perusahaan: Xavortree | Peserta: business-analyst, analyst | Dipimpin: Orkestrator

## Konteks
CEO menjawab feedback atas /riset "drafting Functional Design untuk IT web developer" dengan opsi B (project baru) dan menempel BRD miliknya sendiri (kode dokumen BRD-XV-GCN-2026-V1, v1.0, status versi-CEO "FINAL/APPROVED FOR IMPLEMENTATION") untuk project klien **Gocean B2B E-Commerce & Order Management System** — PT Gocean Indonesia (klien cold-chain seafood B2B), Xavortree sebagai mitra teknologi. Budget disebut Rp 433.000.000 all-in turnkey ("Gas 433"), target roadmap 24 bulan.

Teks BRD yang ditempel CEO **terpotong** di bagian 1.3 (Solusi yang Diusulkan) — bagian 2-12 (Tujuan/KPI, Scope, Stakeholder, Proses Bisnis, FR F1-F6, NFR, Arsitektur Dual Environment, Roadmap 24 bulan rinci, struktur "Gas 433", Matriks Risiko, Acceptance Criteria) baru berupa daftar isi, isi teksnya belum diterima.

Sesuai sop-validasi-kebutuhan: ini kebutuhan nyata (klien konkret, budget konkret, CEO sendiri yang menulis), bukan usulan tim — kickoff sah dijalankan. Karena isi belum lengkap, BRD ditulis dengan status **Draft** (bukan langsung disetujui) dan bagian yang hilang ditandai eksplisit, tidak dikarang.

## Pembahasan per peran
- **Business-analyst**: menulis companies/xavortree/docs/gocean-b2b/BRD.md mengikuti templates/BRD.md. Latar belakang, info kontrol dokumen, dan riwayat revisi masuk lengkap. 11 bagian ditandai "[BUTUH KONFIRMASI CEO]" karena teks aslinya belum diterima (solusi, KPI, scope, stakeholder, proses bisnis, FR F1-F6, NFR, dual environment, roadmap bulanan, rincian Gas 433, matriks risiko, acceptance criteria).
- **Analyst**: menambahkan "Catatan Analyst (tinjauan awal)" di BRD.md. Estimasi kasar **XL**, presisi belum bisa dihitung sampai scope diterima. Pertanyaan teknis utama: makna "Dual Environment", mekanisme fintech/split disbursement (risiko regulasi BI/OJK), sumber data traceability, chat custom vs WhatsApp Business API, kebutuhan e-Faktur, cakupan biaya hosting/gateway dalam anggaran all-in. Risiko: Rp 433jt/24 bulan ≈ Rp 18jt/bulan untuk build+2 pilot+ops standby (ketat untuk scope F1-F6), regulasi UU PDP, stack & repo masih belum ditentukan.

## Keputusan
| # | Keputusan | Jenis | Rekomendasi | Status |
|---|---|---|---|---|
| 1 | Kickoff project gocean-b2b dijalankan | Disetujui CEO (via feedback opsi B) | - | Selesai |
| 2 | Status BRD internal = Draft, bukan langsung disetujui, sampai teks lengkap diterima | ASUMSI | Tunggu teks lengkap dari CEO sebelum lanjut PRD/FD | Menunggu CEO |
| 3 | Tidak mengarang isi F1-F6/NFR/roadmap yang terpotong | ASUMSI (mengikuti sop-validasi-kebutuhan: jangan menebak scope) | Tandai placeholder eksplisit | Diterapkan |

## Tindak lanjut
| Siapa | Apa | File output | Tenggat |
|---|---|---|---|
| CEO | Kirim ulang teks BRD lengkap (bagian 1.3 dan 2-12), idealnya sebagai file utuh agar tidak terpotong | - | Sebelum lanjut PRD/FD |
| pm + analyst | Susun PRD, TIMELINE, FD, TDD setelah BRD lengkap disetujui | docs/gocean-b2b/{PRD,TIMELINE,FD,TDD}.md | Setelah BRD lengkap |

## Pertanyaan untuk CEO (maks 3)
1. Cara terbaik mengirim sisa teks BRD yang terpotong (bagian 1.3 dan 2-12)? A) Upload sebagai file utuh (PDF/Word/txt) B) Kirim ulang bertahap per section di chat. Rekomendasi: **A** — supaya tidak terpotong lagi dan tim tidak salah menebak isi F1-F6/NFR/roadmap.
2. Budget Rp 433 juta all-in dan roadmap 24 bulan itu final untuk jadi basis PRD/FD, atau masih bisa direvisi? A) Final, langsung dipakai B) Masih indikatif, tunggu detail scope dulu. Rekomendasi: **B** — karena estimasi analyst (XL) menilai ini ketat untuk scope F1-F6+fintech+ops standby, lebih aman konfirmasi setelah scope rinci diterima.
3. Permintaan awal CEO adalah drafting Functional Design (FD) untuk web developer — apakah FD boleh mulai ditulis paralel dari bagian yang sudah ada (latar belakang, konteks bisnis) sambil menunggu sisa teks, atau tunggu BRD lengkap dulu baru FD? A) Tunggu BRD lengkap dulu (sesuai SOP: dokumen berat baru setelah BRD disetujui) B) Mulai FD paralel untuk bagian yang sudah pasti. Rekomendasi: **A** — FD yang ditulis dari BRD tidak lengkap berisiko harus dirombak ulang begitu F1-F6/NFR asli masuk.
