# CHANGE-01 — Ganti arsitektur ke Supabase + Vercel (tanpa Docker lokal)
Tanggal: 2026-09-25 | Perusahaan: Xavortree | Project: Monitoring Gudang Pintar | Diminta oleh: CEO | Status: Usulan

## Apa yang berubah
Usulan CEO: ganti database dari TimescaleDB self-host (Docker Compose) menjadi Supabase (Postgres terkelola), dan ganti hosting dashboard/backend dari Docker Compose menjadi Vercel, supaya laptop CEO tidak perlu Docker.

**Riset menemukan dua masalah teknis yang belum disadari CEO, jadi usulan ini tidak bisa diadopsi mentah-mentah:**

1. **TimescaleDB tidak tersedia penuh di Supabase.** Extension `timescaledb` di Supabase sudah *deprecated* untuk Postgres 17 (Timescale me-relisensi ke TSL, tidak kompatibel dengan lisensi open-source Supabase). Proyek baru sudah tidak bisa mengaktifkannya. Alternatif yang didukung Supabase: partisi manual Postgres + extension `pg_partman`, atau tabel biasa dengan indeks `(tenant_id, device_id, time DESC)` tanpa hypertable/continuous aggregate otomatis. Artinya fitur TDD §3 (hypertable, `add_retention_policy`, `add_compression_policy`, continuous aggregate `reading_1m`/`reading_1h` dengan refresh policy) **tidak bisa dipakai apa adanya** — harus ditulis ulang jadi partisi manual + job agregasi sendiri (cron Supabase Edge Function atau pg_cron), yang lebih rumit daripada TimescaleDB asli, bukan lebih simpel.
2. **Supabase dan Vercel tidak punya broker MQTT.** Keduanya hanya database dan hosting web/serverless. Perangkat/simulator butuh broker MQTT (saat ini Mosquitto) untuk publish data. Supabase/Vercel tidak menggantikan Mosquitto — broker MQTT terkelola pihak ketiga tetap wajib ada.
3. **Vercel serverless tidak cocok untuk koneksi MQTT persisten.** Fungsi Vercel bersifat stateless, request-scoped, dan berakhir setelah merespons — tidak bisa menahan koneksi MQTT subscribe yang harus tetap terbuka (mirip keterbatasan WebSocket di Vercel). Proses `apps/ingest` (subscriber MQTT tetap-nyambung) TIDAK bisa dijalankan sebagai fungsi serverless Vercel; ia butuh proses long-running di tempat lain (mis. layanan kecil di Railway/Render/Fly.io, atau worker terpisah), atau jembatan lewat webhook dari broker MQTT ke endpoint HTTP Supabase/Vercel.

## Kenapa
CEO ingin arsitektur yang tidak butuh Docker Desktop berjalan di laptopnya sehari-hari — alasan kenyamanan operasional, bukan perubahan kebutuhan fungsional produk.

## Apa yang TIDAK berubah
Semua fitur di PRD (F01–F13), kontrak payload FD §4, alur bisnis (ingest → deteksi anomali → alert Telegram → dashboard), model data logis (tenant, zone, device, reading, alert, anomaly_event), dan AI-SPEC v0.1 tidak berubah. Ini murni perubahan *tempat berjalan* (hosting/infra), bukan perubahan *apa yang dibangun*.

## Analisis dampak (Analyst)

### TDD.md — bagian yang harus ditulis ulang
- **§1 Arsitektur**: baris "Docker Compose lokal, Postgres/TimescaleDB sebagai satu-satunya state bersama" harus diganti. `apps/ingest` (subscriber MQTT persisten) dan `apps/alerter` (long polling Telegram) tidak bisa jadi fungsi Vercel — perlu host proses long-running terpisah.
- **§2 Stack dan alasan**: TimescaleDB 2.x → Supabase Postgres + pg_partman (atau tabel + indeks polos); Docker Compose v2 → dihapus, diganti daftar layanan terkelola (Supabase, Vercel, broker MQTT pihak ketiga, host proses long-running).
- **§3 Skema data dan migrasi**: seluruh strategi hypertable/retention/compression/continuous aggregate harus ditulis ulang untuk skema tanpa TimescaleDB. RLS (`FORCE ROW LEVEL SECURITY`) tetap bisa dipakai di Supabase — ini salah satu yang **tidak** berubah secara desain.
- **§4 Integrasi eksternal**: baris Mosquitto (dynamic security, TLS 8883) harus diganti dengan broker MQTT terkelola pihak ketiga; perlu baris baru untuk mekanisme jembatan MQTT→DB (webhook broker atau service kecil terpisah).
- **§6 Deploy dan lingkungan**: seluruh bagian Docker Compose (services, port host, `make up/down`) tidak relevan lagi; ganti dengan deploy Vercel + provisioning Supabase + konfigurasi broker MQTT terkelola + (jika perlu) satu layanan long-running kecil untuk ingest/alerter.
- **§8 Keputusan teknis**: baris "Mosquitto 2 + dynamic security bawaan" dan "Realtime via Postgres LISTEN/NOTIFY + SSE" perlu ditinjau ulang — LISTEN/NOTIFY + SSE tidak berjalan baik di fungsi serverless Vercel yang stateless; Supabase Realtime (berbasis WAL) kemungkinan pengganti yang lebih pas.

### Plan yang perlu direvisi
- **011-skema-db-rls-migrasi**: migrasi hypertable (`create_hypertable`, `add_retention_policy`, `add_compression_policy`, continuous aggregate `reading_1m`/`reading_1h`) di AC1 dan AC6 tidak berlaku di Supabase. Perlu ditulis ulang jadi partisi manual `pg_partman` atau tabel biasa + indeks, dan job agregasi terjadwal pengganti continuous aggregate (pg_cron di Supabase atau Edge Function terjadwal). RLS (AC2–AC5) tetap valid tanpa perubahan besar karena Supabase mendukung Postgres RLS penuh.
- **013-simcore-dan-generator-dataset**: dampak minimal — ini paket Python murni (generator dataset, tidak terikat infra). Skema kolom `data.*` (AC1) tetap harus disamakan dengan skema `reading` versi baru (tanpa hypertable), tapi logika simcore sendiri tidak berubah.
- **014-simulator-mqtt-skenario**: target broker berubah dari Mosquitto lokal (`t/{tenant}/{slug}/data` di 1883/8883 compose) ke broker MQTT terkelola pihak ketiga di internet publik. AC1 (`mosquitto_sub` lokal) dan AC6 (`docker stats`) perlu diganti dengan cara uji yang cocok untuk broker cloud. Provisioning kredensial device (dynamic security Mosquitto, disebut di plan 012) perlu diganti dengan mekanisme provisioning ACL broker terkelola yang dipilih.

## Rekomendasi kombinasi layanan
- **Database**: Supabase Postgres, skema `reading` sebagai tabel partisi native Postgres per bulan (`pg_partman`) + indeks `(tenant_id, device_id, time DESC)`, RLS FORCE tetap dipakai. Agregasi 1 menit/1 jam dihitung lewat `pg_cron` job atau materialized view refresh terjadwal, bukan continuous aggregate TimescaleDB.
- **Broker MQTT**: **HiveMQ Cloud (free tier)** — alasan: setup tercepat (menit), TLS bawaan, dan ada Data Hub/webhook untuk meneruskan pesan masuk ke endpoint HTTP tanpa perlu subscriber persisten sendiri. Batasan free tier: 100 koneksi, 10 GB traffic/bulan, retensi data 3 hari, tanpa jaminan uptime — cukup untuk demo dan pengujian, tidak untuk skala 100+ node produksi sungguhan. Alternatif: **EMQX Cloud Serverless** (1 juta menit sesi/bulan gratis, punya rule engine + bridge Postgres bawaan yang lebih matang dari HiveMQ) — lebih cocok kalau ingin jembatan MQTT→Postgres tanpa menulis service sendiri sama sekali.
- **Jembatan MQTT → Supabase**: pakai fitur webhook/rule-engine broker (EMQX rule engine → HTTP POST ke Supabase Edge Function, atau HiveMQ Data Hub → webhook) yang menulis ke tabel `reading` lewat REST/RPC Supabase. Ini menghindari kebutuhan proses subscriber persisten sama sekali, sehingga Vercel serverless bisa dipakai murni untuk API dan dashboard.
- **Hosting dashboard/API**: Vercel untuk `apps/web` (React) dan endpoint API yang stateless (REST biasa). Realtime dashboard pakai Supabase Realtime (subscribe perubahan tabel via WAL), bukan SSE + LISTEN/NOTIFY.
- **Alerter (Telegram long polling)**: proses ini butuh koneksi tetap-hidup — tidak cocok jalan sebagai fungsi Vercel. Rekomendasi: jalankan sebagai satu service kecil di luar Vercel (Railway/Render/Fly.io free tier) khusus proses long-running, atau ganti long polling jadi webhook Telegram yang dipanggil via Vercel function (mengubah desain di TDD §4).

## Opsi ketiga — tanpa MQTT sama sekali untuk fase demo internal (rekomendasi utama untuk fase ini)
Karena pilot Q1=B berarti sumber data fase demo adalah simulator (bukan sensor fisik nyata), pertanyaan CEO relevan: MQTT bisa ditunda. Simulator (plan 014) mengirim langsung ke endpoint HTTP `apps/api`/Supabase (mis. `POST /internal/readings` atau lewat Supabase REST/RPC) — tanpa broker MQTT sama sekali.

- **Yang hilang dari kebutuhan infra**: tidak perlu broker MQTT terkelola (HiveMQ/EMQX), tidak perlu ACL/provisioning device MQTT, tidak perlu jembatan webhook broker→DB. `apps/ingest` jadi endpoint HTTP biasa yang bisa berjalan sebagai fungsi Vercel — cocok dengan sifat stateless Vercel, menghilangkan masalah "koneksi persisten di serverless" sepenuhnya untuk fase ini.
- **Dampak ke plan**: 014-simulator-mqtt-skenario perlu revisi cukup besar — publisher `paho-mqtt` ke topik `t/{tenant}/{slug}/data` diganti klien HTTP yang POST payload sama (skema payload FD §4 tetap dipakai, hanya transportnya berubah). AC1–AC4 di 014 (yang menguji lewat `mosquitto_sub`) perlu ditulis ulang sebagai uji HTTP. 011 (skema DB) tidak terpengaruh oleh pilihan transport ini. TDD §1/§4 perlu mencatat bahwa jalur transport data fase demo = HTTP, dan MQTT dijadwalkan aktif di fase pasca-demo/pilot sungguhan.
- **Trade-off jujur**:
  - Lebih cepat dan murah sekarang: nol biaya/dependensi broker MQTT, arsitektur paling sederhana untuk demo — hanya Supabase + Vercel.
  - **Biaya migrasi di masa depan**: firmware ESP32 (F04, ditulis di fase pasca-demo saat ada hardware fisik sungguhan di gudang) harus ditulis untuk MQTT sejak awal karena perangkat IoT nyata biasanya lebih hemat daya dan lebih andal lewat MQTT (persistent session, QoS, payload kecil) dibanding HTTP polling/push terus-menerus; kontrak MQTT (topik, TLS 8883, dynamic security) yang sudah dirancang di TDD/FD tidak dipakai di fase demo dan baru diuji nyata saat firmware ditulis — risiko bug/asumsi yang meleset baru ketahuan di fase pasca-demo, bukan sekarang.
  - Jalur ingest HTTP fase demo (`apps/ingest` sebagai fungsi Vercel) dan jalur ingest MQTT fase produksi (proses persisten terpisah, lihat opsi Supabase+Vercel+broker di atas) adalah dua implementasi berbeda — kode `apps/ingest` kemungkinan perlu ditulis ulang, bukan sekadar dikonfigurasi ulang, saat transisi ke MQTT.
  - Tidak menguji sama sekali pola integrasi MQTT sebelum hardware nyata tiba — kalau ada masalah desain di kontrak MQTT (mis. ACL, reconnect, QoS), baru ketahuan saat firmware dan broker sungguhan dipasang, momen yang lebih mahal untuk debugging daripada saat masih simulator.
- **Kapan MQTT diaktifkan**: saat fase pasca-demo/pilot sungguhan dimulai (hardware ESP32 fisik terpasang di gudang), broker MQTT terkelola (HiveMQ Cloud atau EMQX Cloud, lihat rekomendasi di atas) diaktifkan, dan baik firmware maupun (jika masih dipertahankan) simulator dipindah ke MQTT.

## Trade-off yang harus disadari CEO
- **Vendor lock-in**: pindah dari stack self-host (bisa dipindah kapan saja) ke kombinasi 3 layanan pihak ketiga (Supabase + Vercel + broker MQTT terkelola). Migrasi keluar lebih rumit karena tiga vendor berbeda dengan API/format masing-masing.
- **Biaya kalau lewat free tier**: Supabase free (500 MB DB, 200 koneksi realtime, project di-pause setelah 7 hari tidak aktif) dan HiveMQ Cloud free (100 koneksi, 10 GB/bulan, retensi 3 hari, tanpa SLA) cukup untuk demo tapi akan kena biaya begitu skala produksi (100+ node, retensi 12 bulan seperti disebut TDD §3) terlampaui — perlu upgrade ke plan berbayar di ketiga layanan.
- **Latensi tambahan lewat webhook**: jalur broker → webhook → HTTP → Supabase menambah hop dibanding MQTT subscriber native yang langsung insert ke DB. Ini bisa menambah delay dan mengubah target `ingest_lag_seconds p95 ≤5 s` di TDD §7 — perlu diuji ulang, bukan diasumsikan tetap terpenuhi.
- **Tidak ada lagi dev environment lokal yang identik dengan produksi**: dengan Docker Compose, `make demo-reset` memberi lingkungan lokal yang sama persis dengan yang akan didemokan. Dengan Supabase+Vercel+broker cloud, pengembangan harian akan selalu memakai layanan cloud (perlu koneksi internet, kena limit free tier bahkan saat development, dan sulit menguji offline).

## Sebelum vs sesudah (timeline)
| Aspek | Sebelum (Plan 010–014 asli) | Sesudah (usulan CEO, direvisi) |
|---|---|---|
| Database | TimescaleDB self-host (Docker), hypertable + continuous aggregate + retention/compression policy otomatis | Supabase Postgres, tabel partisi manual (`pg_partman`) atau tabel biasa + indeks, agregasi via `pg_cron`/job terjadwal |
| Broker MQTT | Mosquitto 2.x self-host (dynamic security, TLS 8883 lokal) | Broker MQTT terkelola (HiveMQ Cloud atau EMQX Cloud), ACL/provisioning lewat API vendor |
| Ingest (subscriber MQTT) | Proses Node.js persisten (`apps/ingest`) di container | Tidak bisa di Vercel; via webhook/rule-engine broker → HTTP Supabase, atau service kecil di host lain |
| Alerter (Telegram long polling) | Proses Node.js persisten di container | Butuh host proses persisten terpisah dari Vercel, atau ganti ke webhook Telegram |
| Dashboard/API | nginx + Fastify di Docker Compose, lokal | Vercel (fungsi stateless + hosting statis) |
| Realtime ke dashboard | Postgres LISTEN/NOTIFY → SSE | Supabase Realtime (WAL-based) |
| Dev environment | `make demo-reset`, semua lokal, identik dengan demo | Selalu bergantung layanan cloud, tidak identik 100% dengan lokal |
| Kebutuhan Docker di laptop CEO | Ya | Tidak, untuk komponen di Supabase/Vercel; mungkin masih perlu untuk service long-running jika dijalankan lokal |

## Keputusan CEO
(diisi CEO)
