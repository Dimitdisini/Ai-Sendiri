# Analisis Kickoff — Monitoring Gudang Pintar
Perusahaan: Xavortree | Penulis: Analyst/Architect (Bima) | Tanggal: 2026-09-25 | Basis: BRD v0.1

## 1. Pertanyaan teknis sebelum FD
1. **Bahasa backend** [ASUMSI] A: Node.js (NestJS/Fastify) satu bahasa dengan dashboard. B: Python (FastAPI) lebih dekat ke modul AI. Rekomendasi: A untuk backend + dashboard, modul anomali sebagai service Python terpisah (stats saja, ringan).
2. **Penyimpanan time-series** [ASUMSI] A: TimescaleDB (hypertable + continuous aggregate + retention policy 12 bulan). B: PostgreSQL polos. Rekomendasi: A; satu DB untuk data tenant dan sensor, retensi otomatis.
3. **Isolasi tenant** [ASUMSI] A: satu DB, kolom `tenant_id` + Row Level Security. B: schema/DB per tenant. Rekomendasi: A; onboarding klien = insert baris konfigurasi, cukup untuk SaaS (BRD Q2 rek. A).
4. **Protokol dan skema payload perangkat** [ASUMSI] A: MQTT topik `t/{tenant}/{device}/data`, JSON, QoS 1, auth user/pass per device + TLS. B: HTTP POST. Rekomendasi: A; buffer offline di firmware, timestamp dari server bila RTC perangkat tidak valid.
5. **Model bisnis hosting** [BLOKIR] A: SaaS di-hosting Xavortree (VPS Indonesia, mis. Biznet/IDCloudHost). B: on-premise per klien. Menentukan TDD deploy, lisensi, dan biaya server; butuh CEO.
6. **Klien pilot dan jaringan gudang** [BLOKIR] A: Wi-Fi gudang tersedia. B: pakai gateway 4G. Tanpa klien pilot tidak bisa menetapkan jumlah titik, ambang, dan baseline kerusakan.

## 2. Risiko teknis utama
1. Alert palsu berlebihan → mode observasi 2–4 minggu, threshold + debounce/hysteresis per zona sebelum AI aktif.
2. Konektivitas gudang putus → buffer ring di ESP32 (flash) dan alert "sensor offline" berbasis heartbeat, bukan hanya data hilang.
3. Kualitas sensor murah (DHT22 drift/macet) → standar pilot SHT31, deteksi nilai macet (stuck) di modul anomali.
4. Kebocoran data antar tenant → RLS wajib, uji QA khusus akses lintas tenant di setiap plan backend.
5. Telegram rate limit/bot mati → antrian alert dengan retry, eskalasi bila tidak di-acknowledge dalam N menit, fallback log di dashboard.

## 3. Pemecahan modul (pilot pertama)
| Modul | Nama | Ukuran | Tergantung |
|---|---|---|---|
| M01 | Fondasi: skema DB TimescaleDB, tenant/device/zone, migrasi, Docker Compose (Mosquitto+DB+API) | M | — |
| M02 | Firmware ESP32 + SHT31: baca, kirim MQTT, buffer offline, heartbeat, provisioning via config | M | M01 (kontrak payload) |
| M03 | Ingestion: subscriber MQTT → validasi → tulis hypertable, status online/offline | S | M01, M02 |
| M04 | Alert ambang klasik + Telegram: aturan per zona, debounce, ack, eskalasi | M | M03 |
| M05 | Dashboard web: login per tenant, peta titik, grafik real-time/historis, status perangkat | L → pecah 5a (auth+list device+grafik) dan 5b (peta+historis+konfigurasi ambang) | M03, M04 |
| M06 | Admin onboarding tenant dan perangkat (konfigurasi tanpa kode) | S | M01, M05a |
| M07 | Anomali AI statistik (rolling z-score, laju perubahan, stuck sensor), mode observasi | M | M03, M04, data ≥2 minggu |
| M08 | Ekspor laporan bulanan CSV/PDF | S | M05 |

Urutan pilot: M01 → M02 ∥ M03 → M04 → M05a → M06 → M05b → M07 → M08. Cakupan rilis pilot 1 = M01–M06 (sesuai BRD Q3 rek. A).

## 4. Perangkat keras pilot [ASUMSI]
- Node sensor: ESP32 DevKit V1 (Tokopedia/Shopee ±Rp60–90 rb) + SHT31 breakout (±Rp40–70 rb), casing IP54 kecil, catu daya adaptor 5V USB (baterai opsional, pilot pakai listrik).
- Cadangan/pembanding: DHT22 hanya untuk uji, bukan produksi.
- Gateway: Wi-Fi gudang; opsi 4G router mis. Huawei/TP-Link MR100 + SIM Telkomsel bila Wi-Fi tidak ada.
- Server pilot: VPS 2 vCPU/4 GB (IDCloudHost/Biznet) untuk Mosquitto + TimescaleDB + API + dashboard.
- Jumlah pilot: 5–10 node + 2 cadangan; skala desain 100+ per tenant.
