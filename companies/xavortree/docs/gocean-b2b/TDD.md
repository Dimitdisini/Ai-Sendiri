# TDD — Gocean B2B E-Commerce & Order Management System
Perusahaan: Xavortree (mitra teknologi) untuk klien PT Gocean Indonesia | Pemilik: Analyst (Bima) | Turunan dari: FD.md v0.1, PRD.md v0.2 | Status: Draft, menunggu review CEO | Versi: 0.1 (2026-09-27)

Tidak ada komponen AI/LLM. Semua keputusan teknis yang belum diputuskan CEO ditandai [ASUMSI] dan tercatat di KEPUTUSAN.md (A21-A28, Q26). Stack sengaja "membosankan": satu bahasa (TypeScript) dari DB sampai UI, satu database (PostgreSQL) untuk data, antrean, dan audit; tanpa Redis/Kafka/Kubernetes. Skala target: puluhan supplier, belasan buyer, ratusan order/bulan (BRD KPI pilot) — satu Postgres dan beberapa VM lebih dari cukup untuk 24 bulan.

## 1. Arsitektur
Monorepo `companies/xavortree/code/gocean-b2b/` (git lokal sampai CEO memberi remote, A26).

| Komponen | Teknologi | Tanggung jawab | Scope |
|---|---|---|---|
| `apps/api` | Node.js 22 + TypeScript + NestJS 11 (adapter Fastify) | REST `/api/v1` (FD §7.2), sesi + 2FA, guard RBAC, interceptor audit, upload, webhook WA (Scope 2), `/healthz` `/readyz` `/metrics` | 1 |
| `apps/worker` | Node.js + pg-boss | job: notifikasi email/in-app (WA di Scope 2), PDF (dokumen jalan), kedaluwarsa penawaran/RFQ, ekspor laporan besar, pembersihan idempotency | 1 |
| `apps/web` | React 18 + Vite + vite-plugin-pwa + TanStack Query/Router + react-i18next + Tailwind + ECharts | semua layar L01-L16, C01; draft offline (IndexedDB) untuk form RFQ, tonase, traceability | 1 |
| `apps/fin` | NestJS (proses & DB role terpisah) | `/fin/v1` (FD §7.3), webhook PG, adaptor PG, invoice, split, disbursement, ledger, rekonsiliasi | 2 |
| `apps/fin-worker` | pg-boss (schema antrean terpisah) | invoice otomatis, pengingat, eksekusi payout, rekonsiliasi harian | 2 |
| `apps/web-fin` | React (berbagi `packages/ui`) | layar K01-K04 di subdomain `keuangan.` | 2 |
| `packages/shared` | TS + zod | skema validasi request/response (dipakai api & web), kode error, definisi state machine order/RFQ/invoice/disbursement sebagai data (tabel transisi), enum peran | 1 |
| `packages/db` | Kysely + kysely-codegen | klien DB bertipe, helper transaksi, `audit.append()` wrapper | 1 |
| `packages/ui` | React | komponen bersama (form besar ramah HP, tabel, badge status) | 1 |
| `db/` | SQL murni + dbmate | migrasi, seed, uji DB (`db/tests/*.sql`) | 1 |
| `deploy/` | Docker Compose v2, Caddy, Makefile | dev lokal, UAT, produksi (§6) | 1 |

Aliran utama: browser/PWA → Caddy (TLS) → `web` (statis) + `api` → PostgreSQL. Job asinkron lewat pg-boss (tabel di schema `jobs`). File → object storage S3-compatible (URL bertanda tangan). Scope 2: `api` memancarkan event domain ke tabel outbox `core.domain_event` → `fin-worker` membacanya (role `app_fin` hanya SELECT pada outbox) → invoice/disbursement. `fin` satu-satunya pemegang kredensial PG dan satu-satunya yang memanggil PG. `api` satu-satunya pemanggil WA Cloud API (lewat worker).

## 2. Stack dan alasan [ASUMSI A21]
- **TypeScript end-to-end** (Node 22 LTS): satu bahasa untuk tim kecil, skema zod dipakai bersama UI dan API → validasi konsisten (penting untuk form spesifikasi baku).
- **NestJS**: modul, guard, interceptor bawaan cocok untuk RBAC berlapis dan audit otomatis di banyak modul; lebih terstruktur daripada Fastify polos (dipakai di project sebelumnya) untuk domain fintech berumur 24 bulan. Adapter Fastify untuk performa.
- **PostgreSQL 16**: transaksi ACID untuk order/ledger, CHECK constraint, trigger append-only, `pgcrypto`, JSONB. Satu DB, tiga schema bisnis (`core`, `audit`, `finance`) + `jobs`.
- **dbmate** (SQL murni, terbukti di plan 010) + **Kysely** (query builder bertipe, SQL tetap terlihat — lebih aman untuk logika uang daripada ORM "magic").
- **pg-boss**: antrean job di Postgres (retry, jadwal cron, dead-letter) → tidak perlu Redis.
- **React + Vite PWA**: platform tertutup (tanpa kebutuhan SEO), SPA lebih ringan dari Next.js, service worker untuk sinyal lemah di TPI.
- **pdfmake** di worker: PDF tanpa Chromium (image kecil, VM murah).
- **Object storage S3-compatible**: MinIO di dev/UAT, object storage provider di produksi.
- **Email**: SMTP generik (Mailpit di dev); provider produksi dipilih devops di plan deploy (syarat: DKIM/SPF, harga per volume kecil).
- **Uji**: vitest (unit), supertest + DB uji nyata (integrasi & matriks otorisasi), Playwright (e2e web, mulai plan frontend).

## 3. Skema data dan migrasi
### 3.1 Schema dan role DB
| Schema | Isi | Pemilik |
|---|---|---|
| `core` | entitas FD §3 Scope 1, `session`, `idempotency_key`, `domain_event` (outbox), `setting`, `notification` | `app_owner` |
| `audit` | `audit_event`, `security_event` | `app_owner` |
| `finance` | entitas FD §3 Scope 2 + `fund_log`, `inbound_webhook` (pg) | `app_owner` (Scope 2) |
| `wa` | `wa_thread`, `wa_message`, `inbound_webhook` (wa) | `app_owner` (Scope 2) |
| `jobs`, `fin_jobs` | tabel pg-boss | `app_ops` / `app_fin` |

| Role | Hak |
|---|---|
| `app_owner` | menjalankan migrasi (via `SET ROLE app_owner` setelah superuser membuat ekstensi/role, pola plan 010) |
| `app_ops` | CRUD `core`; `audit`: hanya EXECUTE `audit.append()` dan `audit.log_security()` + SELECT; `wa` CRUD; **tanpa hak apa pun di `finance`**; SELECT view `finance.v_billing_status` (read-only, Scope 2) |
| `app_fin` | CRUD `finance`; SELECT terbatas view `core.v_order_for_finance`, `core.v_party_bank_account`, `core.domain_event`; EXECUTE `finance.fund_log_append()`; tanpa akses `audit` tulis selain fungsi |
| `app_report` | SELECT view agregat dashboard (`core.v_dashboard_*`) — dipakai endpoint investor agar tidak mungkin membaca baris per pihak [defense in depth] |

### 3.2 Tabel inti Scope 1 (migrasi 0002-0008)
Kolom mengikuti FD §3. Ketentuan teknis:
- Enum status sebagai tipe `ENUM` Postgres (`order_status`, `rfq_status`, `listing_status`, `kyc_status`, `quote_status`).
- Transisi order dijaga dua lapis: service (`packages/shared` state machine) dan trigger `core.order_status_guard` (BEFORE UPDATE OF status) yang menolak transisi di luar tabel FD §4.1 → QA bisa menguji langsung di DB.
- Nomor dokumen: tabel `core.doc_counter(prefix, period, last_no)` + `UPDATE ... RETURNING` dalam transaksi yang sama (tanpa lubang tidak dijamin untuk rollback).
- Uang `bigint` + `currency char(3)`; CHECK `currency IN ('IDR','USD')`; nilai order dihitung di service dan diverifikasi CHECK sederhana (`value_final >= 0`).
- Kolom terenkripsi `*_enc bytea` + `*_key_ver smallint`; kolom `*_bidx bytea` (HMAC-SHA256) untuk keunikan NIK/rekening tanpa dekripsi.
- `order.spec_snapshot jsonb` membekukan label ID/EN + rentang suhu saat PO terbit.
- Indeks: `order(buyer_org_id, status)`, `order(supplier_org_id, status)`, `order(status, received_at)`, `rfq(buyer_org_id, status)`, `listing(status, commodity_id)`, `audit_event(entity_type, entity_id, seq)`, `audit_event(occurred_at)`.

### 3.3 Audit log append-only + rantai hash (F3.3)
- `audit.audit_event(seq bigserial PK, occurred_at, actor_user_id, actor_role, actor_kind, action, entity_type, entity_id, before jsonb, after jsonb, ip inet, user_agent, request_id, prev_hash bytea, hash bytea)`.
- Tulis hanya lewat fungsi `audit.append(...)` `SECURITY DEFINER`: ambil `pg_advisory_xact_lock(<konstanta>)`, baca hash terakhir, `hash = sha256(prev_hash || canonical_json(row tanpa hash))`, insert. Volume rendah → serialisasi tidak masalah.
- `REVOKE UPDATE, DELETE, TRUNCATE ON audit.* FROM PUBLIC, app_ops, app_fin, app_report`; trigger `BEFORE UPDATE OR DELETE` yang `RAISE EXCEPTION` (termasuk untuk `app_owner` → mencegah kesalahan migrasi). Hanya superuser yang secara teori bisa mengubah — dimitigasi dengan hash chain + salinan harian hash terakhir ke log eksternal (§7).
- `make audit-verify`: skrip menghitung ulang rantai dan melaporkan seq pertama yang rusak.
- PII di `before/after` dimasking di service (nomor rekening → `****1234`, NIK → `************3456`).
- Audit ditulis dalam transaksi yang sama dengan perubahan bisnis (FD F3.3: gagal audit = gagal transaksi).
- `finance.fund_log` memakai pola identik, rantai terpisah (Dual Environment b).
- Retensi ≥10 tahun: tanpa penghapusan; partisi per tahun ditambahkan bila >50 juta baris (tidak di v1).

### 3.4 Skema Scope 2 (ringkas, dimigrasikan di plan Scope 2)
`finance.invoice`, `invoice_installment`, `payment`, `split_rule`, `split_line`, `disbursement`, `ledger_journal`, `ledger_entry` (CHECK per jurnal seimbang lewat constraint trigger DEFERRABLE), `fund_log`, `inbound_webhook(source, event_id UNIQUE)`. `wa.wa_thread`, `wa.wa_message(wa_message_id UNIQUE)`. Semua idempoten lewat UNIQUE pada id eksternal.

### 3.5 Query acuan QA dashboard (F3.4)
```sql
-- GMV bulan berjalan (WIB), per mata uang
SELECT currency, SUM(value_final) AS gmv
FROM core."order"
WHERE status = 'diterima'
  AND received_at >= (date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta')
GROUP BY currency;
```
Endpoint dashboard wajib memakai view `core.v_dashboard_gmv` yang definisinya identik; QA membandingkan hasil endpoint vs query ini (selisih 0).

### 3.6 Migrasi dan seed
dbmate, file `db/migrations/NNNN_<nama>.sql`, hanya `up` untuk produksi (down hanya dev). `db/seed/dev.sql`: 1 sysadmin, 1 ops_admin, 1 finance, 1 management, 1 investor, 2 buyer org (horeca, ekspor), 2 supplier org, master data contoh (Tuna loin grade A -25..-18 °C, Udang vannamei, Kakap merah), password dari `.env`. UAT memakai seed yang sama + data master dari Gocean saat tersedia.

## 4. Integrasi eksternal
### 4.1 Payment gateway — Xendit [ASUMSI A22] (Scope 2)
- Pilihan: **Xendit** (bukan Midtrans). Alasan: VA banyak bank + Payouts/Disbursement ke semua bank Indonesia + validasi nama pemilik rekening dalam satu akun dan satu API; ada xenPlatform (sub-account + split rule) sebagai opsi bila Q26 dijawab B; sandbox dan dokumentasi API kuat. Midtrans kuat di checkout (Snap) tetapi disbursement lewat produk terpisah (Iris) dengan onboarding sendiri.
- Akun atas nama PT Gocean (A-PRD, PRD §5). Onboarding/KYC mulai paling lambat bulan 9 (R7), direkomendasikan lebih awal.
- Adaptor `PaymentGateway` di `apps/fin` (`createVirtualAccount`, `createPayout`, `validateBankAccount`, `getSettlementReport`, `verifyWebhook`) → vendor bisa diganti tanpa menyentuh domain.
- Webhook: verifikasi header token callback Xendit (nilai rahasia per environment), simpan `inbound_webhook`, balas 200 < 1 s, proses di `fin-worker`. Nama endpoint/field persis diverifikasi terhadap dokumentasi sandbox saat plan Scope 2 dikerjakan.
- Model dana: dana buyer masuk ke saldo akun Gocean di Xendit (dikelola PG berlisensi), payout dari saldo itu ke rekening supplier/nelayan setelah syarat terpenuhi. Kesesuaian dengan Q17 → **Q26 (Menunggu CEO)**.
- Pembayaran USD buyer ekspor: [ASUMSI A27] invoice ditampilkan USD, pembayaran lewat metode PG yang mendukung (payment link/kartu) atau VA IDR dengan kurs yang dikunci di invoice; dikonfirmasi requirement phase.

### 4.2 WhatsApp — Meta WhatsApp Cloud API langsung [ASUMSI A23] (Scope 2)
- Pilihan: **Meta Cloud API langsung** (bukan Qontak/Wati). Alasan: platform ini membangun konsol chat sendiri (C01) sehingga inbox BSP tidak terpakai; tanpa biaya langganan BSP → biaya WA Gocean (Q23) hanya tarif Meta; webhook dan template API standar. Risiko: verifikasi bisnis Meta dilakukan Gocean sendiri, dukungan tanpa AM lokal. Cadangan: Qontak (Mekari) bila Gocean butuh dukungan/tagihan lokal — adaptor `WhatsAppProvider` (`sendText`, `sendTemplate`, `downloadMedia`, `verifyWebhook`) membuat pergantian murah.
- Webhook `POST /webhooks/wa`: verifikasi `X-Hub-Signature-256` (HMAC app secret), idempoten pada `wa_message_id`.
- Nomor UAT = nomor uji Meta; nomor produksi = nomor resmi Gocean.

### 4.3 Email & object storage (Scope 1)
SMTP (Mailpit dev). Object storage: bucket privat `gocean-<env>-files`; prefix `kyc/`, `orders/<id>/`, `listings/<id>/`, `trace/<id>/`; file KYC dienkripsi aplikasi sebelum upload (AES-256-GCM); unduh hanya lewat URL presigned 5 menit setelah cek hak di API.

## 5. Keamanan
- **Transport**: HTTPS (Caddy, TLS 1.2+, HSTS), CSP ketat, cookie `Secure; HttpOnly; SameSite=Lax`, CSRF token untuk mutasi.
- **Autentikasi**: argon2id (memori 64 MB); TOTP RFC 6238 (otplib) wajib OPS/FIN/SYS + 10 recovery code (hash); step-up TOTP untuk approval disbursement dan "Tampilkan PII"; lockout 5x/15 menit; rate limit login per IP dan per akun.
- **Otorisasi**: guard NestJS berbasis kebijakan (`@Can('order.read')` + fungsi scope kepemilikan) di setiap endpoint; default-deny (endpoint tanpa dekorator gagal uji CI). Uji matriks otorisasi otomatis: setiap endpoint × setiap peran × (milik/bukan milik) → ekspektasi dari FD §5.
- **Enkripsi data**: at-rest disk VM terenkripsi (bila provider mendukung); kolom PII AES-256-GCM di aplikasi, kunci `PII_ENC_KEY_v<n>` dari file rahasia server (bukan repo), dukung rotasi (`key_ver`). Backup dienkripsi (age/GPG) sebelum keluar server.
- **Dual Environment (A25)**: (a) UAT dan produksi beda VM, DB, bucket, domain, kredensial, nomor WA; akses SSH produksi hanya PIC yang ditunjuk. (b) `apps/fin` proses terpisah (Scope 2: VM terpisah `vm-fin`) dengan DB role `app_fin`; `app_ops` tidak punya GRANT di schema `finance` (dibuktikan uji DB); kredensial PG hanya di env `vm-fin`; `fund_log` rantai hash terpisah; subdomain `keuangan.` dengan sesi terpisah; firewall: `vm-fin` hanya menerima 443 + webhook PG.
- **Rahasia**: `.env` di server (chmod 600, pemilik service user), tidak pernah di repo/chat (sop-kredensial); `.env.example` tanpa nilai.
- **Upload**: cek magic bytes, batas ukuran, strip EXIF foto; nama file acak.
- **UU PDP**: data dan backup di Indonesia; persetujuan pemrosesan data di L01; permintaan akses/hapus data subjek lewat SYS (hapus = anonimisasi, karena audit wajib dipertahankan).
- **Pentest** pihak ketiga sebelum F4 go-live (PRD §4); OWASP ASVS L2 sebagai checklist QA.

## 6. Deploy dan lingkungan
### 6.1 Hosting — Biznet Gio NEO Cloud (Jakarta) [ASUMSI A24]
Alasan: data center Indonesia (UU PDP), tagihan rupiah, VM + object storage S3-compatible di provider yang sama, harga lebih rendah dari region Jakarta hyperscaler untuk skala ini. Cadangan: IDCloudHost. Anggaran infra BRD 5-8% dari Rp433 juta (≈Rp0,9-1,4 juta/bulan rata-rata 24 bulan) → Scope 1 hanya UAT dulu, produksi mulai bulan 8, `vm-fin` baru di Scope 2. Harga pasti diverifikasi devops di plan deploy UAT; bila melebihi alokasi, dilaporkan sebagai risiko R1.

| Environment | Topologi | Isi |
|---|---|---|
| dev (laptop) | Docker Compose (OrbStack) | postgres 16, minio, mailpit, api, worker, web, migrate |
| UAT (bulan 2+) | 1 VM ±4 vCPU/8 GB | compose sama + Caddy; sandbox PG + nomor uji WA (Scope 2); data dummy; banner UAT |
| produksi Scope 1 (bulan 8) | `vm-app` (Caddy, web, api, worker) + `vm-db` (Postgres, jaringan privat saja) | backup WAL-G ke object storage + dump harian terenkripsi ke bucket lokasi kedua (masih Indonesia) |
| produksi Scope 2 (bulan 17) | + `vm-fin` (Caddy, fin, fin-worker, web-fin) | koneksi DB sebagai `app_fin`, firewall ketat |
| ops | di `vm-app` Scope 1, pindah VM kecil bila perlu | Prometheus, Grafana, Loki, Uptime Kuma |

Port dev (kontrak plan 015): web 5173 (dev) / 3000 (nginx build), api 8080, fin 8081 (Scope 2), postgres `127.0.0.1:5432`, minio 9000/9001, mailpit 1025/8025.

### 6.2 Rilis, backup, pemulihan
- Build image di CI (GitHub Actions saat remote ada; sementara `make ci` lokal), tag `git sha`; deploy = `docker compose pull && up -d` + migrasi dbmate sebelum api; rollback = tag sebelumnya (migrasi wajib backward-compatible satu versi).
- Backup: WAL archiving kontinu (RPO menit, target PRD ≤24 jam) + `pg_dump` harian terenkripsi, retensi 30 harian + 12 bulanan; object storage versioning. Uji restore bulanan ke UAT (anonimkan). RTO ≤8 jam dengan runbook.
- Deploy produksi selalu menunggu "ya" CEO (CLAUDE.md prinsip 8).

## 7. Observabilitas
- Log JSON (pino) dengan `request_id`, `user_id`, tanpa PII → Loki. Metrik prom-client: latensi & error per endpoint, antrean pg-boss (panjang, gagal), webhook masuk/ditolak, notifikasi gagal, job PDF, (Scope 2) payout gagal, selisih rekonsiliasi.
- Uptime Kuma cek `/healthz` tiap 1 menit dari luar → ketersediaan 99,5%.
- Alert ke grup Telegram ops + email PIC Ahmad (Q19) pada jam kerja (A-PRD-3): api down >2 menit, error 5xx >2% 5 menit, antrean job macet >15 menit, backup gagal, webhook PG ditolak berulang, `audit-verify` gagal. Di luar jam kerja alert tetap terkirim tetapi ditangani hari kerja berikutnya (Q18).
- Hash terakhir `audit_event` dan `fund_log` dikirim harian ke log eksternal (email arsip ke Gocean) sebagai jangkar anti-rusak.

## 8. Keputusan teknis
| ID | Keputusan | Status |
|---|---|---|
| A21 | Stack TypeScript: NestJS + Kysely + dbmate + pg-boss + React/Vite PWA + PostgreSQL 16 + object storage S3 | ASUMSI, dianggap disetujui |
| A22 | PG = Xendit, lewat adaptor | ASUMSI, dianggap disetujui |
| A23 | WA = Meta Cloud API langsung, cadangan Qontak, lewat adaptor | ASUMSI, dianggap disetujui |
| A24 | Hosting Biznet Gio NEO Cloud Jakarta, cadangan IDCloudHost | ASUMSI, dianggap disetujui |
| A25 | Dual Environment: UAT terpisah penuh + `apps/fin` proses/VM/role DB/log terpisah | ASUMSI, dianggap disetujui |
| A26 | Repo git lokal `code/gocean-b2b/` sampai CEO beri remote | ASUMSI, dianggap disetujui |
| A27 | Pembayaran USD buyer ekspor | ASUMSI, konfirmasi requirement phase |
| A28 | 12 asumsi fungsional FD §8 | ASUMSI, dianggap disetujui |
| Q26 | Dana menunggu di saldo PG atas nama Gocean sampai serah terima, lalu payout | **Menunggu CEO** (menahan eksekusi F4 saja) |

## 9. Rencana plan
### Scope 1 (plan ditulis, urutan eksekusi)
| Plan | Judul | Pemilik | Ukuran | Bergantung |
|---|---|---|---|---|
| 015 | Fondasi repo, monorepo, Docker Compose | devops | M | - |
| 016 | Skema identitas, RBAC, audit log append-only | backend | M | 015 |
| 017 | API auth, sesi, 2FA, guard RBAC, audit interceptor | backend | M | 016 |
| 018 | Registrasi & verifikasi KYC (F3.1), enkripsi PII, upload | backend | M | 017 |
| 019 | Master data, harga segmen, listing, katalog (F1.1-F1.3, F1.5 data) | backend | M | 018 |
| 020 | RFQ, penawaran, PO, reorder (F1.4, F2.1, F2.6) | backend | M | 019 |
| 021 | Lifecycle order, tonase & QC, traceability (F2.2, F2.3, F3.2) | backend | M | 020 |
| 022 | Kerangka web PWA, login + 2FA, i18n, layar admin KYC & master data | frontend | M | 017 (API 018-019 untuk layar admin) |

### Scope 1 lanjutan (plan ditulis setelah 015-017 PASS)
023 dokumen jalan PDF, upload dokumen ekspor, serah terima (F2.4, F2.5) — backend; 024 layar buyer (katalog, RFQ, order, terima) — frontend; 025 layar supplier PWA (listing, tonase + traceability 1 layar, offline draft) — frontend; 026 layar admin order (kurasi, penawaran, QC, dokumen) — frontend; 027 dashboard + ekspor + view agregat investor (F3.4, F3.6) — data; 028 deploy UAT + backup + monitoring — devops; 029 notifikasi email/in-app — backend.

### Scope 2 (garis besar, plan ditulis mulai bulan 8-9)
F5 invoice + termin (backend), adaptor Xendit + VA + webhook (backend, **BLOKIR eksekusi**: kredensial sandbox Xendit belum ada), split + disbursement + approval + ledger (backend, BLOKIR eksekusi: sandbox + Q26), rekonsiliasi & ekspor akuntansi (data), `apps/fin` + `vm-fin` + isolasi (devops), web-fin K01-K04 (frontend), adaptor WA Cloud API + konsol C01 + penyamaran (backend + frontend, BLOKIR eksekusi: nomor uji & app Meta belum ada), pentest (devops, vendor eksternal). Desain internal dan kontrak (FD §7.3) tidak menunggu vendor.
