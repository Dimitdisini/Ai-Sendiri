# BRD — Gocean B2B E-Commerce & Order Management System
Perusahaan: Xavortree (mitra teknologi) untuk klien PT Gocean Indonesia | Pemilik: PM | Status: Draft — menunggu teks BRD lengkap dan persetujuan CEO | Versi: 0.1 (2026-09-26)

**Referensi dokumen asli CEO:** kode BRD-XV-GCN-2026-V1, versi 1.0 (Enterprise Specification), status versi CEO "FINAL / APPROVED FOR IMPLEMENTATION", klasifikasi Strictly Confidential. Klien/pemilik produk: PT Gocean Indonesia (BoD & manajemen). Mitra teknologi: Xavortree. System Analyst & Lead Architect: Ardiansyah (Bang Ardi) & Dimitri Ahmad S. Target roadmap 24 bulan (Scope 1 & 2). Anggaran Rp 433.000.000 all-in turnkey (skema "Gas 433").
Riwayat revisi asli: v0.1 (10 Sep) F1-F3 baseline MVP 4 bulan; v0.5 (12 Sep) ekspansi F1-F6 (Fintech, Invoicing, Chat, Dual Environment); v0.9 (14 Sep) roadmap 24 bulan, requirement phase +1 bulan, piloting 2x40 hari, dedicated ops standby; v1.0 (26 Sep) acuan kontrak dan penyusunan FD.
Catatan status: status FINAL berlaku untuk dokumen versi CEO. Di sistem tim, BRD ini baru jadi acuan PRD/FD setelah teks lengkap diterima dan CEO menyetujui eksplisit.
Catatan (2026-09-27): Q14 dijawab CEO — pilih opsi A, kirim ulang BRD sebagai file utuh (PDF/Word/txt) ke folder ini, bukan tempel teks di chat. File utuh belum diterima; bagian 1.3 dan 2-12 masih placeholder di bawah sampai file masuk.

## 1. Latar belakang
PT Gocean Indonesia: perusahaan cold chain dan agregator perdagangan hasil laut (ekspor Asia Timur, Eropa, AS; domestik HORECA dan distributor grosir). Komoditas: tuna saku/loin, lobster, udang vaname, gurita, ikan pelagis bernilai tinggi; menuntut suhu -18°C s/d -25°C, traceability asal tangkapan, sertifikasi karantina.
Masalah saat ini (transaksi manual + WhatsApp):
- Human error saat rekap tonase, grade ukuran, dan spesifikasi potong dari chat ke spreadsheet.
- Tidak ada atribusi transaksi; hubungan supplier binaan dengan buyer rawan dibajak (poaching).
- Rekonsiliasi transfer bank manual memperlambat dokumen jalan, penagihan invoice, dan bagi hasil (split disbursement) ke nelayan/supplier.
- Tidak ada audit trail terpusat untuk validasi metrik ke investor.
Solusi yang diusulkan (bagian 1.3 asli): [BUTUH KONFIRMASI CEO: teks bagian 1.3 terpotong, belum ada isi].

## 2. Tujuan bisnis dan metrik sukses
[BUTUH KONFIRMASI CEO: teks lengkap bagian 2 "Tujuan Bisnis, Masalah & KPI" dari BRD asli belum diterima]. Tidak ada angka KPI yang dikarang di sini.

## 3. Scope
### Termasuk
- Modul F1-F6 (dari riwayat revisi): F1-F3 = baseline MVP; ekspansi mencakup Fintech, Invoicing, Chat, Dual Environment. Rincian tiap modul: [BUTUH KONFIRMASI CEO: teks lengkap bagian 3 dan 6 (FR) belum diterima].
- Requirement phase 1 bulan, piloting 2x40 hari, dedicated ops standby (dari v0.9). Detail: [BUTUH KONFIRMASI CEO: bagian 9].
### Tidak termasuk
[BUTUH KONFIRMASI CEO: batas scope (boundaries) bagian 3 belum diterima].

## 4. Pengguna dan pemangku kepentingan
- Diketahui: BoD & manajemen PT Gocean (pemilik produk); indikasi pengguna dari latar belakang: buyer ekspor/domestik, supplier binaan/nelayan, tim internal Gocean, investor (pembaca laporan).
- Persona dan peran rinci: [BUTUH KONFIRMASI CEO: teks lengkap bagian 4 belum diterima].

## 5. Batasan
- Waktu: 24 bulan (Scope 1 & 2). Anggaran: Rp 433 juta all-in turnkey. Rincian termin/tata kelola bayar: [BUTUH KONFIRMASI CEO: bagian 10].
- NFR, arsitektur Dual Environment, aturan eksekusi: [BUTUH KONFIRMASI CEO: bagian 7 dan 8].
- Tim: tidak ada tim manusia di Xavortree selain CEO; stack dan repo kode belum ditentukan (lihat companies/xavortree/CLAUDE.md).

## 6. Risiko dan asumsi
- Matriks risiko asli: [BUTUH KONFIRMASI CEO: bagian 11]. Kriteria keberterimaan dan lembar pengesahan: [BUTUH KONFIRMASI CEO: bagian 12]. Proses bisnis As-Is vs To-Be: [BUTUH KONFIRMASI CEO: bagian 5].
- [ASUMSI] Rp 433 juta / 24 bulan = rata-rata sekitar Rp 18 juta per bulan, termasuk ops standby dan 2 pilot. Rekomendasi: pastikan pembagian build vs operasional di bagian 10 sebelum PRD, karena scope F1-F6 besar untuk angka ini.
- [ASUMSI] Fitur Fintech/split disbursement kemungkinan menyentuh regulasi pembayaran (BI/OJK) dan butuh mitra payment gateway. Rekomendasi: cek di bagian 7/8/11 asli; kalau belum diatur, jadi pertanyaan untuk klien.
- [ASUMSI] Ardiansyah tercatat sebagai co-analyst di dokumen asli, tapi aturan tim: semua komunikasi hanya ke CEO. Rekomendasi: masukan Ardiansyah disalurkan lewat CEO.

## 7. Estimasi kasar
XL. Alasan: 6 modul termasuk fintech dan chat, dua environment, dua klien pengguna (buyer dan supplier), roadmap 24 bulan dengan pilot dan ops standby. Estimasi rinci menunggu bagian 6 dan 9.

## 8. Pertanyaan untuk CEO
1. Cara mengirim sisa teks BRD (bagian 1.3 dan 2-12)?
   A: upload file BRD lengkap (PDF/DOCX) ke companies/xavortree/docs/gocean-b2b/. B: tempel ulang per bagian di chat.
   Rekomendasi: A, karena satu file utuh mencegah teks terpotong lagi dan jadi arsip asli.
2. Apakah Rp 433 juta all-in dan roadmap 24 bulan sudah final (sudah disepakati klien) untuk jadi basis PRD/FD?
   A: final, kunci sebagai batasan. B: masih bisa dinegosiasikan, BA siapkan business case pembanding.
   Rekomendasi: A jika kontrak sudah ditandatangani, karena PRD perlu batas tetap; B jika belum.
3. Apakah BRD ini dinyatakan disetujui setelah teks lengkap masuk tanpa perubahan isi?
   A: ya, langsung setujui begitu lengkap dan lanjut ke PRD. B: tim review dulu (celah, risiko, konsistensi) sebelum CEO setujui.
   Rekomendasi: B, karena bagian fintech dan anggaran per bulan perlu dicek sebelum mengikat PRD/FD.

## Catatan Analyst (tinjauan awal)
Oleh: analyst (Bima), 2026-09-26. Hanya berdasar isi yang sudah ada; bukan FD/TDD/plan. Tidak ada isi FR yang dikarang.
Estimasi kasar: **XL** (sinyal: F1-F6 termasuk fintech, invoicing, chat, dual environment; dua sisi pengguna buyer dan supplier; 24 bulan dengan 2 pilot dan ops standby). Harus dipecah per modul/fase sebelum jadi plan. Estimasi presisi (plan S/M/L, jumlah plan, urutan) TIDAK BISA dibuat sampai bagian 3, 6, 7, 8, 9 diterima.
Pertanyaan teknis (dijawab dari BRD lengkap atau lewat CEO):
1. Dual Environment artinya apa: dev/staging vs produksi, atau pemisahan lingkungan fintech (dana) vs operasional/marketplace? Ini menentukan arsitektur, biaya hosting, dan audit.
2. Fintech/split disbursement: lewat payment gateway berlisensi (escrow/split payment API) atau Gocean memegang dana sendiri? Kalau memegang dana, ada risiko regulasi BI/OJK di luar kemampuan tim.
3. Traceability cold chain: data suhu diinput manual, dari logger/sensor IoT, atau dari sistem pihak ketiga (gudang/ekspedisi)? Granularitas lacak: per lot, per karton, atau per tangkapan?
4. Dokumen ekspor/karantina (sertifikat, health certificate): hanya upload dan simpan, atau integrasi ke sistem pemerintah?
5. Chat: dibangun sendiri (real-time, moderasi, arsip) atau integrasi WhatsApp Business API/layanan pihak ketiga? Terkait anti-poaching: apakah kontak buyer-supplier harus disembunyikan?
6. Invoicing: perlu e-Faktur/pajak dan integrasi akuntansi, atau cukup invoice PDF + status bayar?
7. Ops standby: SLA jam berapa, siapa yang menjalankan (tim hanya AI + CEO), dan apakah termasuk dalam Rp 433 juta?
8. Hosting, domain, lisensi, dan biaya transaksi gateway: masuk anggaran all-in atau ditanggung klien?
Risiko awal:
- R1 Anggaran vs scope: rata-rata ~Rp 18 juta/bulan untuk build + 2 pilot + ops 24 bulan; F4-F6 (fintech, chat) paling mahal dan paling berisiko. Mitigasi: kunci F1-F3 sebagai fase 1 berdiri sendiri.
- R2 Regulasi dan keamanan dana (fintech, data transaksi, UU PDP): butuh audit keamanan dan mitra berlisensi.
- R3 Kapasitas eksekusi: tidak ada tim manusia, stack dan repo masih [BLOKIR] di CLAUDE.md; ops standby 24 bulan tidak bisa dijalankan agen tanpa orang on-call.
- R4 Adopsi pengguna: buyer/nelayan terbiasa WhatsApp; pilot 2x40 hari bisa molor kalau onboarding supplier lambat.
- R5 Status "FINAL/APPROVED" di dokumen CEO sementara bagian teknis belum ada di tim: risiko komitmen kontrak sebelum scope teknis diverifikasi.
