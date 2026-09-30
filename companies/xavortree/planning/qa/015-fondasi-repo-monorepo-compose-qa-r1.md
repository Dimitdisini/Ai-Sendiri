# QA 015 — ronde 1
Tanggal: 2026-09-29 | Penguji: QA (Dewi) | Verdict: FAIL

Objek uji: `companies/xavortree/code/gocean-b2b/` commit `b0d77bb` (branch `main`).
Lingkungan pengujian: macOS (Darwin arm64), Node.js v24.15.0, Corepack pnpm v12.6.0 (shim), Docker v29.4.0 (OrbStack), Docker Compose v5.1.2, Google Chrome Headless.

## Hasil per AC
| AC | Hasil | Bukti (screenshot atau log) |
|---|---|---|
| AC1: `cp .env.example .env && make up` ≤5 menit, service healthy, migrate & minio-init exit 0 | **FAIL** (pada repo bersih) / PASS (pada worktree lokal dirty) | `02-ac1-make-up-clean-repo.log`: Pada clone repo bersih (commit `b0d77bb`), `make up` gagal saat build image kontainer karena Dockerfile menjalankan `RUN pnpm install --frozen-lockfile` namun `pnpm-lock.yaml` tidak ada di repo git. Pada worktree lokal yang memuat `pnpm-lock.yaml` dan patch uncommitted, seluruh service healthy dalam <1 menit. |
| AC2: `/healthz` & `/readyz` 200; saat postgres stop `/readyz` 503 & `/healthz` 200 | **PASS** | `03-ac2-healthz-readyz.log`: Normal: `/healthz` HTTP 200 `{"status":"ok"}`, `/readyz` HTTP 200 `{"status":"ready"}`. Saat postgres stop: `/readyz` HTTP 503 Service Unavailable `{"status":"not_ready"}` dan `/healthz` tetap HTTP 200 `{"status":"ok"}`. |
| AC3: Schema `core`, `audit`, `jobs`; role `app_*`; extension `pgcrypto`, `citext` ada | **PASS** | `04-ac3-db-schemas-roles.log`: `pg_namespace` memuat `core`, `audit`, `jobs`. `pg_roles` memuat `app_fin`, `app_ops`, `app_owner`, `app_report`. `pg_extension` memuat `pgcrypto` dan `citext`. |
| AC4: Web `localhost:3000` "Gocean B2B — segera" dan `/manifest.webmanifest` 200 valid | **PASS** | `web-localhost-3000.png`: Screenshot headless Chrome menampilkan teks "Gocean B2B — segera" dan "Platform B2B hasil laut sedang dibangun." `05-ac4-web-manifest.log`: `/manifest.webmanifest` mengembalikan HTTP 200 dengan JSON valid. |
| AC5: Worker memproses job `system.heartbeat` (count ≥ 1 setelah 2 menit) | **PASS** | `06-ac5-worker-heartbeat.log`: Kueri `SELECT count(*) FROM jobs.job WHERE name='system.heartbeat'` menghasilkan count 5 (state `completed`), pg-boss heartbeat terbukti aktif dan diproses worker. |
| AC6: Upload MinIO `gocean-dev-files` tanpa kredensial ditolak (403) | **PASS** | `07-ac6-minio-anonymous.log`: `curl -X PUT http://localhost:9000/gocean-dev-files/test.txt` tanpa autentikasi menghasilkan HTTP 403 Forbidden (`AccessDenied`). |
| AC7: Repo bersih `make ci` exit 0 ≤3 menit (install, lint, typecheck, test) | **FAIL** (pada repo bersih) / PASS (pada worktree lokal dirty) | `01-ac7-make-ci-clean-repo.log`: Pada clone repo bersih, `pnpm install --frozen-lockfile` gagal dengan `ERR_PNPM_NO_LOCKFILE: Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent`. Pada worktree lokal dengan `pnpm-lock.yaml` dan fix uncommitted, `make ci` keluar kode 0 dalam 12 detik. |
| AC8: `git ls-files` tanpa rahasia; README lengkap (prasyarat, perintah, tabel port) | **PASS** | `08-ac8-git-ls-files-readme.log`: `git ls-files` tidak memuat `.env`, `*.key`, atau `*.pem`. README.md memiliki bagian Prasyarat, Perintah Makefile, dan Tabel Port. |
| AC9: `make down && make up` ≤2 menit healthy; `make db-reset` bersih | **PASS** | `09-ac9-down-up-db-reset.log`: `make down && make up` selesai dalam 51,5 detik (semua healthy). `make db-reset` berhasil menghapus volume DB dan menjalankan ulang migrasi 0001 tanpa error. |

## Temuan (bila FAIL)
| # | Langkah reproduksi | Hasil | Diharapkan | Berat (P1/P2/P3) |
|---|---|---|---|---|
| 1 | Clone repo bersih (`git clone companies/xavortree/code/gocean-b2b`), lalu jalankan `make ci` | Gagal pada langkah `pnpm install --frozen-lockfile` dengan error `ERR_PNPM_NO_LOCKFILE: Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent` | Perintah `make ci` sukses (exit 0) pada repo bersih karena `pnpm-lock.yaml` sudah di-commit | P1 |
| 2 | Clone repo bersih, jalankan `cp .env.example .env && make up` | Build Dockerfile kontainer (`api`, `worker`, `web`, `migrate`) gagal pada stage `RUN pnpm install --frozen-lockfile` | Docker image berhasil di-build dan seluruh service berjalan healthy | P1 |
| 3 | Periksa `git status` pada repository `companies/xavortree/code/gocean-b2b` | Terdapat 7 file termodifikasi dan 1 file untracked (`pnpm-lock.yaml`) yang belum di-commit ke branch `main`, termasuk perbaikan kritis database grant (`GRANT CONNECT, CREATE ON DATABASE ... TO app_ops`) dan penanganan pg-boss queue di `heartbeat.job.ts` | Seluruh kode perbaikan dan `pnpm-lock.yaml` sudah di-commit rapi oleh devops ke git repo | P1 |

## Catatan
- **Bukti pengujian** tersimpan di [companies/xavortree/planning/qa/bukti/015/](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/):
  - [01-ac7-make-ci-clean-repo.log](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/01-ac7-make-ci-clean-repo.log) — Log kegagalan `make ci` pada repo bersih karena tidak ada `pnpm-lock.yaml`.
  - [02-ac1-make-up-clean-repo.log](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/02-ac1-make-up-clean-repo.log) — Log kegagalan Docker build pada repo bersih.
  - [03-ac2-healthz-readyz.log](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/03-ac2-healthz-readyz.log) — Log uji HTTP 200 dan 503 saat outage DB.
  - [04-ac3-db-schemas-roles.log](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/04-ac3-db-schemas-roles.log) — Log pengecekan namespace, role, dan ekstensi PostgreSQL.
  - [05-ac4-web-manifest.log](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/05-ac4-web-manifest.log) — Log HTTP response HTML & webmanifest.
  - [06-ac5-worker-heartbeat.log](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/06-ac5-worker-heartbeat.log) — Log pemrosesan job heartbeat oleh worker di schema jobs.
  - [07-ac6-minio-anonymous.log](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/07-ac6-minio-anonymous.log) — Log penolakan HTTP 403 upload anonim MinIO.
  - [08-ac8-git-ls-files-readme.log](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/08-ac8-git-ls-files-readme.log) — Log verifikasi kebersihan git dan kelengkapan README.
  - [09-ac9-down-up-db-reset.log](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/09-ac9-down-up-db-reset.log) — Log uji restart compose dan db-reset.
  - [10-working-tree-diff.log](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/10-working-tree-diff.log) — Diff 7 file termodifikasi dan 1 untracked file di worktree lokal.
  - [web-localhost-3000.png](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/web-localhost-3000.png) — Screenshot browser web UI `http://localhost:3000`.
- **Rekomendasi untuk DevOps:**
  1. Commit `pnpm-lock.yaml` dan seluruh file yang sudah diperbaiki di worktree lokal (`db/migrations/0001_extensions_schemas_roles.sql`, `apps/worker/src/heartbeat.job.ts`, dst.).
  2. Pastikan `git status` bersih, lalu jalankan `make ci` dan `make up` pada clone bersih untuk konfirmasi sebelum mengajukan ronde 2.
