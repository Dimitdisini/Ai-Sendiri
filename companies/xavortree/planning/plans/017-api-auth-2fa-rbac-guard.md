# Plan 017 — api-auth-2fa-rbac-guard
Perusahaan: Xavortree | Project: gocean-b2b | Modul: Fondasi — F3.3, F3.5 (API) | Ukuran: M | Status: Siap (mulai setelah 016 PASS) | Pemilik: backend

## Tujuan
API punya login berbasis sesi, 2FA TOTP wajib untuk peran internal sensitif, guard RBAC default-deny, pencatatan otomatis audit dan akses ditolak, serta harness uji matriks otorisasi yang dipakai semua plan berikutnya.

## Scope
### Termasuk
- Endpoint FD §7.2 area Auth (kecuali `register` → 018) dan Admin: `POST /auth/login`, `POST /auth/2fa/setup`, `POST /auth/2fa/confirm`, `POST /auth/2fa/verify`, `POST /auth/logout`, `GET /me`, `POST /auth/password/reset-request`, `POST /auth/password/reset` (email via Mailpit), `GET/POST/PATCH /admin/users`, `POST /admin/users/{id}/roles`, `POST /admin/users/{id}/2fa-reset`, `GET/PUT /admin/settings/{key}`, `GET /audit-events`, `GET /admin/security-events`.
- Sesi di `core.session` (id acak 256-bit, disimpan hash), cookie `sid` `HttpOnly; Secure (kecuali dev); SameSite=Lax`, idle timeout 30 menit untuk peran internal, 7 hari untuk buyer/supplier; CSRF double-submit token untuk semua mutasi.
- argon2id; lockout 5 gagal/15 menit (per akun) + rate limit per IP; `security_event` untuk `login_failed`, `locked`, `2fa_failed`.
- TOTP (otplib) + 10 recovery code (hash). Peran ops_admin, finance, sysadmin: tanpa 2FA aktif → setelah password hanya boleh akses endpoint setup 2FA (403 `2FA_REQUIRED` untuk lainnya). Helper step-up `@RequireFreshTotp()` (dipakai 018 dan Scope 2).
- Guard kebijakan: dekorator `@Can('<permission>')` + resolver kepemilikan; endpoint tanpa dekorator → gagal saat startup/CI (default-deny). Permission map di `packages/shared/src/rbac.ts` diturunkan dari FD §5.
- Interceptor/servis audit: helper `audit.record(tx, {...})` memanggil `audit.append()` dalam transaksi yang sama; masking PII util.
- Filter 403 → tulis `security_event(kind='forbidden', resource, user, ip)`.
- Format error FD §7.1 + `request_id`; middleware `Idempotency-Key` generik (tabel `core.idempotency_key`, TTL 24 jam, job pembersih di worker).
- Harness uji otorisasi `apps/api/test/authz/`: tabel (endpoint, method, peran, milik/bukan) → status yang diharapkan; dijalankan di `make ci` terhadap DB uji.
### Tidak termasuk
Registrasi publik dan KYC (018), UI (022), SSO/OAuth, WebAuthn.

## Acceptance criteria
AC1. Diberikan user seed buyer, ketika `POST /auth/login` dengan password benar, maka 200, cookie `sid` ber-flag HttpOnly dan SameSite=Lax, dan `GET /me` mengembalikan peran `buyer` dan org-nya.
AC2. Diberikan user seed ops_admin tanpa 2FA, ketika login lalu `GET /audit-events`, maka 403 `2FA_REQUIRED`; setelah `2fa/setup` + `2fa/confirm` dengan kode TOTP valid dan login ulang + `2fa/verify`, maka endpoint yang sama 200.
AC3. Diberikan akun mana pun, ketika 5 kali login gagal dalam 15 menit, maka percobaan ke-6 (password benar pun) ditolak 429/423 `ACCOUNT_LOCKED` dan `audit.security_event` memuat 5 `login_failed` + 1 `locked`.
AC4. Diberikan sesi buyer, ketika memanggil `GET /admin/users`, maka 403 `FORBIDDEN` dan satu baris `security_event` kind `forbidden` berisi user, resource, IP.
AC5. Diberikan sysadmin menetapkan peran `finance` ke user yang sudah `ops_admin`, ketika `POST /admin/users/{id}/roles`, maka 422 `ROLE_CONFLICT`.
AC6. Diberikan sysadmin mengubah setting `order.tonnage_tolerance_pct` dari 5 ke 7, ketika selesai, maka `audit_event` baru memuat action `setting.updated`, before `5`, after `7`, aktor sysadmin; `make audit-verify` tetap keluar 0.
AC7. Diberikan mutasi tanpa header CSRF yang benar, ketika dipanggil dengan cookie sesi valid, maka 403.
AC8. Diberikan dua request `PUT /admin/settings/{key}` dengan `Idempotency-Key` sama, ketika dikirim berurutan, maka respons kedua identik dengan pertama dan hanya satu `audit_event` tercatat.
AC9. Diberikan repo, ketika `make ci`, maka harness otorisasi berjalan untuk semua endpoint plan ini × 7 peran (+ tanpa login) dan lulus; menambahkan endpoint baru tanpa `@Can` membuat `make ci` gagal.
AC10. Diberikan sesi ops_admin idle >30 menit, ketika memanggil endpoint apa pun, maka 401 `UNAUTHENTICATED`.

## Catatan teknis
Referensi FD §2.3 (F3.3, F3.5), §5, §7.1-§7.2; TDD §5. Kode 423 vs 429 untuk lockout: pilih satu, konsisten, catat di handback. `2fa/verify` menandai sesi `mfa_passed_at`; step-up = `mfa_passed_at` < 5 menit. Email reset berlaku 30 menit, sekali pakai. Jangan log password/TOTP/cookie.

## Handback (diisi Developer)
Tanggal | File diubah | Cara menjalankan | Belum selesai | Catatan untuk QA

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
