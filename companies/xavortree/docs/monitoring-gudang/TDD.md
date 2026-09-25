# TDD — Monitoring Gudang Pintar
Perusahaan: Xavortree | Pemilik: Analyst (Bima); bagian AI: AI Engineer (Naya) lewat AI-SPEC v0.1 | Turunan dari: FD.md v0.1 | Status: Draft, menunggu review CEO (antrean 30 Sep) | Versi: 0.1 (2026-09-25)

Bagian AI (detektor, eval, biaya LLM) mengikuti AI-SPEC v0.1 dan tidak diulang di sini. Kebutuhan AI-SPEC ke Backend dan Data Engineer (konfigurasi detektor JSON per zona, tabel `anomaly_event` dan `alert_feedback`, feature flag per tenant, simulator + generator dataset berlabel + publisher MQTT, harness eval, job baseline D3) sudah dipetakan ke skema §3, komponen §1, dan plan 011/013/014.

## 1. Arsitektur
Satu monorepo, Docker Compose lokal, Postgres/TimescaleDB sebagai satu-satunya state bersama; tidak ada Redis/queue eksternal.
| Komponen | Teknologi | Tanggung jawab |
|---|---|---|
| `apps/api` | Node.js 22 + TypeScript + Fastify | REST FD §4, auth JWT, konteks tenant (`SET LOCAL app.tenant_id`), SSE `/stream` (LISTEN `rt`), endpoint admin + provisioning dynsec, `/internal/*`, CLI `xt`, `/healthz` `/readyz` `/metrics` |
| `apps/ingest` | Node.js | subscriber MQTT `t/+/+/data|hb` sebagai `svc-ingest`, validasi (registry cache + JSON schema), batch insert `reading` per tenant, upsert `device_status`, job offline, NOTIFY `rt` |
| `apps/alerter` | Node.js | rule ambang D1 + histeresis + debounce, alert offline D6, antrean `alert_delivery` → Telegram (long polling), callback Ack/feedback, stub `explain(event)` (LLM OFF) |
| `apps/web` | React 18 + Vite + ECharts, disajikan nginx | L1–L6 FD §1, bahasa Indonesia, Chrome desktop |
| `services/anomaly` | Python 3.12, numpy/pandas, psycopg | D2–D5 AI-SPEC §3.1 tiap 60 s per tenant, tulis `anomaly_event`, kirim `POST /internal/alerts`; baca `detector_config`, `threshold_config`, `tenant.observation_mode` |
| `tools/simcore` | Python | model termal orde-1, noise AR(1), korelasi zona, injeksi kejadian berlabel (AI-SPEC §3.4); dipakai generator, simulator, harness eval |
| `tools/dataset`, `tools/simulator` | Python | generator CSV/Parquet berlabel (F03); publisher MQTT N node virtual + HTTP kontrol skenario (F02) |
| `firmware/` | PlatformIO, ESP32 Arduino, SHT31, MQTT TLS | F04; kontrak payload FD §4 |
| `db/` | SQL (dbmate) | migrasi, seed demo, uji RLS |
| `deploy/` | docker-compose.yml, mosquitto/, certs/, Makefile | §6 |

Aliran: perangkat/simulator → Mosquitto (8883 TLS untuk fisik, 1883 internal untuk simulator) → ingest → TimescaleDB → (NOTIFY) → api SSE → web. Alerter dan anomaly membaca DB, menulis `alert`/`anomaly_event`; hanya alerter yang bicara ke Telegram. api adalah satu-satunya yang bicara ke dynsec (`$CONTROL/dynamic-security/v1`). Semua proses Node berbagi paket `packages/shared` (schema payload, tipe, klien DB dengan helper tenant).

## 2. Stack dan alasan
Node.js 22 LTS + Fastify (ringan, satu bahasa dengan web; NestJS terlalu berat untuk 4–10 orang). Python 3.12 hanya untuk anomali dan simcore (numpy, sesuai AI-SPEC). TimescaleDB 2.x di PostgreSQL 16 (hypertable, continuous aggregate, retention, compression). Mosquitto 2.x + plugin dynamic security bawaan. Telegram Bot API via long polling. React + Vite + ECharts (grafik time-series ringan). dbmate untuk migrasi SQL murni. pino / structlog log JSON, prom-client / prometheus_client metrik. Docker Compose v2. Semua tersedia gratis dan berjalan di laptop/mini PC.

## 3. Skema data dan migrasi
Entitas dan kolom di FD §3. Ketentuan teknis:
- `reading`: `create_hypertable('reading','time', chunk_time_interval => interval '1 day')`; index `(tenant_id, device_id, time DESC)`; kompresi setelah 7 hari `segmentby tenant_id, device_id`; `add_retention_policy('reading', interval '12 months')`. Continuous aggregate `reading_1m` dan `reading_1h` (avg/min/max temp dan rh per device) dengan refresh policy lag 1 menit / 1 jam; `reading_1h` juga sumber baseline D3 (median/MAD per sensor per jam-hari dihitung service anomali dari cagg, bukan job DB terpisah di v1).
- RLS pola untuk semua tabel tenant: `ENABLE` + `FORCE ROW LEVEL SECURITY`; `CREATE POLICY tenant_isolation ON <t> USING (tenant_id = current_setting('app.tenant_id', true)::uuid) WITH CHECK (sama)`. Tanpa setting → `NULL` → 0 baris, bukan error. [ASUMSI] RLS pada continuous aggregate tidak dijamin TimescaleDB → akses cagg hanya lewat view `security_barrier` `v_reading_1m`/`v_reading_1h` yang memfilter `tenant_id = current_setting(...)`, dan api tetap menambah filter eksplisit.
- Peran DB: `app_owner` (migrasi, pemilik objek), `app_api` (RLS; SELECT/INSERT/UPDATE sesuai FD §3), `app_ingest` (RLS; INSERT `reading`, UPDATE `device_status`, SELECT `device`, `tenant`), `app_anomaly` (RLS; SELECT `reading`, cagg view, `device`, `zone`, `threshold_config`, `detector_config`, `tenant`; INSERT `anomaly_event`), `app_admin` (BYPASSRLS; hanya endpoint `/admin`, CLI, seed). Ingest dan anomali bekerja per tenant dengan `SET LOCAL app.tenant_id` — tidak ada service yang membaca lintas tenant selain `app_admin`.
- `detector_config.params jsonb` divalidasi JSON schema per detektor (D2–D5, dari AI-SPEC §3.1 default per preset zona); `tenant.flags jsonb` menampung feature flag (`llm_explain:false`, cadangan lain); `tenant.observation_mode` kolom eksplisit karena dibaca tiap alert.
- `alert_feedback` dan `anomaly_event` disimpan minimal 12 bulan (tidak ada retention) sebagai bahan label AI-SPEC Tahap 4.
- Migrasi (dbmate, forward-only, satu file per topik): `0001_extensions_roles`, `0002_tenant_user_zone_device_telegram`, `0003_reading_hypertable_device_status`, `0004_threshold_alert_delivery_feedback_anomaly_detector_heartbeat`, `0005_rls_policies_grants`, `0006_cagg_views_retention_compression`. Seed `db/seed/demo.sql` (2 tenant, preset zona, user, device) dijalankan oleh `make demo-reset`, bukan migrasi. Uji `db/tests/rls.sql` dijalankan `make test-rls` (exit 0 = PASS). Rollback DB di demo = `demo-reset`; migrasi `down` hanya untuk dev.

## 4. Integrasi eksternal
| Layanan | Autentikasi | Batas / perilaku | Fallback bila down |
|---|---|---|---|
| Mosquitto 2.x (dynsec) | Perangkat: user/pass per device + TLS 8883 (CA dev self-signed dari `deploy/certs/gen.sh`, disematkan di firmware). Service: `svc-ingest` (subscribe `t/#`), `dynsec-admin` (api saja). Simulator memakai kredensial device di 1883 jaringan internal compose. | Provisioning: api publish `createClient`/`createRole`/`disableClient`/`deleteClient` ke `$CONTROL/dynamic-security/v1`, balasan di `$CONTROL/dynamic-security/v1/response`, timeout 3 s → 503. Role per device: publish `t/{tenant}/{device}/#`, subscribe `t/{tenant}/{device}/cmd`. | Ingest reconnect backoff 1 s → 30 s; `service_heartbeat.info.broker_connected=false` → alerter menahan alert offline (hindari badai). Perangkat retry; buffer offline F13 menyusul. |
| Telegram Bot API | Token bot di env `TELEGRAM_BOT_TOKEN`, satu bot semua tenant; `chat_id` per tenant di `telegram_channel`. | `getUpdates` long polling timeout 30 s (tanpa URL publik). Rate: 30 msg/s global, ±20 msg/menit per grup → pengirim antrean ≤1 msg/3 s per chat; HTTP 429 → hormati `retry_after`. Retry backoff 5 s ×2 hingga 30 menit, lalu `failed`. `sendMessage` (parse_mode HTML, nama disanitasi) + inline keyboard; `editMessageText` saat Ack. Callback diverifikasi `chat_id` vs tenant alert. | Alert tetap di dashboard berlabel "belum terkirim"; L6 merah; tenant tanpa `chat_id` → dashboard saja. |
| NTP (`pool.ntp.org`) | — | firmware sinkron saat boot dan tiap 6 jam | `ts:null` → server memakai `received_at` |
| LLM Claude (AI-SPEC §2, §3.3) | API key env, feature flag `tenant.flags.llm_explain` | OFF di rilis ini; antarmuka `explain(event)` di alerter mengembalikan template deterministik | Produk berfungsi penuh tanpa LLM |

## 5. Keamanan
- Autentikasi web: email + password (argon2id), JWT HS256 (`JWT_SECRET` env) kedaluwarsa 12 jam di cookie `httpOnly; SameSite=Lax; Secure` (Secure dimatikan hanya di `localhost`); mutasi wajib header `X-Requested-With` (mitigasi CSRF); rate limit login 10/menit/IP.
- Otorisasi: `role` dan `tenant_id` dari JWT; middleware membuka transaksi dan `SET LOCAL app.tenant_id`; admin harus mengirim `X-Tenant-Id` untuk aksi per tenant dan memakai koneksi `app_admin` hanya di rute `/admin`. Setiap plan backend wajib menyertakan uji isolasi tenant otomatis: user A → data B kosong/404, ack alert B → 404, SSE A tidak menerima event B, SQL langsung sebagai `app_api` dengan tenant A → 0 baris B. QA mengulanginya manual per plan.
- MQTT: TLS 8883 untuk perangkat fisik; 1883 tidak dipublikasikan ke host; anonim ditolak; ACL per device; password acak 24 karakter tampil sekali, tidak disimpan di DB (hash di dynsec); rotasi dan nonaktif lewat admin; `dynsec-admin` dan `svc-ingest` password dari env.
- Rahasia: `.env` di-gitignore, `.env.example` di repo; `deploy/certs/*.key` di-gitignore; token Telegram, `JWT_SECRET`, `INTERNAL_TOKEN`, password DB dan dynsec hanya lewat env. Tidak ada rahasia di gambar Docker.
- Internal: `/internal/*` butuh `INTERNAL_TOKEN` dan hanya dapat diakses dari jaringan compose; HTTP simulator bind `127.0.0.1:8090`.
- Data pribadi: hanya nama Telegram (`first_name`, `@username`) saat Ack/feedback, email user dashboard. Nama zona/device ≤40 karakter, disanitasi (escape HTML) sebelum ke Telegram dan (bila nanti aktif) ke LLM sebagai ID saja (AI-SPEC §3.3, §6).

## 6. Deploy dan lingkungan
- Lingkungan hanya `dev`/`demo` lokal (Docker Compose di laptop atau mini PC Xavortree). Tidak ada staging/prod, VPS, atau deploy produksi (PRD Won't). Keputusan hosting tetap [BLOKIR] pasca demo.
- Compose: `timescaledb`, `mosquitto`, `migrate` (dbmate one-shot), `api`, `ingest`, `alerter`, `anomaly`, `web`; profile `sim`: `simulator`; profile `obs`: `prometheus`, `grafana`. Healthcheck tiap service, `depends_on: condition: service_healthy`. Port host: web 3000, api 8080, mosquitto 8883, simulator 8090 (localhost), db 5432 (localhost, dev saja).
- Perintah: `make up|down|logs|ci|test-rls`, `make demo-reset` (down -v → up → migrate → seed), `make demo-up` (profile sim), `make sim-up`. Gambar dibangun lokal, tag = git SHA; rollback = `git checkout <sha> && make up`; data demo boleh dibuang. Migrasi forward-only.
- Repo: [ASUMSI] git lokal `companies/xavortree/code/monitoring-gudang/` diinisialisasi plan 010 sampai CEO memberi remote (GitHub/GitLab org Xavortree); CI = `make ci` lokal (lint, unit, `test-rls`) hingga remote ada. Rekomendasi: CEO membuat remote di minggu 1.
- Firmware: PlatformIO, `config.h` dari template, CA dev disematkan; flash lewat USB.

## 7. Observabilitas
- Log JSON ke stdout (pino / structlog), field wajib `svc, tenant_id, device_id, alert_id, msg, level`; `docker compose logs` cukup untuk demo.
- Metrik `/metrics` tiap service: `ingest_messages_total{tenant,result}`, `ingest_lag_seconds` (received_at − ts, target p95 ≤5 s), `ingest_batch_seconds`, `devices_online{tenant}`, `alerts_created_total{source,detector}`, `alert_delivery_latency_seconds` (started_at → sent, target p95 ≤60 s), `telegram_send_failures_total`, `anomaly_cycle_seconds`, `sse_clients`. Grafana dashboard tunggal di profile `obs` (opsional).
- Health: `/healthz` (proses) dan `/readyz` (DB + broker); `service_heartbeat` tiap 30 s → L6 merah bila >2 menit tanpa heartbeat atau delivery `failed` >0 dalam 10 menit. Tidak ada paging di demo.
- Uji beban ringan di MS4: simulator 100 node × 2 tenant 10 menit, `ingest_lag` p95 ≤5 s, CPU total <2 core.

## 8. Keputusan teknis
| Keputusan | Alternatif ditolak | Alasan |
|---|---|---|
| Node.js/Fastify untuk api, ingest, alerter; Python hanya anomali + simcore | Semua Python (FastAPI); NestJS | satu bahasa web + backend; AI tetap numpy sesuai AI-SPEC; NestJS berat untuk tim kecil |
| Satu DB TimescaleDB, `tenant_id` + RLS FORCE | schema per tenant; DB per tenant | onboarding = insert baris; cagg/retention satu tempat; RLS diuji QA tiap plan backend |
| Mosquitto 2 + dynamic security bawaan | `password_file` + SIGHUP; plugin mosquitto-go-auth; EMQX | provisioning runtime tanpa restart, tanpa image pihak ketiga; EMQX berat dan PRD menyebut Mosquitto |
| Kredensial MQTT hanya di dynsec, DB simpan username | simpan hash di DB juga | satu sumber kebenaran; rotasi = buat ulang client |
| Realtime via Postgres LISTEN/NOTIFY + SSE | Redis pub/sub; WebSocket; polling | tanpa komponen tambahan; satu arah cukup; volume demo ≤50 msg/s, payload NOTIFY <8 KB |
| Proses terpisah api/ingest/alerter/anomaly dalam satu repo | satu proses monolit | Telegram macet tidak menahan ingest; tetap satu codebase dan satu `compose up` |
| D1 ambang + D6 offline di alerter, D2–D5 di service AI [ASUMSI, konfirmasi AI Engineer] | semua detektor di service AI | alert klasik hidup tanpa AI (saklar darurat AI-SPEC §7); D6 sudah ditandai milik M03/M04 di AI-SPEC |
| Service AI menulis `anomaly_event` lalu `POST /internal/alerts`; aturan alert (dedup, observasi, peleburan zona, delivery) hanya di alerter/api | AI menulis `alert` langsung | satu tempat aturan dan pengiriman; AI bebas vendor dan bisa diganti |
| Migrasi SQL dbmate | migrasi ORM (Prisma/Drizzle) | DDL hypertable, cagg, policy RLS butuh SQL murni; bisa dijalankan tanpa Node |
| Telegram long polling | webhook | demo lokal tanpa URL publik/HTTPS |
| Simulator, generator, harness eval satu paket Python `simcore` | simulator di Node | reproducible per seed, numpy, dipakai eval AI-SPEC §4 |
| `time` = `ts` perangkat bila valid (≤7 hari lampau, ≤2 menit ke depan), `received_at` selalu disimpan, `ts_source` | selalu waktu server | F13 buffer offline butuh waktu asli; `received_at` untuk ukur lag |
| JWT di cookie httpOnly | localStorage | mitigasi XSS; dashboard desktop Chrome |
| Baseline D3 dihitung service AI dari `reading_1h` | job DB terpisah (AI-SPEC menyebut cagg median/MAD) | cagg tidak mendukung agregat median/MAD; hitung di Python dari cagg jam-an lebih sederhana; ai-engineer mengonfirmasi |
