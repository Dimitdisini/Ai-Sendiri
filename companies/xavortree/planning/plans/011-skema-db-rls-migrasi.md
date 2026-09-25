# Plan 011 — skema-db-rls-migrasi
Perusahaan: Xavortree | Modul: M01 Fondasi (MS0) | Ukuran: M | Status: Siap | Pemilik: backend

## Tujuan
Semua tabel FD §3 tersedia lewat migrasi SQL: hypertable `reading`, RLS FORCE per tenant, continuous aggregate + retention + kompresi, tabel kebutuhan AI-SPEC (`anomaly_event`, `alert_feedback`, `detector_config`, feature flag tenant), seed demo 2 tenant, dan uji RLS otomatis yang bisa dijalankan QA.

## Scope
### Termasuk
- Migrasi dbmate `0002`–`0006` sesuai TDD §3: `tenant` (termasuk `observation_mode`, `flags jsonb`), `app_user`, `zone`, `threshold_config`, `device`, `device_status`, `telegram_channel`, `reading` (hypertable, index, kompresi 7 hari, retention 12 bulan), `alert`, `alert_delivery`, `anomaly_event`, `alert_feedback`, `detector_config` (validasi `params` per detektor lewat CHECK/JSON schema minimal), `service_heartbeat`; enum sesuai FD §3.
- RLS: `ENABLE` + `FORCE` + policy `tenant_isolation` (USING dan WITH CHECK) pada semua tabel tenant; GRANT minimum per role `app_api`, `app_ingest`, `app_anomaly` (TDD §3); `app_admin` BYPASSRLS.
- Cagg `reading_1m`, `reading_1h` + refresh policy; view `security_barrier` `v_reading_1m`, `v_reading_1h` berfilter `current_setting('app.tenant_id', true)`.
- Fungsi `notify_rt()` trigger pada `device_status` dan `alert` (NOTIFY `rt`), trigger `device_changed` pada `device` (untuk registry ingest).
- `db/seed/demo.sql`: tenant `demo-a` (zona `rantai-dingin` 2–8 °C, `gudang-kering` ≤30 °C RH ≤65 %), `demo-b` (1 zona `gudang-kering`), 1 admin Xavortree (tenant NULL), 2 user per tenant (supervisor, operator), 3 device per tenant (`kind` virtual, 1 fisik di `demo-a`), `detector_config` default AI-SPEC §3.1 per zona, password seed dari `.env`.
- `db/tests/rls.sql` + `make test-rls`: skenario AC2–AC5 sebagai skrip psql yang keluar non-0 bila gagal.
### Tidak termasuk
Endpoint API dan login (012), provisioning dynsec (012), job baseline D3 (MS1, ai-engineer), migrasi `down` untuk produksi.

## Acceptance criteria
AC1. Diberikan `make demo-reset`, ketika selesai, maka migrasi 0001–0006 dan seed berjalan tanpa error, `\dt` menampilkan semua tabel FD §3, dan `SELECT * FROM timescaledb_information.hypertables` memuat `reading`.
AC2. Diberikan sesi `app_api` dengan `SET app.tenant_id = <id demo-a>`, ketika `SELECT count(*) FROM device`, maka hasilnya = jumlah device `demo-a` saja; ketika `INSERT INTO device (... tenant_id = <id demo-b> ...)`, maka ditolak dengan pelanggaran policy.
AC3. Diberikan sesi `app_api` tanpa `app.tenant_id`, ketika `SELECT` ke `device`, `alert`, `reading`, `v_reading_1m`, maka 0 baris (bukan error, bukan semua baris).
AC4. Diberikan sesi `app_ingest` dengan tenant `demo-a`, ketika `INSERT INTO reading` dan `UPDATE device_status` device `demo-a`, maka berhasil; ketika `INSERT reading` untuk device `demo-b`, maka ditolak; ketika `SELECT FROM alert`, maka `permission denied`.
AC5. Diberikan sesi `app_anomaly` dengan tenant `demo-a`, ketika `SELECT` `reading`, `v_reading_1h`, `detector_config`, `threshold_config` dan `INSERT anomaly_event`, maka berhasil hanya untuk `demo-a`; ketika `INSERT alert`, maka `permission denied`.
AC6. Diberikan DB termigrasi, ketika `SELECT * FROM timescaledb_information.jobs`, maka ada retention policy 12 bulan dan compression policy 7 hari untuk `reading` serta refresh policy `reading_1m` dan `reading_1h`.
AC7. Diberikan seed, ketika diperiksa, maka ada 2 tenant, 1 admin, 4 user tenant, 3 zona dengan `threshold_config` sesuai preset, 6 device, dan `detector_config` D2–D5 per zona; `make test-rls` mencetak ringkasan PASS dan keluar 0.
AC8. Diberikan migrasi sudah jalan, ketika `dbmate up` dijalankan lagi, maka tidak ada error dan tidak ada perubahan.

## Catatan teknis
Referensi FD §3, TDD §3, AI-SPEC §3.1 (default detektor) dan "Kebutuhan ke peran lain" (tabel `anomaly_event`, `alert_feedback`, konfigurasi detektor JSON per zona, feature flag per tenant). RLS pada cagg tidak diandalkan; view `security_barrier` wajib. Semua `tenant_id` `NOT NULL` kecuali `app_user.tenant_id` (admin). Trigger NOTIFY memuat payload ringkas (<8 KB). File: `db/migrations/000[2-6]_*.sql`, `db/seed/demo.sql`, `db/tests/rls.sql`, `Makefile` target `test-rls`.

## Handback (diisi Developer)
Tanggal | File diubah | Cara menjalankan | Belum selesai | Catatan untuk QA

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
