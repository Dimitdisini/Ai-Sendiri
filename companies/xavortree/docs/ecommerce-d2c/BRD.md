# BRD — Modern Web E-Commerce Platform (D2C & Retail)
Perusahaan: Xavortree | Pemilik: PM | Status: Draft — isi dokumen CEO sudah lengkap (FR-01 s/d FR-22, NFR, tech stack, roadmap 8 minggu, acceptance criteria); pemilik toko terjawab: klien Xavortree (2026-09-27); nama klien KONKRET dari CEO: **Mata Air** (Q21, 2026-09-27); profil bisnis Mata Air, budget, dan persona tetap [ASUMSI] tim atas delegasi CEO (Q21) | Versi: 0.4 (2026-09-27)

**Referensi dokumen asli CEO:** "Business Requirements Document (BRD) — Platform Web E-Commerce Modern (Direct-to-Consumer & Retail). Dokumen Spesifikasi Kebutuhan Bisnis & Fungsional Pengembangan Website E-Commerce."
- Nama Proyek: Modern Web E-Commerce Platform
- Kode Dokumen: BRD-ECOM-2026-V1
- Versi Dokumen: Versi 1.0 (Standard Retail & D2C Ready)
- Target Rilis: MVP 6–8 Minggu (Fase Peluncuran Cepat); dirinci di bagian 7 sebagai 8 minggu
- Penulis/Pemilik: Dimitri Ahmad / Tim Pengembang
- Tipe Bisnis: B2C / D2C Retail (Dapat diekspansi ke B2B Grosir)

Catatan: teks CEO diterima dalam dua kiriman (v0.1 terpotong di FR-16; lanjutan diterima 2026-09-26 dan dimasukkan di v0.2). Tidak ada isi yang dikarang. Yang masih kosong ditandai [BUTUH KONFIRMASI CEO]. Project ini terpisah dari gocean-b2b.

## 1. Latar belakang
(Bagian 1.1 asli) Membangun platform website toko online (web e-commerce) mandiri yang responsif, cepat, dan terintegrasi otomatis dengan gerbang pembayaran lokal (Payment Gateway) dan kurir logistik Indonesia. Tujuannya adalah memiliki kanal penjualan resmi milik sendiri (brand-owned channel) tanpa ketergantungan penuh pada biaya komisi marketplace pihak ketiga (Shopee/Tokopedia).
- Pemilik brand/toko: **Mata Air**, klien Xavortree (klien eksternal dikonfirmasi CEO 2026-09-27, Q13; nama klien dikonfirmasi CEO 2026-09-27, Q21 — bukan asumsi). Xavortree sebagai pengembang.
- [ASUMSI] Profil bisnis Mata Air (sektor, skala, kanal, volume belum dikonfirmasi CEO; didelegasikan ke tim, Q21). Nama "Mata Air" sendiri tidak memastikan jenis produk, jadi profil kerja tetap mengikuti contoh di FR-05/FR-06: brand fashion/apparel lokal skala UMKM-menengah (sesuai contoh FR-05 dan varian ukuran/warna FR-06), saat ini jualan lewat Shopee/Tokopedia plus Instagram/WhatsApp dengan konfirmasi transfer manual, volume [ASUMSI] 300–1.500 order/bulan, AOV Rp150–300 ribu. Bila Mata Air ternyata menjual produk berat/cair (mis. air minum/minuman), FR-14 berat volumetrik, pilihan kurir, dan AOV perlu ditinjau ulang. Kontak dan kontrak Mata Air belum ada. CEO bisa membatalkan/merevisi.

## 2. Tujuan bisnis dan metrik sukses
(Bagian 1.2 asli, 4 tujuan dari CEO, dipertahankan utuh)
1. **Meningkatkan Konversi Penjualan:** alur belanja mulus (seamless checkout) dari lihat produk hingga pembayaran dalam < 3 menit.
2. **Otomatisasi Operasional 100%:** hitung ongkos kirim real-time berdasarkan alamat pelanggan (JNE, SiCepat, J&T, dll); verifikasi pembayaran instan via Webhook tanpa perlu kirim bukti transfer manual via WhatsApp.
3. **Sentralisasi Data Pelanggan:** membangun basis data pelanggan (customer database) untuk retensi, loyalty program, dan promosi email/WA marketing.
4. **Kecepatan & SEO-Friendly:** optimasi performa web di perangkat mobile (80%+ trafik pembeli e-commerce berasal dari HP).

Metrik terukur dari dokumen CEO: checkout < 3 menit (tujuan 1); status UNPAID → PAID < 10 detik via webhook (FR-17, tujuan 2); FCP < 1.8 detik dan Core Web Vitals mobile > 85 di PageSpeed Insights (NFR dan AC, tujuan 4).
- [ASUMSI] Target bisnis pasca-rilis (konversi %, jumlah pelanggan terdaftar, porsi penjualan pindah dari marketplace) belum ada angka. Rekomendasi: ukur baseline 30 hari pertama setelah Go-Live, lalu tetapkan target. CEO bisa membatalkan.

## 3. Scope
### Termasuk (FR dari teks asli, Modul 1–7)
**Modul 1: Autentikasi & Akun Pelanggan (Customer Management)**
- FR-01: Registrasi & Login via Email, Nomor WhatsApp, atau One-Click Google Login.
- FR-02: Buku Alamat Pengiriman (Multiple Address Book) dengan integrasi autocomplete provinsi, kota/kabupaten, kecamatan, dan kode pos.
- FR-03: Riwayat Pesanan (Order History) dan tombol lacak resi pengiriman terkini.
- FR-04: Guest Checkout Mode (pelanggan bisa langsung belanja cepat tanpa wajib daftar akun di awal).

**Modul 2: Katalog Produk & Pencarian Pintar (Product & Discovery)**
- FR-05: Struktur kategori bertingkat (Contoh: Pria ➔ Pakaian ➔ Jaket).
- FR-06: Varian Produk Multi-Dimensi (kombinasi Ukuran, Warna, Material dengan harga & stok masing-masing).
- FR-07: Galeri Foto Produk dengan fitur Zoom-in dan video preview.
- FR-08: Filter & Pengurutan (Harga termurah/termahal, Produk terbaru, Terlaris, Rating).
- FR-09: Fitur Pencarian Cepat (Instant Search) dengan penanganan salah ketik kata (fuzzy search).

**Modul 3: Keranjang, Wishlist & Promosi (Cart & Discounts)**
- FR-10: Keranjang Belanja (Shopping Cart) dinamis yang tersimpan otomatis (tidak hilang saat refresh browser).
- FR-11: Fitur Simpan ke Favorit (Wishlist).
- FR-12: Mesin Kupon Diskon & Voucher Promo: diskon persentase, potongan harga nominal tetap, gratis ongkir dengan batas minimum belanja, batasan kuota penggunaan voucher per akun.

**Modul 4: Pengiriman & Kurir Otomatis (Logistics & Shipping)**
- FR-13: Integrasi API Kalkulator Ongkir Otomatis (via RajaOngkir / Biteship API): Ekspedisi Reguler/Kargo (JNE, SiCepat, J&T Express, Anteraja), Instant/Same-Day (GoSend, GrabExpress, opsional lokal).
- FR-14: Perhitungan berat volumetrik otomatis berdasarkan dimensi paket barang.
- FR-15: Cetak Otomatis Label Pengiriman (Shipping Label/Waybill Thermal PDF) langsung dari admin.

**Modul 5: Gerbang Pembayaran Online (Payment Gateway)**
- FR-16: Integrasi Payment Gateway Indonesia (Midtrans / Xendit / Tripay):
  - Virtual Account Bank Otomatis (BCA, Mandiri, BRI, BNI, BSI, Permata).
  - QRIS Real-Time (mendukung GoPay, OVO, Dana, ShopeePay, LinkAja, BCA Mobile).
  - Kartu Kredit / Debit: Visa, MasterCard, JCB dengan 3D-Secure OTP.
  - PayLater: Kredivo / Akulaku (opsional).
- FR-17: Webhook Notifikasi Pembayaran Instan: status pesanan otomatis berubah dari UNPAID menjadi PAID dalam < 10 detik tanpa perlu unggah foto struk.

**Modul 6: Notifikasi Otomatis (Customer Notification)**
- FR-18: Notifikasi Transaksi Otomatis via WhatsApp API / Email:
  - Tagihan & Petunjuk Pembayaran saat order dibuat.
  - Notifikasi saat Pembayaran Berhasil Diterima.
  - Notifikasi saat Pesanan Dikirim lengkap dengan Nomor Resi.

**Modul 7: Panel Dashboard Admin (Merchant Operations)**
- FR-19: Dashboard Ringkasan Finansial: Total Omzet harian/bulanan, Total Order Masuk, dan Barang Terlaris.
- FR-20: Manajemen Inventori (Notifikasi stok menipis / Low Stock Alert).
- FR-21: Order Pipeline Management: Pending → Sudah Bayar → Diproses/Packing → Dikirim → Selesai.
- FR-22: Ekspor Laporan Transaksi ke format Excel / CSV untuk kebutuhan pembukuan akuntansi.

### Tidak termasuk
- [ASUMSI] Ekspansi B2B Grosir tidak masuk MVP (dokumen asli menyebutnya "dapat diekspansi"). Rekomendasi: kunci sebagai fase berikutnya. CEO bisa membatalkan.
- [ASUMSI] Loyalty program dan kampanye promosi email/WA marketing (tujuan 3) tidak masuk MVP; MVP hanya mengumpulkan data pelanggan dan notifikasi transaksi (FR-18), karena tidak ada FR untuk loyalty/marketing. CEO bisa membatalkan.
- [ASUMSI] COD tidak masuk MVP (tidak disebut di FR-16).

## 4. Alur proses transaksi (end-to-end flow)
(Bagian 4 asli) Diagram mermaid: [BUTUH KONFIRMASI CEO: hanya judul bagian yang diterima, isi diagram belum dikirim]. Urutan status yang sudah pasti dari teks: order dibuat (UNPAID/Pending, FR-18 tagihan) → PAID via webhook (FR-17, notifikasi bayar) → Diproses/Packing → Dikirim (resi, FR-15/FR-18) → Selesai (FR-21).

## 5. Pengguna dan pemangku kepentingan
- Diketahui dari FR: pelanggan terdaftar, pelanggan tamu (guest, FR-04), admin/merchant yang mengoperasikan panel (Modul 7), pemilik brand (Mata Air, klien Xavortree).
- **Nada/kepribadian brand (CEO konfirmasi, Q21 lanjutan, 2026-09-27): ramah, senang, empati, ceria.** Berlaku untuk gaya komunikasi ke pelanggan (notifikasi WA/email FR-17, copy website, penanganan komplain) dan jadi acuan persona di bawah.
- [ASUMSI, kecuali nada brand di atas yang sudah dikonfirmasi CEO] Persona target (Q21, 2026-09-27; CEO bisa membatalkan/merevisi):
  - **Pembeli:** usia 18–35, tinggal di kota besar/menengah, belanja hampir selalu dari HP setelah melihat produk di Instagram/TikTok atau link WhatsApp; terbiasa bayar QRIS/e-wallet atau VA, dan pergi kalau checkout lama atau harus daftar akun dulu (FR-04, FR-16, target < 3 menit); merespons baik komunikasi yang ramah, ceria, dan empatik (bukan kaku/formal).
  - **Admin/pemilik brand:** 1–3 orang yang kini menghabiskan waktu mencocokkan bukti transfer di WA dan menyalin resi manual; butuh status bayar otomatis, cetak label, dan laporan ekspor (FR-17, FR-15, FR-21, FR-22).

## 6. Kebutuhan non-fungsional (NFR)
(Bagian 5 asli)
- **Performa & Kecepatan Akses:** First Contentful Paint < 1.8 detik; kompresi gambar otomatis (format modern .webp atau .avif).
- **Desain Mobile-First (Responsive):** tampilan dirancang khusus agar nyaman digunakan satu tangan pada layar smartphone.
- **Keamanan Transaksi & Data:** enkripsi SSL/TLS 256-bit penuh (HTTPS); kepatuhan standar PCI-DSS (seluruh data kartu kredit ditangani langsung oleh Payment Gateway, server tidak menyimpan nomor kartu).
- **SEO:** struktur URL bersih & ramah SEO (contoh: /produk/sepatu-sneakers-pria); otomasi OpenGraph preview untuk share tautan produk ke WhatsApp & Instagram; Schema.org Structured Data (Rich Snippet Google untuk harga & stok produk).

## 7. Batasan
- **Waktu — Roadmap MVP 8 minggu (bagian 7 asli):**
  - Minggu 1–2: finalisasi wireframe UI/UX, arsitektur database, dan struktur otentikasi.
  - Minggu 3–4: halaman katalog produk, filter pencarian, keranjang, dan halaman produk.
  - Minggu 5–6: integrasi gerbang pembayaran (Midtrans/Xendit) & API ongkos kirim ekspedisi.
  - Minggu 7: Dashboard Admin, manajemen stok, cetak resi pengiriman, dan integrasi WhatsApp.
  - Minggu 8: End-to-End Testing, simulasi transaksi sandbox, dan peluncuran resmi (Go-Live).
- **Rekomendasi teknologi dari CEO (bagian 6 asli) — rekomendasi, bukan keputusan final. Stack final diputuskan Architect/Analyst di TDD:**
  - Frontend Store: Next.js (React) + Tailwind CSS — cepat, ramah SEO (SSR), desain fleksibel.
  - Backend & DB: Node.js (NestJS / Supabase) + PostgreSQL — skalabilitas tinggi, integritas data transaksi kuat (ACID).
  - Payment Gateway: Midtrans / Xendit — reputasi terpercaya di Indonesia, fee bersaing, uptime 99.9%. (Catatan BA: FR-16 juga menyebut Tripay; tech stack hanya Midtrans/Xendit.)
  - Shipping Aggregator: Biteship API / RajaOngkir Pro — otomasi ongkir seluruh kecamatan Indonesia & cetak label resi.
  - Notifikasi WA: Fonnte / Waha / Whapi API — pengiriman status order otomatis ke WhatsApp pelanggan.
  - Cloud Hosting: Vercel (Frontend) + VPS / AWS (Backend) — hemat biaya di awal, mudah scale up saat trafik promosi melonjak.
- **Budget [ASUMSI], estimasi tim untuk Mata Air** (Q21: CEO minta budget "disesuaikan dulu dari tim", 2026-09-27; CEO belum memberi atau menyetujui angka; CEO bisa membatalkan/merevisi). Ditinjau ulang di v0.4: angka dipertahankan, karena nama klien tidak menambah data skala, volume, atau jenis produk; direvisi bila profil bisnis Mata Air diketahui. Harga vendor dari tarif publik per 2026, perlu dicek ulang saat memilih vendor di TDD:
  - Pengembangan MVP (Modul 1–7, FR-01–FR-22, ukuran L, 6–8 minggu): **Rp75–150 juta sekali bayar**, setara harga agensi lokal untuk e-commerce custom setara. Batas bawah bila memakai headless/platform existing, batas atas bila custom dari nol. Biaya internal Xavortree sendiri hanya langganan Claude; angka ini acuan nilai jual ke klien.
  - Biaya tetap bulanan: hosting frontend + backend + database Rp300 ribu–1,5 juta; API ongkir Rp0–600 ribu; WA API Rp50 ribu (unofficial, risiko R4) s.d. Rp1,5 juta (resmi, per percakapan); email transaksional Rp0–350 ribu; domain ±Rp25 ribu. **Total Rp0,4–4 juta/bulan.**
  - Biaya variabel payment gateway (per transaksi, ditanggung toko): VA ±Rp4.000–5.000; QRIS ±0,7%; kartu ±2,9% + Rp2.000. Contoh 500 order/bulan, AOV Rp200 ribu: **±Rp1–2,5 juta/bulan**.
  - Opsional: retainer pemeliharaan Rp2–5 juta/bulan setelah Go-Live.
- Dari konteks perusahaan: repo kode masih [BLOKIR], belum ada lingkungan, tidak ada tim manusia, biaya dibatasi langganan Claude Pro.

## 8. Kriteria keberterimaan MVP (Acceptance Criteria)
(Bagian 8 asli) Website dinyatakan siap rilis (Ready to Launch) jika:
1. Pelanggan dapat menyelesaikan alur pembelian dari memilih produk sampai menerima notifikasi pembayaran sukses tanpa kendala.
2. Ongkos kirim terhitung otomatis sesuai alamat tujuan dan berat barang.
3. Webhook Payment Gateway berhasil merubah status transaksi menjadi PAID secara instan tanpa verifikasi manual.
4. Admin dapat mengelola produk, memantau pesanan masuk, dan mencetak label pengiriman thermal dengan mudah.
5. Website memiliki nilai performa Core Web Vitals (Mobile) di atas 85 pada Google PageSpeed Insights.

## 9. Risiko dan asumsi
- Matriks risiko: dokumen CEO tidak memuat bagian risiko. Catatan BA (bukan isi dokumen CEO):
  - R1 Timeline: 22 FR + 4 integrasi pihak ketiga (payment, ongkir, WA, Google login) dalam 8 minggu tanpa tim manusia dan repo masih BLOKIR. Minggu 7 memuat 4 pekerjaan sekaligus (admin, stok, resi, WA). [ASUMSI] Rekomendasi: jaga jalur checkout inti (AC 1–3) sebagai prioritas; FR-07 video, FR-09 fuzzy, FR-11 wishlist, dan PayLater boleh digeser bila minggu 7 molor.
  - R2 Akun merchant: aktivasi payment gateway, API ongkir, dan nomor WA API butuh KYC badan usaha/rekening, bisa makan 1–3 minggu [ASUMSI]. Integrasi dijadwalkan minggu 5–6, jadi pendaftaran harus dimulai CEO paling lambat minggu 1. Di luar kendali tim.
  - R3 Data pribadi pelanggan (UU PDP) untuk database pelanggan dan notifikasi WA/email: perlu persetujuan (consent) pelanggan.
  - R4 WA API tidak resmi (Fonnte/Waha/Whapi berbasis WA Web) berisiko nomor diblokir WhatsApp. Pilihan final di TDD.

## 10. Estimasi kasar
[ASUMSI] **L** untuk Modul 1–7 (22 FR, 4 integrasi eksternal, webhook pembayaran, admin). Mendekati batas atas L karena Modul 6–7 ikut MVP; bisa naik ke XL bila dibangun custom dari nol tanpa platform/headless. Estimasi presisi di PRD/TDD.

## 11. Pertanyaan untuk CEO
1. Toko ini untuk siapa? — **TERJAWAB (2026-09-27): B, klien Xavortree** (KEPUTUSAN.md Q13).
   Identitas klien spesifik — **TERJAWAB (2026-09-27, Q21): Mata Air** (nama dari CEO via dashboard). Profil bisnis Mata Air (sektor, skala, volume) belum dikonfirmasi, tetap [ASUMSI] di bagian 1.
2. Budget dan biaya operasional bulanan? — **DIDELEGASIKAN (2026-09-27, Q21)**: CEO minta "disesuaikan dulu dari tim"; estimasi [ASUMSI] tim di bagian 7 dipertahankan (dev Rp75–150 juta, tetap Rp0,4–4 juta/bulan, fee PG ±Rp1–2,5 juta/bulan). Belum disetujui CEO sebagai angka final.
3. Sumber diagram alur transaksi (bagian 4) — **TERJAWAB (2026-09-27): B, pakai draft tim**, bukan file BRD asli. Jawaban CEO via dashboard: "buatkan aja deh pake yang ada". Diagram yang dipakai: Mermaid di PRD.md bagian 2.1/2.2 (berlabel draft PM), CEO review.
   Persona detail — **DIDELEGASIKAN (2026-09-27, Q21), belum dikonfirmasi CEO**: hanya nada brand yang dikonfirmasi; persona [ASUMSI] ada di bagian 5, jenis produk dan volume order Mata Air di bagian 1. CEO bisa membatalkan/merevisi.

## Catatan Analyst (tinjauan awal, ditulis atas BRD v0.1)
Oleh: Analyst (Bima), 2026-09-26. Bukan isi dokumen CEO; tidak menambah FR.
Pembaruan BA v0.2: pertanyaan admin/backoffice di poin 2 terjawab oleh Modul 7 (FR-19 s/d FR-22); rekomendasi stack CEO sudah ada di bagian 7 (tetap diputuskan final di TDD).

**1. Estimasi ukuran.** Sepakat dengan BA: **L** untuk Modul 1–5, bukan XL. 5 modul fungsional standar e-commerce untuk MVP 6–8 minggu adalah lingkup wajar (bandingkan gocean-b2b: F1–F6, 24 bulan). Bisa turun ke **M** bila memakai platform/headless yang sudah menyediakan katalog, cart, voucher, dan admin; tetap **L** atau lebih bila custom dari nol. Estimasi belum final sampai NFR, budget, timeline per minggu, dan Modul 6+ diterima. Di tahap plan, ukuran L dipecah per modul (target plan S/M).

**2. Pertanyaan teknis kunci sebelum FD/TDD** (melengkapi pertanyaan BA di bagian 11)
- Admin/backoffice: FR-15 menyebut "admin", tapi kelola produk/varian/stok, pesanan, status bayar, dan voucher tidak didefinisikan. Masuk MVP? [ASUMSI] A: ya, admin minimal (produk, pesanan, voucher, cetak label). B: tidak. Rekomendasi A, karena tanpa admin FR-05 s/d FR-15 tidak bisa dioperasikan.
- Platform: custom build vs headless/existing (Medusa, WooCommerce, Shopify + plugin lokal). Ini penentu terbesar kelayakan 6–8 minggu. [ASUMSI] Rekomendasi: headless open-source (mis. Medusa) + storefront custom mobile-first; dibandingkan resmi lewat /riset sebelum TDD.
- Akun pihak ketiga: RajaOngkir/Biteship dan Midtrans/Xendit/Tripay sudah punya akun + API key production, atau baru daftar? Dipegang atas nama siapa (terkait pertanyaan BA no. 1)? Satu vendor per kategori dipilih sebelum TDD.
- Konten katalog (data produk, varian, foto, video FR-07): siapa yang mengisi, dan apakah migrasi dari marketplace masuk timeline dev? [ASUMSI] Rekomendasi: tanggung jawab pemilik brand, tim hanya menyediakan import CSV.
- Stack: default stack di companies/xavortree/CLAUDE.md berorientasi IoT (MQTT/TimescaleDB), tidak cocok langsung untuk e-commerce; perlu keputusan stack sendiri di TDD.

**3. Risiko awal**
- Timeline: 5 modul + 2–3 integrasi (ongkir, payment, Google login) dalam 6–8 minggu agresif bila custom dari nol; platform existing mempercepat tapi membatasi kustomisasi (mis. aturan voucher FR-12, UX checkout <3 menit).
- Approval pihak ketiga (verifikasi bisnis payment gateway, aktivasi kurir instan) di luar kendali tim dan bisa jadi jalur kritis.
- Teknis yang sering meleset: data wilayah FR-02 harus cocok dengan ID area vendor ongkir (beda antar RajaOngkir/Biteship); webhook pembayaran wajib idempoten + verifikasi signature; reservasi stok selama VA/QRIS belum dibayar dan saat kedaluwarsa.
- Repo kode masih [BLOKIR] dan belum ada lingkungan; dev tidak bisa mulai sebelum itu dibuka.

**4. Konsistensi dengan gocean-b2b.** Berdiri sendiri: target beda (D2C retail klien Mata Air vs B2B cold-chain seafood), dokumen, timeline, dan budget terpisah. Irisan hanya di pola teknis (payment gateway, rekonsiliasi bayar otomatis). [ASUMSI] Rekomendasi: tidak berbagi kode atau kredensial antar project; pola integrasi boleh dirujuk ulang di TDD bila stack sama. Konfirmasi CEO hanya perlu bila toko ini ternyata milik PT Gocean.
