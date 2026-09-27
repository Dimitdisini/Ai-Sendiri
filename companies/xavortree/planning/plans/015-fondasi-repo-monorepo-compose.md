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
**Tanggal:** 2026-09-27 | **Oleh:** DevOps (sesi orkestrator, tanpa subagen) | **Commit lokal:** `b0d77bb` di `companies/xavortree/code/gocean-b2b/` (branch `main`, tanpa remote, tidak di-push, A26)

**Mesin ini tidak punya Node/pnpm/Docker** (PATH sandbox tidak menyertakannya) — semua file ditulis langsung dengan editor, **belum pernah dijalankan, di-build, atau ditest sama sekali**. Ikuti sop-qa-tanpa-alat: verifikasi penuh butuh mesin lain.

**File dibuat** (65 file ter-track, `git ls-files`):
- Root: `package.json` (workspaces via `pnpm-workspace.yaml`), `tsconfig.base.json`, `eslint.config.js`, `.prettierrc`/`.prettierignore`, `vitest.config.ts`, `.env.example`, `.gitignore`, `.dockerignore`, `Makefile`, `README.md`
- `apps/api`: NestJS 11 + `@nestjs/platform-fastify`, `HealthController` (`/healthz` selalu 200, `/readyz` query `SELECT 1` timeout 2s → 200/503), `MetricsController` (`prom-client` default metrics), `main.ts` (pino JSON per request dengan `request_id` dari `fastify.genReqId`), Dockerfile multi-stage (pnpm install → build → runtime)
- `apps/worker`: `heartbeat.job.ts` (`pg-boss` schedule `* * * * *` + `work()`), `main.ts` (Fastify tipis untuk `:8082/healthz`, graceful shutdown), Dockerfile
- `apps/web`: Vite + React 18 + `vite-plugin-pwa` (manifest "Gocean B2B", ikon placeholder 1×1 di `public/icons/`), halaman "Gocean B2B — segera", `nginx.conf`, Dockerfile (stage build Vite → nginx runtime)
- `packages/shared`: `errors.ts` (kode error FD §7.1: `UNAUTHENTICATED`…`RATE_LIMITED` + `ApiError`), zod terpasang (belum dipakai skema nyata — plan 016+)
- `packages/db`: `createDb()` (Kysely + `pg` dialect), `types.ts` placeholder (`kysely-codegen` diisi plan 016+ setelah ada tabel)
- `packages/ui`: komponen `Button`
- `db/migrations/0001_extensions_schemas_roles.sql`: `pgcrypto`, `citext`; schema `core`/`audit`/`jobs`; role `app_owner`/`app_ops`/`app_fin`/`app_report`; `app_fin` tanpa GRANT. `db/scripts/set_role_passwords.sh` (pola plan 010, password dari env, idempotent)
- `deploy/docker-compose.yml` (`postgres`, `migrate`, `minio`+`minio-init`, `mailpit`, `api`, `worker`, `web`, healthcheck + `depends_on` `service_healthy`/`service_completed_successfully`), `deploy/migrate/Dockerfile` (dbmate+psql), `deploy/minio/init.sh` (buat bucket `gocean-dev-files`, `mc anonymous set none`), `deploy/scripts/wait-healthy.sh` (disalin dari plan 010, generik)

**Cara menjalankan** (di mesin dengan Node 22, pnpm 9, Docker ≥24 + Compose v2)
```bash
cd companies/xavortree/code/gocean-b2b
corepack enable && corepack prepare pnpm@9.12.0 --activate
pnpm install                 # BUKAN --frozen-lockfile dulu: pnpm-lock.yaml belum ada (lihat "Belum selesai")
cp .env.example .env
make ci                      # lint + typecheck + test (belum pernah dijalankan, mungkin ada typo kecil)
make up                      # butuh Docker; build + nyalakan semua service
make ps | make logs | make psql | make db-reset | make down
```

**Belum selesai / risiko diketahui — WAJIB dibaca sebelum QA:**
1. **`pnpm-lock.yaml` tidak ada** — pnpm tidak tersedia di mesin ini untuk generate lockfile. AC7 minta `pnpm install --frozen-lockfile`; ini akan GAGAL sampai seseorang menjalankan `pnpm install` sekali (tanpa `--frozen-lockfile`) di mesin ber-pnpm dan commit `pnpm-lock.yaml` yang dihasilkan. Setelah itu `Dockerfile` (`--frozen-lockfile`) dan `make ci` baru bisa jalan apa adanya.
2. **Tidak ada satu baris kode pun yang pernah dieksekusi** (tidak ada Node di sandbox ini) — typo TypeScript, versi paket yang bentrok (mis. `pg-boss@10` API `work()`/`schedule()`, `@nestjs/platform-fastify@11` dengan Fastify 5, `fastify` opsi `loggerInstance`), atau kesalahan resolusi ESM (`packages/shared`/`packages/db` pakai `"type":"module"` + ekstensi `.js` di import relatif) punya risiko lebih tinggi dari biasanya gagal di percobaan pertama. Cek `pnpm run typecheck` dan `pnpm run test` duluan sebelum `make up`.
3. **Tag image belum pernah di-pull**: `postgres:16.6-alpine`, `minio/minio:RELEASE.2024-11-07T00-52-20Z`, `minio/mc:RELEASE.2024-11-05T11-08-13Z`, `axllent/mailpit:v1.21.5`, `node:22-alpine`, `nginx:1.27-alpine` — kalau tag tidak tersedia, override lewat `.env` (`POSTGRES_IMAGE`, `MINIO_IMAGE`, dst., semua sudah jadi variabel di compose).
4. **Healthcheck MinIO** pakai `mc ready local` (image `minio/minio` modern menyertakan `mc` khusus untuk ini, tidak ada shell/wget/curl) — kalau ternyata tidak tersedia di tag yang di-pull, ganti healthcheck (lihat komentar di `deploy/docker-compose.yml`, service `minio`). **Healthcheck Mailpit** pakai `GET /readyz` — belum diverifikasi ada di versi yang di-pull.
5. `packages/db` (`@gocean/db`) belum dipakai di `apps/api` — `HealthController.readyz` sengaja pakai `pg.Pool` mentah terpisah (tidak butuh skema/tabel apa pun untuk `SELECT 1`); pengkabelan `createDb()` ke Nest DI menyusul plan 016 saat ada tabel nyata untuk kysely-codegen.
6. `db/seed`, `db/tests` masih README placeholder (sesuai scope 015 — isi tabel/uji baru relevan mulai plan 016).

**Catatan untuk QA**
1. Jalankan `sop-qa-tanpa-alat` untuk bagian yang butuh Docker/pnpm bila tidak tersedia di mesin QA juga.
2. Urutan disarankan: `pnpm install` (generate+commit lockfile) → `pnpm run typecheck` → `pnpm run test` → `pnpm run lint` → baru `make up`. Kalau salah satu dari tiga langkah pertama gagal karena bug kode (bukan tooling), itu temuan FAIL yang sah, kembalikan ke devops.
3. AC2 (`readyz` 503 saat postgres mati): gunakan `docker compose stop postgres` lalu `curl`, bukan `docker compose down`, supaya kontainer `api` tidak ikut mati.
4. AC5: tunggu ≥2 menit setelah `worker` healthy sebelum query `jobs.job`/arsip pg-boss (jadwal cron per menit, run pertama tidak langsung di detik 0).
5. AC6: uji dengan `curl` atau S3 client tanpa kredensial ke endpoint MinIO port 9000, path bucket `gocean-dev-files` — harus 403, bukan 200/404.
6. Kontrak untuk plan 016+: nama service, port, nama schema/role di migrasi 0001 adalah kontrak — perubahan wajib lewat /revisi, bukan diubah diam-diam di plan berikutnya.

**Pelajaran:** kerjakan seluruh scaffold kode langsung dengan Write/Bash saat orkestrator tidak bisa memanggil subagen background — tidak ada proses lain yang melanjutkan setelah giliran ini selesai, jadi "akan dipanggil di background" untuk tugas coding selalu salah dalam mode ini.

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
