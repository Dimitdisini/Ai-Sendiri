# PRD — Monitoring Gudang Pintar
Perusahaan: Xavortree | Pemilik: PM (Sari) | Turunan dari: BRD.md v0.1 (disetujui CEO 2026-09-25) | Status: Draft, menunggu review CEO | Versi: 0.1

## 1. Ringkasan produk
Platform SaaS multi-tenant untuk memantau suhu dan kelembapan gudang: node sensor (ESP32 + SHT31) mengirim data via MQTT, server menyimpan time-series, memberi alert Telegram berbasis ambang klasik dan deteksi anomali AI (tren naik, laju perubahan abnormal, sensor macet) sebelum ambang terlampaui, serta dashboard web per tenant. Lebih baik dari pengecekan manual dan alert ambang saja karena peringatan datang lebih dini, terekam, dan bisa di-acknowledge. Rilis pertama = **demo internal** (keputusan CEO Q1=B): berjalan dengan simulator data, dataset sintetis, dan 2–3 node fisik milik Xavortree; klien nyata dicari setelah demo. Multi-tenant sejak awal (Q2=A) dan AI anomali wajib ada di rilis pertama (Q3=B); AI Engineer menulis AI-SPEC terpisah.

## 2. Persona dan alur utama
- Petugas gudang: menerima alert Telegram, menekan Ack, melihat dashboard.
- Supervisor gudang: mengatur ambang zona, melihat grafik dan riwayat alert.
- Admin Xavortree: onboarding tenant, zona, perangkat, grup Telegram; memantau kesehatan sistem.
- Persona internal rilis ini: CEO (penonton demo) dan AI Engineer (pengguna simulator dan dataset).

Alur utama: (1) node fisik/simulator → MQTT → ingestion → TimescaleDB → dashboard real-time; (2) rule ambang dan modul AI membaca data → alert Telegram → Ack → status di dashboard, eskalasi bila tidak di-ack; (3) admin membuat tenant baru → kredensial perangkat → data tenant baru tampil terpisah tanpa restart.

## 3. Fitur (prioritas MoSCoW)
| ID | Fitur | Prioritas | User story | Acceptance criteria |
|---|---|---|---|---|
| F01 | Fondasi multi-tenant | Must | Sebagai admin Xavortree, saya ingin data tiap klien terpisah dalam satu instance agar produk bisa dijual ulang sebagai SaaS. | Diberikan tenant A dan B masing-masing punya perangkat, ketika pengguna tenant A meminta data (API atau dashboard) dengan tokennya, maka hanya data tenant A yang dikembalikan dan permintaan ke perangkat tenant B ditolak (403 atau kosong). |
| F02 | Simulator data sensor | Must | Sebagai tim demo, saya ingin simulator yang menerbitkan data N node virtual via MQTT dengan skenario yang bisa dipilih agar demo dan pengujian tidak bergantung gudang nyata. | Diberikan simulator dikonfigurasi 20 node virtual tenant A skenario `normal`, ketika dijalankan 5 menit, maka 20 node tampil online di dashboard dengan data tiap ≤30 detik; diberikan skenario `tren-naik`, `spike`, `stuck`, atau `offline` dipicu lewat CLI/API pada satu node, ketika simulator berjalan, maka perilaku node itu berubah sesuai parameter tanpa restart. |
| F03 | Dataset sintetis berlabel | Must | Sebagai AI Engineer, saya butuh dataset sintetis berlabel yang mewakili ≥2 minggu data agar model dikalibrasi dan dievaluasi tanpa data nyata. | Diberikan generator dijalankan dengan seed tetap, ketika selesai, maka menghasilkan file CSV/Parquet ≥14 hari × ≥10 node dengan kolom label {normal, tren_naik, spike, stuck, offline} dan proporsi anomali terdokumentasi di AI-SPEC; diberikan seed yang sama dijalankan dua kali, maka hasilnya identik. |
| F04 | Node sensor fisik (firmware ESP32 + SHT31) | Must | Sebagai tim demo, saya ingin 2–3 node milik sendiri mengirim data nyata agar demo menunjukkan jalur end-to-end dari perangkat. | Diberikan node terkonfigurasi (Wi-Fi, kredensial MQTT, tenant/device id), ketika dinyalakan, maka data suhu/kelembapan terbit ke topik `t/{tenant}/{device}/data` tiap ≤60 detik beserta heartbeat; diberikan sensor dipanaskan dengan tangan, ketika 60 detik berlalu, maka kenaikan suhu tampak di dashboard. |
| F05 | Ingestion dan status perangkat | Must | Sebagai supervisor, saya ingin semua data tersimpan dan tahu perangkat mana yang mati. | Diberikan pesan MQTT valid, ketika diterima, maka tersimpan di hypertable dengan tenant_id, device_id, timestamp dalam ≤5 detik; diberikan pesan tidak valid (schema salah, tenant tak dikenal), ketika diterima, maka ditolak dan dicatat log tanpa mengganggu pesan lain; diberikan node berhenti heartbeat, ketika 3 interval lewat, maka status menjadi offline. |
| F06 | Alert ambang klasik + Telegram + Ack | Must | Sebagai petugas gudang, saya ingin alert Telegram saat ambang zona terlampaui dan bisa acknowledge agar tim tahu sudah ditangani. | Diberikan ambang zona 8°C dan debounce 2 pembacaan, ketika dua pembacaan berturut >8°C, maka pesan alert (tenant, zona, node, nilai, waktu) sampai ke grup Telegram tenant ≤2 menit; diberikan alert aktif, ketika petugas menekan tombol Ack, maka status "diakui" dengan nama dan waktu tampil di dashboard dan tidak ada alert ulang untuk kejadian yang sama selama masih di atas ambang (hysteresis). |
| F07 | Deteksi anomali AI (statistik) | Must | Sebagai supervisor, saya ingin peringatan dini saat tren naik tidak wajar, laju perubahan abnormal, atau sensor macet, sebelum ambang terlampaui. | Diberikan dataset F03 sebagai uji, ketika model dievaluasi, maka recall ≥80% untuk tren_naik dan stuck serta alert palsu ≤1 per node per 7 hari simulasi (dicatat di EVAL-REPORT); diberikan skenario `tren-naik` simulator, ketika suhu naik tetapi masih di bawah ambang, maka alert "anomali: tren naik" terkirim ke Telegram sebelum ambang klasik terlampaui; diberikan mode observasi aktif untuk tenant, ketika anomali terdeteksi, maka hanya dicatat di dashboard tanpa Telegram. |
| F08 | Dashboard real-time per tenant | Must | Sebagai petugas/supervisor, saya ingin login per tenant dan melihat daftar node, status, dan grafik real-time. | Diberikan pengguna tenant A login, ketika membuka dashboard, maka tampil daftar node tenant A dengan status online/offline, nilai terakhir, grafik 1 jam terakhir yang diperbarui ≤30 detik, serta panel alert aktif dan anomali dengan status Ack. |
| F09 | Onboarding admin tenant dan perangkat | Must | Sebagai admin Xavortree, saya ingin menambah tenant, zona, perangkat, dan grup Telegram lewat UI/CLI tanpa mengubah kode. | Diberikan admin login, ketika membuat tenant baru + 1 zona + 1 perangkat + chat_id Telegram, maka kredensial MQTT perangkat dihasilkan dan dalam ≤15 menit simulator/node dengan kredensial itu tampil di dashboard tenant baru tanpa restart layanan. |
| F10 | Skenario demo terskrip | Must | Sebagai CEO, saya ingin demo 15 menit yang bisa diulang dan menunjukkan alur lengkap serta nilai AI. | Diberikan runbook DEMO.md dan lingkungan Docker Compose, ketika QA menjalankan dari nol mengikuti runbook, maka dalam ≤15 menit tampil: 2 tenant terisolasi, node fisik + virtual online, alert ambang → Telegram → Ack, alert AI tren naik sebelum ambang, deteksi stuck dan offline, onboarding tenant baru; diberikan runbook diulang 2 kali berturut, maka tidak ada langkah gagal. |
| F11 | Dashboard historis + konfigurasi ambang per zona | Should | Sebagai supervisor, saya ingin grafik 7/30 hari dan mengubah ambang zona sendiri. | Diberikan data ≥7 hari dari simulator, ketika memilih rentang 7 hari, maka grafik tampil ≤3 detik (continuous aggregate); diberikan supervisor mengubah ambang zona, ketika pembacaan berikutnya masuk, maka alert memakai ambang baru tanpa restart. |
| F12 | Eskalasi alert tidak di-Ack | Should | Sebagai supervisor, saya ingin tahu bila petugas tidak merespons alert. | Diberikan alert tidak di-Ack dalam N menit (default 10), ketika waktu lewat, maka pesan eskalasi dikirim ke kontak eskalasi tenant dan dicatat di riwayat alert. |
| F13 | Buffer offline di firmware | Should | Sebagai admin, saya ingin data tidak hilang saat Wi-Fi gudang putus. | Diberikan Wi-Fi diputus 5 menit, ketika tersambung kembali, maka data selama putus terkirim dengan timestamp asli dan tersimpan berurutan. |
| F14 | Peta titik sensor di denah | Could | Sebagai supervisor, saya ingin melihat posisi node di denah gudang. | Diberikan denah diunggah dan node diposisikan, ketika dashboard dibuka, maka node tampil di denah dengan warna sesuai status. |
| F15 | Ekspor laporan bulanan CSV/PDF | Could | Sebagai supervisor, saya ingin bukti audit bulanan. | Diberikan rentang bulan dipilih, ketika ekspor, maka file berisi ringkasan per zona (min/max/rata-rata, jumlah alert, waktu Ack) dapat diunduh. |

## 4. Non-fungsional
- Performa: deteksi (ambang atau AI) → pesan Telegram ≤2 menit; ingestion ≤5 detik; refresh dashboard real-time ≤30 detik; grafik historis 7 hari ≤3 detik.
- Skala: demo 20 node virtual + 2–3 fisik per tenant, 2 tenant; desain untuk 100+ node per tenant (BRD).
- Keamanan: isolasi tenant lewat `tenant_id` + Row Level Security, QA menguji akses lintas tenant di tiap plan backend; MQTT TLS + user/pass per perangkat; login dashboard per tenant; token bot Telegram tidak disimpan di repo.
- Keandalan: alert palsu ≤1 per node per minggu (diukur pada dataset sintetis 7 hari, diulang saat klien nyata); status offline berbasis heartbeat; antrian alert dengan retry bila Telegram gagal, fallback log di dashboard.
- Data: retensi 12 bulan (retention policy); timestamp server bila RTC perangkat tidak valid.
- Perangkat dan bahasa: dashboard web desktop (Chrome terbaru); UI bahasa Indonesia; hardware tersedia di pasar Indonesia.

## 5. Ketergantungan dan integrasi
- Dokumen: AI-SPEC (AI Engineer) untuk F03 dan F07; FD/TDD (Analyst) sebelum plan tiap modul; EVAL-REPORT sebelum /rilis demo.
- Eksternal: Telegram Bot API (bot + grup per tenant); Mosquitto; TimescaleDB; Docker Compose sebagai lingkungan demo.
- Hardware: 3–4 set ESP32 DevKit V1 + SHT31 + adaptor 5V, dipesan minggu 1 agar tiba minggu 2.
- F02 dan F03 adalah prasyarat F05–F07 dan pengganti syarat "data ≥2 minggu" pada ANALISIS-KICKOFF.

## 6. Di luar scope versi ini (Won't)
Kontrol aktuator AC/pendingin, integrasi WMS/ERP, aplikasi mobile native, sensor selain suhu/kelembapan, instalasi fisik di gudang, deploy produksi ke VPS, billing/lisensi SaaS, model deep learning, uji lapangan di gudang nyata (menyusul setelah demo dan klien pilot ada).

## 7. Pertanyaan terbuka
- [ASUMSI] Stack: Node.js untuk backend + dashboard, modul AI sebagai service Python (rekomendasi Analyst). Rekomendasi: pakai; CEO konfirmasi sebelum kode.
- [ASUMSI] Lingkungan demo: Docker Compose di laptop/mini PC Xavortree, bukan VPS. Rekomendasi: cukup untuk demo; VPS dibahas saat klien nyata.
- [ASUMSI] Node fisik demo: 3 unit + 1 cadangan, catu daya adaptor. Rekomendasi: beli minggu 1.
- [ASUMSI] Kalibrasi AI memakai dataset sintetis sebagai pengganti 2–4 minggu data nyata; parameter awal ditetapkan di AI-SPEC dan wajib dikalibrasi ulang saat klien nyata masuk. Rekomendasi: terima, catat sebagai risiko di KEPUTUSAN.md.
- [ASUMSI] Preset ambang demo: zona "rantai dingin" 2–8°C dan zona "gudang kering" ≤30°C, RH ≤65%; dapat diubah per zona. Rekomendasi: pakai dua zona ini agar demo menunjukkan konfigurasi per zona.
- [BLOKIR] Repo kode belum diberikan (level perusahaan); pekerjaan kode tidak bisa dimulai sampai ada.
