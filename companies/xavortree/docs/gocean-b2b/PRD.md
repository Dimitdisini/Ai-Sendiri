# PRD — Gocean B2B E-Commerce & Order Management System
Perusahaan: Xavortree (mitra teknologi) untuk klien PT Gocean Indonesia | Pemilik: PM (Sari) | Turunan dari: BRD.md v0.2 (draft ideal) | Status: Draft — menunggu persetujuan CEO (Q25) sebelum FD | Versi: 0.2 (2026-09-27)

Riwayat versi:
- v0.1 (2026-09-27): draft awal dari BRD v0.2 + keputusan CEO Q14, Q16-Q20. Q22 dan Q23 masih terbuka.
- v0.2 (2026-09-27): sinkron dengan KEPUTUSAN.md — Q22 (A) dan Q23 (A) sudah Dijawab CEO; model penghubung F6 dan pembebanan biaya WA tidak lagi asumsi. A-PRD-1 s/d A-PRD-5 tetap ASUMSI (belum ada jawaban CEO). Tidak ada perubahan fitur, prioritas, atau AC.

Catatan sumber (wajib dibaca):
- BRD v0.2 sebagian besar adalah **versi ideal usulan tim** (Q14), bukan teks asli klien. Semua fitur, AC, dan angka di PRD ini yang diturunkan dari bagian BRD bertanda [ASUMSI] ikut ditandai **[ASUMSI]**. Bagian tanpa tanda = fakta dokumen CEO atau keputusan CEO di KEPUTUSAN.md.
- Keputusan CEO yang mengikat PRD ini: Q16 (Dual Environment, F4=Fintech/Split Disbursement, F5=Invoicing, F6=Chat), Q17 (dana hanya lewat PG berlisensi), Q18 (ops standby jam kerja + PIC on-call; biaya PG/MDR di luar Rp 433 juta), Q19 (PIC on-call = Ahmad), Q20 (traceability per-pesanan; chat pakai WhatsApp Business API pihak ketiga), Q22 (A: F6 = chat per order lewat nomor WA resmi Gocean sebagai penghubung tunggal), Q23 (A: biaya WhatsApp Business API di luar Rp 433 juta, dibebankan ke Gocean).
- Dua keputusan CEO (Q20) menggeser isi BRD v0.2: FR-3.2 "traceability per lot" menjadi **per-pesanan**, dan F6 "Chat in-platform" menjadi **integrasi WhatsApp Business API**. Q22 menegaskan model penghubung F6. PRD mengikuti keputusan CEO; BRD perlu disesuaikan oleh Business Analyst (bukan PM) — lihat follow-up FU-1 di bagian 7. PRD tidak menunggu sinkronisasi ini.

## 1. Ringkasan produk
Platform B2B tertutup untuk PT Gocean Indonesia, tempat buyer (ekspor, HORECA, grosir), supplier binaan/pengepul, dan tim internal Gocean menjalankan seluruh transaksi hasil laut dari RFQ sampai dana diterima supplier. Dibanding cara sekarang (WhatsApp + spreadsheet + transfer bank manual), platform ini: (1) mengganti rekap chat dengan formulir spesifikasi baku sehingga tonase/grade/potongan tidak salah catat, (2) menjadikan Gocean perantara tunggal sehingga kontak buyer-supplier tidak bocor (anti-poaching), (3) mengotomasi invoice, rekonsiliasi, dan split disbursement lewat payment gateway berlisensi, dan (4) mencatat semua kejadian di audit log yang bisa dipakai untuk validasi metrik ke investor. Dikirim dalam dua scope: Scope 1 (F1-F3) dan Scope 2 (F4-F6), roadmap 24 bulan, anggaran Rp 433 juta all-in.

## 2. Persona dan alur utama
### 2.1 Persona [ASUMSI — dari BRD bagian 4, usulan tim]
| Kode | Persona | Kebutuhan utama | Akses |
|---|---|---|---|
| P1 | Buyer ekspor | spesifikasi presisi, dokumen ekspor, USD, bahasa Inggris | web (desktop), login |
| P2 | Buyer domestik HORECA/grosir | pesan ulang cepat, harga jelas, termin | web/HP, login |
| P3 | Supplier binaan/pengepul | lihat order, konfirmasi tonase aktual, dana cepat | HP (PWA), login, literasi digital bervariasi |
| P4 | Nelayan penerima bagi hasil | kepastian bagian dana | tidak login; hanya penerima disbursement + notifikasi WA |
| P5 | Admin operasional Gocean | kurasi RFQ/order, QC grade, dokumen jalan | web, pengguna harian terberat |
| P6 | Keuangan Gocean | invoice, rekonsiliasi, approval disbursement | web, 2FA wajib |
| P7 | BoD/manajemen | dashboard GMV, margin, volume, audit trail | web, baca + laporan |
| P8 | Investor | laporan metrik | baca saja, tanpa data kontak/harga per pihak [ASUMSI] |

### 2.2 Alur utama (To-Be) [ASUMSI — dari BRD bagian 5, disesuaikan Q20]
1. Buyer mengajukan RFQ dengan spesifikasi baku (F1). Admin Gocean mencocokkan ke stok supplier; supplier tidak melihat identitas buyer, buyer tidak melihat identitas supplier.
2. Admin mengirim penawaran balik; buyer menyetujui → PO terbit (F2).
3. Supplier mengonfirmasi tonase aktual dan mengisi data traceability **untuk pesanan tersebut** (asal tangkapan, tanggal, kapal/nelayan, log suhu) (F2/F3). Admin QC grade; selisih tonase otomatis mengubah nilai order.
4. Invoice terbit otomatis (F5) → buyer membayar ke virtual account PG berlisensi (F4) → rekonsiliasi otomatis (F5).
5. Dokumen jalan diterbitkan, dokumen ekspor/karantina diunggah (F2) → serah terima dikonfirmasi.
6. Split disbursement otomatis dari PG langsung ke rekening supplier/nelayan (F4). Semua langkah masuk audit log dan dashboard (F3).
7. Komunikasi per order lewat WhatsApp Business API dengan nomor resmi Gocean sebagai penghubung (F6), percakapan tertaut ke ID order dan terarsip.

## 3. Fitur (prioritas MoSCoW)
Prioritas MoSCoW berlaku per scope: "Must" = syarat BAST scope tersebut. Seluruh baris F1-F6 berstatus **[ASUMSI]** kecuali disebut lain, karena FR sumbernya (BRD bagian 6) adalah usulan tim. Angka ambang di AC adalah usulan PM, final di FD/requirement phase.

### Scope 1 — F1 Katalog & Marketplace B2B
| ID | Fitur | Prioritas | User story | Acceptance criteria |
|---|---|---|---|---|
| F1.1 | Master data komoditas (komoditas, grade, ukuran, potongan, rentang suhu) | Must | Sebagai admin Gocean, saya ingin mengelola master data spesifikasi agar semua order memakai istilah baku. | Diberikan admin login, ketika menambah grade "A" untuk komoditas "Tuna loin" dengan rentang suhu -18 s/d -25°C, maka grade itu muncul sebagai pilihan dropdown di form RFQ dan listing. Diberikan master data dipakai di order aktif, ketika admin mencoba menghapusnya, maka sistem menolak dan menawarkan nonaktifkan. |
| F1.2 | Listing stok supplier (foto, estimasi tonase, spesifikasi) | Must | Sebagai supplier, saya ingin mendaftarkan stok agar admin bisa mencocokkan ke RFQ. | Diberikan supplier terverifikasi, ketika mengisi listing dengan spesifikasi dari master data, tonase, dan minimal 1 foto, maka listing tersimpan berstatus "menunggu kurasi" dan tidak terlihat buyer sebelum admin menyetujui. Diberikan buyer melihat listing yang sudah dikurasi, maka nama, nomor HP, dan alamat supplier tidak tampil. |
| F1.3 | Harga per segmen buyer (ekspor/HORECA/grosir) | Should | Sebagai admin, saya ingin menetapkan harga berbeda per segmen agar penawaran sesuai pasar. | Diberikan komoditas punya harga ekspor dan harga HORECA, ketika buyer segmen HORECA membuka katalog, maka hanya harga HORECA yang tampil. Diberikan buyer ekspor, maka harga tampil dalam USD. |
| F1.4 | RFQ dan penawaran balik | Must | Sebagai buyer, saya ingin mengajukan RFQ dengan spesifikasi baku agar tidak ada salah tafsir. | Diberikan buyer login, ketika mengirim RFQ tanpa grade atau tonase, maka form menolak dan menandai field wajib. Diberikan RFQ lengkap terkirim, ketika admin mengirim penawaran balik (harga, tonase, tanggal kirim), maka buyer menerima notifikasi dan bisa memilih setuju/tolak/negosiasi. |
| F1.5 | Katalog dwibahasa (ID/EN) | Should | Sebagai buyer ekspor, saya ingin antarmuka berbahasa Inggris. | Diberikan pengguna memilih bahasa EN, ketika membuka katalog dan form RFQ, maka semua label dan nama master data tampil dalam bahasa Inggris. |

### Scope 1 — F2 Order Management
| ID | Fitur | Prioritas | User story | Acceptance criteria |
|---|---|---|---|---|
| F2.1 | PO dari RFQ yang disetujui | Must | Sebagai buyer, saya ingin PO terbit otomatis setelah setuju penawaran. | Diberikan buyer menyetujui penawaran, ketika menekan "Setuju", maka PO bernomor unik terbit berisi spesifikasi, tonase, harga, dan tercatat di audit log dengan waktu dan pelaku. |
| F2.2 | Konfirmasi tonase aktual dan penyesuaian nilai | Must | Sebagai supplier, saya ingin mengonfirmasi tonase aktual agar nilai order sesuai barang nyata. | Diberikan PO 1.000 kg @ Rp 100.000, ketika supplier mengonfirmasi 950 kg dan admin menyetujui QC, maka nilai order menjadi Rp 95.000.000, buyer mendapat notifikasi selisih, dan nilai lama + baru tercatat di audit log. Diberikan selisih melebihi toleransi [ASUMSI 5%], maka order butuh persetujuan buyer sebelum lanjut. |
| F2.3 | Status order bertahap | Must | Sebagai semua pihak, saya ingin melihat status order terkini. | Diberikan order aktif, ketika status berubah, maka urutan hanya boleh dipesan → dikonfirmasi → diproses → dikirim → diterima (atau dibatalkan dengan alasan); lompatan status ditolak sistem; setiap perubahan tercatat di audit log. |
| F2.4 | Dokumen jalan dan upload dokumen ekspor/karantina | Must | Sebagai admin, saya ingin menerbitkan dokumen jalan dan menyimpan dokumen ekspor per order. | Diberikan order berstatus "diproses", ketika admin menekan "Terbitkan dokumen jalan", maka PDF terbit dengan nomor order, spesifikasi, tonase aktual, dan suhu. Diberikan admin mengunggah PDF/JPG ≤10 MB sebagai health certificate, maka file tertaut ke order dan bisa diunduh buyer order itu saja. |
| F2.5 | Serah terima | Must | Sebagai buyer, saya ingin mengonfirmasi penerimaan barang. | Diberikan order "dikirim", ketika buyer (atau admin atas nama buyer dengan bukti foto) mengonfirmasi terima, maka status menjadi "diterima" dan memicu langkah invoice/disbursement (Scope 2). |
| F2.6 | Pesan ulang (reorder) | Could | Sebagai buyer HORECA, saya ingin mengulang order lama dengan satu klik. | Diberikan order lama berstatus "diterima", ketika buyer menekan "Pesan ulang", maka RFQ baru terisi otomatis dengan spesifikasi yang sama dan bisa diedit sebelum dikirim. |

### Scope 1 — F3 Supplier, Traceability & Dashboard
| ID | Fitur | Prioritas | User story | Acceptance criteria |
|---|---|---|---|---|
| F3.1 | Registrasi dan verifikasi buyer/supplier (KYC ringan) | Must | Sebagai admin, saya ingin hanya pengguna terverifikasi yang bisa bertransaksi. | Diberikan pendaftar baru mengunggah KTP/NIB dan data rekening, ketika admin belum memverifikasi, maka akun tidak bisa membuat RFQ/listing. Diberikan admin menyetujui, maka akun aktif dan kejadian tercatat di audit log. |
| F3.2 | Traceability **per-pesanan** (Q20) | Must | Sebagai buyer ekspor, saya ingin tahu asal tangkapan dan riwayat suhu pesanan saya. | Diberikan order dikonfirmasi, ketika supplier mengisi satu catatan traceability untuk order itu (lokasi/TPI asal, tanggal tangkap, kapal/nelayan, minimal 1 entri log suhu manual atau upload), maka catatan tertaut ke order dan terlihat buyer order itu. Diberikan suhu yang diinput di luar rentang master data, maka sistem menandai "suhu di luar batas" dan memberi tahu admin. Granularitas per-item/per-karton tidak didukung di versi ini. |
| F3.3 | Audit log tidak bisa diubah | Must | Sebagai BoD/investor, saya ingin jejak transaksi yang bisa dipercaya. | Diberikan kejadian penting (buat/ubah order, harga, status, dokumen, pembayaran, verifikasi akun), maka tercatat dengan waktu, pelaku, nilai lama/baru. Diberikan pengguna mana pun termasuk admin, ketika mencoba mengubah/menghapus baris audit log lewat aplikasi, maka tidak ada fungsi untuk itu. |
| F3.4 | Dashboard manajemen/investor | Must | Sebagai BoD, saya ingin melihat GMV, volume per komoditas, margin, dan pengguna aktif. | Diberikan data order "diterima" bulan berjalan, ketika BoD membuka dashboard, maka GMV sama dengan jumlah nilai order tersebut (selisih 0 terhadap query acuan QA). Diberikan akun investor, maka dashboard tampil tanpa nama/kontak pihak dan tanpa harga per pihak [ASUMSI]. |
| F3.5 | Peran dan hak akses (RBAC) | Must | Sebagai admin sistem, saya ingin setiap persona hanya melihat yang menjadi haknya. | Diberikan akun supplier, ketika membuka URL order milik supplier lain atau data buyer, maka akses ditolak (HTTP 403) dan percobaan tercatat. Diberikan akun keuangan/admin, maka login wajib 2FA. |
| F3.6 | Ekspor laporan ke spreadsheet | Could | Sebagai manajemen, saya ingin mengunduh data order untuk analisis. | Diberikan filter tanggal, ketika menekan "Ekspor", maka file CSV/XLSX berisi order sesuai filter terunduh, sesuai hak akses peran. |

### Scope 2 — F4 Fintech & Split Disbursement (Q16, Q17)
Aturan mengikat (keputusan CEO Q17, bukan asumsi): semua dana masuk dan keluar lewat payment gateway pihak ketiga berlisensi BI (Xendit/Midtrans/sejenis). Gocean dan Xavortree tidak pernah menampung dana nasabah di rekening sendiri; tidak ada fitur saldo/dompet yang membuat platform berstatus PJP. Pilihan PG spesifik diputuskan Analyst di FD/TDD.
| ID | Fitur | Prioritas | User story | Acceptance criteria |
|---|---|---|---|---|
| F4.1 | Pembayaran buyer via virtual account/PG | Must | Sebagai buyer, saya ingin membayar invoice ke VA unik per invoice. | Diberikan invoice terbit, ketika buyer membuka invoice, maka VA unik dari PG tampil dengan nominal tepat. Diberikan PG mengirim callback "paid" (sandbox di UAT), maka status invoice menjadi "lunas" otomatis tanpa input manual, tercatat di audit log. |
| F4.2 | Aturan split per order (fee Gocean, supplier, nelayan) | Must | Sebagai keuangan, saya ingin aturan bagi hasil ditetapkan per order sebelum dana cair. | Diberikan order dengan aturan fee Gocean X%, supplier Y%, nelayan Z%, ketika aturan disimpan, maka sistem menolak bila X+Y+Z ≠ 100% dan menampilkan pratinjau nominal per penerima. |
| F4.3 | Disbursement otomatis dengan approval berjenjang | Must | Sebagai keuangan, saya ingin dana otomatis cair ke rekening penerima, dengan approval untuk nilai besar. | Diberikan invoice lunas dan order "diterima", ketika nilai disbursement ≤ batas [ASUMSI Rp 50 juta], maka perintah split disbursement dikirim ke PG otomatis langsung ke rekening tujuan. Diberikan nilai > batas, maka menunggu approval akun keuangan (2FA) sebelum dikirim. Tidak ada langkah di mana dana mampir ke rekening Gocean/Xavortree. |
| F4.4 | Ledger dan laporan dana | Must | Sebagai keuangan, saya ingin ledger per transaksi yang cocok dengan laporan PG. | Diberikan sampel uji transaksi di UAT, ketika ledger dibandingkan dengan laporan settlement PG, maka selisih 0. |
| F4.5 | Isolasi fungsi dana (Dual Environment b, Q16) | Must | Sebagai BoD, saya ingin fungsi dana terpisah dari operasional agar risiko penyalahgunaan kecil. | Diberikan akun admin operasional, ketika mencoba membuka menu disbursement/aturan split/kredensial PG, maka akses ditolak. Diberikan aktivitas fungsi dana, maka tercatat di log dana terpisah dari log operasional. Detail teknis di TDD. |
| F4.6 | Penanganan gagal disbursement | Should | Sebagai keuangan, saya ingin tahu dan mengulang disbursement yang gagal. | Diberikan PG mengembalikan status gagal (mis. rekening salah), ketika callback diterima, maka status "gagal" tampil ke keuangan dengan alasan, notifikasi terkirim, dan tombol "ulangi" tersedia setelah data rekening diperbaiki. |

Biaya MDR/disbursement PG dibebankan ke transaksi/klien, di luar Rp 433 juta (Q18) — sistem wajib menampilkan komponen biaya PG terpisah di pratinjau split dan invoice.

### Scope 2 — F5 Invoicing & Rekonsiliasi (Q16)
| ID | Fitur | Prioritas | User story | Acceptance criteria |
|---|---|---|---|---|
| F5.1 | Invoice otomatis IDR/USD | Must | Sebagai keuangan, saya ingin invoice terbit otomatis dari order. | Diberikan order dikonfirmasi tonase aktualnya, ketika QC disetujui, maka invoice PDF terbit ≤24 jam dengan mata uang sesuai segmen buyer, nomor unik, dan tercatat di audit log. |
| F5.2 | DP/termin dan jatuh tempo + pengingat | Should | Sebagai keuangan, saya ingin mengatur DP/termin dan pengingat otomatis. | Diberikan invoice dengan termin 30% DP / 70% pelunasan, ketika dibuat, maka dua tagihan dengan VA masing-masing terbit. Diberikan H-3 jatuh tempo dan belum lunas, maka pengingat terkirim ke buyer. |
| F5.3 | Rekonsiliasi otomatis + penanda selisih | Must | Sebagai keuangan, saya ingin pembayaran tercocokkan otomatis. | Diberikan mutasi/callback PG, ketika nominal sama dengan tagihan, maka tagihan "lunas" otomatis. Diberikan nominal kurang/lebih, maka tagihan ditandai "selisih" dan masuk antrean tinjauan keuangan. Target: ≥80% transaksi pilot 2 terekonsiliasi otomatis [ASUMSI — KPI T3 BRD]. |
| F5.4 | Ekspor data ke spreadsheet akuntansi | Should | Sebagai keuangan, saya ingin mengekspor invoice dan pembayaran. | Diberikan rentang tanggal, ketika menekan "Ekspor akuntansi", maka XLSX berisi invoice, pembayaran, biaya PG, dan disbursement terunduh. |

### Scope 2 — F6 Chat via WhatsApp Business API (Q16, Q20, Q22, Q23)
Keputusan CEO Q20: chat memakai WhatsApp Business API pihak ketiga (BSP resmi), tidak dibangun sendiri. Model penghubung = keputusan CEO Q22 (A, 2026-09-27): nomor WhatsApp resmi Gocean menjadi satu-satunya penghubung: buyer dan supplier masing-masing hanya berbicara dengan nomor Gocean, tidak pernah saling bertukar nomor; admin Gocean meneruskan/membalas dari konsol platform. Biaya percakapan WA (tarif Meta + langganan BSP) di luar Rp 433 juta, dibebankan ke Gocean (Q23).
| ID | Fitur | Prioritas | User story | Acceptance criteria |
|---|---|---|---|---|
| F6.1 | Percakapan per order/RFQ lewat nomor WA Gocean | Must | Sebagai admin, saya ingin semua percakapan order tertaut ke ID order. | Diberikan buyer membalas pesan WA dari nomor Gocean yang memuat ID order, ketika pesan diterima webhook, maka pesan tampil di konsol platform pada order tersebut. Diberikan admin membalas dari konsol, maka pesan terkirim ke WA buyer dari nomor Gocean. |
| F6.2 | Penyamaran kontak (anti-poaching) | Must | Sebagai Gocean, saya ingin buyer dan supplier tidak saling tahu kontak. | Diberikan admin meneruskan pesan supplier ke buyer, maka nomor/nama supplier tidak ikut terkirim. Diberikan isi pesan mengandung pola nomor HP/email, ketika diterima sistem, maka pesan ditandai untuk admin sebelum diteruskan [ASUMSI]. |
| F6.3 | Arsip chat masuk audit trail | Must | Sebagai BoD, saya ingin percakapan order terarsip. | Diberikan pesan masuk/keluar lewat WA API, maka isi, waktu, pengirim, dan ID order tersimpan di platform dan tidak bisa dihapus dari aplikasi. |
| F6.4 | Notifikasi keluar (WA template/email) | Must | Sebagai supplier/nelayan, saya ingin notifikasi status order dan dana. | Diberikan status order berubah atau disbursement sukses, maka notifikasi template WA (dan email bila ada) terkirim ke pihak terkait dalam ≤5 menit. Nelayan (P4) tanpa login tetap menerima notifikasi disbursement. |
| F6.5 | Chat internal tim Gocean | Won't (versi ini) | — | Sesuai Q22 (A): WA API dipakai untuk chat per order, bukan chat internal tim. [ASUMSI] Diskusi internal tim Gocean tetap di alat mereka sendiri. |

### Won't (versi ini) — ringkas
In-house chat real-time; traceability per-item/karton; integrasi logger/IoT suhu; integrasi INSW/karantina/e-Faktur/Coretax; aplikasi native; marketplace publik/B2C; fitur saldo/dompet/pinjaman. Detail di bagian 6.

## 4. Non-fungsional [ASUMSI — dari BRD bagian 7 kecuali disebut lain]
- Performa: halaman utama <3 detik di 4G; form RFQ/konfirmasi tonase tetap bisa dikirim di sinyal lemah (PWA dengan simpan draft lokal).
- Ketersediaan: 99,5% per bulan. **Ops standby = jam kerja** (Q18) — [ASUMSI] Senin-Jumat 08.00-17.00 WIB, PIC manusia on-call: **Ahmad** (Q19). Insiden di luar jam kerja ditangani hari kerja berikutnya (mengikuti Q18); target 99,5% diukur dengan asumsi ini.
- Keamanan: HTTPS, enkripsi data sensitif (rekening, KTP), RBAC, 2FA untuk keuangan/admin, kepatuhan UU PDP No. 27/2022, uji keamanan (pentest) sebelum F4 go-live.
- Dual Environment (Q16, keputusan CEO): (a) UAT terpisah dari produksi dengan sandbox PG dan data dummy, dipakai untuk pilot dan uji rilis; (b) di produksi, fungsi dana F4/F5 terpisah hak akses dan log-nya. Implementasi teknis di FD/TDD.
- Data: backup harian, RPO ≤24 jam, RTO ≤8 jam; retensi audit log dan transaksi ≥10 tahun (rekomendasi cek konsultan klien).
- Bahasa: Indonesia dan Inggris. Mata uang: IDR dan USD.
- Perangkat: web responsif/PWA; supplier diasumsikan memakai HP Android kelas menengah-bawah.
- Aksesibilitas: teks dan tombol cukup besar untuk pengguna literasi digital rendah; form konfirmasi tonase maksimal 1 layar.

## 5. Ketergantungan dan integrasi
| Ketergantungan | Untuk | Status |
|---|---|---|
| Payment gateway berlisensi BI (Xendit/Midtrans/sejenis): VA, callback, split disbursement API | F4, F5 | Model disetujui (Q17). Pilihan vendor di FD. Onboarding/KYC PG mulai paling lambat bulan 9 (R7). Akun PG atas nama Gocean [ASUMSI]. |
| WhatsApp Business API via BSP resmi (mis. Meta Cloud API / Qontak / Wati) | F6 | Keputusan CEO (Q20). Verifikasi nomor bisnis Gocean dan template pesan butuh waktu [ASUMSI 2-4 minggu]. Biaya percakapan: di luar Rp 433 juta, dibebankan ke Gocean (Q23). Akun WA Business atas nama Gocean [ASUMSI]. |
| Email transaksional (SMTP/penyedia) | F5, F6.4 | [ASUMSI] |
| Data master dari Gocean (komoditas, grade, daftar supplier/buyer, harga) | F1, F3 | Kewajiban klien (BRD bagian 8), dibutuhkan bulan 1-2. |
| PIC harian Gocean selama pilot | Pilot 1 & 2 | Kewajiban klien [ASUMSI] |
| Hosting (UAT + produksi) di Indonesia | Semua | [ASUMSI] VPS/cloud region Indonesia (UU PDP); stack dan repo belum ditentukan (CLAUDE.md Xavortree). |
| Urutan modul | — | F1 → F2 → F3 (audit log dan RBAC dibangun paling awal karena dipakai semua modul); F5 dan F4 berpasangan; F6 bisa paralel. |

## 6. Di luar scope versi ini
- Gocean/Xavortree menampung, memutar, atau menahan dana pengguna; fitur saldo, dompet, escrow sendiri, pinjaman/pembiayaan supplier (Q17).
- Chat real-time yang dibangun sendiri (Q20).
- Traceability per-item/per-karton/per-tangkapan (Q20: per-pesanan).
- Integrasi otomatis logger/sensor IoT suhu; hanya input manual/upload [ASUMSI].
- Integrasi sistem pemerintah (INSW, karantina, e-Faktur/Coretax); hanya upload dan simpan dokumen [ASUMSI].
- ERP/akuntansi penuh, manajemen armada/logistik [ASUMSI].
- Aplikasi native iOS/Android; marketplace terbuka untuk publik/B2C [ASUMSI].
- Ops standby 24/7 (Q18).
- Biaya MDR/transaksi PG dan biaya percakapan/langganan WhatsApp Business API tidak termasuk Rp 433 juta, dibebankan ke transaksi/Gocean (keputusan CEO Q18 untuk PG, Q23 untuk WA).

## 7. Pertanyaan terbuka dan riwayat keputusan
| ID | Jenis | Hal | Rekomendasi | Status |
|---|---|---|---|---|
| Q22 | BLOKIR (untuk FD F6, bukan untuk Scope 1) | Q20 menyebut "chat internal pakai WhatsApp Business API". Apakah maksudnya chat buyer–Gocean–supplier per order (F6 BRD) atau hanya chat internal tim Gocean? | A: F6 = chat per order lewat nomor WA resmi Gocean sebagai penghubung tunggal (kontak tetap tersamar, anti-poaching terjaga). | **Dijawab CEO 2026-09-27: A** ("A dua-duanya oke, ikutin rekomendasi"). Diterapkan di F6. |
| Q23 | BLOKIR (untuk kontrak/anggaran) | Biaya percakapan WhatsApp Business API (tarif Meta per percakapan + langganan BSP) ditanggung siapa? Q18 hanya menyebut biaya PG/MDR. | A: di luar Rp 433 juta, dibebankan ke Gocean seperti biaya PG, karena berulang dan bergantung volume. | **Dijawab CEO 2026-09-27: A** — di luar Rp 433 juta, dibebankan ke Gocean. Diterapkan di F6, bagian 5, bagian 6. |
| Q25 | BLOKIR (sebelum FD) | Persetujuan PRD v0.2 sebagai acuan FD, termasuk A-PRD-1 s/d A-PRD-5 sebagai nilai default sampai requirement phase. | A: setujui, lanjut FD; angka asumsi dikonfirmasi ulang di requirement phase. | Menunggu CEO (KEPUTUSAN.md Q25) |
| A-PRD-1 | ASUMSI | Toleransi selisih tonase 5% sebelum butuh persetujuan buyer (F2.2). | Konfirmasi dengan Gocean di requirement phase. | Tetap ASUMSI — belum ada jawaban CEO |
| A-PRD-2 | ASUMSI | Batas approval disbursement Rp 50 juta (F4.3). | Konfirmasi dengan keuangan Gocean. | Tetap ASUMSI — belum ada jawaban CEO |
| A-PRD-3 | ASUMSI | Jam kerja ops standby Senin-Jumat 08.00-17.00 WIB. Q18 hanya menetapkan "jam kerja" dan Q19 PIC = Ahmad; jam/hari spesifik belum diputuskan. | Tetapkan di kontrak. | Tetap ASUMSI — Q18/Q19 tidak menyebut jam |
| A-PRD-4 | ASUMSI | Investor hanya melihat metrik agregat tanpa identitas/harga per pihak. | Konfirmasi dengan BoD Gocean. | Tetap ASUMSI — belum ada jawaban CEO |
| A-PRD-5 | ASUMSI | Data suhu traceability diinput manual/upload, tanpa logger (BRD bagian 12 no. 3). Q20 hanya memutuskan granularitas per-pesanan, bukan sumber data suhu. | Sesuai BRD "Tidak termasuk" (juga [ASUMSI] per Q14). | Tetap ASUMSI — belum ada jawaban CEO |

### Follow-up terpisah (bukan tugas PM)
| ID | Pemilik | Hal | Status |
|---|---|---|---|
| FU-1 | Business Analyst | Sinkronkan BRD v0.2 dengan Q20/Q22/Q23: FR-3.2 dan baris F3 "per lot" → **per-pesanan**; F6 "Chat in-platform" → **integrasi WhatsApp Business API** lewat nomor resmi Gocean (FR-6.1-6.4, bagian 1.2, 3, 5 "bukan WA"); tambah biaya WA di luar Rp 433 juta. | Belum dikerjakan. PRD dan FD boleh jalan paralel; PRD yang jadi acuan untuk dua hal ini. |
