# BRD — Gocean B2B E-Commerce & Order Management System
Perusahaan: Xavortree (mitra teknologi) untuk klien PT Gocean Indonesia | Pemilik: PM | Status: Draft ideal disusun tim — menunggu konfirmasi/revisi CEO, belum acuan final PRD/FD | Versi: 0.2 (2026-09-27)

**Referensi dokumen asli CEO:** kode BRD-XV-GCN-2026-V1, versi 1.0 (Enterprise Specification), status versi CEO "FINAL / APPROVED FOR IMPLEMENTATION", klasifikasi Strictly Confidential. Klien/pemilik produk: PT Gocean Indonesia (BoD & manajemen). Mitra teknologi: Xavortree. System Analyst & Lead Architect: Ardiansyah (Bang Ardi) & Dimitri Ahmad S. Target roadmap 24 bulan (Scope 1 & 2). Anggaran Rp 433.000.000 all-in turnkey (skema "Gas 433").
Riwayat revisi asli: v0.1 (10 Sep) F1-F3 baseline MVP 4 bulan; v0.5 (12 Sep) ekspansi F1-F6 (Fintech, Invoicing, Chat, Dual Environment); v0.9 (14 Sep) roadmap 24 bulan, requirement phase +1 bulan, piloting 2x40 hari, dedicated ops standby; v1.0 (26 Sep) acuan kontrak dan penyusunan FD.
Catatan status: status FINAL berlaku untuk dokumen versi CEO. Di sistem tim, BRD ini baru jadi acuan PRD/FD setelah CEO menyetujui eksplisit.
Catatan (2026-09-27): Q14 — CEO memutuskan tidak menunggu file BRD asli. Bagian 1.3, 2-12 di bawah adalah **VERSI IDEAL USULAN TIM** (BA Tari), disusun dari fakta yang sudah ada (masalah bisnis, F1-F6, anggaran, timeline) plus praktik umum B2B cold-chain seafood. **Bukan teks asli klien.** Semua isi bertanda [ASUMSI] adalah usulan tim dan wajib dikonfirmasi/direvisi CEO. Kalimat tanpa tanda = fakta dari dokumen CEO.
Catatan (2026-09-27, Q16): CEO menyetujui opsi A — pemetaan F4=Fintech, F5=Invoicing, F6=Chat dan definisi Dual Environment usulan tim dipakai sebagai dasar arsitektur. Tidak ada pemetaan asli dari klien. Bagian 3 dan 7 disesuaikan; versi tetap 0.2 (perubahan status, bukan isi baru).

## 1. Latar belakang
PT Gocean Indonesia: perusahaan cold chain dan agregator perdagangan hasil laut (ekspor Asia Timur, Eropa, AS; domestik HORECA dan distributor grosir). Komoditas: tuna saku/loin, lobster, udang vaname, gurita, ikan pelagis bernilai tinggi; menuntut suhu -18°C s/d -25°C, traceability asal tangkapan, sertifikasi karantina.
Masalah saat ini (transaksi manual + WhatsApp):
- Human error saat rekap tonase, grade ukuran, dan spesifikasi potong dari chat ke spreadsheet.
- Tidak ada atribusi transaksi; hubungan supplier binaan dengan buyer rawan dibajak (poaching).
- Rekonsiliasi transfer bank manual memperlambat dokumen jalan, penagihan invoice, dan bagi hasil (split disbursement) ke nelayan/supplier.
- Tidak ada audit trail terpusat untuk validasi metrik ke investor.

### 1.3 Solusi yang diusulkan
[ASUMSI — disusun tim dari 4 masalah di atas] Satu platform B2B tertutup (hanya pengguna terverifikasi) tempat seluruh transaksi Gocean terjadi dari permintaan buyer sampai dana diterima supplier:
- Marketplace dan order terstruktur (F1-F3) menggantikan rekap chat: spesifikasi (komoditas, grade, ukuran, potongan, tonase, suhu) diisi lewat formulir baku, bukan teks bebas → menjawab masalah human error.
- Gocean jadi perantara tunggal: identitas/kontak supplier dan buyer tidak saling terlihat, semua komunikasi lewat Chat di platform (F6) → menjawab poaching dan atribusi.
- Pembayaran lewat rekening virtual/payment gateway berlisensi, invoice otomatis (F5), dan split disbursement otomatis ke supplier/nelayan (F4) → menjawab rekonsiliasi manual.
- Semua kejadian (order, perubahan harga, pembayaran, dokumen) tercatat di audit log dan dashboard metrik → menjawab kebutuhan validasi investor.

## 2. Tujuan bisnis dan metrik sukses
[ASUMSI — seluruh angka di bagian ini usulan tim, bukan dari klien.] Baseline wajib diukur di requirement phase (bulan 1) dari data WhatsApp/spreadsheet 3 bulan terakhir; target final ditetapkan setelah baseline ada.
| # | Tujuan | KPI usulan | Rentang target wajar | Diukur kapan |
|---|---|---|---|---|
| T1 | Hilangkan error rekap order | % order dengan koreksi tonase/grade/spesifikasi setelah konfirmasi | turun 70-90% dari baseline | akhir pilot 1 dan pilot 2 |
| T2 | Semua transaksi teratribusi di platform | % nilai transaksi Gocean yang terjadi di platform (bukan WA/offline) | 60-80% akhir pilot 2; 90%+ bulan 24 | bulanan sejak pilot 1 |
| T3 | Percepat arus kas | waktu rekonsiliasi pembayaran; waktu dana sampai supplier setelah buyer bayar | rekonsiliasi otomatis 80-95% transaksi; disbursement H+1 s/d H+2 | pilot 2 dan bulanan setelahnya |
KPI pendukung [ASUMSI]: 100% transaksi platform punya audit trail lengkap; invoice terbit ≤24 jam setelah serah terima; jumlah supplier aktif pilot 10-20 dan buyer aktif 5-15 (rekomendasi: angka diganti data riil jumlah supplier binaan Gocean).

## 3. Scope (per modul)
Pemetaan nomor modul — dikonfirmasi CEO (Q16, 2026-09-27): riwayat revisi asli hanya menyebut F1-F3 = baseline order management/marketplace dan ekspansi = Fintech, Invoicing, Chat, Dual Environment (4 item untuk 3 nomor). Usulan tim yang disetujui CEO: F4 = Fintech & Split Disbursement, F5 = Invoicing & Rekonsiliasi, F6 = Chat in-platform; Dual Environment adalah persyaratan arsitektur lintas modul (bagian 7), bukan modul sendiri. Isi rinci tiap modul di tabel bawah tetap [ASUMSI].
### Termasuk
| Modul | Isi usulan [ASUMSI] | Fase |
|---|---|---|
| F1 Katalog & Marketplace B2B | master komoditas/grade/ukuran/potongan, listing stok supplier, harga per buyer/segmen (ekspor vs HORECA vs grosir), RFQ | Scope 1 |
| F2 Order Management | PO, konfirmasi tonase aktual vs pesanan, status order sampai serah terima, dokumen jalan, upload dokumen ekspor/karantina | Scope 1 |
| F3 Supplier, Traceability & Dashboard | onboarding dan verifikasi supplier/buyer (KYC ringan), catatan asal tangkapan per lot, log suhu manual/upload, audit log, dashboard metrik manajemen/investor | Scope 1 |
| F4 Fintech & Split Disbursement | pembayaran buyer via virtual account/PG berlisensi, aturan bagi hasil per order (Gocean fee, supplier, nelayan), disbursement otomatis, ledger | Scope 2 |
| F5 Invoicing & Rekonsiliasi | invoice otomatis dari order, termin/DP, status bayar, pengingat jatuh tempo, rekonsiliasi otomatis dengan mutasi PG, ekspor ke spreadsheet akuntansi | Scope 2 |
| F6 Chat in-platform | chat per order/RFQ antara buyer–Gocean–supplier, kontak disamarkan, arsip jadi bagian audit trail, notifikasi (email/WA notifikasi satu arah) | Scope 2 |
Juga termasuk (fakta): requirement phase 1 bulan, piloting 2x40 hari, dedicated ops standby.
### Tidak termasuk [ASUMSI — batas yang umum untuk anggaran ini]
- Gocean/Xavortree memegang atau memutar dana pengguna (dana hanya lewat PG berlisensi); fitur pinjaman/pembiayaan supplier.
- Integrasi sistem pemerintah (INSW, karantina, e-Faktur/Coretax) — di scope awal hanya upload dan simpan dokumen.
- Perangkat IoT/sensor suhu dan integrasi logger otomatis; ERP/akuntansi penuh; manajemen armada/logistik.
- Aplikasi native iOS/Android (cukup web responsif/PWA); marketplace terbuka untuk publik/B2C.

## 4. Pengguna dan pemangku kepentingan
Fakta: BoD & manajemen PT Gocean = pemilik produk. Indikasi pengguna dari latar belakang: buyer, supplier binaan/nelayan, tim internal, investor.
[ASUMSI — persona rinci usulan tim]
| Persona | Kebutuhan utama | Catatan |
|---|---|---|
| Buyer ekspor (importir Asia Timur/Eropa/AS) | spesifikasi presisi, dokumen ekspor & sertifikat, USD, bahasa Inggris | volume besar, frekuensi rendah |
| Buyer domestik HORECA & grosir | pesan ulang cepat, harga jelas, invoice/termin | frekuensi tinggi, volume kecil-menengah |
| Supplier binaan / pengepul | lihat order, konfirmasi tonase aktual, terima dana cepat | akses via HP, literasi digital bervariasi |
| Nelayan (penerima bagi hasil) | kepastian bagian dana | mungkin tidak login; cukup penerima disbursement + notifikasi |
| Admin operasional Gocean | kurasi order, QC grade, dokumen jalan | pengguna harian terberat |
| Keuangan Gocean | invoice, rekonsiliasi, disbursement, laporan | butuh approval berjenjang |
| BoD/manajemen & investor | dashboard GMV, margin, volume, audit trail | investor: akses baca/laporan saja |

## 5. Proses bisnis As-Is vs To-Be
As-Is (fakta dari bagian 1): order via WA → rekap manual ke spreadsheet → buyer transfer bank → rekonsiliasi manual → dokumen jalan dan invoice terlambat → bagi hasil manual ke supplier/nelayan. Tidak ada audit trail.
To-Be [ASUMSI — alur usulan tim]:
1. Buyer ajukan RFQ/PO di F1 dengan spesifikasi baku → admin Gocean cocokkan ke stok supplier (supplier tidak lihat identitas buyer).
2. Supplier konfirmasi tonase aktual dan data lot/asal tangkapan (F2/F3) → admin QC grade → selisih tonase otomatis mengubah nilai order.
3. Invoice terbit otomatis (F5) → buyer bayar ke virtual account (F4) → rekonsiliasi otomatis.
4. Dokumen jalan/ekspor diterbitkan dan diunggah (F2) → serah terima dikonfirmasi.
5. Split disbursement otomatis ke supplier/nelayan sesuai aturan bagi hasil (F4) → semua langkah masuk audit log dan dashboard (F3).
Komunikasi di tiap langkah lewat Chat per order (F6), bukan WA.

## 6. Kebutuhan fungsional (FR) tingkat bisnis
[ASUMSI — seluruh FR usulan tim; PRD/FD yang merinci.]
- F1: FR-1.1 master data komoditas/grade/ukuran/potongan/suhu; FR-1.2 listing stok supplier dengan foto dan lot; FR-1.3 harga per segmen buyer; FR-1.4 RFQ dan penawaran balik oleh admin.
- F2: FR-2.1 PO dari RFQ disetujui; FR-2.2 konfirmasi tonase aktual dan penyesuaian nilai; FR-2.3 status order (dipesan → dikonfirmasi → diproses → dikirim → diterima); FR-2.4 terbit dokumen jalan dan upload dokumen ekspor/karantina.
- F3: FR-3.1 registrasi dan verifikasi buyer/supplier; FR-3.2 traceability per lot (asal tangkapan, tanggal, kapal/nelayan, log suhu); FR-3.3 audit log tidak bisa diubah; FR-3.4 dashboard GMV, volume per komoditas, margin, supplier/buyer aktif; FR-3.5 peran dan hak akses (RBAC).
- F4: FR-4.1 pembayaran via virtual account/PG; FR-4.2 aturan split per order; FR-4.3 disbursement otomatis dengan approval keuangan di atas batas nilai; FR-4.4 ledger dan laporan dana.
- F5: FR-5.1 invoice otomatis IDR/USD; FR-5.2 DP/termin dan jatuh tempo; FR-5.3 rekonsiliasi otomatis dan penanda selisih; FR-5.4 ekspor data ke spreadsheet akuntansi.
- F6: FR-6.1 chat per order/RFQ; FR-6.2 penyamaran kontak dan deteksi nomor/email dalam pesan; FR-6.3 arsip chat masuk audit trail; FR-6.4 notifikasi keluar (email/WA satu arah).

## 7. Kebutuhan non-fungsional dan Dual Environment
[ASUMSI — standar wajar untuk platform transaksi B2B skala ini]
- Ketersediaan 99,5% per bulan; halaman utama <3 detik di jaringan 4G; tetap bisa dipakai di sinyal lemah (pelabuhan/TPI).
- Keamanan: HTTPS, enkripsi data sensitif, RBAC, 2FA untuk keuangan/admin, kepatuhan UU PDP No. 27/2022, uji keamanan sebelum F4 go-live.
- Data: backup harian, RPO ≤24 jam, RTO ≤8 jam; retensi audit log dan data transaksi minimal 10 tahun (kebiasaan dokumen keuangan/pajak — rekomendasi cek ke konsultan klien).
- Bahasa Indonesia dan Inggris; mata uang IDR dan USD.
- Dual Environment — definisi dikonfirmasi CEO (Q16, 2026-09-27) sebagai dasar arsitektur: (a) lingkungan uji/UAT terpisah dari produksi, memakai sandbox PG dan data dummy, untuk pilot dan uji rilis; dan (b) di produksi, fungsi dana (F4/F5) terpisah hak akses dan log-nya dari fungsi operasional. [ASUMSI] Cara implementasi teknisnya belum diputuskan; diserahkan ke Analyst/Architect di FD/TDD.

## 8. Batasan dan aturan eksekusi
- Fakta: waktu 24 bulan (Scope 1 & 2); anggaran Rp 433 juta all-in turnkey.
- Tim: tidak ada tim manusia di Xavortree selain CEO; stack dan repo kode belum ditentukan (lihat companies/xavortree/CLAUDE.md).
- [ASUMSI] Rp 433 juta / 24 bulan = rata-rata sekitar Rp 18 juta per bulan termasuk ops standby dan 2 pilot; scope F1-F6 besar untuk angka ini (lihat R1).
- [ASUMSI] Ardiansyah tercatat sebagai co-analyst di dokumen asli, tapi aturan tim: semua komunikasi hanya ke CEO. Masukan Ardiansyah disalurkan lewat CEO.
- [ASUMSI] Perubahan scope setelah requirement phase hanya lewat change request tertulis dengan dampak biaya/waktu; Gocean menyediakan data master (daftar supplier, komoditas, harga) dan PIC harian selama pilot.

## 9. Roadmap 24 bulan
Fakta: requirement phase 1 bulan, F1-F3 MVP 4 bulan (v0.1), piloting 2x40 hari, ops standby. [ASUMSI — urutan bulan usulan tim]
| Bulan | Kegiatan | Keluaran |
|---|---|---|
| 1 | Requirement phase: ukur baseline KPI, validasi proses, FD/TDD, pilih mitra PG | BRD final, FD, TDD disetujui |
| 2-5 | Build F1-F3 + lingkungan UAT | MVP Scope 1 |
| 6-7 | Pilot 1 (40 hari): 5-10 supplier, 3-5 buyer domestik [ASUMSI] + perbaikan | laporan pilot 1, KPI T1 |
| 8 | Hardening dan go-live F1-F3 produksi | BAST Scope 1 |
| 9-14 | Build F4-F6 (onboarding PG/KYC dimulai bulan 9 karena butuh waktu) | Scope 2 di UAT |
| 15-16 | Pilot 2 (40 hari): alur dana nyata, termasuk 1-2 buyer ekspor [ASUMSI] | laporan pilot 2, KPI T2/T3 |
| 17 | Go-live F4-F6 | BAST Scope 2 |
| 18-24 | Ops standby, stabilisasi, perbaikan kecil, laporan KPI bulanan, serah terima dokumentasi | BAST akhir bulan 24 |

## 10. Rincian anggaran "Gas 433"
Fakta: total Rp 433.000.000 all-in turnkey. [ASUMSI — pembagian usulan tim, belum dari kontrak]
Alokasi per komponen (rentang): build F1-F3 30-35%; build F4-F6 30-35%; requirement phase + 2 pilot + onboarding pengguna 10-12%; ops standby 7-8 bulan 12-15%; infrastruktur, domain, lisensi selama 24 bulan 5-8%; cadangan 5%.
Termin usulan (terikat keluaran, bukan waktu):
| Termin | Pemicu | % | Nilai kira-kira |
|---|---|---|---|
| 1 | Tanda tangan kontrak | 20% | Rp 86,6 jt |
| 2 | FD/TDD disetujui (akhir bulan 1) | 10% | Rp 43,3 jt |
| 3 | MVP F1-F3 siap pilot (bulan 5) | 20% | Rp 86,6 jt |
| 4 | BAST Scope 1 (bulan 8) | 15% | Rp 65,0 jt |
| 5 | BAST Scope 2 (bulan 17) | 20% | Rp 86,6 jt |
| 6 | Ops standby, dicicil bulanan bulan 18-24 atau BAST akhir | 15% | Rp 65,0 jt |
Dikonfirmasi CEO (Q18, 2026-09-27): biaya transaksi PG (MDR/biaya disbursement) dibebankan ke transaksi/klien, di luar Rp 433 juta — bukan lagi [ASUMSI], tegaskan di kontrak.

## 11. Matriks risiko
K = kemungkinan, D = dampak (R/S/T). R1-R5 dari tinjauan analyst; R6-R10 [ASUMSI] tambahan tim.
| ID | Risiko | K | D | Mitigasi |
|---|---|---|---|---|
| R1 | Anggaran tidak cukup untuk F1-F6 + ops 24 bulan | T | T | F1-F3 berdiri sendiri; termin terikat keluaran; cadangan 5% |
| R2 | Regulasi dana (BI/OJK) dan data (UU PDP) | S | T | dana hanya lewat PG berlisensi; uji keamanan sebelum F4 |
| R3 | Kapasitas eksekusi dan ops tanpa orang on-call | T | T | ops standby = jam kerja + PIC manusia (Q18, 2026-09-27); nama PIC belum ditunjuk — tentukan sebelum kontrak |
| R4 | Adopsi rendah, pengguna tetap di WA | T | S | pilot kecil dulu, onboarding dibantu admin Gocean, insentif disbursement lebih cepat |
| R5 | Komitmen kontrak sebelum scope teknis diverifikasi | S | T | requirement phase wajib menghasilkan BRD final bertanda tangan |
| R6 | Poaching tetap terjadi offline | S | S | penyamaran kontak + klausul perjanjian supplier; ini sebagian di luar kendali sistem |
| R7 | Onboarding/KYC mitra PG lambat | S | S | mulai proses PG di bulan 9 atau lebih awal |
| R8 | Data suhu/traceability tidak akurat (input manual) | S | S | validasi rentang suhu, foto bukti, opsi integrasi logger di fase lanjut |
| R9 | Scope creep dari klien selama 24 bulan | T | S | change request tertulis dengan biaya |
| R10 | Keterlambatan data master dan PIC klien | S | S | daftar kewajiban klien di kontrak; jadwal mundur bila terlambat |

## 12. Kriteria keberterimaan (acceptance criteria)
[ASUMSI — usulan tim; angka final disepakati di requirement phase]
- Requirement phase: FD, TDD, baseline KPI, dan BRD final disetujui tertulis oleh Gocean dan CEO.
- Scope 1 (F1-F3): satu order lengkap RFQ → PO → konfirmasi tonase → dokumen jalan → serah terima berjalan tanpa spreadsheet; semua langkah muncul di audit log; pilot 1 selesai 40 hari tanpa bug kritis terbuka; KPI T1 tercapai sesuai target hasil baseline.
- Scope 2 (F4-F6): pembayaran buyer terekonsiliasi otomatis dan split disbursement sampai ke supplier di sandbox lalu produksi; selisih rekonsiliasi 0 pada sampel uji; kontak tidak terlihat di chat; pilot 2 selesai 40 hari tanpa insiden dana.
- Serah terima akhir: dokumentasi pengguna dan teknis, akses dan kredensial dipindah ke Gocean, laporan KPI bulanan bulan 18-24.
- Lembar pengesahan: BoD Gocean dan CEO Xavortree per BAST.

## Estimasi kasar
XL. Alasan: 6 modul termasuk fintech dan chat, dua environment, dua sisi pengguna (buyer dan supplier), roadmap 24 bulan dengan pilot dan ops standby.

## Pertanyaan untuk CEO (sebelum jadi dasar PRD)
1. ~~Arti "Dual Environment" dan pemetaan F4-F6?~~ SELESAI (Q16, 2026-09-27): CEO pilih A — usulan tim dipakai (lihat bagian 3 dan 7).
2. ~~Model dana Fintech (F4)?~~ SELESAI (Q17, 2026-09-27): CEO pilih A — semua dana lewat payment gateway pihak ketiga berlisensi, split disbursement langsung ke rekening tujuan. Gocean/Xavortree tidak pernah menampung dana nasabah.
3. ~~Ops standby dan batas "all-in"?~~ SELESAI (Q18, 2026-09-27): CEO pilih A — ops standby = jam kerja dengan PIC manusia yang ditunjuk CEO (nama PIC belum disebut, masih ASUMSI terbuka); biaya transaksi PG/MDR di luar Rp 433 juta, dibebankan ke transaksi/klien.

## Catatan Analyst (tinjauan awal)
Oleh: analyst (Bima), 2026-09-26. Hanya berdasar isi yang sudah ada; bukan FD/TDD/plan. Tidak ada isi FR yang dikarang.
Estimasi kasar: **XL** (sinyal: F1-F6 termasuk fintech, invoicing, chat, dual environment; dua sisi pengguna buyer dan supplier; 24 bulan dengan 2 pilot dan ops standby). Harus dipecah per modul/fase sebelum jadi plan. Estimasi presisi (plan S/M/L, jumlah plan, urutan) TIDAK BISA dibuat sampai bagian 3, 6, 7, 8, 9 dikonfirmasi CEO.
Pertanyaan teknis (dijawab lewat CEO):
1. Dual Environment artinya apa: dev/staging vs produksi, atau pemisahan lingkungan fintech (dana) vs operasional/marketplace? Ini menentukan arsitektur, biaya hosting, dan audit.
   → Dikonfirmasi CEO via Q16 (2026-09-27): keduanya — UAT terpisah dari produksi + isolasi fungsi dana (F4/F5) dari operasional (bagian 7). Detail teknis (implementasi UAT terpisah, isolasi akses dan log dana) tetap diputuskan analyst/architect di FD/TDD.
2. Fintech/split disbursement: lewat payment gateway berlisensi (escrow/split payment API) atau Gocean memegang dana sendiri?
   → Dikonfirmasi CEO via Q17 (2026-09-27): lewat PG pihak ketiga berlisensi (mis. Xendit/Midtrans), split disbursement API. Gocean tidak memegang dana. Pilihan PG spesifik dan integrasi teknis diputuskan analyst/architect di FD/TDD.
3. Traceability cold chain: data suhu diinput manual, dari logger/sensor IoT, atau dari sistem pihak ketiga (gudang/ekspedisi)? Granularitas lacak: per lot, per karton, atau per tangkapan?
4. Dokumen ekspor/karantina (sertifikat, health certificate): hanya upload dan simpan, atau integrasi ke sistem pemerintah?
5. Chat: dibangun sendiri (real-time, moderasi, arsip) atau integrasi WhatsApp Business API/layanan pihak ketiga? Terkait anti-poaching: apakah kontak buyer-supplier harus disembunyikan?
6. Invoicing: perlu e-Faktur/pajak dan integrasi akuntansi, atau cukup invoice PDF + status bayar?
7. Ops standby: SLA jam berapa, siapa yang menjalankan (tim hanya AI + CEO), dan apakah termasuk dalam Rp 433 juta?
8. Hosting, domain, lisensi, dan biaya transaksi gateway: masuk anggaran all-in atau ditanggung klien?
Catatan BA (2026-09-27): draft ideal di atas sudah memuat usulan jawaban [ASUMSI] untuk no. 2, 4, 5, 6, 8 (lihat bagian 3, 7, 10); no. 1 sudah dikonfirmasi CEO (Q16); no. 3 dan 7 masih terbuka penuh.
