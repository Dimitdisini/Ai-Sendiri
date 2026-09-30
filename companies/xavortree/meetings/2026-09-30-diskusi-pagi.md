# Diskusi Pagi — Dynamic FEFO Berbasis Telemetri IoT & Prediksi Sisa Masa Simpan
Tanggal: 2026-09-30 | Perusahaan: Xavortree | Peserta: peneliti (Rian), business-analyst (Tari), pm (Sari), analyst (Bima), ai-engineer (Naya) | Dipimpin: Orkestrator (Kai)

## Tema
Dynamic FEFO (First-Expired, First-Out) Berbasis Telemetri IoT & Prediksi Sisa Masa Simpan (Remaining Shelf Life) untuk Cold-Chain Seafood B2B

## Ringkasan Tema
Pada logistik rantai dingin hasil laut, metode rotasi stok tradisional berbasis FIFO atau FEFO statis kerap memicu pembusukan karena degradasi mutu sangat dipengaruhi riwayat deviasi suhu (*thermal abuse*) selama transit dan penyimpanan. Dynamic FEFO memanfaatkan data telemetri sensor IoT secara kontinu untuk menghitung sisa masa simpan aktual (*Remaining Shelf Life* / RSL) tiap batch secara *real-time* menggunakan model kinetika degradasi kesegaran. Integrasi analitik ini ke dalam Order Management System (OMS) atau Warehouse Management System (WMS) memungkinkan alokasi dan pengiriman otomatis stok dengan RSL terpendek ke pembeli terdekat atau kanal konsumsi cepat, bukan sekadar urutan kedatangan barang di gudang. Penerapan Dynamic FEFO terbukti menekan limbah susut (*spoilage*) komoditas *perishable* hingga 8–15% sekaligus menjamin konsistensi mutu yang diterima pembeli.

**Sumber:**
- Intelligent Container (2026): *Dynamic FEFO: Revolutionizing Perishable Goods and Cold Chain Logistics through Real-Time IoT* (https://intelligentcontainer.com)
- Datoms IoT Research: *Smart Cold Chain Monitoring & Predictive Shelf-Life Automation for Seafood* (https://datoms.io)
- Food Logistics / Emergent Cold LatAm: *From FIFO to Dynamic FEFO in Temperature-Controlled Supply Chains* (https://foodlogistics.com)

## Pandangan Per Peran

### Tari (Business Analyst)
Bagi saya, inisiatif ini berarti harus memetakan ulang proses bisnis pemenuhan pesanan dari kedaluwarsa statis ke aturan dinamis berbasis RSL serta memvalidasi business case penghematan spoilage 8–15%. Secara konkret, tim dapat segera menyusun matriks alokasi order di BRD yang memetakan ambang batas RSL terhadap segmen buyer (HORECA lokal vs ekspor) sebagai acuan kebutuhan sebelum solusi teknis dibangun.

### Sari (Product Manager)
Dynamic FEFO ini mengubah logika alokasi inventaris pada PRD Gocean dari aturan kedaluwarsa statis menjadi matching engine dinamis berbasis skor RSL real-time dan profil buyer. Saya perlu merumuskan acceptance criteria ketat terkait ambang batas RSL minimum per segmen (ekspor vs HORECA) guna mencegah komplain kualitas. Langkah konkretnya, kita bisa segera memetakan user story dan aturan alokasi Dynamic FEFO ke BACKLOG.md dengan prioritas MoSCoW agar siap ditindaklanjuti Architect ke dalam spesifikasi teknis.

### Bima (System Analyst / Architect)
Dynamic FEFO menuntut saya merancang arsitektur event-driven untuk ingest telemetri suhu IoT dan memperbarui model data inventaris Gocean agar alokasi stok berbasis kalkulasi RSL real-time, bukan tanggal kedaluwarsa statis. Hal ini mengubah kontrak API dan logika dispatch pesanan dari query database sederhana menjadi aturan pencocokan adaptif antara kualitas aktual produk dengan SLA pengiriman buyer. Satu hal konkret yang bisa tim lakukan adalah menyusun TDD modul alokasi pesanan pintar yang mengotomatisasi pemetaan batch ber-RSL pendek ke HORECA lokal dan stok prima ke buyer jarak jauh.

### Naya (AI Engineer)
Bagi saya sebagai AI Engineer, tema ini menuntut kita memvalidasi secara ketat apakah prediksi RSL benar-benar membutuhkan model Machine Learning atau cukup formula kinetika pembusukan biokimia (seperti persamaan Arrhenius) agar terhindar dari over-engineering. Jika variabilitas telemetri dan jenis seafood Gocean memang memerlukan pendekatan prediktif ML, peran saya adalah merancang AI-SPEC dan menentukan metrik evaluasi akurasi sisa masa simpan sebelum model diintegrasikan ke sistem alokasi. Satu hal konkret yang bisa tim lakukan sekarang adalah berkolaborasi dengan Data Engineer (Wulan) untuk menguji coba formula non-AI pada sampel log telemetri historis sebagai baseline pembanding efektivitas.
