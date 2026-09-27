# Plan 018 — registrasi-kyc-enkripsi-pii
Perusahaan: Xavortree | Project: gocean-b2b | Modul: F3.1 Registrasi & verifikasi | Ukuran: M | Status: Siap (mulai setelah 017 PASS) | Pemilik: backend

## Tujuan
Buyer dan supplier bisa mendaftar dan mengunggah dokumen KYC; admin memverifikasi/menolak/menangguhkan; data sensitif (NIK, rekening, file KYC) terenkripsi dan hanya bisa dibuka dengan jejak audit; akun yang belum aktif tidak bisa bertransaksi.

## Scope
### Termasuk
- `POST /auth/register` (buyer/supplier) sesuai FD F3.1: data org + PIC user; supplier + rekening; persetujuan pemrosesan data (UU PDP) wajib `true`; org `pending_verification`; audit `account.registered`.
- `POST /orgs/me/documents` multipart (JPG/PNG/PDF ≤5 MB, cek magic bytes) → file dienkripsi AES-256-GCM di aplikasi → object storage `kyc/<org_id>/<uuid>`; metadata `core.kyc_document` (sha256 file asli).
- Modul kripto `packages/shared` atau `apps/api/src/crypto`: `encrypt/decrypt` dengan `PII_ENC_KEY_v1` (env), `key_ver`; `blindIndex()` HMAC-SHA256 dengan `PII_BIDX_KEY`. NIK dan nomor rekening disimpan `*_enc` + `*_bidx` + `last4`.
- Admin (ops_admin): `GET /admin/orgs?kyc_status=`, `GET /admin/orgs/{id}` (PII masked), `POST /admin/orgs/{id}/verify {segment}` (segment wajib untuk buyer), `POST /admin/orgs/{id}/reject {reason}`, `POST /admin/orgs/{id}/suspend {reason}`, `POST /admin/orgs/{id}/reactivate`, `POST /admin/orgs/{id}/pii-reveal {field}` (step-up TOTP ≤5 menit), `GET /admin/orgs/{id}/documents/{docId}/download` (didekripsi di server, stream, tidak disimpan plaintext).
- Perubahan rekening supplier aktif: `POST /orgs/me/bank-accounts` → status `pending`, rekening lama tetap primer sampai admin verifikasi `POST /admin/bank-accounts/{id}/verify`.
- Guard `ActiveOrgGuard`: org bukan `active` → 403 `ACCOUNT_NOT_VERIFIED` (dipakai endpoint RFQ/listing di 019-020); plan ini menyediakan endpoint dummy terlindung `GET /_probe/active-only` untuk uji (hanya env dev/test).
- Audit: `account.registered|verified|rejected|suspended|reactivated`, `bank_account.changed|verified`, `pii.revealed`, `kyc_document.downloaded`.
- Notifikasi email ke PIC saat verified/rejected (template sederhana ID/EN, Mailpit).
- Update harness otorisasi 017 untuk semua endpoint baru.
### Tidak termasuk
UI (022), validasi rekening lewat PG (Scope 2), undangan user tambahan buyer (ASUMSI-FD-6, plan lanjutan), virus scan.

## Acceptance criteria
AC1. Diberikan pendaftar supplier baru mengirim data lengkap + KTP, ketika `POST /auth/register` lalu login, maka `GET /me` menunjukkan org `pending_verification` dan `GET /_probe/active-only` → 403 `ACCOUNT_NOT_VERIFIED`.
AC2. Diberikan payload register dengan NIK 15 digit, email terpakai, atau `consent=false`, ketika dikirim, maka 422 dengan `fields` menyebut field yang salah (email terpakai boleh 409), tidak ada baris org baru.
AC3. Diberikan KTP terunggah, ketika memeriksa object storage langsung (mc/aws cli) dan kolom DB, maka isi file di bucket bukan JPG/PDF yang bisa dibuka (terenkripsi), `app_user`/`bank_account` tidak memuat NIK atau nomor rekening plaintext (cek `SELECT` seluruh kolom teks), dan `last4` sesuai.
AC4. Diberikan ops_admin (2FA) memverifikasi org supplier, ketika `POST /admin/orgs/{id}/verify`, maka org `active`, `GET /_probe/active-only` untuk user org itu → 200, dan `audit_event` memuat `account.verified` dengan aktor ops_admin.
AC5. Diberikan verifikasi buyer tanpa `segment`, ketika dikirim, maka 422.
AC6. Diberikan ops_admin tanpa step-up TOTP 5 menit terakhir, ketika `POST /pii-reveal {field:"nik"}`, maka 403 `2FA_REQUIRED`; setelah step-up, maka 200 berisi NIK plaintext dan `audit_event` `pii.revealed` (tanpa nilai NIK di before/after).
AC7. Diberikan user buyer atau supplier lain, ketika `GET /admin/orgs/{id}/documents/{docId}/download`, maka 403 dan tercatat `security_event`.
AC8. Diberikan supplier aktif mengubah rekening, ketika belum diverifikasi admin, maka rekening primer tetap yang lama; setelah `verify`, rekening baru primer dan audit memuat `bank_account.verified` (nomor dimasking).
AC9. Diberikan file 6 MB atau file `.exe` berganti nama `.jpg`, ketika diunggah, maka 413 / 415.
AC10. Diberikan `make ci`, maka unit test kripto (enkripsi-dekripsi bolak-balik, tamper → gagal dekripsi, blind index deterministik) dan harness otorisasi lulus.

## Catatan teknis
Referensi FD F3.1, §5, §7.2 (KYC); TDD §4.3, §5. Kunci di `.env` (dev: nilai contoh di `.env.example` diberi label DEV-ONLY). Format ciphertext: `version(1B) | iv(12B) | tag(16B) | data`. Satu user = satu org di v1. Endpoint `_probe` dimatikan saat `NODE_ENV=production`.

## Handback (diisi Developer)
Tanggal | File diubah | Cara menjalankan | Belum selesai | Catatan untuk QA

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
