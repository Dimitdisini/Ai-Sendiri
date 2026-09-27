# FD — Gocean B2B E-Commerce & Order Management System
Perusahaan: Xavortree (mitra teknologi) untuk klien PT Gocean Indonesia | Pemilik: Analyst (Bima) | Turunan dari: PRD.md v0.2 (disetujui CEO, Q25=A) | Status: Draft, menunggu review CEO | Versi: 0.1 (2026-09-27)

Cakupan: seluruh fitur F1-F6 PRD v0.2. Scope 1 (F1-F3) ditulis sampai level siap-plan; Scope 2 (F4-F6) ditulis sampai level kontrak internal, detail vendor menunggu sandbox (lihat §8). Keputusan CEO yang mengikat: Q16 (Dual Environment), Q17 (dana hanya lewat PG berlisensi), Q18/Q19 (ops jam kerja, PIC Ahmad), Q20 (traceability per-pesanan, chat via WA Business API), Q22 (nomor WA Gocean penghubung tunggal), Q23 (biaya WA ke Gocean). Angka A-PRD-1..5 dipakai sebagai nilai default yang bisa diubah lewat konfigurasi, bukan hard-code. Detail teknis (stack, vendor, hosting) di TDD.md.

Penanda: [ASUMSI-FD-n] = keputusan fungsional Analyst yang belum dikonfirmasi klien, dikumpulkan di §8.

## 1. Peta layar atau alur
Satu aplikasi web responsif/PWA, bahasa ID/EN (F1.5). Fungsi dana (F4/F5) tampil di aplikasi terpisah `keuangan.<domain>` (Dual Environment b, §6).

| Kode | Layar / kanal | Peran | Isi utama | Fitur |
|---|---|---|---|---|
| L01 | Daftar akun | publik | pilih jenis (buyer/supplier), data organisasi, PIC, email, HP, password, unggah KTP/NIB, data rekening (supplier) | F3.1 |
| L02 | Login + 2FA | semua pengguna | email + password; TOTP wajib untuk ops_admin, finance, sysadmin | F3.5 |
| L03 | Beranda per peran | semua | ringkasan tugas: RFQ baru (admin), order aktif, tindakan tertunda | - |
| L04 | Katalog | buyer | listing terkurasi, filter komoditas/grade/ukuran/potongan, harga sesuai segmen & mata uang | F1.2, F1.3 |
| L05 | Form RFQ | buyer | spesifikasi dari master data, tonase, tanggal kirim diinginkan, tujuan, catatan; draft lokal offline | F1.4, F2.6 |
| L06 | Daftar & detail RFQ | buyer, ops_admin | status RFQ, riwayat penawaran, tombol Setuju/Tolak/Negosiasi | F1.4 |
| L07 | Listing saya | supplier | buat/ubah listing: spesifikasi, estimasi tonase, harga beli yang diajukan, foto | F1.2 |
| L08 | Daftar & detail order | buyer, supplier, ops_admin, finance (baca) | status bertahap, spesifikasi, tonase pesan vs aktual, dokumen, traceability, riwayat | F2.x, F3.2 |
| L09 | Konfirmasi tonase + traceability | supplier | 1 layar: tonase aktual, asal/TPI, tanggal tangkap, kapal/nelayan, log suhu (manual/upload), foto | F2.2, F3.2 |
| L10 | Konsol admin order | ops_admin | kurasi listing, cocokkan RFQ ke listing, kirim penawaran, QC grade, terbitkan dokumen jalan, unggah dokumen ekspor, konfirmasi serah terima atas nama buyer | F1.2, F1.4, F2.x |
| L11 | Master data | ops_admin | komoditas, grade, ukuran, potongan, rentang suhu, label ID/EN, harga per segmen | F1.1, F1.3, F1.5 |
| L12 | Verifikasi akun (KYC) | ops_admin | antrean pendaftar, lihat dokumen, setujui/tolak dengan alasan | F3.1 |
| L13 | Dashboard | management, investor | GMV, volume per komoditas, margin (management saja), pengguna aktif; filter periode | F3.4 |
| L14 | Ekspor laporan | management, ops_admin | filter tanggal → CSV/XLSX sesuai hak | F3.6 |
| L15 | Audit log | management, sysadmin (baca) | cari per entitas/pelaku/periode, tanpa tombol ubah/hapus | F3.3 |
| L16 | Pengguna & peran | sysadmin | kelola akun internal, reset 2FA, nonaktifkan akun, lihat log akses ditolak | F3.5 |
| K01 | Invoice & pembayaran | finance (tulis), buyer (lihat invoice sendiri) | invoice, termin, VA, status bayar, antrean selisih | F5.x, F4.1 |
| K02 | Aturan split & disbursement | finance | aturan per order, pratinjau nominal, approval berjenjang, status, ulangi gagal | F4.2, F4.3, F4.6 |
| K03 | Ledger & rekonsiliasi | finance | ledger per transaksi, cocokkan dengan laporan settlement PG, ekspor akuntansi | F4.4, F5.3, F5.4 |
| K04 | Penerima dana (nelayan) | finance | daftar beneficiary P4: nama, rekening, HP WA, supplier induk | F4.2 |
| C01 | Konsol chat per order | ops_admin | thread WA per order/RFQ, balas, teruskan ke pihak lain (tersamar), pesan ditahan | F6.1-F6.3 |
| WA | WhatsApp nomor resmi Gocean | buyer, supplier, nelayan | chat dua arah dengan admin; notifikasi template | F6.x |

### Alur utama (sesuai PRD §2.2)
- **A1 Onboarding**: L01 daftar → akun `pending_verification` (bisa login, hanya lihat profil) → L12 admin verifikasi → `active` → boleh RFQ (buyer) / listing (supplier). Audit: `account.registered`, `account.verified|rejected`.
- **A2 RFQ → PO**: L05 buyer kirim RFQ → L10 admin cocokkan ke listing (identitas tersamar dua arah) → admin kirim penawaran (harga jual, tonase, tanggal kirim, masa berlaku) → buyer L06: Setuju → PO terbit (order `dipesan`) | Tolak → RFQ `ditolak` | Negosiasi (harga/tonase/tanggal usulan) → admin kirim penawaran versi berikut.
- **A3 Fulfilment**: supplier L09 isi tonase aktual + traceability → admin QC grade → nilai order disesuaikan → (selisih > toleransi → persetujuan buyer) → `dikonfirmasi` → admin `diproses` → dokumen jalan + dokumen ekspor → `dikirim` → buyer/admin konfirmasi terima → `diterima`.
- **A4 Dana (Scope 2)**: QC disetujui → invoice terbit (≤24 jam) → VA per tagihan → callback PG → lunas → order `diterima` + invoice lunas → aturan split → disbursement (auto ≤ batas, approval > batas) → callback sukses/gagal → ledger → notifikasi WA ke supplier/nelayan.
- **A5 Chat (Scope 2)**: pesan WA masuk ke nomor Gocean → webhook → dicocokkan ke order → C01 → admin balas / teruskan tersamar → arsip.

## 2. Detail per fitur
### 2.1 F1 Katalog & Marketplace
| ID | Input dan aturan bisnis | Validasi, kasus tepi, pesan error |
|---|---|---|
| F1.1 Master data | Entitas: `commodity` (kode, nama_id, nama_en, satuan kg), `grade` (per komoditas), `size_class` (per komoditas, label mis. "3-5 kg/ekor"), `cut_type` (loin, whole, fillet, ...), rentang suhu simpan (`temp_min_c`, `temp_max_c`) melekat di kombinasi komoditas+grade. Semua punya `is_active`. Label wajib ID dan EN. | Kode unik per tipe (409 `DUPLICATE_CODE`). `temp_min_c ≤ temp_max_c` (catat: suhu beku negatif, "-18 s/d -25" disimpan min=-25, max=-18). Hapus master yang dirujuk RFQ/listing/order mana pun → 409 `IN_USE`, UI menawarkan Nonaktifkan. Master nonaktif tidak muncul di dropdown baru, tetap tampil di data lama. |
| F1.2 Listing stok | Supplier `active` membuat listing: komoditas, grade, ukuran, potongan (dari master), estimasi tonase kg, harga beli yang diajukan per kg (IDR), lokasi (kabupaten/provinsi), tanggal tersedia, ≥1 foto (JPG/PNG ≤5 MB, maks 6). Status: `draft` → `menunggu_kurasi` → `terkurasi` / `ditolak` (alasan) → `habis` / `diarsip`. Supplier boleh ubah tonase/tanggal pada listing `terkurasi`; perubahan spesifikasi atau harga mengembalikan ke `menunggu_kurasi`. | Buyer hanya melihat listing `terkurasi` dan tonase > 0. Tampilan buyer: tanpa nama/HP/alamat/nama organisasi supplier; lokasi hanya provinsi; foto di-strip EXIF (GPS). Harga beli supplier TIDAK pernah tampil ke buyer; buyer melihat harga jual segmen (F1.3). Supplier belum `active` → 403 `ACCOUNT_NOT_VERIFIED`. |
| F1.3 Harga per segmen | `price_list`: (komoditas, grade, ukuran, potongan, segmen ∈ {ekspor, horeca, grosir}, mata uang, harga per kg, berlaku_dari, berlaku_sampai). Segmen ekspor = USD, horeca/grosir = IDR. Segmen buyer ditentukan di organisasi buyer saat verifikasi (bukan dipilih buyer). | Katalog hanya menampilkan harga segmen buyer yang login; tidak ada harga → tampil "Harga atas permintaan (RFQ)". Tumpang tindih periode untuk kunci yang sama → 409. Harga katalog = harga indikatif; harga mengikat hanya di penawaran (F1.4). |
| F1.4 RFQ & penawaran | RFQ: komoditas, grade, ukuran, potongan (wajib), tonase kg (wajib, >0), tanggal kirim diinginkan (≥ hari ini + 1), tujuan (kota/pelabuhan), incoterm opsional (ekspor), catatan. Admin memilih listing sumber (1 supplier per RFQ, [ASUMSI-FD-1]) lalu mengirim penawaran: harga jual per kg + mata uang segmen, tonase, tanggal kirim, masa berlaku (default 48 jam, [ASUMSI-FD-2]), harga beli supplier (internal, tidak tampil ke buyer). Buyer: Setuju / Tolak (alasan opsional) / Negosiasi (usulan harga, tonase, tanggal). Setiap penawaran baru = versi baru; hanya versi terakhir yang bisa disetujui. | Field wajib kosong → 422 dengan daftar field, form menandai. Setuju pada penawaran kedaluwarsa atau bukan versi terakhir → 409 `QUOTE_NOT_ACTIVE`. Double-click Setuju → idempoten (header `Idempotency-Key`), PO hanya satu. Notifikasi penawaran baru: in-app + email (Scope 1), + WA template (Scope 2). Batas negosiasi 5 putaran [ASUMSI-FD-3], setelahnya hanya admin yang bisa membuka ulang. |
| F1.5 Dwibahasa | Semua label UI lewat kamus i18n; master data menyimpan `name_id` dan `name_en`. Bahasa per pengguna (`user.locale`), default ID; buyer segmen ekspor default EN. Format angka/tanggal mengikuti locale; zona waktu tampilan WIB. | Label master data EN kosong → tidak bisa disimpan (wajib). Dokumen PDF (dokumen jalan, invoice) dicetak dalam bahasa penerima dokumen. |

### 2.2 F2 Order Management
| ID | Input dan aturan bisnis | Validasi, kasus tepi, pesan error |
|---|---|---|
| F2.1 PO | Buyer menyetujui penawaran aktif → dalam satu transaksi DB: order dibuat status `dipesan`, nomor `GCN-PO-YYYYMM-NNNNN` (urut per bulan, tanpa lubang tidak dijamin), salinan spesifikasi + harga jual + harga beli + tonase dipesan dibekukan di order (tidak ikut berubah bila master/price list berubah), RFQ → `disetujui`, audit `order.created`. Notifikasi ke supplier (tanpa identitas buyer) dan admin. | Listing sumber tonase < tonase penawaran → PO tetap terbit, admin mendapat peringatan (stok estimasi, bukan stok pasti). Tonase listing dikurangi tonase PO; negatif → 0 + `habis`. |
| F2.2 Tonase aktual | Supplier mengisi tonase aktual (kg, 1 desimal) di L09 saat order `dipesan`. Admin QC: grade diterima (sama / diturunkan ke grade lain dengan harga baru), tonase diterima. Nilai order baru = round(tonase_aktual × harga_per_kg) (IDR ke rupiah, USD ke sen, half-up). Selisih % = abs(aktual − dipesan) / dipesan. Selisih ≤ toleransi (default 5%, konfigurasi `order.tonnage_tolerance_pct`, A-PRD-1) → langsung `dikonfirmasi`. Selisih > toleransi atau grade diturunkan → flag `buyer_approval = pending`, status tetap `dipesan`, buyer diberi notifikasi dengan nilai lama/baru: Setuju → `dikonfirmasi`; Tolak → order `dibatalkan` alasan `BUYER_REJECTED_ADJUSTMENT`. | Audit mencatat tonase & nilai lama dan baru. Supplier ubah tonase setelah QC → tidak bisa (409); hanya admin yang bisa membuka ulang QC (alasan wajib, audit). Tonase aktual 0 → sama dengan pembatalan, butuh admin. Contoh AC PRD: 1.000 kg @ Rp100.000, aktual 950 kg → Rp95.000.000, selisih 5% ≤ 5% → tidak perlu persetujuan buyer (batas inklusif). |
| F2.3 Status order | State machine §4.1. Hanya transisi di tabel §4.1 yang sah; lainnya → 409 `INVALID_TRANSITION` dengan status sekarang dan transisi yang diizinkan. `dibatalkan` wajib alasan (kode + teks). Setiap transisi = baris `order_status_history` + audit `order.status_changed`. | Update konkuren → optimistic lock (`version`), yang kalah dapat 409 `STALE_VERSION`. |
| F2.4 Dokumen jalan & dokumen ekspor | "Terbitkan dokumen jalan" hanya di `diproses`: PDF berisi nomor order, nomor dokumen `GCN-DJ-...`, spesifikasi, tonase aktual, rentang suhu wajib, asal (provinsi), tanggal, tanda terima kosong. Versi bisa diterbitkan ulang (v2, v3), versi lama tetap tersimpan. Upload dokumen: tipe ∈ {health_certificate, karantina, packing_list, coo, lainnya}, PDF/JPG/PNG ≤10 MB. Hak unduh: buyer order itu, admin, finance, management. Supplier melihat dokumen jalan versi supplier (tanpa nama/alamat buyer, tujuan = titik serah Gocean, [ASUMSI-FD-4]). | File >10 MB → 413; tipe lain → 415 (dicek dari magic bytes, bukan ekstensi). Buyer lain / supplier minta dokumen ekspor → 403 + log akses ditolak. Unduh lewat URL bertanda tangan berumur 5 menit. |
| F2.5 Serah terima | Di `dikirim`: buyer menekan "Terima" (opsional foto/catatan kondisi), atau admin "Terima atas nama buyer" dengan wajib ≥1 foto bukti. → `diterima`, `received_at`. Memicu event `order.received` (dipakai F4/F5 di Scope 2; di Scope 1 hanya audit + notifikasi). | Klaim kerusakan/susut saat terima: v1 dicatat sebagai catatan + foto, tidak mengubah nilai otomatis; penyesuaian nilai setelah terima lewat nota kredit Scope 2 [ASUMSI-FD-5]. |
| F2.6 Pesan ulang | Pada order `diterima` milik buyer → RFQ baru draft terisi spesifikasi, tonase, tujuan; buyer bisa ubah sebelum kirim. | Master yang sudah nonaktif → field dikosongkan dan ditandai. |

### 2.3 F3 Supplier, Traceability & Dashboard
| ID | Input dan aturan bisnis | Validasi, kasus tepi, pesan error |
|---|---|---|
| F3.1 Registrasi & KYC ringan | Buyer: nama organisasi, NIB (atau paspor/registrasi asing untuk buyer ekspor), NPWP opsional, alamat, PIC (nama, email, HP), dokumen NIB/KTP PIC. Supplier: nama/UD, KTP pemilik (NIK), NIB opsional, alamat, HP, rekening bank (bank, nomor, nama pemilik), dokumen KTP. Status akun: `pending_verification` → `active` / `rejected` (alasan, bisa daftar ulang) ; `active` ↔ `suspended` (admin, alasan). Admin set segmen buyer saat verifikasi. Buyer org bisa punya >1 user (diundang oleh PIC, [ASUMSI-FD-6]). | Email unik; HP format E.164 (+62...). NIK 16 digit; nomor rekening 6-20 digit. Dokumen JPG/PNG/PDF ≤5 MB. `pending`/`rejected`/`suspended` → endpoint RFQ/listing 403 `ACCOUNT_NOT_VERIFIED`. NIK, nomor rekening, dan file KYC disimpan terenkripsi; tampil ke admin dengan masking kecuali tombol "Tampilkan" (tercatat di audit `pii.revealed`). Perubahan rekening supplier setelah aktif → wajib verifikasi ulang admin (rekening lama tetap dipakai sampai disetujui). |
| F3.2 Traceability per-pesanan | Satu catatan per order (Q20): lokasi/TPI asal (teks + provinsi), tanggal tangkap (≤ hari ini), kapal/nelayan (teks, opsional tautan beneficiary P4), log suhu ≥1 entri: manual (waktu, suhu °C, lokasi titik: tangkap/penyimpanan/muat) atau upload file (CSV/PDF/JPG ≤10 MB) (A-PRD-5). Diisi saat `dipesan`/`dikonfirmasi`/`diproses`; wajib lengkap sebelum `dikirim`. | Entri suhu di luar rentang master komoditas+grade order → entri ditandai `out_of_range`, catatan diberi badge "suhu di luar batas", notifikasi admin; tidak memblokir alur (admin memutuskan). Upload file tanpa entri manual tetap sah (dianggap 1 entri bertipe file). Buyer melihat traceability order miliknya saja; nama nelayan tampil, kontaknya tidak. Granularitas per-item/karton tidak didukung. |
| F3.3 Audit log | Kejadian wajib dicatat (daftar minimal): akun (registered, verified, rejected, suspended, role_changed, 2fa_enabled/reset, login_failed berulang), master data & harga (create/update/deactivate), listing (status), RFQ/penawaran (semua), order (created, status_changed, tonnage_adjusted, qc, cancelled), dokumen (issued, uploaded, downloaded dokumen KYC/ekspor), traceability (created/updated), pii.revealed, ekspor laporan; Scope 2: invoice, pembayaran, split, disbursement, approval, chat. Field: waktu (UTC), pelaku (user id + peran, atau `system`/`webhook:<sumber>`), aksi, tipe+id entitas, nilai lama, nilai baru (JSON, PII dimasking), IP, user agent, request id. | Tidak ada endpoint ubah/hapus. Di DB: tabel append-only (tanpa hak UPDATE/DELETE + trigger penolak) dan rantai hash untuk bukti tidak dirusak (TDD §3.3). Audit gagal ditulis → transaksi bisnis ikut gagal (satu transaksi). Log akses ditolak (403) dicatat di tabel terpisah `security_event`. |
| F3.4 Dashboard | Metrik bulan berjalan dan periode pilihan: GMV = Σ nilai akhir order `diterima` dengan `received_at` dalam periode, dipisah per mata uang (IDR, USD) + total setara IDR memakai kurs referensi yang dicatat di order (§7.4); volume kg per komoditas; margin = Σ(nilai jual − nilai beli) order `diterima` (management saja); pengguna aktif = buyer/supplier org dengan ≥1 RFQ/listing/order dalam periode; jumlah order per status. | Investor (A-PRD-4): hanya agregat, tanpa nama/kontak pihak, tanpa harga per pihak, tanpa margin per order; agregat dengan <3 pihak kontributor disembunyikan ("data tidak cukup") agar tidak bisa ditebak [ASUMSI-FD-7]. QA acuan: GMV dashboard = query acuan SQL di TDD §3.5, selisih 0. |
| F3.5 RBAC | Matriks §5. 2FA TOTP wajib untuk ops_admin, finance, sysadmin; opsional untuk peran lain. Sesi idle 30 menit untuk peran internal, 7 hari untuk buyer/supplier (PWA) [ASUMSI-FD-8]. | Akses ke resource di luar hak → 403 `FORBIDDEN` + `security_event` (user, resource, waktu, IP). Sengaja 403 (bukan 404) sesuai AC PRD. 5 kali gagal login dalam 15 menit → kunci 15 menit. |
| F3.6 Ekspor | Filter tanggal (maks 12 bulan per ekspor), format CSV/XLSX, kolom sesuai hak peran (investor tidak punya akses ekspor order). | Ekspor tercatat di audit `report.exported`. >50.000 baris → diproses background, tautan unduh dikirim in-app. |

### 2.4 F4 Fintech & Split Disbursement (Scope 2)
Prinsip Q17: dana hanya mengalir di payment gateway berlisensi (vendor di TDD §4.1). Tidak ada saldo/dompet pengguna di platform. Semua fungsi di aplikasi `keuangan` (§6).
| ID | Input dan aturan bisnis | Validasi, kasus tepi, pesan error |
|---|---|---|
| F4.1 Pembayaran VA | Tiap tagihan (installment) mendapat VA unik closed-amount dari PG, bank pilihan buyer (daftar bank yang didukung PG). Callback PG `paid` → cocokkan ke tagihan lewat `external_id` → rekonsiliasi F5.3. | Callback tanpa token/tanda tangan valid → 401, dicatat. Callback ganda → idempoten (kunci = id pembayaran PG). VA kedaluwarsa → buat VA baru (tagihan sama). Metode bayar USD untuk buyer ekspor: [ASUMSI] lihat A27 di KEPUTUSAN.md. |
| F4.2 Aturan split | Per order: daftar penerima {Gocean fee, supplier, beneficiary nelayan 0..n} dengan persen (2 desimal). Basis = nilai tagihan lunas dikurangi biaya PG (MDR) yang ditampilkan terpisah (Q18). Pratinjau nominal per penerima; pembulatan ke rupiah ke bawah, sisa pembulatan ke Gocean fee. Default aturan dari template per supplier. | Σ persen ≠ 100,00 → 422 `SPLIT_NOT_100`. Penerima tanpa rekening terverifikasi → 422. Aturan terkunci setelah disbursement pertama dikirim. |
| F4.3 Disbursement | Syarat: invoice lunas penuh + order `diterima` (+ Q26). Per penerima 1 instruksi payout. Nominal ≤ batas (default Rp50.000.000 per instruksi, konfigurasi, A-PRD-2) → otomatis; > batas → `menunggu_approval`, finance approve dengan 2FA step-up (TOTP ulang) — maker-checker: pembuat aturan split tidak boleh menjadi approver [ASUMSI-FD-9]. State §4.3. | Idempotency key per instruksi (`DSB-<id>`) agar retry tidak dobel bayar. Saldo PG tidak cukup → `gagal` alasan `INSUFFICIENT_BALANCE`, tidak auto-retry. |
| F4.4 Ledger | Double-entry, immutable (§3 entitas `ledger_entry`). Setiap pembayaran, biaya PG, fee Gocean, payout, gagal/kembali = jurnal seimbang. Rekonsiliasi harian terhadap laporan settlement/transaksi PG (API atau file) → selisih ditandai. | Σ debit = Σ kredit per jurnal (CHECK DB). Koreksi hanya lewat jurnal balik, tidak ada edit. |
| F4.5 Isolasi dana | Menu, API, kredensial PG, dan log dana hanya di aplikasi `keuangan` dengan peran finance (§6). ops_admin tidak punya akses (403 + `security_event`). Log dana = `fund_log` terpisah dari audit operasional. | Lihat §6 dan TDD §5. |
| F4.6 Gagal disbursement | Callback `failed` → status `gagal` + alasan PG, notifikasi finance (in-app + email), tombol "Ulangi" aktif setelah data rekening penerima diperbarui dan diverifikasi. Ulangi = instruksi baru (id baru) yang merujuk instruksi lama. | Maksimal 3 kali ulang per penerima per order, setelahnya eskalasi manual. |

### 2.5 F5 Invoicing & Rekonsiliasi (Scope 2)
| ID | Input dan aturan bisnis | Validasi, kasus tepi, pesan error |
|---|---|---|
| F5.1 Invoice otomatis | Pemicu: QC disetujui / order `dikonfirmasi` (sesuai AC PRD F5.1). Job membuat invoice ≤24 jam (target ≤5 menit): nomor `GCN-INV-YYYYMM-NNNNN`, mata uang segmen, baris = order (tonase aktual × harga), biaya PG ditampilkan terpisah, PDF bahasa buyer. | Order dibatalkan setelah invoice terbit → invoice `batal` + nota; kalau sudah ada pembayaran → proses refund manual lewat PG (di luar otomasi v1). |
| F5.2 Termin & pengingat | Skema termin per buyer org (default 100% sebelum kirim untuk buyer baru [ASUMSI-FD-10]; termin mis. 30% DP / 70% pelunasan). Tiap termin = `invoice_installment` dengan VA sendiri, jatuh tempo. Pengingat H-3, H-0, H+3 (email + WA template). | Σ persen termin = 100. Pengingat berhenti saat lunas. |
| F5.3 Rekonsiliasi | Callback/mutasi PG: nominal = sisa tagihan → `lunas`; kurang → `sebagian` + tanda `selisih`; lebih → `lunas` + `selisih_lebih`; keduanya masuk antrean tinjau K03. | Target ≥80% otomatis (KPI). Pembayaran tanpa pasangan (VA tidak dikenal) → antrean `tak_terpasang`. |
| F5.4 Ekspor akuntansi | XLSX: invoice, pembayaran, biaya PG, disbursement, fee Gocean, per rentang tanggal. | Hanya finance. Tercatat di `fund_log`. |

### 2.6 F6 Chat via WhatsApp Business API (Scope 2)
| ID | Input dan aturan bisnis | Validasi, kasus tepi, pesan error |
|---|---|---|
| F6.1 Percakapan per order | Satu nomor WA Gocean (Q22). Pesan masuk → webhook → cari pengirim dari nomor HP terdaftar (user/beneficiary). Pencocokan order: (1) pesan memuat nomor order/RFQ (`GCN-PO-...`/`RFQ-...`) → thread order itu; (2) balasan ke pesan keluar yang tertaut order (context message id) → order itu; (3) selain itu → kotak "belum tertaut" di C01, admin menautkan manual. Admin membalas dari C01: dalam jendela 24 jam sejak pesan terakhir pengguna → teks bebas; di luar jendela → wajib template yang disetujui Meta. | Nomor tidak terdaftar → masuk "belum tertaut" bertanda "nomor tak dikenal". Pesan media (foto/dokumen) disimpan ke object storage dan ditautkan. |
| F6.2 Penyamaran | Pengguna hanya berbicara dengan nomor Gocean. "Teruskan" dari admin: sistem mengirim isi pesan saja, dengan prefiks "[Gocean — Order GCN-PO-...]" tanpa nama/nomor pengirim asal. Pesan masuk yang mengandung pola nomor HP, email, URL, atau kata kunci kontak → status `ditahan`, tidak bisa diteruskan sebelum admin menyunting/menyetujui. | Pola: regex nomor Indonesia/internasional (≥9 digit dengan pemisah), email, URL, "wa.me". False positive dapat disetujui admin (tercatat). |
| F6.3 Arsip | Semua pesan masuk/keluar (isi, media ref, waktu, arah, pengirim, order id, status kirim) disimpan permanen, tanpa fungsi hapus di aplikasi; masuk audit trail. | Retensi mengikuti audit (≥10 tahun). |
| F6.4 Notifikasi | Event → template WA (+ email bila ada): penawaran baru, PO terbit, butuh persetujuan selisih, status order berubah, invoice terbit, pengingat, disbursement sukses/gagal (termasuk nelayan P4 tanpa login). Target ≤5 menit. Scope 1 memakai email + in-app untuk event yang sama (WA menyusul Scope 2). | Gagal kirim → retry backoff sampai 30 menit, lalu tandai gagal di log notifikasi. Pengguna tanpa WA opt-in → email saja. |

## 3. Model data
Konvensi: id `uuid`; uang `bigint` dalam satuan terkecil (IDR = rupiah, USD = sen) + kolom `currency`; berat `numeric(12,1)` kg; waktu `timestamptz` UTC; setiap tabel bisnis punya `created_at`, `updated_at`, `version`. Detail kolom & indeks di TDD §3. Kolom Tulis/Baca memakai kode peran §5.

| Entitas | Atribut kunci | Relasi | Tulis / Baca |
|---|---|---|---|
| `organization` | type {buyer, supplier, gocean}, name, segment {ekspor, horeca, grosir} (buyer), nib, npwp, address, province, kyc_status {pending_verification, active, rejected, suspended}, verified_by/at, reject_reason | 1-n user | publik (daftar), OPS / pemilik org, OPS, MGT |
| `app_user` | org_id, email uniq, phone_e164, name, password_hash, locale {id,en}, totp_secret_enc, totp_enabled, is_active, last_login_at, wa_opt_in | org, 1-n user_role | SYS, diri sendiri / diri, OPS, SYS |
| `role`, `user_role` | role code {buyer, supplier, ops_admin, finance, management, investor, sysadmin} | user | SYS / SYS |
| `kyc_document` | org_id, type {ktp, nib, paspor, lainnya}, storage_key, sha256, encrypted=true | org | pemilik (unggah) / OPS |
| `bank_account` | owner (org_id atau beneficiary_id), bank_code, account_no_enc, account_no_last4, holder_name, status {pending, verified, rejected}, is_primary | org / beneficiary | pemilik, FIN / OPS (masked), FIN |
| `beneficiary` (P4) | name, phone_e164, supplier_org_id, nik_enc (opsional) | supplier org | FIN, OPS / FIN, OPS |
| `commodity`, `grade`, `size_class`, `cut_type` | code, name_id, name_en, is_active; grade: commodity_id, temp_min_c, temp_max_c | hierarki komoditas | OPS / semua login |
| `price_list` | commodity/grade/size/cut, segment, currency, price_per_kg, valid_from, valid_to | master | OPS / buyer (segmennya), OPS, MGT |
| `listing` | supplier_org_id, spesifikasi (FK master), est_tonnage_kg, remaining_kg, buy_price_per_kg, province, available_date, status, curated_by | supplier, 1-n listing_photo | SUP (miliknya), OPS / buyer (terkurasi, tersamar), OPS |
| `rfq` | no `RFQ-YYMM-NNNN`, buyer_org_id, created_by, spesifikasi, tonnage_kg, desired_date, destination, incoterm, notes, status, negotiation_round | buyer, 1-n quote | BUY, OPS / BUY (miliknya), OPS |
| `quote` | rfq_id, version, listing_id, sell_price_per_kg, currency, buy_price_per_kg (internal), tonnage_kg, ship_date, valid_until, status {aktif, digantikan, disetujui, ditolak, kedaluwarsa}, buyer_counter (jsonb) | rfq, listing | OPS / BUY (tanpa buy_price), OPS |
| `order` | no PO, rfq_id, quote_id, buyer_org_id, supplier_org_id, spec snapshot (jsonb + FK), ordered_kg, actual_kg, qc_grade_id, sell_price_per_kg, buy_price_per_kg, currency, fx_rate_idr, value_initial, value_final, buy_value_final, status, buyer_approval {none, pending, approved, rejected}, cancel_code, cancel_reason, received_at, version | 1-n order_status_history, order_document, 1 traceability_record | lihat §5 |
| `order_status_history` | order_id, from, to, actor, reason, at | order | sistem / pihak order |
| `order_document` | order_id, type {dokumen_jalan, health_certificate, karantina, packing_list, coo, bukti_terima, lainnya}, version, audience {semua_internal, buyer, supplier}, storage_key, sha256, size | order | OPS (+SUP foto, BUY bukti terima) / sesuai audience |
| `traceability_record` | order_id uniq, origin_text, origin_province, catch_date, vessel_or_fisher, beneficiary_id?, has_out_of_range | order, 1-n temperature_log | SUP (order miliknya), OPS / BUY (order miliknya), OPS, MGT |
| `temperature_log` | record_id, kind {manual, file}, measured_at, temp_c, point {tangkap, simpan, muat, lainnya}, storage_key, out_of_range | traceability | SUP, OPS / idem |
| `audit_event` | seq bigserial, occurred_at, actor_user_id, actor_role, actor_kind {user, system, webhook}, action, entity_type, entity_id, before, after, ip, user_agent, request_id, prev_hash, hash | — | sistem (append-only) / MGT, SYS |
| `security_event` | occurred_at, user_id, kind {forbidden, login_failed, locked, 2fa_failed}, resource, ip | — | sistem / SYS |
| `notification` | user_id/beneficiary_id, channel {inapp, email, wa}, template, payload, status, attempts, sent_at | — | sistem / penerima (inapp) |
| `setting` | key, value jsonb (mis. `order.tonnage_tolerance_pct`=5, `disbursement.approval_threshold_idr`=50000000) | — | SYS (operasional), FIN (setting dana) / internal |
| **Scope 2 (skema `finance`)** | | | |
| `invoice`, `invoice_installment` | no INV, order_id, currency, amount, pg_fee_amount, status §4.2; installment: pct, amount, due_date, va_number, va_bank, pg_external_id, paid_amount, status | order | FIN, sistem / FIN, BUY (miliknya, lewat view read-only) |
| `payment` | installment_id, pg_payment_id uniq, amount, paid_at, raw_callback_ref | installment | webhook / FIN |
| `split_rule`, `split_line` | order_id, locked; line: recipient_type {gocean, supplier, beneficiary}, recipient_id, pct, amount_preview | order | FIN / FIN |
| `disbursement` | split_line_id, amount, bank_account_id snapshot, idempotency_key, pg_payout_id, status §4.3, fail_reason, approved_by/at, retry_of | split_line | FIN, sistem / FIN |
| `ledger_journal`, `ledger_entry` | journal: ref_type/ref_id, memo; entry: account {buyer_receivable, pg_clearing, pg_fee_expense, gocean_fee_revenue, payable_supplier, payable_beneficiary}, debit, credit, currency | — | sistem / FIN |
| `fund_log` | sama dengan audit_event (hash chain) tetapi khusus fungsi dana | — | sistem / FIN, MGT (baca) |
| `inbound_webhook` | source {pg, wa}, event_id uniq, signature_ok, payload (jsonb, PII dimasking untuk log), processed_at, error | — | webhook / SYS, FIN (pg) |
| **Scope 2 (F6)** `wa_thread`, `wa_message` | thread: order_id/rfq_id/null, party_phone, party_user_id; message: direction, wa_message_id uniq, body, media_key, status {diterima, ditahan, diteruskan, terkirim, gagal, dibaca}, held_reason, forwarded_from | order | sistem, OPS / OPS, MGT |

## 4. State machine
### 4.1 Order
| Dari | Ke | Pemicu / pelaku | Syarat |
|---|---|---|---|
| (baru) | `dipesan` | buyer setuju penawaran | quote aktif, buyer org active |
| `dipesan` | `dikonfirmasi` | admin QC (selisih ≤ toleransi, grade sama) atau buyer menyetujui penyesuaian | actual_kg terisi, QC selesai |
| `dikonfirmasi` | `diproses` | ops_admin | - |
| `diproses` | `dikirim` | ops_admin | traceability lengkap (≥1 log suhu), dokumen jalan terbit |
| `dikirim` | `diterima` | buyer, atau ops_admin + foto bukti | - |
| `dipesan`, `dikonfirmasi`, `diproses` | `dibatalkan` | ops_admin (semua), buyer (hanya `dipesan` dan sebelum supplier mengisi tonase) | alasan wajib |
| `dikirim` | `dibatalkan` | ops_admin + management approval | alasan wajib (mis. barang rusak total) [ASUMSI-FD-11] |
Flag `buyer_approval=pending` menahan `dipesan` → `dikonfirmasi`. `diterima` dan `dibatalkan` final.

### 4.2 Invoice / installment (Scope 2)
`draft` → `terbit` → (`sebagian`) → `lunas` | `jatuh_tempo` (job harian, masih bisa dibayar → `lunas`) | `batal`. Tanda tambahan `selisih` / `selisih_lebih` / `tak_terpasang` tidak mengubah state, hanya antrean tinjau. Invoice `lunas` bila semua installment `lunas`.

### 4.3 Disbursement (Scope 2)
`direncanakan` → (`menunggu_approval` → `disetujui` | `ditolak`) → `dikirim_ke_pg` → `sukses` | `gagal` → (Ulangi = disbursement baru `retry_of`). Nominal ≤ batas melompati approval (`direncanakan` → `dikirim_ke_pg`). `sukses`, `ditolak`, `gagal` final per instruksi.

### 4.4 RFQ dan listing
RFQ: `draft` (lokal/server) → `diajukan` → `ditawar` → (`negosiasi` ↔ `ditawar`) → `disetujui` | `ditolak` | `kedaluwarsa` (penawaran habis masa & tidak ada aksi 7 hari) | `dibatalkan` (buyer sebelum disetujui). Listing: §2.1 F1.2.

## 5. Peran dan hak akses
Kode: BUY buyer (P1/P2, dibedakan `organization.segment`), SUP supplier (P3), OPS ops_admin (P5), FIN finance (P6), MGT management (P7), INV investor (P8), SYS sysadmin (IT Gocean/Xavortree, [ASUMSI-FD-12]). P4 nelayan = `beneficiary`, bukan pengguna. "Milik" = organisasi pengguna adalah pihak pada objek itu.

| Resource / aksi | BUY | SUP | OPS | FIN | MGT | INV | SYS |
|---|---|---|---|---|---|---|---|
| Master data & harga: kelola | - | - | ✓ | - | baca | - | - |
| Katalog (listing terkurasi, harga segmen) | baca (tersamar) | - | ✓ | - | baca | - | - |
| Listing: buat/ubah | - | milik | kurasi | - | baca | - | - |
| RFQ: buat/lihat/respons penawaran | milik | - | ✓ semua | - | baca | - | - |
| Penawaran: buat | - | - | ✓ | - | baca | - | - |
| Order: lihat | milik (tanpa identitas & harga supplier) | milik (tanpa identitas & harga buyer) | ✓ | baca | baca | - | - |
| Order: tonase aktual, traceability | - | milik | ✓ | - | - | - | - |
| Order: QC, status, dokumen jalan, upload | - | - | ✓ | - | - | - | - |
| Order: terima | milik | - | ✓ (+foto) | - | - | - | - |
| Verifikasi KYC, suspend org | - | - | ✓ | - | - | - | - |
| Lihat PII terenkripsi (Tampilkan) | - | - | ✓ (tercatat) | rekening saja | - | - | - |
| Dashboard | - | - | ✓ | ✓ | ✓ lengkap | agregat saja | - |
| Ekspor laporan order | - | - | ✓ | ✓ | ✓ | - | - |
| Audit log (baca) | - | - | entitas order | fund_log | ✓ | - | ✓ |
| Pengguna internal & peran, reset 2FA | - | - | - | - | - | - | ✓ |
| Aplikasi keuangan (invoice, split, disbursement, ledger, kredensial PG) | invoice milik (lihat, di app utama) | - | **ditolak** | ✓ | baca laporan | - | - |
| Konsol chat WA | - | - | ✓ | - | baca arsip | - | - |
| 2FA wajib | - | - | ✓ | ✓ | disarankan | - | ✓ |

Aturan tambahan: satu user bisa punya >1 peran internal kecuali kombinasi OPS+FIN dilarang (Dual Environment b, dicek saat penetapan peran → 422 `ROLE_CONFLICT`). SYS tidak otomatis punya hak bisnis.

## 6. Dual Environment (Q16) — fungsional
- (a) **UAT vs produksi**: dua deployment terpisah (domain, database, object storage, kredensial PG sandbox vs live, nomor WA uji vs nomor resmi). UAT memakai data dummy; tidak ada salinan data produksi ke UAT kecuali dianonimkan. Banner "UAT — bukan transaksi nyata" di semua layar UAT dan watermark "UAT" di PDF.
- (b) **Isolasi fungsi dana di produksi**: aplikasi `keuangan` (K01-K04) berjalan sebagai service dan subdomain terpisah, hanya peran FIN (baca terbatas MGT), 2FA wajib + step-up untuk approval; kredensial PG hanya ada di service keuangan; log dana `fund_log` terpisah dari `audit_event`. App operasional hanya berkomunikasi ke keuangan lewat event (`order.confirmed`, `order.received`) dan membaca status invoice lewat API read-only. Detail teknis TDD §5-§6.

## 7. API dan kontrak (tingkat tinggi)
### 7.1 Konvensi
REST JSON `/api/v1` (app operasional) dan `/fin/v1` (app keuangan). Auth: cookie sesi httpOnly `Secure` `SameSite=Lax` + token CSRF untuk mutasi. Mutasi pembuat objek menerima `Idempotency-Key` (UUID, disimpan 24 jam) — wajib dari PWA untuk RFQ, konfirmasi tonase, traceability, terima. Error: `{ "error": { "code": "INVALID_TRANSITION", "message": "...", "fields": {...}, "request_id": "..." } }`. Kode umum: 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`/`ACCOUNT_NOT_VERIFIED`/`2FA_REQUIRED`, 404, 409 `INVALID_TRANSITION`/`STALE_VERSION`/`IN_USE`/`DUPLICATE_CODE`/`QUOTE_NOT_ACTIVE`, 413, 415, 422 `VALIDATION_FAILED`, 429. Paginasi cursor `?cursor=&limit=` (maks 100).

### 7.2 Endpoint Scope 1 (ringkas)
| Area | Endpoint |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/2fa/verify`, `POST /auth/2fa/setup`, `POST /auth/2fa/confirm`, `POST /auth/logout`, `GET /me`, `POST /auth/password/reset-request`, `POST /auth/password/reset` |
| KYC | `POST /orgs/me/documents` (multipart), `GET /admin/orgs?kyc_status=`, `POST /admin/orgs/{id}/verify` `{segment}`, `POST /admin/orgs/{id}/reject` `{reason}`, `POST /admin/orgs/{id}/suspend`, `POST /admin/orgs/{id}/pii-reveal` `{field}` |
| Master | `GET/POST/PATCH /master/{commodities|grades|sizes|cuts}`, `POST /master/{type}/{id}/deactivate`, `DELETE` (409 bila dipakai), `GET/POST/PATCH /price-lists` |
| Listing | `GET/POST/PATCH /listings`, `POST /listings/{id}/photos`, `POST /listings/{id}/submit`, `POST /admin/listings/{id}/curate` `{decision, reason}`, `GET /catalog` |
| RFQ | `GET/POST /rfqs`, `GET /rfqs/{id}`, `POST /rfqs/{id}/quotes` (OPS), `POST /rfqs/{id}/quotes/{v}/accept|reject|counter` (BUY), `POST /rfqs/{id}/cancel`, `POST /orders/{id}/reorder` |
| Order | `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/actual-tonnage` (SUP), `POST /orders/{id}/qc` (OPS), `POST /orders/{id}/adjustment/approve|reject` (BUY), `POST /orders/{id}/transition` `{to, reason, version}`, `POST /orders/{id}/delivery-note` (OPS → PDF), `POST /orders/{id}/documents`, `GET /orders/{id}/documents/{docId}/download` (URL bertanda tangan), `POST /orders/{id}/receive`, `PUT /orders/{id}/traceability`, `POST /orders/{id}/traceability/temperature-logs` |
| Dashboard | `GET /dashboard/summary?from&to` (output berbeda MGT vs INV), `POST /reports/orders/export` |
| Audit | `GET /audit-events?entity_type&entity_id&actor&from&to`, `GET /admin/security-events` |
| Admin | `GET/POST/PATCH /admin/users`, `POST /admin/users/{id}/roles`, `POST /admin/users/{id}/2fa-reset`, `GET/PUT /admin/settings/{key}` |
| Sistem | `GET /healthz`, `GET /readyz`, `GET /metrics` (jaringan internal saja) |

### 7.3 Kontrak Scope 2 (internal, vendor-agnostik; adaptor vendor di TDD §4)
| Arah | Kontrak |
|---|---|
| ops → keuangan (event) | `order.confirmed {order_id, currency, value_final, buyer_org_id}` → buat invoice; `order.received {order_id, received_at}` → syarat disbursement; `order.cancelled` → batalkan invoice terbuka |
| keuangan → ops (read-only) | `GET /fin/v1/orders/{id}/billing-status` → `{invoice_no, status, paid_amount, outstanding}` untuk ditampilkan ke buyer/OPS |
| keuangan (FIN) | `GET/POST /fin/v1/invoices`, `POST /fin/v1/invoices/{id}/installments`, `GET/PUT /fin/v1/orders/{id}/split-rule`, `POST /fin/v1/disbursements/{id}/approve|reject` (step-up TOTP), `POST /fin/v1/disbursements/{id}/retry`, `GET /fin/v1/ledger`, `GET /fin/v1/reconciliation?date=`, `POST /fin/v1/exports/accounting` |
| Webhook PG → keuangan | `POST /fin/webhooks/pg/{event}`: verifikasi token/tanda tangan vendor, simpan `inbound_webhook` (unik `event_id`), balas 200 cepat, proses di job. Event: `va.paid`, `payout.succeeded`, `payout.failed`. |
| Webhook WA → ops | `GET /webhooks/wa` (verifikasi hub.challenge), `POST /webhooks/wa` (verifikasi `X-Hub-Signature-256`), event: pesan masuk, status kirim (sent/delivered/read/failed). |
| ops → WA | adaptor `sendText(to, body, context)`, `sendTemplate(to, template, lang, params)`; semua lewat antrean job, rate-limit sesuai tier nomor. |

## 8. Hal yang belum diputuskan
Asumsi fungsional FD (default dipakai, dikonfirmasi di requirement phase; dicatat ringkas di KEPUTUSAN.md baris A28):
| ID | Asumsi | Alasan |
|---|---|---|
| ASUMSI-FD-1 | 1 RFQ = 1 penawaran aktif = 1 PO = 1 supplier; kebutuhan multi-supplier dipecah admin jadi beberapa RFQ/PO | alur dan traceability per-pesanan tetap sederhana |
| ASUMSI-FD-2 | Masa berlaku penawaran default 48 jam (konfigurasi) | harga hasil laut cepat berubah |
| ASUMSI-FD-3 | Negosiasi maks 5 putaran | cegah RFQ menggantung |
| ASUMSI-FD-4 | Supplier menyerahkan barang ke titik serah Gocean; dokumen jalan versi supplier tanpa identitas buyer | anti-poaching |
| ASUMSI-FD-5 | Klaim/susut setelah terima diselesaikan lewat nota kredit Scope 2, bukan ubah nilai order | nilai order `diterima` jadi dasar GMV yang stabil |
| ASUMSI-FD-6 | Buyer org boleh >1 user; supplier 1 user per org di v1 | supplier umumnya perorangan |
| ASUMSI-FD-7 | Agregat investor dengan <3 pihak kontributor disembunyikan | cegah identifikasi tidak langsung |
| ASUMSI-FD-8 | Sesi idle 30 menit internal, 7 hari buyer/supplier | keamanan vs kenyamanan PWA di lapangan |
| ASUMSI-FD-9 | Maker-checker: pembuat aturan split ≠ approver disbursement | kontrol internal dana |
| ASUMSI-FD-10 | Buyer baru default bayar 100% sebelum kirim; termin per buyer diatur finance | risiko gagal bayar |
| ASUMSI-FD-11 | Pembatalan setelah `dikirim` butuh persetujuan management | kejadian jarang, berdampak dana |
| ASUMSI-FD-12 | Peran tambahan `sysadmin` untuk kelola pengguna internal, tanpa hak bisnis | pemisahan tugas |

Pertanyaan terbuka ke CEO: Q26 (model penahanan dana di saldo PG sampai serah terima, lihat KEPUTUSAN.md) — hanya menahan eksekusi Scope 2 F4, tidak menahan Scope 1. Keputusan teknis (stack, PG, BSP WA, hosting, repo) di TDD §8 dan KEPUTUSAN.md A21-A27.
