# Plan 016 — skema-identitas-rbac-audit-log
Perusahaan: Xavortree | Project: gocean-b2b | Modul: Fondasi — F3.3, F3.5 (data) | Ukuran: M | Status: Siap (mulai setelah 015 PASS) | Pemilik: backend

## Tujuan
Tabel identitas, peran, sesi, setting, dan audit log append-only dengan rantai hash tersedia lewat migrasi, lengkap dengan GRANT per role DB dan uji DB otomatis, karena semua modul berikutnya menulis audit dan memeriksa peran.

## Scope
### Termasuk
- Migrasi `0002_core_identity.sql`: `core.organization`, `core.app_user`, `core.role`, `core.user_role`, `core.session`, `core.setting`, `core.idempotency_key`, `core.doc_counter`, `core.domain_event` (outbox), `core.kyc_document`, `core.bank_account`; enum `org_type`, `kyc_status`, `segment`, `role_code` (buyer, supplier, ops_admin, finance, management, investor, sysadmin). Kolom sesuai FD §3 dan konvensi TDD §3.2 (uuid, `*_enc bytea`, `*_key_ver`, `*_bidx`, `version`, timestamp).
- Constraint `ROLE_CONFLICT`: user tidak boleh punya `ops_admin` dan `finance` sekaligus (trigger pada `user_role`).
- Migrasi `0003_audit.sql`: `audit.audit_event`, `audit.security_event`; fungsi `audit.append(...)` SECURITY DEFINER dengan advisory lock + `hash = sha256(prev_hash || canonical_json)`; fungsi `audit.log_security(...)`; REVOKE UPDATE/DELETE/TRUNCATE dari semua role aplikasi; trigger BEFORE UPDATE OR DELETE yang menolak (berlaku juga untuk `app_owner`).
- Migrasi `0004_grants.sql`: GRANT sesuai TDD §3.1 (`app_ops` CRUD `core` + EXECUTE fungsi audit + SELECT audit; `app_fin` tanpa GRANT di `core` selain view yang nanti dibuat Scope 2; `app_report` belum ada view → tanpa GRANT).
- Setting default: `order.tonnage_tolerance_pct` = 5, `disbursement.approval_threshold_idr` = 50000000, `quote.validity_hours` = 48, `rfq.max_negotiation_rounds` = 5.
- `db/seed/dev.sql`: 7 peran, 1 user per peran internal (sysadmin, ops_admin, finance, management, investor), org Gocean, 2 buyer org (horeca, ekspor, status active), 2 supplier org (1 active, 1 pending_verification), 1 user per org; password hash argon2id dibuat skrip seed dari env `SEED_PASSWORD`.
- `db/tests/audit.sql`, `db/tests/grants.sql` + target `make test-db` (keluar non-0 bila gagal); skrip `make audit-verify` (TS di `packages/db` atau SQL) menghitung ulang rantai hash.
- Tipe Kysely ter-generate (`packages/db/src/types.ts`) dan commit.
### Tidak termasuk
Endpoint API (017), tabel master/listing/RFQ/order (019-021), enkripsi aplikasi (fungsi AES di 018 — di sini kolom `bytea` saja), schema `finance`/`wa` (Scope 2).

## Acceptance criteria
AC1. Diberikan `make db-reset && make seed`, ketika selesai, maka migrasi 0001-0004 dan seed berjalan tanpa error; `\dt core.*` dan `\dt audit.*` menampilkan semua tabel di Scope.
AC2. Diberikan sesi `app_ops`, ketika memanggil `audit.append(...)` 3 kali, maka 3 baris masuk dengan `seq` naik dan `prev_hash` baris ke-n = `hash` baris ke-(n-1).
AC3. Diberikan sesi `app_ops` (dan juga `app_owner`), ketika `UPDATE audit.audit_event SET action='x'`, `DELETE FROM audit.audit_event`, atau `TRUNCATE audit.audit_event`, maka semua ditolak dengan error; jumlah baris tidak berubah.
AC4. Diberikan superuser mengubah satu baris `audit_event` langsung (menonaktifkan trigger, simulasi perusakan), ketika `make audit-verify`, maka keluar non-0 dan mencetak `seq` pertama yang rusak; tanpa perusakan keluar 0 dengan jumlah baris terverifikasi.
AC5. Diberikan sesi `app_ops`, ketika `INSERT INTO audit.audit_event` langsung (tanpa fungsi), maka `permission denied`.
AC6. Diberikan sesi `app_fin`, ketika `SELECT` dari `core.app_user` atau `core.organization`, maka `permission denied`.
AC7. Diberikan user dengan peran `ops_admin`, ketika `INSERT INTO core.user_role` peran `finance` untuk user itu, maka ditolak dengan pesan memuat `ROLE_CONFLICT`.
AC8. Diberikan seed, ketika diperiksa, maka ada 7 peran, 5 user internal, 4 org eksternal (1 supplier `pending_verification`), 4 setting default dengan nilai di Scope; `make test-db` mencetak ringkasan PASS dan keluar 0.
AC9. Diberikan migrasi sudah jalan, ketika `dbmate up` diulang, maka tidak ada error dan tidak ada perubahan.

## Catatan teknis
Referensi FD §3, §5; TDD §3.1-§3.3, §3.6. `canonical_json` = `jsonb` di-cast ke teks dengan urutan kunci deterministik (jsonb sudah mengurutkan kunci) — dokumentasikan formula persis di `db/README.md` karena QA dan auditor akan memverifikasi. Advisory lock pakai konstanta tetap (mis. `hashtext('audit_chain')`). `app_user.email` bertipe `citext` unik. Password hash tidak pernah masuk audit.

## Handback (diisi Developer)
Tanggal | File diubah | Cara menjalankan | Belum selesai | Catatan untuk QA

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
