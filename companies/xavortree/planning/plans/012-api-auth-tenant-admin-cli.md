# Plan 012 — api-auth-tenant-admin-cli
Perusahaan: Xavortree | Modul: M01 Fondasi (MS0) | Ukuran: M | Status: Dibatalkan (I01 ditolak, Q9 2026-09-25) | Pemilik: backend

## Tujuan
API fondasi multi-tenant (F01) dan onboarding lewat API/CLI (F09 tanpa UI): login JWT, konteks tenant + RLS di setiap request, endpoint admin tenant/user/zona/device, provisioning kredensial MQTT ke Mosquitto dynsec tanpa restart, CLI `xt`, dan uji isolasi tenant otomatis.

## Scope
### Termasuk
- `apps/api` Fastify + TS: `POST /auth/login`, `GET /me`; middleware JWT → transaksi + `SET LOCAL app.tenant_id` (`app_api`); `GET /devices` (gabung `device_status`), `GET /zones`, `GET /zones/{id}/threshold`; format error FD §4; rate limit login; `/healthz`, `/readyz` (DB + broker), `/metrics`; `POST /internal/heartbeat` (`INTERNAL_TOKEN`).
- Endpoint admin (koneksi `app_admin`, hanya role admin): `POST/GET /admin/tenants`, `PATCH /admin/tenants/{id}` (`observation_mode`, `is_active`, `flags`), `POST /admin/tenants/{id}/users|zones|devices`, `POST /admin/tenants/{id}/telegram` (simpan `chat_id` saja; pesan uji di M06), `POST /admin/devices/{id}/credentials/rotate`, `PATCH /admin/devices/{id}` (`is_active`), `GET /admin/health`.
- Klien dynsec di `packages/shared`: `createClient`, `createRole`, `addRoleACL`, `disableClient`, `deleteClient` lewat `$CONTROL/dynamic-security/v1`, timeout 3 s; provisioning device dalam transaksi DB (gagal broker → rollback + 503).
- CLI `xt` (`node apps/api/dist/cli.js`, dipanggil `docker compose exec api xt …`): `tenant create|list`, `user create`, `zone create`, `device create|rotate|disable`, `telegram set`, memakai API dengan token admin dari env.
- Uji integrasi (vitest + compose): isolasi tenant, provisioning, rotasi; masuk `make ci`.
### Tidak termasuk
SSE `/stream`, `readings`, `alerts`, `PUT threshold` (M03/M04/M05a), UI admin dan pesan uji Telegram (M06), `/internal/alerts` (M04), firmware.

## Acceptance criteria
AC1. Diberikan seed 011, ketika `POST /auth/login` dengan email/password benar, maka 200 + JWT (cookie httpOnly) memuat `role` dan `tenant`; password salah → 401; percobaan ke-11 dalam 1 menit dari IP yang sama → 429.
AC2. Diberikan token supervisor `demo-a`, ketika `GET /devices`, maka hanya device `demo-a`; `GET /devices/{id device demo-b}` → 404; `GET /zones` hanya zona `demo-a`; token operator `POST /admin/tenants` → 403; tanpa token → 401.
AC3. Diberikan token admin, ketika `POST /admin/tenants {slug:"demo-c"}` lalu `POST …/zones {preset:"rantai-dingin"}` lalu `POST …/devices {slug:"c-01"}`, maka 201 dan respons device memuat `mqtt.username = "demo-c.c-01"`, `password` 24 karakter, `host`, `port`, `ca_url`; `GET` ulang tidak memuat password; slug ganda → 409.
AC4. Diberikan device AC3, ketika `mosquitto_pub` dengan kredensial itu ke `t/demo-c/c-01/data`, maka diterima ≤5 detik setelah dibuat; ke `t/demo-c/lain/data` atau `t/demo-a/c-01/data` → ditolak; `$SYS/broker/uptime` tidak reset.
AC5. Diberikan device aktif, ketika `POST /admin/devices/{id}/credentials/rotate`, maka kredensial lama ditolak ≤5 detik dan yang baru diterima; ketika `PATCH {is_active:false}`, maka publish ditolak dan `GET /devices` menampilkan `is_active=false`.
AC6. Diberikan container `mosquitto` dihentikan, ketika `POST /admin/tenants/{id}/devices`, maka 503 `UPSTREAM_UNAVAILABLE` dan tidak ada baris `device` baru; `GET /readyz` → 503; setelah broker hidup, `GET /readyz` → 200.
AC7. Diberikan compose jalan, ketika `docker compose exec api xt tenant create --slug demo-d --name "PT D"` lalu `xt device create --tenant demo-d --zone <id> --slug d-01`, maka kredensial tercetak sekali dan device tampil di `xt device list --tenant demo-d`.
AC8. Diberikan `make ci`, ketika dijalankan, maka uji isolasi tenant (AC2), provisioning (AC3–AC5) dan skenario AC6 berjalan otomatis dan hijau; `/metrics` memuat `http_requests_total`.

## Catatan teknis
Referensi FD §2 F01/F09, §4, §5; TDD §1, §4 (dynsec), §5. Koneksi DB dua pool: `app_api` (RLS) dan `app_admin` (hanya rute `/admin` dan CLI). Password argon2id. Nama device ≤40 karakter. Payload NOTIFY `device_changed` sudah dari trigger 011; API tidak perlu NOTIFY manual. Simpan `mqtt_username` di DB, jangan simpan password/hash. File: `apps/api/src/{auth,tenant,admin,dynsec,cli}`, `packages/shared/{db,dynsec,schema}`.

## Handback (diisi Developer)
Tanggal | File diubah | Cara menjalankan | Belum selesai | Catatan untuk QA

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
