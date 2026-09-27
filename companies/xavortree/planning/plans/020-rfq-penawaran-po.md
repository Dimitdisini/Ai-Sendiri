# Plan 020 — rfq-penawaran-po
Perusahaan: Xavortree | Project: gocean-b2b | Modul: F1.4, F2.1, F2.6 | Ukuran: M | Status: Siap (mulai setelah 019 PASS) | Pemilik: backend

## Tujuan
Buyer mengajukan RFQ berspesifikasi baku, admin membalas penawaran berversi dari listing supplier, buyer setuju/tolak/negosiasi, dan persetujuan menerbitkan tepat satu PO bernomor unik dengan spesifikasi dan harga yang dibekukan.

## Scope
### Termasuk
- Migrasi `0006_rfq_order.sql`: `core.rfq`, `core.quote`, `core."order"` (kolom FD §3, status awal saja — trigger transisi lengkap di 021), `core.order_status_history`; enum `rfq_status`, `quote_status`, `order_status` (semua nilai FD §4.1 sudah didefinisikan).
- Endpoint FD §7.2 area RFQ: `POST/GET /rfqs`, `GET /rfqs/{id}`, `POST /rfqs/{id}/quotes` (ops_admin: listing_id, sell_price_per_kg, buy_price_per_kg, tonnage_kg, ship_date, valid_until default setting 48 jam), `POST /rfqs/{id}/quotes/{v}/accept|reject|counter` (buyer pemilik), `POST /rfqs/{id}/cancel`, `POST /orders/{id}/reorder`.
- Validasi RFQ FD F1.4 (field wajib → 422 dengan daftar field; tanggal ≥ besok; master aktif). Mata uang penawaran = mata uang segmen buyer.
- Versi penawaran: penawaran baru → versi sebelumnya `digantikan`; accept hanya versi terakhir `aktif` dan belum kedaluwarsa → selain itu 409 `QUOTE_NOT_ACTIVE`. Counter menaikkan `negotiation_round`; > setting `rfq.max_negotiation_rounds` → 409 kecuali admin membuka ulang.
- Accept dalam satu transaksi: order `dipesan`, nomor `GCN-PO-YYYYMM-NNNNN` via `core.doc_counter`, `spec_snapshot` (label ID/EN + rentang suhu), harga jual & beli, `ordered_kg`, `value_initial`; listing `remaining_kg` dikurangi (min 0, → `habis`); RFQ `disetujui`; audit `order.created`; `domain_event` `order.created`. Wajib `Idempotency-Key`.
- Job worker: penawaran lewat `valid_until` → `kedaluwarsa`; RFQ tanpa aksi 7 hari setelah penawaran kedaluwarsa → `kedaluwarsa`.
- Tampilan per pihak: buyer melihat RFQ/penawaran tanpa `buy_price_per_kg` dan tanpa identitas supplier; supplier melihat order miliknya tanpa identitas buyer dan tanpa `sell_price_per_kg` (serializer allowlist).
- Notifikasi in-app + email: penawaran baru (buyer), PO terbit (buyer, supplier, ops_admin).
- Nomor RFQ `RFQ-YYMM-NNNN`. Audit semua aksi RFQ/penawaran.
### Tidak termasuk
Transisi order setelah `dipesan`, tonase, traceability (021), dokumen (023), UI (024-026), notifikasi WA (Scope 2).

## Acceptance criteria
AC1. Diberikan buyer active, ketika `POST /rfqs` tanpa `grade_id` dan tanpa `tonnage_kg`, maka 422 dengan `fields` memuat keduanya dan tidak ada RFQ tersimpan.
AC2. Diberikan RFQ lengkap, ketika ops_admin mengirim penawaran, maka buyer menerima notifikasi in-app + email (Mailpit) dan `GET /rfqs/{id}` (buyer) menampilkan harga jual, tonase, tanggal kirim, masa berlaku, tanpa field `buy_price_per_kg` maupun identitas supplier.
AC3. Diberikan buyer menekan setuju pada penawaran aktif, ketika `accept`, maka 1 order `dipesan` bernomor format `GCN-PO-YYYYMM-NNNNN` terbit berisi spesifikasi, tonase, harga; `audit_event` `order.created` memuat waktu dan pelaku buyer.
AC4. Diberikan dua request `accept` paralel dengan `Idempotency-Key` sama (dan satu lagi dengan key berbeda), ketika dieksekusi, maka tepat 1 order tercipta; request berkey berbeda mendapat 409 `QUOTE_NOT_ACTIVE`.
AC5. Diberikan penawaran v1 lalu admin kirim v2, ketika buyer `accept` v1, maka 409 `QUOTE_NOT_ACTIVE`.
AC6. Diberikan penawaran dengan `valid_until` lewat (manipulasi waktu/seed), ketika job kedaluwarsa berjalan dan buyer `accept`, maka status `kedaluwarsa` dan 409.
AC7. Diberikan negosiasi 5 putaran, ketika buyer `counter` ke-6, maka 409.
AC8. Diberikan PO terbit, ketika master grade kemudian diganti label/suhunya, maka `GET /orders/{id}` tetap menampilkan label dan rentang suhu saat PO terbit.
AC9. Diberikan supplier pemilik listing, ketika `GET /orders/{id}`, maka respons tanpa nama/kontak buyer dan tanpa `sell_price_per_kg`; buyer lain → 403 + `security_event`.
AC10. Diberikan order lama `diterima` (seed), ketika buyer `POST /orders/{id}/reorder`, maka RFQ `draft` baru terisi spesifikasi, tonase, tujuan yang sama dan bisa di-`PATCH` sebelum diajukan. `make ci` harness otorisasi lulus.

## Catatan teknis
Referensi FD F1.4, F2.1, F2.6, §3, §4.4, §5; TDD §3.2. ASUMSI-FD-1 (1 RFQ → 1 supplier), FD-2, FD-3 berlaku. Konkurensi accept: `SELECT ... FOR UPDATE` pada quote. Nilai = round half-up (tonase × harga) dalam satuan terkecil; letakkan fungsi `computeValue` di `packages/shared` + unit test (dipakai 021).

## Handback (diisi Developer)
Tanggal | File diubah | Cara menjalankan | Belum selesai | Catatan untuk QA

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
