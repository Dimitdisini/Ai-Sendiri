# Basis Pengetahuan — Xavortree

File ini terus bertambah. Entri terbaru di atas. Dibaca semua peran sebelum mulai kerja untuk konteks terkini bidang perusahaan.

<!-- Entri baru ditambahkan Peneliti di bawah baris ini, format:
## YYYY-MM-DD — <judul singkat>
<2-4 kalimat ringkasan>
**Relevan karena:** <satu kalimat>
**Sumber:** <tautan atau nama>
-->

## 2026-10-09 — Otomasi Critical Tracking Events (CTEs) & Key Data Elements (KDEs) Berbasis IoT Telemetry untuk Kepatuhan Traceability Seafood B2B (FSMA 204)
Standar kepatuhan rantai pasok global (seperti regulasi FDA FSMA Rule 204 untuk seafood) mewajibkan pencatatan digital terstruktur atas Critical Tracking Events (CTEs: harvesting, cooling, packing, shipping, receiving) beserta Key Data Elements (KDEs) dalam format spreadsheet elektronik yang dapat diekspor dalam 24 jam saat audit. Pemanfaatan perangkat IoT telemetri (sensor suhu, kelembapan, dan GPS) mengotomatisasi pengikatan data fisik real-time langsung ke Traceability Lot Code (TLC) di setiap titik perpindahan rantai dingin, mengeliminasi risiko pencatatan manual di kapal/gudang dan mencegah manipulasi data. Pendekatan terotomasi ini memangkas waktu audit penelusuran lot bermasalah dari hitungan hari menjadi hitungan detik bila terjadi anomali paparan termal atau instruksi penarikan produk (recall).
**Relevan karena:** krusial untuk rancangan modul order management dan cold-chain traceability Gocean B2B (Scope 2) serta penguatan nilai jual solusi AI IoT Xavortree di pasar ekspor.
**Sumber:** [FDA FSMA Rule 204](https://fda.gov), [GS1 Standards for Cold-Chain](https://gs1.org), [Global Cold Chain Alliance](https://gcca.org)
*Notulen diskusi pagi:* [meetings/2026-10-09-diskusi-pagi.md](../../meetings/2026-10-09-diskusi-pagi.md)

## 2026-10-07 — Arsitektur Tiered Storage & Continuous Aggregates (TimescaleDB) untuk Telemetri IoT Cold-Chain
Implementasi TimescaleDB dengan pola Continuous Aggregates (CAGGs) memungkinkan pra-kalkulasi rollup metrik sensor (min, max, avg per 5 menit/jam) secara hierarkis, menjaga latensi kueri dashboard analitik tetap di bawah 200 ms tanpa memindai miliaran baris mentah. Kombinasi native columnar compression dan tiered storage ke object storage S3 mengotomatisasi penurunan data telemetri historis >30 hari, memangkas biaya penyimpanan hingga 85% untuk kebutuhan audit kepatuhan cold-chain 1–2 tahun tanpa memutus akses kueri SQL standar.
**Relevan karena:** sangat krusial untuk arsitektur backend data ingestion dan dashboard analitik Gocean B2B (Scope 2: traceability) serta efisiensi biaya infrastruktur cloud Xavortree.
**Sumber:** [Timescale Docs & Benchmarks](https://timescale.com), [Datoms IoT Research](https://datoms.io), [ResearchGate Time-Series IoT](https://researchgate.net)
*Notulen diskusi pagi:* [meetings/2026-10-07-diskusi-pagi.md](../../meetings/2026-10-07-diskusi-pagi.md)

## 2026-10-01 — Edge AI Risk Scoring & Local Store-and-Forward via MQTT pada Gateway IoT Cold-Chain
Edge AI pada gateway IoT cold-chain memungkinkan deteksi anomali deviasi suhu dan kalkulasi skor risiko secara on-device saat armada kapal atau truk berada di area blank spot sinyal maritim. Mekanisme local store-and-forward berprotokol MQTT QoS 1 menjamin seluruh telemetri tersimpan aman dan terkompresi hingga sinkronisasi audit logistik berhasil ditransmisikan ke cloud saat koneksi pulih.
**Relevan karena:** memperkuat ketahanan monitoring IoT dan keutuhan jejak audit data pada modul traceability Gocean B2B (Scope 2).
**Sumber:** [OpenText IoT](https://opentext.com), [Datoms IoT Research](https://datoms.io), [GCCA](https://gcca.org)
*Notulen diskusi pagi:* [meetings/2026-10-01-diskusi-pagi.md](../../meetings/2026-10-01-diskusi-pagi.md)


## 2026-09-30 — Dynamic FEFO Berbasis Telemetri IoT & Prediksi Sisa Masa Simpan untuk Cold-Chain Seafood B2B
Dynamic FEFO memanfaatkan telemetri suhu IoT kontinu untuk menghitung sisa masa simpan aktual (Remaining Shelf Life / RSL) komoditas seafood secara real-time berdasarkan paparan termal nyata, bukan sekadar tanggal kedaluwarsa statis. Alokasi order diarahkan otomatis untuk mengirim stok ber-RSL pendek ke pembeli lokal/cepat guna menekan risiko pembusukan 8–15% dan mengamankan stok mutu prima untuk jalur ekspor.
**Relevan karena:** mendukung arsitektur order management dan traceability gocean-b2b (Scope 2) serta selaras dengan fokus solusi AI IoT Xavortree.
**Sumber:** [Intelligent Container](https://intelligentcontainer.com), [Datoms IoT Research](https://datoms.io), [Food Logistics](https://foodlogistics.com)
*Notulen diskusi pagi:* [meetings/2026-09-30-diskusi-pagi.md](../../meetings/2026-09-30-diskusi-pagi.md)


## 2026-09-25 — Pergeseran ke AI prescriptive di monitoring IoT industri
Platform IoT industri 2026 bergeser dari dashboard deskriptif ke analitik preskriptif: AI tidak cuma menampilkan data sensor tapi mendiagnosis kondisi, memprediksi kegagalan, dan merekomendasikan tindakan langsung (contoh: Treon IQ). Pasar predictive maintenance global diperkirakan tumbuh dari USD 13,65 miliar (2025) ke USD 97 miliar (2034), CAGR di atas 24%.
**Relevan karena:** ini persis segmen produk Xavortree (monitoring sensor + dashboard analitik untuk klien) — jadi acuan arah fitur (rekomendasi otomatis, bukan cuma grafik) dan bukti pasar sedang tumbuh cepat.
**Sumber:** [Treon IQ - Macau Business](https://macaubusiness.com/treon-iq-the-new-industrial-ai-that-automates-operational-understanding-and-recommends-actions/), [Best Industrial IoT Monitoring Solutions 2026 - Tractian](https://tractian.com/en/blog/best-industrial-iot-monitoring-solutions-for-smart-manufacturing)
