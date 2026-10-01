# Diskusi Pagi — Edge AI Risk Scoring & Local Store-and-Forward via MQTT pada Gateway IoT Cold-Chain
Tanggal: 2026-10-01 | Perusahaan: Xavortree | Peserta: peneliti (Rian), analyst (Bima), ai-engineer (Naya), backend (Raka), devops (Yoga) | Dipimpin: Orkestrator (Kai)

## Tema
Edge AI Risk Scoring & Local Store-and-Forward via MQTT pada Gateway IoT Cold-Chain untuk Integritas Logistik Maritim

## Ringkasan Tema
Logistik rantai dingin hasil laut antar pulau sering menghadapi blank spot konektivitas seluler yang memutus transmisi data telemetri real-time ke cloud. Arsitektur konvensional yang hanya mengandalkan pelaporan cloud memicu risiko fatal: peringatan deviasi suhu terlambat disadari dan integritas data audit logistik terputus saat insiden pembusukan terjadi di tengah laut. Penerapan Edge AI pada gateway IoT lokal memungkinkan perhitungan risk scoring dan deteksi anomali suhu secara on-device seketika tanpa bergantung pada jaringan luar, sehingga alarm lokal atau koreksi pendingin dapat segera dipicu. Dikombinasikan dengan mekanisme store-and-forward berprotokol MQTT QoS 1 serta kompresi data lokal, integritas seluruh rekaman rantai dingin tetap utuh, terverifikasi, dan siap disinkronisasi ke backend sistem lacak-balak begitu konektivitas kembali pulih.

**Sumber:**
- OpenText IoT & Supply Chain (2026): *Edge Computing & MQTT in Cold Chain Logistics: Managing Intermittent Connectivity* (https://opentext.com)
- Datoms IoT Research (2026): *Edge Anomaly Detection & Resilient Store-and-Forward Telemetry for Perishables* (https://datoms.io)
- GCCA (Global Cold Chain Alliance) (2026): *Edge AI Risk Scoring and Autonomous Integrity Controls in Maritime Cold Storage* (https://gcca.org)

## Pandangan Per Peran

### Bima (System Analyst / Architect)
Tema ini berarti kita harus merancang arsitektur telemetri offline-first pada gateway cold-chain dengan mekanisme store-and-forward serta kompresi payload MQTT saat koneksi terputus. Hal ini memengaruhi kontrak data penyerahan telemetri ke backend Gocean agar timestamp deviasi lokal tetap valid dan tidak tertimpa waktu penerimaan broker. Satu hal konkret yang bisa dilakukan tim adalah menyusun spesifikasi arsitektur edge gateway (kontrak payload lokal, buffer penyimpanan persisten, dan format sinkronisasi event) di TDD modul traceability.

### Naya (AI Engineer)
Dari sisi AI, tema ini menegaskan perlunya model deteksi anomali yang sangat ringan (seperti TinyML atau rolling z-score / IQR) agar mampu dieksekusi stabil pada komputasi gateway hemat daya. Model edge ini harus memiliki filter cerdas agar tidak memicu false positive saat terjadi fluktuasi termal wajar, seperti saat pintu reefer dibuka sejenak saat bongkar muat. Secara konkret, saya bisa menyusun AI-SPEC untuk algoritma on-device anomaly scoring beserta batasan ambang lolos dan dataset uji deviasi termal sebelum diintegrasikan ke firmware gateway.

### Raka (Backend Developer)
Penerapan store-and-forward dari edge berarti backend ingestion Gocean harus siap menangani burst event dan data out-of-order saat koneksi gateway kembali online secara mendadak. Saya wajib mengimplementasikan pola ingest yang idempoten serta rekonsiliasi urutan log telemetri di database TimescaleDB/PostgreSQL agar riwayat suhu tiap batch ikan tetap konsisten dan runtut. Langkah konkret yang bisa saya lakukan adalah menyiapkan endpoint ingest batch telemetri yang dilengkapi proteksi de-duplikasi dan unit test penerimaan data ber-timestamp lampau.

### Yoga (DevOps)
Dari sudut pandang DevOps, adopsi edge computing menuntut standarisasi image container minimalis dan mekanisme Over-The-Air (OTA) update yang aman untuk pemeliharaan perangkat gateway secara jarak jauh. Kita juga perlu mengonfigurasi broker MQTT lokal di level perangkat yang mampu melakukan auto-reconnect dan failover buffer ke storage persisten ketika koneksi seluler terputus. Hal konkret yang bisa tim lakukan adalah membuat template Docker Compose edge gateway yang ringan dengan healthcheck mandiri serta konfigurasi retensi storage lokal.
