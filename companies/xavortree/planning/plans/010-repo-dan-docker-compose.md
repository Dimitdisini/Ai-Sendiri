# Plan 010 — repo-dan-docker-compose
Perusahaan: Xavortree | Modul: M01 Fondasi (MS0) | Ukuran: M | Status: Siap | Pemilik: devops

## Tujuan
Repo kode monitoring-gudang ada dan `make up` menyalakan TimescaleDB, Mosquitto (dynamic security + TLS), migrasi kosong, dan kerangka semua service dengan healthcheck, sehingga plan 011–014 punya tempat bekerja.

## Scope
### Termasuk
- Inisialisasi git lokal di `companies/xavortree/code/monitoring-gudang/` (lihat [ASUMSI] TDD §6) dengan struktur monorepo TDD §1: `apps/{api,ingest,alerter,web}`, `services/anomaly`, `tools/{simcore,dataset,simulator}`, `firmware/`, `db/{migrations,seed,tests}`, `deploy/`, `packages/shared`, `docs/`.
- `deploy/docker-compose.yml`: `timescaledb` (image timescale/timescaledb, PG16), `mosquitto` (2.x), `migrate` (dbmate one-shot), `api`, `ingest`, `alerter`, `anomaly`, `web`; profile `sim` (`simulator`), profile `obs` (`prometheus`, `grafana`). Healthcheck tiap service, `depends_on` `service_healthy`, port host sesuai TDD §6.
- Mosquitto: `deploy/mosquitto/mosquitto.conf` (listener 8883 TLS, listener 1883 hanya jaringan compose, `allow_anonymous false`, plugin dynamic security), `deploy/mosquitto/init-dynsec.sh` membuat `dynsec.json` dari env (`dynsec-admin`, `svc-ingest` dengan subscribe `t/#`), `deploy/certs/gen.sh` (CA + server cert self-signed, dev).
- Migrasi `db/migrations/0001_extensions_roles.sql`: `timescaledb`, `pgcrypto`, role `app_owner`, `app_api`, `app_ingest`, `app_anomaly`, `app_admin` (BYPASSRLS) dengan password dari env.
- Placeholder service: tiap app Node (Fastify + TS) dan Python menjawab `/healthz` 200; `web` nginx menyajikan halaman "Monitoring Gudang — segera"; `simulator` placeholder `/healthz`.
- `.env.example` (semua variabel TDD §5), `.gitignore` (`.env`, `deploy/certs/*.key`, `node_modules`, `.venv`), `Makefile` (`up`, `down`, `logs`, `ci`, `test-rls` stub, `demo-reset`, `demo-up`, `sim-up`), `README.md` (prasyarat, perintah, port), konfigurasi lint (eslint + prettier, ruff), pytest dan vitest placeholder.
### Tidak termasuk
Skema tabel dan RLS (011), endpoint API dan provisioning dynsec (012), simcore/generator (013), simulator (014), firmware (M02), remote git dan CI hosted (menunggu CEO).

## Acceptance criteria
AC1. Diberikan mesin dengan Docker ≥24 dan Compose v2 tanpa state lama, ketika `cp .env.example .env && make up`, maka dalam ≤5 menit `docker compose ps` menampilkan `timescaledb`, `mosquitto`, `api`, `ingest`, `alerter`, `anomaly`, `web` berstatus `healthy` dan `migrate` keluar dengan kode 0.
AC2. Diberikan compose jalan, ketika `mosquitto_pub -h localhost -p 8883 --cafile deploy/certs/ca.crt -t t/x/y/data -m '{}'` tanpa kredensial, maka koneksi ditolak (`not authorised`), dan port 1883 tidak dapat diakses dari host.
AC3. Diberikan `mosquitto_ctrl dynsec createClient qa1` + role dengan ACL publish `t/demo/qa1/#` dijalankan saat broker hidup, ketika `qa1` publish ke `t/demo/qa1/data`, maka diterima; publish ke `t/demo/lain/data` ditolak; uptime broker (`$SYS/broker/uptime`) tidak reset (tanpa restart).
AC4. Diberikan compose jalan, ketika `psql` sebagai `app_owner` menjalankan `SELECT extname FROM pg_extension` dan `SELECT rolname FROM pg_roles`, maka `timescaledb`, `pgcrypto` dan lima role TDD §3 ada; hanya `app_admin` yang `rolbypassrls`.
AC5. Diberikan compose jalan, ketika `make down && make up`, maka semua service healthy ≤2 menit; ketika `make demo-reset`, maka volume DB dihapus dan naik kembali bersih tanpa error.
AC6. Diberikan repo, ketika `git ls-files`, maka tidak memuat `.env` maupun `deploy/certs/*.key`, dan `README.md` memuat prasyarat, perintah Makefile, daftar port.
AC7. Diberikan repo bersih, ketika `make ci`, maka lint dan test placeholder (vitest, pytest) berjalan dan keluar 0 dalam ≤3 menit.

## Catatan teknis
Referensi TDD §1, §4 (Mosquitto), §6, §7. Password `dynsec-admin` dan `svc-ingest` dari `.env`; `init-dynsec.sh` idempotent (tidak menimpa `dynsec.json` yang sudah ada). `timescaledb` bind `127.0.0.1:5432` saja. Jangan menaruh rahasia di image. Struktur folder dan nama service adalah kontrak untuk plan berikutnya; perubahan nama wajib dicatat di handback.

## Handback (diisi Developer)
Tanggal | File diubah | Cara menjalankan | Belum selesai | Catatan untuk QA

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
