# BRD — SaaS AI IoT Cepat (eksplorasi)
Perusahaan: Xavortree | Pemilik: PM | Penulis: BA (Tari) | Status: Draft v0.1 (2026-09-25) | Versi: 0.1

## 1. Latar belakang
Pendapatan Xavortree saat ini dari proyek jasa (software, AI IoT, analisis bisnis): tiap klien dibangun ulang, pendapatan tidak berulang, dan tim 4-10 orang cepat habis kapasitasnya. CEO ingin produk SaaS AI IoT yang bisa dijual berulang dengan waktu dev singkat. Pelajaran dari Monitoring Gudang Pintar (dihentikan, Q7): produk dipilih tanpa pembayar nyata. Maka eksplorasi ini dimulai dari **siapa yang membayar**, bukan dari fitur. Keputusan yang tetap berlaku: SaaS multi-tenant (Q2=A), AI wajib sejak rilis pertama (Q3=B). Pasar mendukung: cold chain monitoring Indonesia USD 29,2 jt (2025) ke 87,7 jt (2030), CAGR 24,6% (MarketsandMarkets); tarif listrik industri naik 5-8%/tahun, mendorong submetering (Mobility Foresights); tren AI bergeser ke rekomendasi tindakan, bukan cuma grafik (BASIS.md).

**Kandidat arah (maks 3, belum dipilih):**
| Arah | Pembayar | Nilai yang dibeli | Kenapa bisa cepat |
|---|---|---|---|
| A. Kepatuhan suhu (apotek, klinik, dapur pusat F&B, distributor farmasi) | Pemilik/QA manager | Log suhu otomatis untuk audit (CDOB/BPOM), cegah produk rusak, AI peringatan dini | Pakai ulang aset gudang (sensor suhu, alert Telegram, multi-tenant) [ASUMSI] 50-70% |
| B. Hemat listrik (pabrik kecil-menengah, gedung, ritel) | Pemilik/plant manager | Tagihan PLN turun, AI tunjukkan pemborosan dan jadwal beban | Power meter Modbus/CT siap beli di Indonesia; ROI mudah dihitung dalam rupiah, siklus jual lebih pendek |
| C. Platform white-label untuk klien jasa sendiri | Klien proyek Xavortree yang sudah ada | Dashboard + AI tanpa bangun custom, bayar bulanan | Ubah proyek jasa jadi langganan; satu inti, beda konfigurasi per klien |

## 2. Tujuan bisnis dan metrik sukses
1. Validasi pembayar: ≥ 3 calon klien di satu segmen menyatakan minat tertulis (LOI atau pilot berbayar) dalam 4 minggu sejak segmen dipilih.
2. Waktu ke rilis berbayar: MVP dipakai klien berbayar pertama dalam ≤ 8 minggu [ASUMSI, rentang 6-12; lihat Q3].
3. Bisa dijual ulang: klien kedua onboarding ≤ 5 hari kerja hanya dengan konfigurasi; MRR [ASUMSI] Rp 5-15 jt dalam 6 bulan setelah rilis.

## 3. Scope
### Termasuk
- Fase 1 (eksplorasi, 2-4 minggu): pilih 1 segmen, wawancara 5-10 prospek, uji harga, dapatkan 1 design partner.
- Fase 2: satu MVP multi-tenant, satu jenis sensor, satu fitur AI yang dirasakan langsung pembayar, satu kanal alert.
### Tidak termasuk
- Lebih dari satu segmen sekaligus, aktuator/kontrol otomatis, integrasi ERP/WMS, aplikasi mobile native, hardware desain sendiri, marketplace/self-signup penuh.

## 4. Pengguna dan pemangku kepentingan
CEO (sponsor, pilih segmen dan harga); calon pembayar per arah (tabel di atas); operator lapangan penerima alert; admin Xavortree (onboarding, perangkat).

## 5. Batasan
Tim 4-10 orang dan budget langganan Claude Pro; hardware wajib mudah dibeli di Indonesia; repo dan lingkungan deploy belum ada (BLOKIR level perusahaan); tidak ada kontak eksternal yang boleh dihubungi agen, jadi wawancara prospek dilakukan tim manusia.

## 6. Risiko dan asumsi
- Risiko utama: mengulang pola gudang, yaitu membangun sebelum ada pembayar. Mitigasi: tidak ada plan kode sebelum Tujuan 1 tercapai.
- [ASUMSI] Harga langganan Rp 300 rb-1,5 jt per lokasi/bulan (belum ada data Indonesia); rekomendasi: uji di wawancara.
- [ASUMSI] "AI wajib" di MVP cukup satu kemampuan (anomali atau rekomendasi), bukan platform AI lengkap, agar tetap cepat.
- Risiko biaya hardware di muka menghambat UKM; mitigasi: sewa perangkat dalam paket langganan.

## 7. Estimasi kasar
Fase 1 eksplorasi: **S** (2-4 minggu, kerja riset dan penjualan, hampir tanpa kode). Fase 2 MVP: **M** (6-12 minggu) karena fondasi di code/monitoring-gudang/ bisa dipakai ulang; jadi L bila pilih arah B tanpa aset yang cocok.

## 8. Pertanyaan untuk CEO
1. **Calon klien pertama:** A: sudah ada klien/relasi Xavortree yang mau jadi design partner berbayar | B: belum ada, mulai wawancara 5-10 prospek dulu. **Rekomendasi: A bila ada**, karena satu pembayar nyata langsung menjawab kegagalan project gudang dan memotong waktu validasi.
2. **Segmen awal:** A: kepatuhan suhu (arah A) | B: hemat listrik (arah B); arah C dipakai sebagai model jual, bukan segmen. **Rekomendasi: A**, karena paling banyak memakai ulang aset sehingga paling selaras dengan "dev singkat", dengan syarat Q1 menghasilkan pembayar.
3. **Definisi "singkat":** A: ≤ 8 minggu ke klien berbayar pertama (fitur AI tipis, satu sensor) | B: ≤ 12 minggu (AI lebih dalam, dua jenis sensor). **Rekomendasi: A**, karena kecepatan ke pendapatan pertama lebih bernilai daripada kelengkapan fitur pada tahap validasi.

Sumber: [MarketsandMarkets, Cold Chain Monitoring Indonesia](https://www.marketsandmarkets.com/Market-Reports/geography/cold-chain-monitoring-market/indonesia), [Mobility Foresights, Indonesia Energy Management](https://mobilityforesights.com/product/indonesia-energy-management-market), [Appscrip, white-label SaaS 2-4 bulan](https://appscrip.com/blog/best-vertical-saas-ideas/).
