# Plan 019 — master-data-harga-listing-katalog
Perusahaan: Xavortree | Project: gocean-b2b | Modul: F1.1, F1.2, F1.3, F1.5 (data) | Ukuran: M | Status: Siap (mulai setelah 018 PASS) | Pemilik: backend

## Tujuan
Admin mengelola master data spesifikasi baku (ID/EN) dan harga per segmen; supplier aktif membuat listing yang dikurasi admin; buyer melihat katalog terkurasi dengan harga segmennya tanpa identitas supplier.

## Scope
### Termasuk
- Migrasi `0005_master_listing.sql`: `core.commodity`, `core.grade` (temp_min_c, temp_max_c, CHECK min ≤ max), `core.size_class`, `core.cut_type`, `core.price_list` (+ exclusion constraint/validasi overlap periode per kunci), `core.listing`, `core.listing_photo`; enum `listing_status`.
- Endpoint FD §7.2 area Master dan Listing: CRUD master (ops_admin), `deactivate`, `DELETE` → 409 `IN_USE` bila dirujuk listing (dan kelak RFQ/order: cek FK generik), `GET` master untuk dropdown (semua login, hanya aktif, label sesuai `locale`).
- Price list CRUD (ops_admin); segmen ekspor wajib USD, horeca/grosir wajib IDR (422 bila tidak).
- Listing: supplier `active` (ActiveOrgGuard) buat/ubah/submit; foto JPG/PNG ≤5 MB maks 6, EXIF di-strip (sharp) sebelum simpan; status FD F1.2; ubah spesifikasi/harga pada `terkurasi` → kembali `menunggu_kurasi`; `POST /admin/listings/{id}/curate`.
- `GET /catalog` (buyer active): hanya listing `terkurasi` dengan `remaining_kg > 0`; respons TIDAK memuat supplier_org_id, nama/HP/alamat supplier, `buy_price_per_kg`; lokasi = provinsi; harga = price_list segmen buyer yang berlaku hari ini, atau `null` + flag `price_on_request`.
- Master nama wajib `name_id` dan `name_en`; respons memilih label sesuai `Accept-Language`/`user.locale`.
- Seed dev: master contoh TDD §3.6 + price list 3 segmen + 3 listing (2 terkurasi, 1 menunggu).
- Audit: `master.*`, `price_list.*`, `listing.status_changed`, `listing.curated`.
### Tidak termasuk
RFQ (020), UI (022/024/025), impor massal master dari Excel (plan lanjutan bila Gocean kirim data), pencarian full-text.

## Acceptance criteria
AC1. Diberikan ops_admin, ketika menambah grade "A" untuk komoditas "Tuna loin" dengan suhu min -25 dan max -18, maka `GET /master/grades?commodity_id=` (sebagai buyer) memuat grade itu dengan label sesuai locale.
AC2. Diberikan grade dipakai listing, ketika ops_admin `DELETE` grade itu, maka 409 `IN_USE`; ketika `deactivate`, maka 200 dan grade tidak muncul di `GET` dropdown tetapi listing lama tetap menampilkan labelnya.
AC3. Diberikan grade dengan min -18 dan max -25 (terbalik) atau tanpa `name_en`, ketika disimpan, maka 422.
AC4. Diberikan supplier active, ketika membuat listing lengkap + 1 foto lalu submit, maka status `menunggu_kurasi` dan listing tidak muncul di `GET /catalog` buyer; setelah admin `curate {decision:"approve"}`, muncul.
AC5. Diberikan supplier `pending_verification`, ketika `POST /listings`, maka 403 `ACCOUNT_NOT_VERIFIED`.
AC6. Diberikan buyer membuka `GET /catalog` dan `GET /catalog/{id}`, ketika respons JSON diperiksa, maka tidak ada field/teks yang memuat nama org supplier, HP, alamat, `supplier_org_id`, atau `buy_price_per_kg`; foto yang diunduh tidak memiliki tag EXIF GPS.
AC7. Diberikan price list Tuna loin grade A: ekspor USD 12,50/kg dan horeca IDR 185.000/kg, ketika buyer horeca membuka katalog, maka hanya harga IDR 185.000 yang tampil; ketika buyer ekspor, maka hanya USD 12,50.
AC8. Diberikan price list horeca untuk kunci yang sama dengan periode tumpang tindih, ketika disimpan, maka 409.
AC9. Diberikan supplier mengubah harga beli listing `terkurasi`, ketika disimpan, maka status kembali `menunggu_kurasi` dan hilang dari katalog.
AC10. Diberikan supplier lain, ketika `PATCH /listings/{id}` milik supplier pertama, maka 403 + `security_event`; `make ci` harness otorisasi lulus untuk semua endpoint baru.

## Catatan teknis
Referensi FD F1.1-F1.3, F1.5, §3, §5; TDD §3.2. Uang disimpan satuan terkecil (USD 12,50 = 1250 sen). Serializer katalog dibuat eksplisit (allowlist field), jangan spread entity. Deteksi `IN_USE` via penangkapan FK violation 23503 → 409.

## Handback (diisi Developer)
Tanggal | File diubah | Cara menjalankan | Belum selesai | Catatan untuk QA

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
