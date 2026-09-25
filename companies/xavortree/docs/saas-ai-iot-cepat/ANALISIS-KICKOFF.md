# Analisis Kickoff — SaaS AI IoT Cepat
Perusahaan: Xavortree | Penulis: Analyst (Bima) | Turunan dari: BRD v0.1 | Status: Draft v0.1 (2026-09-25)
Fokus: cara memperpendek waktu dev SaaS AI IoT untuk tim kecil, bukan desain produk. [F] = fakta terverifikasi (sumber di bawah), [ASUMSI] = belum dicek.

## 0. Temuan dasar
Kode `code/monitoring-gudang/` masih kerangka: docker-compose, konfigurasi Mosquitto dynsec + skrip sertifikat, 1 migrasi (extensions/roles), app Node dan service Python yang baru punya `/healthz`, simcore masih placeholder, firmware hanya README [F, dari daftar file dan ROADMAP: M01 10%, M09 5%]. Nilai terbesar ada di **desain** (FD, TDD, AI-SPEC: kontrak payload, aturan alert D1/D6, detektor D2–D5, model termal simulator), bukan di kode. Artinya pilihan stack masih murah untuk diubah sekarang.

## 1. Tuas pemendek waktu dev
**(a) Platform IoT**
| Opsi | Yang didapat gratis | Kekurangan |
|---|---|---|
| **ThingsBoard CE, self-host** | Apache 2.0, multi-tenant, device mgmt, broker MQTT bawaan, rule engine, alarm, dashboard, tanpa batas perangkat [F] | Java, berat (≥4 GB RAM [ASUMSI]); white-label hanya di PE [F]; AI tetap harus service terpisah |
| Lanjut stack sendiri (TDD gudang: Fastify + Mosquitto + TimescaleDB) | Kontrol penuh, desain sudah ada | Semua fitur di kolom kiri harus dibangun: +3–5 minggu [ASUMSI] |
| AWS IoT Core + backend sendiri | Broker terkelola, murah per pesan (USD 1/juta pesan) [F] | Hanya broker; dashboard, tenant, alarm tetap dibangun; lock-in + kurs USD |
**Rekomendasi: ThingsBoard CE.** Alasan: menghapus kira-kira separuh pekerjaan MVP (ingest, tenant, device registry, dashboard, alarm) dan kode lama belum cukup banyak untuk dipertahankan. Ini alasan tertulis untuk mengganti lapisan IoT di TDD gudang. Ditolak: stack sendiri (terlalu lama untuk target ≤ 8 minggu), AWS IoT Core (terlalu sedikit yang dicakup).

**(b) Backend/dashboard**
| Opsi | Catatan |
|---|---|
| **Dashboard + customer user bawaan ThingsBoard, ditambah 1 service AI Python kecil** | Nol frontend untuk MVP; hasil AI ditulis balik sebagai telemetri/alarm ke TB lewat REST API |
| Portal React custom (mis. Refine + komponen siap pakai) di atas API TB | UX lebih baik, +2–3 minggu [ASUMSI] |
| Grafana di atas DB | Cepat untuk grafik, lemah untuk multi-tenant dan alur alert |
**Rekomendasi: dashboard bawaan TB + service AI Python** (pakai ulang desain detektor AI-SPEC dan simcore). Portal custom ditunda sampai ada ≥ 3 klien berbayar.

**(c) Perangkat**
| Opsi | Catatan |
|---|---|
| **Modul umum + firmware siap pakai**: ESP32 + SHT31/DS18B20 dengan ESPHome/Tasmota ke MQTT (A); power meter Modbus RTU (mis. Eastron SDM) + gateway RS485-ke-MQTT (B) | Tanpa menulis firmware; komponen dijual di marketplace lokal [ASUMSI, cek stok dan harga] |
| Sensor/gateway industri jadi (mis. LoRaWAN Milesight) | Andal dan rapi untuk dijual, harga per titik lebih mahal [ASUMSI] |
| Firmware sendiri (PlatformIO, rencana F04 gudang) | Paling fleksibel, paling lama; risiko bug di lapangan |
**Rekomendasi: modul umum + firmware siap pakai.** Ditolak: firmware sendiri (bukan pembeda produk); perangkat industri disimpan sebagai opsi paket premium.

**(d) Auth, multi-tenant, billing**
| Opsi | Catatan |
|---|---|
| **Auth + tenant/customer bawaan TB; tagihan manual lewat Xendit Invoice** | Nol kode billing; 1–5 klien pertama cukup ditagih bulanan |
| Xendit Subscriptions (VA, QRIS, e-wallet) | Otomatis, biaya Rp 2.500/plan aktif/bulan [F]; integrasi +1 minggu [ASUMSI] |
| Bangun sendiri (JWT + RLS, plan 012 gudang) | Sudah didesain, tapi tidak diperlukan jika memakai TB |
**Rekomendasi: bawaan TB + tagihan manual.** Xendit Subscriptions baru dipakai setelah klien ke-5.

## 2. Pakai ulang aset monitoring-gudang [ASUMSI, porsi usaha MVP yang dihemat]
| Arah | Rentang | Yang terpakai |
|---|---|---|
| A. Kepatuhan suhu | 20–35% | Kontrak payload, aturan alert ambang/offline, detektor anomali + simcore termal, desain alert Telegram |
| B. Hemat listrik | 5–15% | Pola service anomali, harness eval, deploy/observabilitas; model termal tidak berlaku untuk energi |
| C. White-label | 10–20% | Seperti A, tergantung jenis sensor klien |
Koreksi atas BRD: angka 50–70% untuk arah A terlalu optimistis karena kode yang ada baru kerangka.

## 3. Pertanyaan untuk CEO
1. **[BLOKIR sebelum ada plan kode] Platform IoT.** A: ThingsBoard CE self-host (lapisan IoT di TDD gudang diganti) | B: lanjut stack sendiri. **Rekomendasi A**, karena memotong 3–5 minggu dan kode lama baru kerangka.
2. **[ASUMSI] Perangkat MVP.** A: modul umum + ESPHome/Tasmota atau gateway Modbus jadi | B: firmware sendiri. **Rekomendasi A**, karena firmware bukan pembeda produk dan menambah risiko lapangan.
3. **[BLOKIR] Lingkungan demo.** A: 1 VPS di Indonesia (8 GB [ASUMSI]) dikelola devops | B: cloud global (AWS/GCP). **Rekomendasi A**, karena biayanya dalam rupiah, latensinya rendah, dan data tetap di Indonesia (UU PDP).

## 4. Risiko teknis utama
1. Kurva belajar ThingsBoard (rule chain, widget) dan kebutuhan RAM-nya; mitigasi: spike 3 hari sebelum plan lain.
2. White-label (arah C) butuh TB PE, USD ~10–499/bulan per skala [F]; menambah biaya tetap.
3. Konektivitas di lokasi klien (WiFi tidak stabil, listrik padam) membuat data hilang; perangkat perlu buffer lokal atau opsi GSM.
4. Arah A: log untuk audit CDOB kemungkinan butuh sensor terkalibrasi bersertifikat [ASUMSI]; sensor murah bisa ditolak auditor.
5. Arah B: peta register Modbus berbeda per merek meter; batasi MVP ke 1 merek.

## 5. Estimasi MVP (tim agen + CEO ~1 jam/hari review, dengan tuas yang direkomendasikan)
| Arah | Ukuran | Minggu ke demo untuk klien berbayar [ASUMSI] | Tanpa TB |
|---|---|---|---|
| A | M | 5–7 | 9–12 |
| B | M (batas L) | 7–9 | 11–14 |
| C | L (wajib dipecah) | 10–14 | >14 |
Hitungan mulai setelah segmen dan platform diputuskan. Hambatan terbesar adalah review CEO dan pengadaan perangkat, bukan menulis kode.

## 6. Hanya bisa dibuktikan lewat uji nyata oleh manusia
Pemasangan dan kekuatan sinyal di lokasi klien; akurasi sensor dibanding termometer referensi atau meter PLN; perilaku saat listrik atau internet putus; operator benar-benar menerima dan menindaklanjuti alert Telegram; auditor atau QA klien menerima format log; klien bersedia membayar harga yang diuji.

Sumber: [ThingsBoard CE vs PE](https://thingsboard.io/ce-vs-pe-diff/), [ThingsBoard pricing 2026 (wz-it)](https://wz-it.com/en/knowledge/iot/thingsboard-pricing/), [AWS IoT Core pricing](https://aws.amazon.com/iot-core/pricing/), [Xendit Subscriptions](https://www.xendit.co/en-id/products/subscriptions/), [Xendit fee Subscriptions](https://help.xendit.co/hc/en-us/articles/29477976087065-How-is-the-scheme-for-Subscriptions-fee).
