# Test Plan — Plan 015
Perusahaan: Xavortree | Project: gocean-b2b | Ronde: 1 | Penguji: QA (Dewi)

## Lingkungan
- OS: macOS (Darwin arm64)
- Runtime: Node.js v24.15.0, pnpm 12.6.0
- Container: Docker Engine 29.4.0 (OrbStack), Docker Compose v5.1.2
- Tools: git, curl, make

## Data uji
- File konfigurasi: `.env` (disalin dari `.env.example`)
- Target compose: `postgres:16.6-alpine`, `minio/minio:RELEASE.2024-11-07T00-52-20Z`, `axllent/mailpit:v1.21.5`, `minio/mc:RELEASE.2024-11-05T11-08-13Z`, `node:22-alpine`, `nginx:1.27-alpine`
- Skema database: `0001_extensions_schemas_roles.sql` (`pgcrypto`, `citext`, schema `core`, `audit`, `jobs`, role `app_owner`, `app_ops`, `app_fin`, `app_report`)
- Object storage: MinIO bucket `gocean-dev-files` (privat)
- Worker job: `system.heartbeat` (jadwal cron 1 menit)

## Kasus uji
| ID | AC | Langkah | Hasil diharapkan |
|---|---|---|---|
| TC-01 | AC1 | Bersihkan container/volume lama, jalankan `cp .env.example .env && make up`, pantau `docker compose ps` | Dalam ≤5 menit, service `postgres`, `minio`, `mailpit`, `api`, `worker`, `web` berstatus `healthy`; `migrate` dan `minio-init` exit dengan kode 0 |
| TC-02 | AC2 | 1. `curl http://localhost:8080/healthz`<br>2. `curl http://localhost:8080/readyz`<br>3. `docker compose stop postgres`<br>4. `curl http://localhost:8080/readyz`<br>5. `curl http://localhost:8080/healthz`<br>6. Nyalakan kembali postgres | Langkah 1 & 2 mengembalikan HTTP 200.<br>Langkah 4 mengembalikan HTTP 503.<br>Langkah 5 tetap mengembalikan HTTP 200. |
| TC-03 | AC3 | Jalankan kueri SQL via psql superuser:<br>1. `SELECT nspname FROM pg_namespace;`<br>2. `SELECT rolname FROM pg_roles WHERE rolname LIKE 'app_%';`<br>3. `SELECT extname FROM pg_extension;` | 1. Terdapat schema `core`, `audit`, `jobs`.<br>2. Terdapat role `app_owner`, `app_ops`, `app_fin`, `app_report`.<br>3. Terdapat ekstensi `pgcrypto` dan `citext`. |
| TC-04 | AC4 | 1. Buka `http://localhost:3000` via curl / browser, verifikasi teks "Gocean B2B — segera" dan simpan screenshot di `planning/qa/bukti/015/`.<br>2. Request `http://localhost:3000/manifest.webmanifest`. | Halaman web tampil dengan benar memuat "Gocean B2B — segera". File manifest mengembalikan status 200 dengan format JSON valid. |
| TC-05 | AC5 | Biarkan compose berjalan ≥2 menit, lalu jalankan kueri:<br>`SELECT count(*) FROM jobs.job WHERE name='system.heartbeat';` (dan/atau tabel arsip pg-boss). | Jumlah baris count ≥ 1, membuktikan worker memproses job heartbeat. |
| TC-06 | AC6 | Lakukan upload file tanpa kredensial via `curl -X PUT http://localhost:9000/gocean-dev-files/test.txt -d "test"` | Akses ditolak dengan status HTTP 403 Forbidden. |
| TC-07 | AC7 | Jalankan `make ci` di direktori repo `companies/xavortree/code/gocean-b2b` | `pnpm install --frozen-lockfile`, lint, typecheck, dan vitest semua paket berhasil (exit 0) dalam ≤3 menit. |
| TC-08 | AC8 | 1. Periksa `git ls-files` untuk memastikan tidak ada `.env` atau private key `*.key`/`*.pem`.<br>2. Periksa `README.md` memuat prasyarat, perintah Makefile, dan tabel port. | 1. Tidak ada `.env` atau file kunci sensitif yang ter-track.<br>2. Bagian Prasyarat, Perintah Makefile, dan Tabel Port lengkap di README. |
| TC-09 | AC9 | 1. Jalankan `make down && make up`, ukur durasi.<br>2. Jalankan `make db-reset`. | 1. Semua service healthy dalam ≤2 menit.<br>2. Volume DB dihapus, container dibuat ulang, migrasi 0001 berjalan ulang tanpa error. |
