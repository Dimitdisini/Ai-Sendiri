# QA 015 — ronde 1
Tanggal: 2026-09-30 | Penguji: QA (Dewi) | Verdict: PASS

Objek uji: `companies/xavortree/code/gocean-b2b/` commit `8d2fc8a` (branch `main`).
Lingkungan pengujian: macOS (Darwin arm64), Node.js v24.15.0, Corepack pnpm v12.6.0, Docker v29.4.0 (OrbStack), Docker Compose v5.1.2.

## Hasil per AC
| AC | Hasil | Bukti (screenshot atau log) |
|---|---|---|
| AC1: `cp .env.example .env && make up` ≤5 menit, service healthy, migrate & minio-init exit 0 | PASS | `02-ac1-make-up.log`: Dalam 8 detik seluruh service (`postgres`, `minio`, `mailpit`, `api`, `worker`, `web`) berstatus healthy, `migrate` dan `minio-init` keluar dengan kode 0. |
| AC2: `/healthz` & `/readyz` 200; saat postgres stop `/readyz` 503 & `/healthz` tetap 200 | PASS | `03-ac2-healthz-readyz.log`: Normal: `/healthz` 200 `{"status":"ok"}`, `/readyz` 200 `{"status":"ready"}`. Saat postgres di-stop: `/readyz` 503 `{"status":"not_ready"}` dan `/healthz` tetap 200 `{"status":"ok"}`. |
| AC3: Schema `core`, `audit`, `jobs`; role `app_*`; extension `pgcrypto`, `citext` ada | PASS | `04-ac3-db-schemas-roles.log`: Kueri psql superuser mengonfirmasi schema `core`, `audit`, `jobs`; role `app_fin`, `app_ops`, `app_owner`, `app_report`; serta ekstensi `pgcrypto` dan `citext` aktif. |
| AC4: Web `localhost:3000` "Gocean B2B — segera" dan `/manifest.webmanifest` 200 valid | PASS | `web-localhost-3000.png` & `05-ac4-web-manifest.log`: Halaman web tersaji memuat "Gocean B2B — segera" dan `/manifest.webmanifest` mengembalikan HTTP 200 dengan format JSON valid. |
| AC5: Worker memproses job `system.heartbeat` (count ≥ 1 setelah 2 menit) | PASS | `06-ac5-worker-heartbeat.log`: Kueri `SELECT count(*) FROM jobs.job WHERE name='system.heartbeat'` menghasilkan count 12 (status `completed`). Worker aktif memproses heartbeat tiap 1 menit. |
| AC6: Upload MinIO `gocean-dev-files` tanpa kredensial ditolak (403) | PASS | `07-ac6-minio-anonymous.log`: `curl -X PUT http://localhost:9000/gocean-dev-files/test.txt` anonim mengembalikan HTTP 403 Forbidden (`AccessDenied`). |
| AC7: Repo bersih `make ci` exit 0 ≤3 menit (install, lint, typecheck, test) | PASS | `01-ac7-make-ci.log`: Pengujian pada clean git clone repo (`git clone ...`) berhasil menjalankan `pnpm install --frozen-lockfile`, `eslint + prettier`, `tsc --noEmit`, dan vitest pada semua 7 package/app dengan exit 0 dalam 1m15s. |
| AC8: `git ls-files` tanpa rahasia; README lengkap (prasyarat, perintah, tabel port) | PASS | `08-ac8-git-ls-files-readme.log`: `git ls-files` bersih dari `.env` dan file kunci; `README.md` memuat bagian Prasyarat, Perintah Makefile, dan Tabel Port. |
| AC9: `make down && make up` ≤2 menit healthy; `make db-reset` bersih | PASS | `09-ac9-down-up-db-reset.log`: `make down && make up` mencapai status healthy dalam 24 detik (≤2 menit). `make db-reset` berhasil menghapus volume DB dan mengeksekusi ulang migrasi 0001 dengan kode keluar 0. |

## Temuan (bila FAIL)
| # | Langkah reproduksi | Hasil | Diharapkan | Berat (P1/P2/P3) |
|---|---|---|---|---|
| - | Tidak ada temuan baru. Seluruh temuan dari pengujian awal (pnpm-lock.yaml absen, DB grant pg-boss, vitest matcher) telah diperbaiki tuntas pada commit `8d2fc8a`. | - | - | - |

## Catatan
- Seluruh 9 Acceptance Criteria berhasil dipenuhi tanpa kompromi standar.
- Bukti pengujian tersimpan di [companies/xavortree/planning/qa/bukti/015/](file:///Users/haimac/Dimitri%20Ahmad/n8n-agent-Vscode/companies/xavortree/planning/qa/bukti/015/).
- Plan 015 siap dinyatakan **Selesai** dan menjadi fondasi monorepo yang kokoh untuk pengerjaan Plan 016 (Identitas & RBAC) serta plan berikutnya.
