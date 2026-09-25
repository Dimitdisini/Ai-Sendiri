# BRD — Monitoring Gudang Pintar
Perusahaan: Xavortree | Pemilik: PM (Sari) | Status: Disetujui CEO 2026-09-25 (Q1=B demo internal, Q2=A SaaS, Q3=B AI sejak awal) | Versi: 0.1

## 1. Latar belakang
Klien gudang kehilangan barang karena suhu/kelembapan menyimpang tanpa terdeteksi; pengecekan manual lambat dan tidak terekam. Peringatan berbasis ambang (threshold) saja terlambat karena kerusakan sering terjadi setelah tren naik yang tidak wajar. Xavortree membutuhkan produk IoT + AI pertama yang bisa dijual ulang (multi-klien), bukan proyek sekali pakai.

## 2. Tujuan bisnis dan metrik sukses
1. Mengurangi kerusakan barang akibat suhu/kelembapan pada klien pilot ≥ 50% dalam 3 bulan setelah go-live (dibanding 3 bulan sebelumnya, [ASUMSI] klien punya catatan kerusakan; rekomendasi: minta data baseline saat kickoff).
2. Waktu deteksi ke notifikasi petugas ≤ 2 menit sejak anomali/ambang terlampaui; alert palsu ≤ 1 per sensor per minggu setelah bulan pertama.
3. Produk siap dijual ulang: onboarding klien gudang kedua ≤ 5 hari kerja tanpa perubahan kode (hanya konfigurasi), diukur saat klien kedua masuk.

## 3. Scope
### Termasuk
- Sensor suhu dan kelembapan di beberapa titik gudang (perangkat mudah dibeli di Indonesia, misal ESP32 + SHT31/DHT22), kirim data via MQTT ke server.
- Ingestion dan penyimpanan time-series; dashboard web: peta titik sensor, grafik real-time dan historis, status perangkat (online/offline, baterai).
- Deteksi anomali AI: tren naik tidak wajar, laju perubahan abnormal, sensor mati/nilai macet, sebelum ambang terlampaui; ditambah alert ambang klasik.
- Alert ke Telegram petugas (grup per gudang), dengan acknowledge dan eskalasi bila tidak direspons.
- Multi-tenant sejak awal: satu instance melayani banyak klien dengan data terpisah; konfigurasi ambang per zona.
- Ekspor laporan bulanan (CSV/PDF) untuk bukti audit.
### Tidak termasuk
- Kontrol otomatis AC/pendingin (aktuator), integrasi WMS/ERP klien, aplikasi mobile native, sensor selain suhu/kelembapan (gas, pintu, CCTV), instalasi listrik/jaringan fisik di gudang.

## 4. Pengguna dan pemangku kepentingan
- Petugas gudang: menerima alert Telegram, acknowledge, cek dashboard.
- Supervisor/manajer gudang klien: atur ambang, lihat laporan, akses historis.
- Admin Xavortree: onboarding klien, kelola perangkat, pantau kesehatan sistem.
- CEO Xavortree: sponsor, keputusan produk dan harga jual ulang.

## 5. Batasan
- Stack: [ASUMSI] Node.js/Python backend, MQTT (Mosquitto), TimescaleDB/PostgreSQL, dashboard web; sesuai rekomendasi default CLAUDE.md, konfirmasi sebelum kode produksi.
- Hardware wajib tersedia di pasar Indonesia; konektivitas gudang [ASUMSI] Wi-Fi ada; rekomendasi siapkan opsi gateway 4G.
- Lingkungan deploy belum ada, repo belum diberikan (BLOKIR di level perusahaan). Budget dan tenggat belum ditentukan.
- Data klien harus terpisah per tenant; retensi data [ASUMSI] 12 bulan.

## 6. Risiko dan asumsi
- [BLOKIR] Klien pilot pertama belum diketahui (jenis barang, jumlah titik, luas gudang) — menentukan ambang, jumlah sensor, dan baseline metrik.
- [ASUMSI] Jumlah titik sensor pilot 5–20; rekomendasi desain untuk 100+ per tenant agar siap dijual ulang.
- [ASUMSI] Model anomali awal berbasis statistik (rolling z-score / laju perubahan), bukan deep learning; butuh 2–4 minggu data untuk kalibrasi; rekomendasi mulai dengan ambang klasik lalu aktifkan AI bertahap.
- Risiko: alert palsu berlebihan membuat petugas mengabaikan Telegram; mitigasi: mode observasi dulu, tuning per zona.
- Risiko: koneksi gudang putus; mitigasi: buffer di perangkat/gateway dan alert "sensor offline".
- Risiko: model bisnis jual ulang butuh lisensi/hosting per klien; belum diputuskan.

## 7. Estimasi kasar
L. Tiga komponen berbeda (firmware perangkat, backend + dashboard multi-tenant, modul AI) plus uji lapangan di gudang nyata; tim 4–10 orang; diperkirakan 3–4 bulan sampai pilot stabil.

## 8. Pertanyaan untuk CEO
1. Klien pilot dan barang yang dimonitor? A: gudang klien sudah ada (nama, jenis barang, jumlah titik). B: belum ada, bangun demo internal dulu. Rekomendasi: A, karena metrik kerusakan dan ambang tidak bisa ditetapkan tanpa gudang nyata.
2. Model jual ulang: A: SaaS multi-tenant di-hosting Xavortree (langganan per gudang). B: instalasi on-premise per klien. Rekomendasi: A, karena onboarding klien baru cukup konfigurasi dan pemeliharaan model AI terpusat.
3. Cakupan pilot: A: ambang klasik + alert Telegram dulu, AI anomali menyusul setelah data terkumpul. B: AI anomali wajib sejak rilis pertama. Rekomendasi: A, karena model butuh data historis nyata untuk kalibrasi dan mengurangi alert palsu.
