# FD — Monitoring Gudang Pintar
Perusahaan: Xavortree | Pemilik: Analyst (Bima) | Turunan dari: PRD.md v0.1 | Status: Draft, menunggu review CEO (antrean 29 Sep) | Versi: 0.1 (2026-09-25)

Cakupan: fitur Must F01–F10 untuk rilis demo internal (Q1=B, Q2=A, Q3=B). F11–F15 hanya disebut bila memengaruhi model data. Bagian AI mengacu AI-SPEC v0.1 (draft).

## 1. Peta layar atau alur
| Kode | Layar / kanal | Peran | Isi utama |
|---|---|---|---|
| L1 | Login | semua | email + password; tenant ditentukan dari akun, bukan dipilih |
| L2 | Ringkasan node | operator, supervisor | daftar node tenant: nama, zona, status online/offline, suhu/RH terakhir, waktu terakhir, badge alert aktif |
| L3 | Detail node | operator, supervisor | grafik suhu dan RH 1 jam terakhir (refresh ≤30 s), riwayat alert node |
| L4 | Panel alert dan anomali | operator, supervisor | alert aktif (ambang, anomali, offline) + tombol Ack + riwayat 24 jam; alert mode observasi diberi label "observasi" |
| L5 | Admin tenant (M06) | admin Xavortree | buat tenant, user, zona (preset ambang), perangkat (kredensial MQTT tampil sekali), chat_id Telegram, toggle mode observasi |
| L6 | Kesehatan sistem | admin Xavortree | heartbeat service, broker, antrean Telegram, pesan MQTT ditolak |
| TG | Telegram, satu grup per tenant | operator, supervisor | pesan alert + tombol inline [Ack] [Benar] [Palsu]; perintah `/status` |
| CLI | `xt` (di container api) | admin, tim demo | `tenant`, `zone`, `device`, `user`, `telegram`, `sim`, `demo` — pengganti L5 sebelum M06 |

Alur: **A1 Data** node/simulator → MQTT `t/{tenant}/{device}/data|hb` → ingest (validasi + registry) → `reading` + `device_status` → NOTIFY → api SSE `/stream` → L2/L3. **A2 Alert** alerter (ambang D1, offline D6) dan service anomali (D2–D5) → `alert` (+`anomaly_event`) → antrean `alert_delivery` → Telegram → callback Ack → status acked → SSE → L4. **A3 Onboarding** admin (L5/CLI) → tenant/zona/device → kredensial dibuat di broker (dynsec) → registry ingest diperbarui via NOTIFY → node/sim tampil tanpa restart. **A4 Demo** `make demo-reset` → seed 2 tenant → simulator 20 node/tenant → `xt demo step N` memicu skenario sesuai DEMO.md.

## 2. Detail per fitur
| ID | Input dan aturan bisnis | Validasi, kasus tepi, pesan error |
|---|---|---|
| F01 Multi-tenant | Semua entitas tenant berkolom `tenant_id`. JWT memuat `tenant_id` + `role`. Tiap request dibungkus transaksi `SET LOCAL app.tenant_id`; RLS FORCE di semua tabel tenant. Admin Xavortree (tenant NULL) wajib kirim `X-Tenant-Id` untuk aksi per tenant. | Token tanpa tenant pada endpoint tenant → 401. Resource tunggal milik tenant lain → 404 (id tidak bocor); koleksi → daftar kosong; peran tidak cukup → 403. Memenuhi PRD "403 atau kosong". |
| F02 Simulator | Konfigurasi: tenant, N node, interval data (default 10 s, maks 30 s), seed, skenario awal. Tiap node virtual memakai kredensial device-nya sendiri (tanpa superuser), payload identik firmware, `seq` naik. Skenario runtime per node lewat HTTP lokal `POST /sim/nodes/{slug}/scenario` atau `xt sim scenario`: `normal`, `tren-naik{slope_c_per_min,duration_min}`, `spike{delta}`, `stuck{duration_min}`, `offline{duration_min}`. | Ganti skenario tanpa restart proses. `offline` = berhenti data dan hb. Kredensial satu node salah → node itu log error dan retry backoff, node lain lanjut. Mode `--clock virtual` (dipercepat) hanya untuk uji, demo memakai real-time. |
| F03 Dataset | Generator `gen --seed --days ≥14 --nodes ≥10 --zones 2 --out`: `data.csv|parquet` (ts, tenant, zone, device, temp_c, rh_pct, label), `events.csv` (jenis, mulai, selesai, device), `meta.json` (seed, parameter, proporsi label). Label baris ∈ {normal, tren_naik, spike, stuck, offline}; offline = baris hilang + entri di events. Model sinyal = paket `simcore` yang sama dengan simulator (AI-SPEC §3.4). | Seed sama → hash file identik. Proporsi anomali default ±5% baris, dicatat ke AI-SPEC §3.4 oleh AI Engineer. Skenario lanjutan AI-SPEC §4.1 (34 × 3 seed) dibangun MS1 di atas simcore. |
| F04 Firmware | Konfigurasi lewat `config.h`/serial: SSID, password Wi-Fi, host, 8883, CA, username `{tenant}.{device}`, password, tenant, device. Publish data tiap 30 s (≤60 s), hb tiap 60 s, QoS 1. `ts` dari NTP; NTP gagal → `ts:null`. Reconnect backoff 5 s → 60 s. | Nilai SHT31 di luar −40..125 °C atau 0..100 %RH dibuang, hitung `err` di hb. Buffer offline (F13) tidak di v1. |
| F05 Ingestion | Subscribe `t/+/+/data` dan `t/+/+/hb` sebagai `svc-ingest`. Validasi: (tenant, device) ada di registry (cache DB, refresh via NOTIFY `device_changed`) dan aktif; JSON schema v1; rentang nilai; `ts` ≤ now+2 menit dan ≥ now−7 hari, selain itu `time=received_at`, `ts_source=server`. Insert batch ≤1 s atau 500 baris per tenant; upsert `device_status`. Job tiap 30 s: `last_hb < now − 3×hb_interval` → `offline`, emit `device_offline` sekali; hb kembali → `online`. | Pesan ditolak → log `ingest_rejected{reason}` + metrik, tidak retry, pesan lain tidak terganggu. Duplikat (device, seq) dalam 10 menit → diabaikan. Device baru saat ingest jalan → diterima ≤5 s. Broker putus → reconnect; alert offline ditahan selama ingest sendiri terputus (hindari badai alert). |
| F06 Alert ambang + Telegram + Ack | `threshold_config` per zona: `temp_min`, `temp_max`, `rh_max`, `debounce_n` (default 2, PRD), `hysteresis_c` 1 °C, `hysteresis_rh` 3 %RH. State per (device, metrik): normal → pending (1 pelanggaran) → active (debounce tercapai: buat `alert`, kirim) → acked (Ack) → resolved (kembali di dalam batas ± histeresis selama `debounce_n`). Tidak ada alert ulang selama active/acked. Pesan template deterministik: `[Tenant] Zona / Node: suhu 9,4 °C > 8 °C (10:32 WIB)`. Ack lewat tombol Telegram (`ack:{alert_id}`) atau dashboard; mencatat nama dan waktu; pesan Telegram diedit "Diakui oleh … pukul …". | Callback hanya sah bila `chat_id` = `telegram_channel.chat_id` tenant alert, selain itu diabaikan dan dicatat. Ack pada alert acked/resolved → 409. Telegram gagal → `alert_delivery.failed`, retry backoff 5 s → 5 menit sampai 30 menit; dashboard menandai "belum terkirim". Tenant tanpa chat_id → alert hanya dashboard + log warn. Kolom `escalated_at` disiapkan untuk F12. |
| F07 Anomali AI | Sesuai AI-SPEC v0.1: service anomali tiap 60 s membaca jendela `reading` per tenant, menjalankan D2 laju perubahan, D3 pola harian (nonaktif sampai baseline 14 hari), D4 macet, D5 peer/drift → tulis `anomaly_event` lalu `POST /internal/alerts`. Cooldown 30 menit per (device, detektor); ≥50 % device satu zona → 1 alert zona (`device_id` NULL). `tenant.observation_mode=true` (PRD "mode observasi" = AI-SPEC "shadow") → alert `channel=dashboard_only`. Tombol Benar/Palsu → `alert_feedback`. Konfigurasi detektor per tenant/zona JSON (`detector_config`), toggle per detektor. | D1 dan D6 tidak dihitung ulang di service AI (dimiliki alerter). Service AI mati → alert ambang tetap jalan. Alert palsu > 3/device/hari → detektor auto-nonaktif + notifikasi admin (AI-SPEC §6). Target eval di AI-SPEC §4; EVAL-REPORT wajib sebelum /rilis. |
| F08 Dashboard | Login → JWT di cookie httpOnly. L2/L3/L4 dimuat dari REST lalu diperbarui via SSE `/stream` (event `reading`, `device_status`, `alert`). Grafik 1 jam dari `GET /devices/{id}/readings` (raw ≤3.600 titik). | SSE putus → reconnect + refetch. Tenant tanpa node → empty state. Nilai terakhir >5 menit → abu-abu. Hanya data tenant dari token (RLS). |
| F09 Onboarding | Admin buat tenant (`slug` `[a-z0-9-]{3,32}` unik, nama), user, zona (nama + preset `rantai-dingin` 2–8 °C atau `gudang-kering` ≤30 °C, RH ≤65 %), device (`slug` unik per tenant, zona, `kind` physical/virtual), chat_id Telegram (bot kirim pesan uji "Tenant X terhubung", M06). Kredensial MQTT: username `{tenant}.{device}`, password acak 24 karakter tampil sekali, client + role dibuat di dynsec dengan ACL publish `t/{tenant}/{device}/#` dan subscribe `t/{tenant}/{device}/cmd`. Rotasi dan nonaktif lewat admin/CLI. | Broker tidak terjangkau → 503 `UPSTREAM_UNAVAILABLE`, transaksi dibatalkan, device tidak dibuat. Slug ganda → 409. Device nonaktif → dynsec `disableClient` + ingest menolak. Target PRD ≤15 menit sampai tampil tanpa restart. |
| F10 Demo | `make demo-reset` (volume dibuang, migrasi, seed: tenant `demo-a` 2 zona + `demo-b` 1 zona, admin, 2 user/tenant, node fisik terdaftar di `demo-a`), `make demo-up` (compose + simulator 20 node/tenant), `xt demo step N` memicu urutan DEMO.md: tren-naik A-05 sebelum ambang, tembus ambang A-03 → Telegram → Ack, stuck A-07, offline A-09, spike B-02, onboarding live `demo-c`. Tiga grup Telegram internal (A, B, C). | Runbook bernomor dengan durasi per langkah; QA mengukur ≤15 menit, diulang 2×. Tidak menduplikasi logika skenario simulator (memanggil API M09). |

## 3. Model data
Semua tabel tenant memuat `tenant_id uuid NOT NULL` + RLS. Peran tulis/baca di kolom terakhir (A = admin Xavortree, S = supervisor, O = operator, svc = service internal).
| Entitas | Atribut kunci | Relasi | Tulis / Baca |
|---|---|---|---|
| `tenant` | id, slug uniq, name, observation_mode bool, flags jsonb (feature flag per tenant: `llm_explain` default false, dst.), is_active, created_at | — | A / A, svc |
| `app_user` | id, tenant_id (NULL = admin), email uniq, password_hash, name, role {admin, supervisor, operator}, is_active | tenant | A / diri sendiri |
| `zone` | id, tenant_id, name, preset | tenant | A / S, O |
| `threshold_config` | zone_id pk, temp_min, temp_max, rh_max, debounce_n, hysteresis_c, hysteresis_rh, updated_by, updated_at | zone | A, S (F11) / S, O, svc |
| `device` | id, tenant_id, zone_id, slug, name, mqtt_username uniq, kind {physical, virtual}, is_active, data_interval_s 30, hb_interval_s 60; uniq (tenant_id, slug) | zone | A / S, O, svc |
| `device_status` | device_id pk, tenant_id, state {online, offline, unknown}, last_seen, last_hb, last_temp, last_rh, rssi, fw, changed_at | device | ingest / S, O, svc |
| `reading` (hypertable) | time, tenant_id, device_id, temp_c, rh_pct, seq, received_at, ts_source {device, server} | device | ingest / S, O, anomali |
| `telegram_channel` | tenant_id pk, chat_id, title, verified_at | tenant | A / alerter |
| `alert` | id, tenant_id, zone_id, device_id NULL (alert zona), source {threshold, anomaly, offline}, detector, severity, status {active, acked, resolved}, metric, value, limit_value, evidence jsonb, channel {telegram, dashboard_only}, started_at, acked_at, acked_by, acked_via {telegram, dashboard}, resolved_at, escalated_at, anomaly_event_id NULL | zone, device, anomaly_event | alerter, api (ack) / S, O |
| `alert_delivery` | id, alert_id, tenant_id, kind {new, ack, escalation}, status {pending, sent, failed}, attempts, next_try_at, tg_message_id, error | alert | alerter / A (L6) |
| `anomaly_event` | id, tenant_id, zone_id, device_id NULL, detector, severity, evidence jsonb, t_start, t_end | zone, device | anomali / S, A |
| `alert_feedback` | id, alert_id, tenant_id, verdict {benar, palsu}, by_name, via, created_at | alert | alerter, api / A, ai-engineer |
| `detector_config` | tenant_id, zone_id NULL, detector, enabled, params jsonb, updated_at | tenant, zone | A / anomali |
| `service_heartbeat` | service pk, last_seen, version, info jsonb (mis. broker_connected) | — | svc / A (L6) |

Kredensial MQTT tidak disimpan di DB (hanya `mqtt_username`); hash ada di dynsec broker. Tidak ada audit log di v1 (log pino cukup untuk demo).

## 4. API dan kontrak
REST `/api/v1`, JSON, JWT Bearer (cookie httpOnly untuk web). Error: `{"error":{"code":"…","message":"…"}}` dengan 400 `VALIDATION`, 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 409 `CONFLICT`, 429 `RATE_LIMITED`, 503 `UPSTREAM_UNAVAILABLE`.
| Endpoint | Peran | Catatan |
|---|---|---|
| `POST /auth/login {email,password}` → `{token, user{id,name,role,tenant{id,slug,name}}}`; `GET /me` | semua | login salah 401; >10 percobaan/menit/IP 429 |
| `GET /devices` → `[{id,slug,name,zone,state,last_temp,last_rh,last_seen}]`; `GET /devices/{id}/readings?from&to&step=raw|1m` → `[{time,temp_c,rh_pct}]` | S, O | raw maks 24 jam |
| `GET /zones`; `GET /zones/{id}/threshold`; `PUT /zones/{id}/threshold` (F11) | S, O (PUT: S) | PUT berlaku pada pembacaan berikutnya |
| `GET /alerts?status&from&to`; `POST /alerts/{id}/ack`; `POST /alerts/{id}/feedback {verdict}` | S, O | ack ganda 409 |
| `GET /stream` (SSE: `reading`, `device_status`, `alert`) | S, O | hanya event tenant token |
| `POST /admin/tenants`; `GET /admin/tenants`; `PATCH /admin/tenants/{id} {observation_mode,is_active}`; `POST /admin/tenants/{id}/users|zones|devices`; `POST /admin/tenants/{id}/telegram {chat_id}`; `POST /admin/devices/{id}/credentials/rotate`; `PATCH /admin/devices/{id} {is_active}`; `GET /admin/health` | A | `POST devices` → `{device, mqtt:{username,password,host,port,ca_url}}`, password sekali tampil |
| `POST /internal/alerts` (dari service anomali), `POST /internal/heartbeat` | svc | token `INTERNAL_TOKEN`, hanya jaringan compose |
| Simulator `127.0.0.1:8090`: `GET /sim/nodes`; `POST /sim/nodes/{slug}/scenario {scenario,params}`; `POST /sim/scenario` (semua node) | tim demo | tidak diekspos keluar host |

MQTT: topik `t/{tenant_slug}/{device_slug}/data`, `…/hb`, `…/cmd` (dicadangkan), QoS 1, retain false, ukuran ≤512 B. Payload data v1 `{"v":1,"ts":"2026-10-01T03:00:00Z","t":24.52,"h":61.3,"seq":1234}` (`ts` null bila jam tidak valid); hb v1 `{"v":1,"ts":…,"up":3600,"rssi":-61,"fw":"0.1.0","err":0}`. Ditolak bila topik tidak cocok registry, JSON tidak valid, `v`≠1, nilai di luar rentang, atau kelebihan ukuran.

Telegram: pesan alert template deterministik + inline keyboard `ack:{alert_id}`, `fb:{alert_id}:benar`, `fb:{alert_id}:palsu`; callback diverifikasi terhadap `telegram_channel` tenant; `/status` ringkasan node tenant grup itu; `/jelaskan` (LLM) OFF di rilis ini (AI-SPEC §7 Tahap 3).

## 5. Peran dan hak akses
| Hak | Admin Xavortree | Supervisor | Operator | Device (MQTT) | Service internal |
|---|---|---|---|---|---|
| Lihat data tenant sendiri (node, grafik, alert) | ya, dengan `X-Tenant-Id` | ya | ya | — | ya, per tenant (RLS) |
| Lihat semua tenant / L6 | ya | — | — | — | — |
| Ack alert, feedback Benar/Palsu | ya | ya | ya | — | alerter (atas nama pengguna Telegram) |
| Ubah ambang zona, mode observasi, detektor | ya | ambang saja (F11) | — | — | — |
| Kelola tenant, user, zona, device, Telegram | ya | — | — | — | — |
| Publish MQTT | — | — | — | hanya topik sendiri | `svc-ingest` subscribe `t/#` |
| `/internal/*` | — | — | — | — | ya (`INTERNAL_TOKEN`) |
Peran DB: `app_owner` (migrasi), `app_api`/`app_ingest`/`app_anomaly` (RLS aktif, hak GRANT minimum), `app_admin` (BYPASSRLS, hanya endpoint `/admin` dan CLI). Detail di TDD §5.

## 6. Hal yang belum diputuskan
- **M09 (simulator + dataset): DITERIMA** sebagai modul terpisah, pemilik `data`, karena F02/F03 Must, prasyarat M03/M04/M07, dan satu paket `simcore` dipakai simulator, generator, dan harness eval AI-SPEC §4. Plan 013 dan 014.
- **M10 (skenario demo): DITERIMA dengan batasan**: bukan modul kode baru, melainkan integrasi (DEMO.md + skrip `demo-reset`/`demo-up`/`xt demo step`) di atas API M06 dan API skenario M09; pemilik `devops`, ukuran S–M, plan di MS4; dilarang menduplikasi logika skenario.
- [ASUMSI] D1 ambang + histeresis dan D6 offline dijalankan alerter (Node), bukan service AI; AI-SPEC D1/D6 menjadi acuan parameter. Rekomendasi A (alert klasik hidup tanpa AI, selaras saklar darurat AI-SPEC §7). B: semua detektor di service AI. Perlu konfirmasi AI Engineer.
- [ASUMSI] Debounce default 2 pembacaan (PRD) bukan 3 (AI-SPEC); dapat diubah per zona. Rekomendasi A: ikut PRD untuk demo.
- [ASUMSI] "Mode observasi" (PRD) = "shadow" (AI-SPEC) = satu flag `tenant.observation_mode`, hanya berlaku pada alert `source=anomaly`. Rekomendasi A.
- [ASUMSI] Satu bot Telegram untuk semua tenant, isolasi lewat `chat_id` per tenant dan verifikasi callback. B: bot per tenant, ditolak untuk demo.
- [ASUMSI] Akses lintas tenant dijawab 404/daftar kosong; 403 hanya untuk peran kurang. Rekomendasi A.
- [BLOKIR lama] Repo kode: ditangani plan 010 sebagai git lokal di `companies/xavortree/code/monitoring-gudang/` sampai CEO memberi remote (lihat TDD §6).
