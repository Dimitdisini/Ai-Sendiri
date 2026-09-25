# Kickoff (eksplorasi) — saas-ai-iot-cepat
Tanggal: 2026-09-25 | Perusahaan: Xavortree | Peserta: business-analyst (Tari), analyst (Bima), ai-engineer (Naya) | Dipimpin: Orkestrator (Kai)

## Konteks
CEO lewat Telegram: "untuk xavortree aku ingin coba gali terkait AI IoT dan Software gimana caranya bisa buat SaaS dengan waktu dev singkat" (jawaban B atas pertanyaan /kickoff sesi sebelumnya, lihat KEPUTUSAN.md Q8). Karena CEO belum menyebut produk spesifik, dijalankan sebagai kickoff EKSPLORASI (setara protokol /ide): BRD bertanda eksplorasi, terdaftar di lab/IDE.md sebagai I01, belum ada komitmen membangun. PM belum dipanggil; baru dipanggil setelah CEO bilang lanjut. Keputusan lama yang tetap berlaku: SaaS multi-tenant (Q2=A), AI wajib sejak rilis pertama (Q3=B). Pelajaran Monitoring Gudang (Q7): jangan bangun sebelum ada pembayar.

## Pembahasan per peran
- Business Analyst (Tari): BRD v0.1 di docs/saas-ai-iot-cepat/BRD.md. Tiga kandidat arah: A kepatuhan suhu (apotek, klinik, dapur pusat, distributor farmasi; log audit CDOB/BPOM + peringatan dini), B hemat listrik (pabrik UKM, gedung, ritel; power meter Modbus, ROI dalam rupiah), C white-label untuk klien jasa sendiri (cara jual, bukan segmen). Fase 1 eksplorasi S (2-4 minggu, wawancara 5-10 prospek, target 3 LOI atau 1 design partner berbayar). Fase 2 MVP M (6-12 minggu). Aturan penjaga: tidak ada plan kode sebelum ada pembayar.
- Analyst (Bima): docs/saas-ai-iot-cepat/ANALISIS-KICKOFF.md. Temuan penting: kode monitoring-gudang baru kerangka (compose, 1 migrasi, healthz); aset bernilai adalah desain di FD/TDD/AI-SPEC. Pakai ulang untuk arah A diperkirakan 20-35% [ASUMSI], bukan 50-70% seperti di BRD. Tuas pemendek dev: (a) ThingsBoard CE self-host (Apache 2.0, multi-tenant, alarm dan dashboard bawaan), (b) dashboard bawaan ThingsBoard + satu service AI Python, (c) modul sensor umum dengan firmware siap pakai (ESPHome/Tasmota, gateway Modbus), (d) auth/tenant bawaan ThingsBoard, tagihan manual via Xendit Invoice. Estimasi minggu ke demo untuk klien berbayar [ASUMSI]: A = M, 5-7 minggu; B = M mendekati L, 7-9 minggu; C = L, 10-14 minggu. Tanpa ThingsBoard tiap arah tambah 3-5 minggu. Risiko: kurva belajar ThingsBoard, white-label butuh edisi berbayar (PE, USD 10-499/bulan), auditor CDOB mungkin menuntut sensor terkalibrasi bersertifikat.
- AI Engineer (Naya): docs/saas-ai-iot-cepat/CATATAN-AI.md. Deteksi yang paling laku cukup statistik dan aturan (pakai ulang detektor AI-SPEC gudang), tidak perlu LLM. LLM hanya untuk bahasa: penjelasan alert dan laporan bulanan bahasa Indonesia; angka dan status patuh dihitung kode. Model claude-opus-5, turun ke Sonnet/Haiku hanya bila eval sama baik. Biaya 10 tenant sekitar US$14,6/bulan; tanya-jawab data (+US$27) ditunda ke rilis 2. Eval ditetapkan sebelum bangun: detektor 102 run sintetis, tangkap ≥90%; teks LLM 50 alert + 10 laporan, nol angka salah. Alert ke klien baru setelah 14 hari mode shadow. Arah C tidak butuh AI baru. Fitur AI menambah 1-2 minggu [ASUMSI].

## Perbedaan pendapat yang perlu dicatat
- Pakai ulang aset gudang: Tari 50-70% vs Bima 20-35%. Dipakai angka Bima karena dia memeriksa isi kode. BRD akan dikoreksi PM saat lanjut ke PRD.
- Bima mengusulkan ThingsBoard CE, yang berbeda dari stack default A1 (Node/Python, MQTT, TimescaleDB). Butuh keputusan CEO (Q10).

## Keputusan
| # | Keputusan | Jenis | Rekomendasi | Status |
|---|---|---|---|---|
| 1 | Lanjut, tunda, atau tolak eksplorasi I01 | BLOKIR | Lanjut ke Fase 1 validasi pembayar (tanpa kode) | Menunggu CEO (Q9) |
| 2 | Segmen awal: A kepatuhan suhu, B hemat listrik | BLOKIR | A, paling banyak pakai ulang desain, tidak butuh data historis | Menunggu CEO (Q11) |
| 3 | Platform: A ThingsBoard CE, B stack sendiri | BLOKIR sebelum plan kode | A, memotong 3-5 minggu | Menunggu CEO (Q10) |
| 4 | Design partner, definisi "singkat" ≤8 minggu, perangkat firmware siap pakai, VPS Indonesia, cakupan AI rilis 1, beli 2 sensor kalibrasi | ASUMSI | Lihat KEPUTUSAN.md A15 sampai A20 | Dianggap disetujui, CEO bisa membatalkan |

## Tindak lanjut
| Siapa | Apa | File output | Tenggat |
|---|---|---|---|
| CEO | Jawab Q9, Q10, Q11 | KEPUTUSAN.md | sebelum langkah berikut |
| CEO / tim manusia | Fase 1: wawancara 5-10 prospek segmen terpilih, uji harga (agen tidak boleh kontak eksternal) | catatan wawancara di docs/saas-ai-iot-cepat/ | 4 minggu setelah Q11 |
| pm | PRD dan TIMELINE setelah CEO bilang lanjut dan ada pembayar | docs/saas-ai-iot-cepat/PRD.md, TIMELINE.md | setelah Fase 1 |
| analyst | FD, TDD (basis ThingsBoard bila Q10=A), pecah plan | docs/..., planning/plans/ | setelah PRD |
| ai-engineer | AI-SPEC v0.1 dari CATATAN-AI | docs/saas-ai-iot-cepat/AI-SPEC.md | bersama FD |
| Orkestrator | Ubah status lab/IDE.md sesuai jawaban Q9 | lab/IDE.md | setelah jawaban |

## Pertanyaan untuk CEO (maks 3)
Lihat Keputusan nomor 1 sampai 3.
