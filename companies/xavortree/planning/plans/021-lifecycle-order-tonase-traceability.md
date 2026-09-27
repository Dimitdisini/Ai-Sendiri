# Plan 021 — lifecycle-order-tonase-traceability
Perusahaan: Xavortree | Project: gocean-b2b | Modul: F2.2, F2.3, F3.2 | Ukuran: M | Status: Siap (mulai setelah 020 PASS) | Pemilik: backend

## Tujuan
Order bergerak hanya lewat transisi sah, tonase aktual + QC menyesuaikan nilai order dengan aturan toleransi, dan supplier mencatat traceability per-pesanan dengan penanda suhu di luar batas.

## Scope
### Termasuk
- Migrasi `0007_order_lifecycle_trace.sql`: trigger `core.order_status_guard` (tabel transisi FD §4.1, termasuk syarat `buyer_approval <> 'pending'` untuk `dipesan→dikonfirmasi`), `core.traceability_record` (unik per order), `core.temperature_log`.
- `packages/shared/src/state/order.ts`: tabel transisi yang sama (sumber tunggal untuk service, UI, dan uji; trigger DB dicek sinkron lewat uji).
- `POST /orders/{id}/actual-tonnage` (supplier pemilik, status `dipesan`, sebelum QC), `POST /orders/{id}/qc` (ops_admin: `accepted_kg`, `qc_grade_id` sama/turun + harga baru bila turun): hitung `value_final` = `computeValue`, selisih % vs `ordered_kg`, bandingkan setting `order.tonnage_tolerance_pct` (inklusif); ≤ toleransi dan grade sama → `dikonfirmasi`; selainnya → `buyer_approval=pending` + notifikasi buyer (nilai lama/baru).
- `POST /orders/{id}/adjustment/approve|reject` (buyer pemilik): approve → `dikonfirmasi`; reject → `dibatalkan` kode `BUYER_REJECTED_ADJUSTMENT`.
- `POST /orders/{id}/reopen-qc` (ops_admin, alasan wajib).
- `POST /orders/{id}/transition {to, reason?, version}`: `diproses`, `dikirim` (syarat traceability lengkap; syarat dokumen jalan diaktifkan di 023 lewat flag setting `order.require_delivery_note`, default false di plan ini), `dibatalkan` (aturan pelaku FD §4.1; `dikirim→dibatalkan` butuh `management_approval_by`); versi optimistic → 409 `STALE_VERSION`; transisi tidak sah → 409 `INVALID_TRANSITION` + daftar transisi yang diizinkan.
- `PUT /orders/{id}/traceability` (supplier pemilik / ops_admin; status `dipesan|dikonfirmasi|diproses`), `POST /orders/{id}/traceability/temperature-logs` (manual atau upload CSV/PDF/JPG ≤10 MB). Entri di luar `spec_snapshot.temp_min_c..temp_max_c` → `out_of_range=true`, record `has_out_of_range=true`, notifikasi ops_admin.
- `GET /orders?status=&cursor=` per peran (buyer/supplier: milik; internal: semua) + `GET /orders/{id}` dengan riwayat status dan traceability (buyer: termasuk nama nelayan, tanpa kontak).
- Audit: `order.tonnage_submitted`, `order.qc`, `order.tonnage_adjusted` (nilai lama/baru), `order.status_changed`, `order.cancelled`, `traceability.*`; `domain_event` `order.confirmed`, `order.received`, `order.cancelled` (untuk Scope 2).
- Endpoint sementara `POST /orders/{id}/receive` minimal (buyer pemilik / ops_admin) agar alur bisa diuji sampai `diterima`; bukti foto & dokumen lengkap di 023.
### Tidak termasuk
Dokumen jalan PDF, upload dokumen ekspor, foto bukti terima (023); UI (024-026); invoice (Scope 2).

## Acceptance criteria
AC1. Diberikan PO 1.000 kg @ Rp100.000, ketika supplier mengonfirmasi 950 kg dan admin QC menyetujui 950 kg grade sama, maka `value_final` = 95.000.000 (rupiah), status `dikonfirmasi` (selisih 5% = toleransi, inklusif), buyer mendapat notifikasi selisih, dan `audit_event` `order.tonnage_adjusted` memuat nilai lama 100.000.000 dan baru 95.000.000.
AC2. Diberikan PO 1.000 kg, ketika aktual 940 kg (6%) disetujui QC, maka status tetap `dipesan`, `buyer_approval=pending`; `POST /transition {to:"diproses"}` → 409; setelah buyer `approve`, status `dikonfirmasi`.
AC3. Diberikan `buyer_approval=pending`, ketika buyer `reject`, maka status `dibatalkan` dengan `cancel_code=BUYER_REJECTED_ADJUSTMENT` dan tercatat di audit.
AC4. Diberikan order `dipesan`, ketika `transition` ke `dikirim` atau `diterima` (lompatan), maka 409 `INVALID_TRANSITION` berisi transisi yang diizinkan; `UPDATE core."order" SET status='diterima'` langsung di DB sebagai `app_ops` juga ditolak trigger.
AC5. Diberikan order `diproses` tanpa traceability atau tanpa log suhu, ketika `transition` ke `dikirim`, maka 409 dengan kode `TRACEABILITY_INCOMPLETE`.
AC6. Diberikan order Tuna loin grade A (-25..-18 °C), ketika supplier mengisi traceability (TPI asal, tanggal tangkap, kapal) + log suhu -12 °C, maka record tersimpan, entri `out_of_range=true`, badge `has_out_of_range`, ops_admin menerima notifikasi; buyer order itu melihat traceability, buyer lain → 403.
AC7. Diberikan dua admin mengubah status dengan `version` sama, ketika dikirim bersamaan, maka satu 200 dan satu 409 `STALE_VERSION`.
AC8. Diberikan order `dibatalkan` tanpa `reason`, ketika dikirim, maka 422; dengan reason → 200 dan `order_status_history` memuat alasan.
AC9. Diberikan alur penuh `dipesan → dikonfirmasi → diproses → dikirim → diterima`, ketika selesai, maka `order_status_history` 4 baris berurutan, `domain_event` memuat `order.confirmed` dan `order.received`, dan `make audit-verify` keluar 0.
AC10. Diberikan setting toleransi diubah ke 7%, ketika aktual 940 kg, maka langsung `dikonfirmasi` (nilai dari setting, bukan hard-code). `make ci` (unit test tabel transisi sinkron dengan trigger + harness otorisasi) lulus.

## Catatan teknis
Referensi FD F2.2, F2.3, F3.2, §4.1, §5; TDD §3.2. Contoh angka AC1 berasal dari AC PRD F2.2. Uji sinkron: skrip membaca tabel transisi TS lalu mencoba semua pasangan status di DB uji dan membandingkan hasil trigger.

## Handback (diisi Developer)
Tanggal | File diubah | Cara menjalankan | Belum selesai | Catatan untuk QA

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
