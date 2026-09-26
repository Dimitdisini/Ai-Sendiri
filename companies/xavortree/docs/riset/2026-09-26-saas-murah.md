# Riset: Membangun Web SaaS yang Bisa Dijual Murah

Tanggal: 2026-09-26 | Peran: Business Analyst (Tari) | Status: eksplorasi, BUKAN kickoff project

## Pertanyaan riset
Bagaimana Xavortree bisa membangun dan menjual SaaS dengan harga murah tapi tetap untung? Apa strategi bisnis, harga, dan stack hemat yang paling cocok?

## Temuan inti (strategi bisnis SaaS murah)
1. **Satu niche, satu masalah.** Micro SaaS yang untung menyelesaikan satu masalah untuk satu tipe pelanggan. Fitur sedikit = biaya bangun dan rawat rendah.
2. **Self-serve penuh.** Daftar, bayar, dan onboarding tanpa sales dan tanpa demo. Ini syarat utama harga murah karena biaya akuisisi (CAC) harus mendekati nol.
3. **Trial 14 hari, bukan freemium.** Untuk B2B, trial lebih mudah jadi pelanggan berbayar. Freemium merugikan kalau pengguna gratis tetap memakan biaya server.
4. **Harga naik mengikuti pemakaian** (per perangkat/sensor/lokasi), bukan per fitur. Harga awal murah, lalu naik sendiri saat pelanggan bertumbuh.
5. **Paket tahunan diskon sekitar 20%** supaya kas masuk lebih cepat dan pelanggan tidak cepat berhenti (churn turun).
6. **Pembayaran lokal otomatis.** QRIS sekitar 0,7%, VA sekitar Rp4.000/transaksi (Midtrans); Xendit sekitar 1,5%. Pelanggan kecil di Indonesia lebih suka QRIS/VA daripada kartu kredit.
7. **Aturan margin:** biaya melayani satu pelanggan (infra + fee bayar + support) maksimal 20% dari harga jualnya. [ASUMSI] Angka ini patokan umum industri, belum diuji di Xavortree.
8. **Pemasaran tanpa iklan:** konten tutorial/SEO, komunitas niche (grup WA/FB industri), program referral. Iklan berbayar hampir selalu merusak unit economics untuk harga di bawah Rp100rb.

## Perbandingan 3 opsi membangun
Kurs [ASUMSI] Rp16.500/USD. Biaya belum termasuk waktu kerja CEO.

| Aspek | A. Boilerplate open-source + VPS self-host | B. Platform no-code (misal Bubble) | C. Custom minimal serverless (Next.js + Vercel + Supabase) |
|---|---|---|---|
| Biaya awal | Rp0 sampai sekitar Rp3 jt (boilerplate berbayar opsional) | Rp0 (paket gratis untuk prototipe) | Rp0 (free tier), bisa pakai boilerplate gratis |
| Operasional/bulan | VPS sekitar Rp100-300rb, tetap sama sampai ratusan pelanggan | Sekitar Rp500rb-2 jt, naik sesuai kapasitas | Sekitar Rp750rb untuk produksi (Vercel Pro $20 + Supabase Pro $25), naik bertahap |
| Kecepatan ke pasar | 3-6 minggu [ASUMSI] | 1-3 minggu (paling cepat) | 3-6 minggu [ASUMSI], lebih cepat dengan bantuan AI coding |
| Kemampuan dijual murah (margin) | Paling tinggi saat skala besar, tapi ops/backup/keamanan diurus sendiri | Paling rendah: biaya platform naik mengikuti pemakaian, lock-in | Tinggi: biaya awal nol, naik bertahap, ops minim |
| Cocok dengan Xavortree (software + AI + IoT) | Cocok secara teknis, tapi beban ops berat untuk tim tanpa manusia | Lemah: integrasi MQTT/data sensor time-series terbatas | Paling cocok: Postgres cocok untuk data sensor, API bebas, AI mudah ditambah |
| Risiko utama | Downtime dan keamanan jadi tanggung jawab sendiri | Lock-in, sulit migrasi, sulit dijual sebagai IP sendiri | Tagihan bisa melonjak kalau trafik tak terkontrol; free tier Supabase berhenti sementara (pause) kalau tidak aktif 1 minggu, Vercel Hobby tidak boleh untuk komersial |

## Rekomendasi: Opsi C (custom minimal serverless), mulai dari boilerplate gratis
- Biaya awal Rp0 dan biaya naik mengikuti jumlah pelanggan, cocok dengan batas biaya hemat Xavortree.
- Kodenya milik sendiri, jadi bisa dijual ulang atau di-white-label untuk klien (klien analisis bisnis dan IoT).
- Hitungan kasar [ASUMSI]: kalau harga Rp99rb/bulan, 8 pelanggan sudah menutup biaya infra sekitar Rp750rb. Mulai 30 pelanggan (sekitar Rp3 jt/bulan), margin kotor di atas 70%.
- Kalau nanti biaya serverless melewati sekitar Rp3 jt/bulan, baru pertimbangkan pindah ke opsi A (VPS). Keputusan pindahnya milik Architect, bukan BA.
- Catatan: di 2026-09-25 CEO pernah menolak project "SaaS AI IoT" (lihat PELAJARAN.md). Riset ini hanya jawaban pertanyaan CEO, bukan usulan project. Project baru harus lewat sop-validasi-kebutuhan.

## Butuh uji nyata oleh manusia (CEO)
Agen tidak boleh menghubungi pihak luar dan tidak boleh mengeluarkan uang, jadi hal-hal di bawah hanya bisa dibuktikan oleh CEO:
1. **Masalahnya nyata dan harganya masuk.** Apakah calon pelanggan (UMKM/pabrik kecil) punya masalah itu dan mau bayar sekitar Rp50-150rb/bulan?
2. **Orang mau daftar dan bayar.** Ukur tingkat konversi landing page ke pendaftaran trial, lalu ke pembayaran pertama.
3. **Mereka mau bayar sendiri tanpa dibantu.** Apakah pelanggan kecil mau daftar dan bayar lewat QRIS tanpa ditelepon?

**Rencana uji (2-3 minggu, biaya di bawah Rp500rb)**
| Minggu | Aktivitas CEO | Metrik lulus |
|---|---|---|
| 1 | Wawancara 8-10 calon pelanggan dari satu niche (misal monitoring suhu gudang/cold storage). Tanyakan masalahnya, cara mereka sekarang, dan berapa uang yang habis untuk itu | Minimal 5 dari 10 menyebut masalah yang sama dan saat ini sudah keluar uang/waktu untuk itu |
| 2 | Landing page satu halaman dengan 2 varian harga (Rp79rb vs Rp149rb) dan tombol "Mulai trial / Pre-order", sebar ke komunitas niche | Konversi pengunjung ke daftar minimal 5%, dan varian mahal tidak turun lebih dari setengah |
| 3 | Pre-sale: tawarkan paket tahunan diskon lewat link QRIS/VA | Minimal 3 pembayaran nyata. Kalau 0, niche atau harga salah; ulangi minggu 1 dengan niche lain |

Semua tindakan keluar (sebar link, menerima pembayaran) menunggu "ya" eksplisit dari CEO.

## Sumber
- [Dodo Payments: Micro SaaS ideas 2026](https://dodopayments.com/blogs/micro-saas-ideas-2026)
- [NxCode: Micro SaaS ideas 2026](https://www.nxcode.io/resources/news/micro-saas-ideas-2026)
- [MakerKit: Supabase pricing 2026](https://makerkit.dev/blog/saas/supabase-pricing)
- [getdeploying: Supabase vs Vercel 2026](https://getdeploying.com/supabase-vs-vercel)
- [Midtrans pricing](https://midtrans.com/pricing) · [Midtrans vs Xendit untuk UMKM](https://umkmgodigital.com/midtrans-vs-xendit-untuk-umkm)
