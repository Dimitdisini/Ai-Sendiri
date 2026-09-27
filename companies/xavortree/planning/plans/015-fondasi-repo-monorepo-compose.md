# Plan 015 — fondasi-repo-monorepo-compose
Perusahaan: Xavortree | Project: gocean-b2b | Modul: Fondasi (Scope 1) | Ukuran: M | Status: Siap | Pemilik: devops

## Tujuan
Repo `gocean-b2b` ada sebagai monorepo TypeScript dan `make up` menyalakan PostgreSQL 16, MinIO, Mailpit, migrasi, serta kerangka `api`, `worker`, `web` yang sehat, sehingga plan 016-022 punya tempat bekerja.

## Scope
### Termasuk
- `git init` lokal di `companies/xavortree/code/gocean-b2b/` (A26, tanpa remote, tanpa push).
- Monorepo pnpm workspaces sesuai TDD §1: `apps/{api,worker,web}`, `packages/{shared,db,ui}`, `db/{migrations,seed,tests}`, `deploy/`, `docs/`. Folder `apps/{fin,fin-worker,web-fin}` BELUM dibuat (Scope 2).
- `apps/api`: NestJS 11 + adapter Fastify, `GET /healthz` 200 (proses hidup), `GET /readyz` 200 bila DB terjangkau (503 bila tidak), `GET /metrics` (prom-client), log JSON pino dengan `request_id`.
- `apps/worker`: proses Node + pg-boss terhubung (schema `jobs`), 1 job contoh `system.heartbeat` tiap 1 menit, endpoint health `:8082/healthz`.
- `apps/web`: React 18 + Vite + vite-plugin-pwa, halaman "Gocean B2B — segera" dengan manifest PWA; build statis disajikan nginx di container.
- `packages/shared` (zod terpasang, file `errors.ts` berisi kode error FD §7.1), `packages/db` (Kysely + konfigurasi kysely-codegen), `packages/ui` (kosong + 1 komponen Button).
- `deploy/docker-compose.yml`: `postgres` (postgres:16, bind `127.0.0.1:5432`), `migrate` (dbmate one-shot), `minio` + `minio-init` (buat bucket `gocean-dev-files`, privat), `mailpit` (1025/8025), `api` (8080), `worker`, `web` (3000). Healthcheck tiap service, `depends_on` `service_healthy`/`service_completed_successfully`.
- Migrasi `db/migrations/0001_extensions_schemas_roles.sql`: ekstensi `pgcrypto`, `citext`; schema `core`, `audit`, `jobs`; role `app_owner`, `app_ops`, `app_fin`, `app_report` (password dari env via skrip terpisah, pola plan 010). `app_fin` belum diberi GRANT apa pun.
- `.env.example` (semua variabel, tanpa nilai rahasia), `.gitignore` (`.env`, `node_modules`, `dist`, kunci), `Makefile` (`up`, `down`, `logs`, `ps`, `ci`, `db-reset`, `migrate`, `seed`, `psql`), `README.md` (prasyarat, perintah, tabel port TDD §6.1), eslint + prettier, vitest placeholder per paket, `tsconfig.base.json`.
### Tidak termasuk
Tabel bisnis (016), endpoint auth (017), CI hosted & remote git (menunggu CEO), deploy UAT (plan 028), Scope 2.

## Acceptance criteria
AC1. Diberikan mesin dengan Docker/OrbStack dan Compose v2 tanpa state lama, ketika `cp .env.example .env && make up`, maka dalam ≤5 menit `docker compose ps` menampilkan `postgres`, `minio`, `mailpit`, `api`, `worker`, `web` berstatus healthy, serta `migrate` dan `minio-init` keluar dengan kode 0.
AC2. Diberikan compose jalan, ketika `curl localhost:8080/healthz` dan `curl localhost:8080/readyz`, maka keduanya 200; ketika `docker compose stop postgres` lalu `curl localhost:8080/readyz`, maka 503 dan `/healthz` tetap 200.
AC3. Diberikan compose jalan, ketika `make psql` menjalankan `SELECT nspname FROM pg_namespace` dan `SELECT rolname FROM pg_roles WHERE rolname LIKE 'app_%'`, maka schema `core`, `audit`, `jobs` dan role `app_owner`, `app_ops`, `app_fin`, `app_report` ada; `SELECT extname FROM pg_extension` memuat `pgcrypto` dan `citext`.
AC4. Diberikan compose jalan, ketika membuka `http://localhost:3000`, maka halaman "Gocean B2B — segera" tampil dan `/manifest.webmanifest` tersaji (status 200, JSON valid).
AC5. Diberikan compose jalan 2 menit, ketika `SELECT count(*) FROM jobs.job WHERE name='system.heartbeat'` (atau tabel arsip pg-boss), maka ≥1 (worker benar-benar memproses job).
AC6. Diberikan compose jalan, ketika mengunggah file ke bucket `gocean-dev-files` tanpa kredensial (akses anonim), maka ditolak (403).
AC7. Diberikan repo bersih, ketika `make ci`, maka `pnpm install --frozen-lockfile`, lint, typecheck, dan test placeholder semua paket keluar 0 dalam ≤3 menit.
AC8. Diberikan repo, ketika `git ls-files`, maka tidak memuat `.env` atau file kunci; README memuat prasyarat, perintah Makefile, dan tabel port.
AC9. Diberikan compose jalan, ketika `make down && make up`, maka semua healthy ≤2 menit; ketika `make db-reset`, maka volume DB dihapus, migrasi 0001 jalan ulang tanpa error.

## Catatan teknis
Referensi TDD §1, §2, §6.1. Pola plan 010 (sudah PASS bersyarat) boleh ditiru: migrasi 0001 dijalankan superuser, migrasi berikut diawali `SET ROLE app_owner;`. Tag image dikunci (postgres:16.x, minio RELEASE tertentu, node:22-alpine, nginx:1.27-alpine). Struktur folder, nama service, dan port adalah kontrak plan berikutnya; perubahan wajib dicatat di handback. Kalau Docker tidak tersedia saat QA, ikuti sop-qa-tanpa-alat.

## Handback (diisi Developer)
Tanggal | File diubah | Cara menjalankan | Belum selesai | Catatan untuk QA

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
