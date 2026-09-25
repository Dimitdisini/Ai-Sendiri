# Plan 010 — repo-dan-docker-compose
Perusahaan: Xavortree | Modul: M01 Fondasi (MS0) | Ukuran: M | Status: PASS bersyarat (AC1-AC5 menunggu Docker) | Pemilik: devops

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
**Tanggal:** 2026-09-25 | **Oleh:** DevOps (Yoga) | **Commit lokal:** `3cc2957` di `companies/xavortree/code/monitoring-gudang/` (branch `main`, tanpa remote, tidak di-push)

**File diubah/dibuat** (69 file ter-track; kerangka dari sesi DevOps sebelumnya dipertahankan dan dilanjutkan):
- Root: `package.json` (+devDep `yaml`), `package-lock.json`, `Makefile`, `README.md`, `.env.example`, `.gitignore`, `.dockerignore`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `tsconfig.base.json`, `vitest.config.ts`, `pyproject.toml`, `requirements-dev.txt`
- `deploy/`: `docker-compose.yml`, `mosquitto/{mosquitto.conf,init-dynsec.sh}`, `certs/{gen.sh,README.md}`, `migrate/Dockerfile`, `node.Dockerfile`, `python.Dockerfile`, `prometheus/prometheus.yml`, `grafana/provisioning/datasources/prometheus.yml`, **baru sesi ini:** `scripts/{wait-healthy.sh,check-compose.mjs,test-scripts.sh}`
- `db/migrations/0001_extensions_roles.sql`, `db/scripts/set_role_passwords.sh`, `db/{seed,tests}/README.md`
- `apps/{api,ingest,alerter}` (Fastify+TS, `/healthz`, vitest), `packages/shared` (createApp, log JSON pino), `apps/web` (nginx + halaman "Monitoring Gudang — segera"), `services/anomaly`, `tools/{simcore,dataset,simulator}` (Python, pytest), `firmware/`, `docs/`
- Di luar repo kode: `planning/DITUNDA.md` (3 item)

**Perubahan sesi ini atas kerangka lama:** prettier dirapikan (7 file gagal cek); pytest `--import-mode=importlib` (nama file uji duplikat antarpaket gagal dikoleksi); `make up/demo-up/demo-reset/sim-up/obs-up` menunggu lewat `wait-healthy.sh` alih-alih `up --wait` (sebagian versi Compose gagal saat one-shot `migrate` keluar; skrip juga memastikan `migrate` exit 0 dan gagal cepat bila `unhealthy`); seed/`test-rls` membaca `POSTGRES_DB` dari env kontainer (sebelumnya dari shell host); `gen.sh` mendukung `CERT_DIR` (untuk uji); `make check-compose` + `make test-scripts` masuk `make ci`; README ditambah cara verifikasi AC3.

**Cara menjalankan**
```bash
cd companies/xavortree/code/monitoring-gudang
make ci                        # tanpa Docker: lint + test + check-compose + test-scripts (≈15 s)
cp .env.example .env && make up   # butuh Docker ≥24 + Compose v2
make ps | make logs | make down | make demo-reset | make demo-up | make sim-up | make obs-up
```

**AC terverifikasi di mesin ini (tanpa Docker)**
- AC6 ✅ `git ls-files` (69 file) tidak memuat `.env` maupun `deploy/certs/*.key|*.crt` — diuji dengan `.env` + sertifikat asli ada di working tree lalu `git add -A`; scan pola kunci privat/token: bersih. README memuat prasyarat, tabel perintah Makefile, tabel port.
- AC7 ✅ `make ci` exit 0 dalam ±15 s: `npm ci`, eslint, prettier, ruff check/format, `tsc -b`, vitest 4/4, pytest 4/4, `check-compose` OK (11 service, 21 variabel env terdokumentasi, port sesuai TDD §6), `test-scripts` 14/14 cek. `docker compose config` dan `test-rls` otomatis dilewati bila Docker tidak ada (tercetak di log).
- Pendukung AC1–AC5 (statis): nama service, profile, healthcheck tiap service, `depends_on` (healthy / completed_successfully), port host (web 3000, api 8080, mosquitto 8883, db `127.0.0.1:5432`, simulator `127.0.0.1:8090`, 1883 tidak dipublikasikan), file bind-mount/Dockerfile ada, semua `${VAR}` ada di `.env.example` — dicek `check-compose.mjs` (diuji juga kasus negatif: 1883 dipublikasikan dan variabel tak terdokumentasi → exit 1). `gen.sh`: rantai CA→server valid, SAN `localhost,mosquitto,127.0.0.1`, idempoten. `set_role_passwords.sh`: 5 role di-ALTER lewat variabel psql, gagal bila env kosong. `wait-healthy.sh`: sukses / migrate exit≠0 / timeout / unhealthy.

**AC yang menunggu mesin dengan Docker (belum pernah dijalankan end-to-end)**
- AC1 `make up` ≤5 menit semua healthy + `migrate` exit 0 (pull image pertama kali bisa memakan sebagian besar waktu; ukur setelah image ter-cache bila jaringan lambat).
- AC2 anonim di 8883 ditolak; 1883 tidak terjangkau dari host.
- AC3 provisioning `qa1` via `mosquitto_ctrl` tanpa restart (langkah lengkap di README §Mosquitto).
- AC4 extension + 5 role, hanya `app_admin` `rolbypassrls`.
- AC5 `make down && make up` ≤2 menit; `make demo-reset` bersih.
- `docker compose config` dan `make test-rls` (stub) di dalam `make ci`.

**Catatan untuk QA**
1. Jalankan di mesin ber-Docker: `cp .env.example .env && make ci && time make up`. Tanpa klien mosquitto/psql di host, semua perintah AC2–AC4 bisa dijalankan via `docker compose --env-file .env -f deploy/docker-compose.yml exec mosquitto|timescaledb ...` (contoh di README).
2. AC3: publish yang ditolak di MQTT 3.1.1 tidak memberi error ke klien (perilaku protokol). Pakai `-V mqttv5 -q 1` untuk melihat `not authorised`, atau pantau `mosquitto_sub -u svc-ingest -t 't/#' -v` di terminal lain. Cek `$SYS/broker/uptime` (sys_interval 10 s) sebelum/sesudah.
3. AC4: `psql` dari dalam kontainer tim memakai socket lokal (trust). Untuk memastikan password role dari `.env` berlaku, uji dari host: `PGPASSWORD=<APP_OWNER_PASSWORD> psql -h 127.0.0.1 -U app_owner -d monitoring -c 'select rolname, rolbypassrls from pg_roles'`.
4. Kontrak untuk plan 011+: migrasi dijalankan sebagai superuser `postgres` (butuh CREATE EXTENSION/ROLE); migrasi 0002+ wajib diawali `SET ROLE app_owner;` agar objek dimiliki `app_owner`. Nama service dan struktur folder sesuai plan, tidak ada perubahan nama. `alerter` sementara memakai role `app_api` (dicatat di DITUNDA).
5. Password di `.env` dipakai di URL koneksi: pakai karakter aman URL. Mengganti `DYNSEC_ADMIN_PASSWORD`/`SVC_INGEST_PASSWORD` baru berlaku setelah `make demo-reset` (dynsec.json idempoten, tidak ditimpa).
6. Tag image (2.17.2-pg16, mosquitto 2.0.20, dbmate 2, node 22-alpine, python 3.12-slim, nginx 1.27-alpine) belum pernah di-pull di mesin ini; bila tag tidak tersedia, override lewat env `TIMESCALEDB_IMAGE`/`MOSQUITTO_IMAGE`.

**Belum selesai / di luar scope:** remote git + CI hosted (menunggu CEO); upgrade vitest (audit dev-only) dan role `app_alerter` dicatat di `planning/DITUNDA.md`.

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
| 1 | PASS BERSYARAT (AC6, AC7 PASS; AC1–AC5 tidak dapat diuji tanpa Docker, wajib diuji ulang) | planning/qa/010-qa-r1.md |
