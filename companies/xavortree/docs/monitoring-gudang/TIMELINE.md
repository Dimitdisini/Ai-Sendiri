# Timeline — Monitoring Gudang Pintar
Perusahaan: Xavortree | Pemilik: PM (Sari) | Diperbarui: 2026-09-25 | Status: Usulan (menunggu persetujuan CEO)

Target: demo internal dalam 6 minggu dari 2026-09-28 → **2026-11-06** (Jumat, minggu 6). Urutan ANALISIS-KICKOFF §3 disusun ulang sesuai keputusan CEO Q3=B: M07 (AI anomali) masuk rilis pertama sebagai jalur paralel sejak minggu 1, dan syarat "data ≥2 minggu" diganti dataset sintetis. Modul baru: M09 simulator data + dataset sintetis (PRD F02, F03) dan M10 skenario demo (PRD F10); [ASUMSI] Analyst mengonfirmasi keduanya di FD. Rilis demo = M01–M07 + M09 + M10 (semua Must); M08 dan Could pasca demo.

| Milestone | Isi (modul) | Target | Perkiraan saat ini | Status | Ketergantungan |
|---|---|---|---|---|---|
| MS0 Fondasi dan simulator (W1: 28 Sep–4 Okt) | M01 fondasi DB TimescaleDB, tenant/device/zone, RLS, Docker Compose; M09 simulator v1 (skenario normal, tren-naik, spike, stuck, offline) + dataset sintetis v1; M07a AI-SPEC draft; pesan hardware | 2026-10-04 | 2026-10-04 | Belum | PRD + TIMELINE disetujui CEO; FD/TDD M01; repo kode ([BLOKIR]) |
| MS1 Data mengalir (W2: 5–11 Okt) | M03 ingestion MQTT → hypertable + status online/offline; M02 firmware node fisik ESP32 + SHT31; M07a kalibrasi offline pada dataset sintetis (recall dan alert palsu awal) | 2026-10-11 | 2026-10-11 | Belum | MS0; hardware tiba; AI-SPEC disetujui CEO |
| MS2 Alert dan AI observasi (W3: 12–18 Okt) | M04 alert ambang + Telegram + Ack; M07b service anomali mode observasi (hasil ditulis ke DB, belum Telegram); M05a dimulai | 2026-10-18 | 2026-10-18 | Belum | MS1; bot dan grup Telegram tersedia |
| MS3 Dashboard dan onboarding (W4: 19–25 Okt) | M05a dashboard real-time (auth tenant, daftar node, grafik, panel alert); M06 onboarding admin; M07b anomali → alert Telegram; EVAL-REPORT v1 | 2026-10-25 | 2026-10-25 | Belum | MS2 |
| MS4 Integrasi demo (W5: 26 Okt–1 Nov) | M10 skenario demo + DEMO.md; M05b historis + konfigurasi ambang (Should); F12 eskalasi dan F13 buffer offline (Should, bila kapasitas ada); QA end-to-end ronde 1–2 | 2026-11-01 | 2026-11-01 | Belum | MS3 |
| MS5 Demo internal (W6: 2–6 Nov) | Perbaikan temuan QA; EVAL-REPORT final; /rilis go/no-go; demo 15 menit ke CEO | 2026-11-06 | 2026-11-06 | Belum | MS4; QA PASS semua fitur Must |
| Pasca demo | M08 laporan bulanan (F15); F14 peta denah; pencarian klien pilot nyata; kalibrasi ulang AI dengan data nyata; keputusan VPS/hosting | Belum ditetapkan | — | Belum | Keputusan CEO setelah demo |

## Asumsi kapasitas
- Tim AI (ai-engineer) bekerja setiap hari termasuk akhir pekan → M07 berjalan paralel W1–W4: AI-SPEC (W1), kalibrasi offline (W2), service mode observasi (W3), integrasi alert + EVAL-REPORT (W4). Jalur AI tidak menunggu dashboard, hanya menunggu M09 (dataset) dan M03/M04 (integrasi).
- CEO review 1 jam per hari → maksimal 1 dokumen atau keputusan per hari. Antrean review: 28 Sep PRD + TIMELINE, 29 Sep FD, 30 Sep TDD, 1 Okt AI-SPEC, lalu plan dan hasil QA harian. Dokumen yang tidak sempat direview menggeser milestone terkait 1 hari per hari tunda.
- [ASUMSI] Peran lain (analyst, backend, frontend, data, devops, qa) masing-masing 1 agen, hari kerja Senin–Jumat, satu plan aktif per peran; maksimal 2 plan paralel karena kuota Claude Pro. Jalur kritis: M01 → M09 → M03 → M04 → M07b → M10.
- [ASUMSI] MS0 padat: M01 dan M09 hanya punya 1–4 Okt setelah FD/TDD disetujui; risiko geser 2–3 hari, ditutup buffer W6.
- [ASUMSI] QA rata-rata 2 ronde per plan (maks 5 sesuai aturan kantor); buffer perbaikan 3 hari kerja di W6.
- [ASUMSI] Hardware 3–4 set ESP32 + SHT31 dipesan 29 Sep, tiba ≤7 Okt; bila terlambat, M02 geser ke W3 tanpa menggeser demo karena simulator menutupi.
- [ASUMSI] Lingkungan demo = Docker Compose lokal; tidak ada VPS atau deploy produksi. [BLOKIR] repo kode: bila belum ada pada 28 Sep, MS0 geser hari demi hari.
- Prioritas bila kapasitas kurang: Should (M05b, F12, F13) dilepas lebih dulu; fitur Must tidak dipotong tanpa /revisi.

## Riwayat perubahan
| Tanggal | Perubahan | Alasan (tautkan CHANGE-NN) |
|---|---|---|
| 2026-09-25 | Versi 0.1 (usulan). Urutan modul diubah dari ANALISIS-KICKOFF: M07 masuk rilis pertama sebagai jalur paralel; tambah M09 dan M10; M08 pasca demo. | Keputusan CEO saat kickoff Q1=B, Q2=A, Q3=B (timeline awal, bukan CHANGE) |
