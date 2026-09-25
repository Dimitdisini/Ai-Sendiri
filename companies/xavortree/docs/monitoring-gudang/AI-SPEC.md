# AI-SPEC — Deteksi Anomali Suhu dan Kelembapan Gudang
Perusahaan: Xavortree | Pemilik: AI Engineer (Naya) | Status: Draft v0.1, 2026-09-25, menunggu review CEO | Basis: BRD v0.1 (Q1=B, Q2=A, Q3=B), ANALISIS-KICKOFF M07

## 1. Masalah yang diselesaikan dan kenapa butuh AI
Ambang klasik memberi tahu **setelah** barang terancam. Dibutuhkan peringatan **sebelum** ambang tembus (tren naik tidak wajar, pintu terbuka lama, AC mati) dan deteksi sensor yang bohong (macet, drift, offline).

**Jawaban jujur: rilis pertama TIDAK butuh model machine learning.** Cukup **statistik adaptif + aturan** yang dikalibrasi per tenant/zona. Alasan: tanpa data gudang nyata (Q1=B) model belajar tidak punya bahan latih dan tidak bisa dipercaya; fisika suhu gudang sederhana dan bisa dimodelkan eksplisit; aturan bisa dijelaskan ke petugas dan diaudit. Secara pemasaran boleh disebut "AI anomali" (inferensi otomatis, adaptif per sensor); secara teknis ini statistical anomaly detection. CEO perlu tahu bedanya.

Alternatif ditolak: ambang saja (terlambat, BRD §1); ML sekarang (butuh ≥ 3 bulan data nyata berlabel); LLM sebagai detektor (mahal, lambat, tidak deterministik, tidak lebih baik dari statistik untuk deret waktu).

**Model belajar ditambahkan** setelah ≥ 2 tenant nyata × ≥ 3 bulan data berlabel (tombol Benar/Palsu di Telegram), dan hanya bila EVAL-REPORT menunjukkan ia mengalahkan mesin statistik pada data yang sama. Kandidat: STL residual, lalu Isolation Forest per zona. Bukan deep learning.

## 2. Pilihan model dan alasan
- **Deteksi:** tanpa model vendor; mesin statistik sendiri (Python, numpy/pandas) sebagai service M07. Biaya token nol.
- **LLM (opsional, bukan jalur kritis rilis 1):** `claude-opus-5`, konteks 1M, $5 input / $25 output per 1M token. Hanya untuk (a) menjelaskan anomali saat petugas mengetik `/jelaskan` di Telegram, (b) ringkasan insiden mingguan ke supervisor. Bukan `claude-sonnet-5` ($2/$10) atau `claude-haiku-4-5` ($1/$5) karena belum ada eval yang membuktikan kualitas bahasa Indonesia setara; boleh turun kelas setelah eval §4.4. Teks alert utama memakai **template deterministik**: nol biaya, nol halusinasi.

## 3. Desain
### 3.1 Detektor (parameter per tenant/zona sebagai JSON; default dari template jenis barang: farmasi, pangan kering, elektronik, umum)
| ID | Detektor | Logika inti | Default | Butuh data |
|---|---|---|---|---|
| D1 | Ambang + histeresis | nilai > batas selama ≥ debounce; pulih di bawah batas − histeresis | histeresis 1°C/3%RH, debounce 3 sampel | 0 hari |
| D2 | Laju perubahan + prediksi tembus | slope regresi linier jendela 10 menit; ekstrapolasi waktu-ke-ambang | 0,2°C/menit, 1,5%RH/menit; alert bila tembus < 30 menit | 0 hari |
| D3 | Deviasi pola harian | median+MAD per sensor per jam-hari (14 hari bergulir); robust z > k selama ≥ n | k = 4, n = 10 menit | 14 hari |
| D4 | Sensor macet | varian ≈ 0 selama jendela sementara peer bervariasi | 30 menit, resolusi 0,05°C | 0 hari |
| D5 | Konsistensi peer / drift | selisih ke median zona > d selama ≥ m; drift = selisih tumbuh > r/hari selama 7 hari | d 3°C, m 30 menit, r 0,3°C/hari | 0 / 7 hari |
| D6 | Offline | heartbeat hilang > t (milik M03/M04, disebut agar alert tidak ganda) | 5 menit | 0 hari |

### 3.2 Penggabungan, pengiriman, LLM
Keluaran `AnomalyEvent{tenant, zone, sensor, detector, severity, evidence JSON, t_start}`. Severity: RINGAN (1 detektor non-ambang), SEDANG (D2/D3 + prediksi tembus), KRITIS (D1, ≥ 2 detektor sepakat, D4, D6). Cooldown 30 menit per sensor per detektor; ≥ 50% sensor satu zona dilebur jadi **1 alert zona**; mode **shadow** per tenant (alert hanya ke dashboard dan admin Xavortree). Tiap alert punya tombol "Benar / Palsu" → tabel `alert_feedback`.
Prompt LLM (bila aktif): input hanya JSON (evidence, statistik 60 menit, konfigurasi zona, ID bukan nama tenant); ≤ 5 kalimat bahasa Indonesia, angka dari data, tidak menebak penyebab di luar data. Nama sensor/zona buatan tenant = data (risiko prompt injection), maks 40 karakter, disanitasi. Tanpa tool, memori, RAG.

### 3.3 Sumber data: simulator dan dataset sintetis (pengganti gudang nyata)
Milik Data Engineer; dipakai untuk demo internal (mengirim MQTT persis seperti firmware M02) dan eval; reproducible per seed.
- **Sinyal dasar:** suhu luar sinusoid harian (musim hujan menaikkan RH) → suhu dalam mengikuti model termal orde-1: menuju setpoint saat AC hidup (siklus histeresis normal), menuju suhu luar saat AC mati; RH berbanding terbalik dengan suhu plus pengaruh pintu; noise AR(1) dan offset kalibrasi kecil per sensor; sensor satu zona berkorelasi.
- **Kejadian berlabel (jenis, mulai, selesai, sensor):** pintu dibuka 3–60 menit, AC mati total/sebagian, sumber panas baru, lonjakan RH hujan, drift linier, macet (konstan atau varian rendah), offline, spike satu sampel, paket telat/duplikat, reboot gap, pemadaman satu zona.
- **Kalibrasi realisme [ASUMSI]:** 2 unit ESP32+SHT31 (± Rp 300 rb) di kantor Xavortree 14 hari untuk menyetel amplitudo harian, noise, siklus AC. Tanpa ini parameter simulator murni tebakan literatur.

## 4. Evaluasi (ditetapkan sebelum dibangun; fitur belum selesai tanpa EVAL-REPORT)
### 4.1 Set uji: 34 skenario × 3 seed = 102 run; tiap run 14 hari, 1 sampel/menit, 10 sensor, 2 zona
**Positif, harus alert (20):** P1 pintu 30 menit siang; P2 pintu 45 menit malam; P3 pintu 5×10 menit/2 jam; P4 AC mati siang 0,1°C/menit; P5 AC mati malam 0,03°C/menit; P6 AC sebagian +3°C stabil; P7 naik 0,5°C/menit; P8 RH +20% dalam 20 menit; P9 RH naik perlahan 5 hari; P10 macet konstan; P11 macet varian rendah; P12 macet setelah drift; P13 drift 0,1°C/hari 20 hari; P14 drift 0,5°C/hari; P15 offline 10 menit; P16 satu zona naik serentak (wajib 1 alert zona); P17 rata-rata harian +2°C 3 hari tanpa tembus ambang; P18 pola malam tidak turun; P19 satu sensor +4°C dari peer; P20 tembus ambang mendadak.
**Negatif, tidak boleh alert (14):** N1 hari kerja normal; N2 akhir pekan; N3 siklus AC ±1°C; N4 pintu 3 menit 6×/hari; N5 spike satu sampel; N6 musim hujan RH tinggi dalam batas; N7 paket telat/duplikat/acak; N8 gap 2 menit reboot; N9 ambang diubah tengah hari; N10 pergeseran musiman 0,05°C/hari; N11 siang lebih hangat karena forklift; N12 dua sensor offset tetap 0,5°C; N13 tenant baru hari 1–3 tanpa baseline; N14 restart service deteksi.
### 4.2 Metrik dan ambang lolos (satu gagal = FAIL)
Metrik: presisi dan recall per kejadian (cocok bila alert jatuh di [mulai, selesai + 15 menit]); waktu deteksi = t_alert − t_mulai (median, p90); lead time = menit sebelum ambang klasik tembus; alert palsu per sensor per minggu pada run negatif; jumlah alert per kejadian zona.
Lolos: recall ≥ 90% total dan **100% untuk P4, P5, P10–P12, P15, P16**; presisi ≥ 85%; alert palsu ≤ 0,5/sensor/minggu (lebih ketat dari BRD ≤ 1); waktu deteksi median ≤ 2 menit untuk P7/P15/P20, ≤ 15 menit untuk P4–P6/P17/P18, ≤ 60 menit macet, ≤ 3 hari drift; lead time ≥ 15 menit pada ≥ 70% run bertahap; P16 tepat 1 alert; latensi sampel→Telegram p95 ≤ 60 detik (BRD ≤ 2 menit).
Eval LLM (bila aktif): 30 penjelasan, rubrik 1–5 (akurasi angka, tidak menebak, jelas untuk petugas); lolos bila rata-rata ≥ 4,2 dan nol halusinasi angka.
Ground truth dari label simulator; harness eval oleh Data Engineer; skor oleh AI Engineer; PASS/FAIL oleh QA.

## 5. Biaya
- **Deteksi statistik:** Rp 0 token; 10 sensor × 6 detektor muat di VPS 2 vCPU; 100 sensor × 10 tenant [ASUMSI] masih muat, diverifikasi uji beban.
- **LLM per alert:** ±2.000 token input (prompt sistem 600 + evidence 1.400) + ±200 output. `claude-opus-5`: 2.000 × $5/1M + 200 × $25/1M = $0,010 + $0,005 = **$0,015 → $15 per 1.000 alert ≈ Rp 250 rb** (kurs [ASUMSI] Rp 16.500). Bila eval setara: Sonnet 5 $6, Haiku 4.5 $3 per 1.000. Prompt caching menurunkan lagi, belum dihitung.
- **Volume [ASUMSI]:** 10 tenant × 20 sensor, ≤ 3 alert/sensor/bulan → ≤ 600 alert/bulan → **≤ $9/bulan** bila semua dijelaskan, ≈ $2 bila hanya via `/jelaskan`. Ringkasan mingguan 40 × (6.000 in + 500 out) ≈ $1,70/bulan. Biaya LLM bukan penentu; kualitasnya yang harus dibuktikan.

## 6. Risiko dan mitigasi
1. **Alert palsu → petugas abai** (terbesar): shadow 14 hari per tenant baru; D3 nonaktif sampai baseline ada; histeresis + debounce + cooldown; alert zona dilebur; tombol Benar/Palsu; **auto-nonaktif** detektor bila > 3 alert palsu per sensor per hari, admin diberi tahu.
2. **Sintetis ≠ nyata:** kalibrasi 2 sensor nyata (§3.3); default konservatif; tenant nyata pertama wajib shadow; **eval ulang pada data nyata 30 hari pertama → EVAL-REPORT v2**; bila presisi < 70% di data nyata, mundur ke D1+D2+D4+D6 sampai dikalibrasi.
3. **Cold start tenant baru:** D1, D2, D4, D5-peer, D6 aktif hari pertama; D3 dan drift menyusul; onboarding tetap ≤ 5 hari (BRD §2.3).
4. **Halusinasi / prompt injection LLM:** input JSON saja, nama tenant disanitasi, keluaran disimpan; fitur default OFF. **Privasi:** ke LLM hanya ID dan angka; data tidak dipakai melatih apa pun tanpa izin tertulis; QA uji kebocoran lintas tenant.
5. **Vendor:** mesin deteksi bebas vendor; LLM di balik antarmuka `explain(event)`; produk berfungsi penuh tanpa LLM.

## 7. Rencana rollout
Tahap 0 (demo internal, Q1=B): simulator → MQTT → deteksi → Telegram grup internal; EVAL-REPORT v1 lolos §4.2 sebelum demo ke CEO. Tahap 1 (tenant nyata pertama): shadow 14 hari, alert hanya ke dashboard dan admin. Tahap 2: D1/D2/D4/D5/D6 ke petugas, D3 menyala setelah 14 hari, EVAL-REPORT v2 hari ke-30. Tahap 3 (rilis 1.1, opsional): LLM `/jelaskan` untuk 1 tenant setelah eval LLM lolos. Tahap 4 (≥ 2 tenant × 3 bulan): model belajar diadu dengan mesin statistik, ganti hanya bila menang. Saklar darurat: toggle per tenant per detektor; fallback ke ambang klasik (M04) tanpa deploy ulang; LLM dimatikan lewat feature flag.

## Kebutuhan ke peran lain
- **Data Engineer:** simulator + generator dataset berlabel (§3.3) sebagai CSV dan publisher MQTT, 34 skenario × 3 seed, harness eval §4.2, job baseline D3 (continuous aggregate median/MAD per sensor per jam-hari).
- **Backend:** konfigurasi detektor per zona (JSON), tabel `anomaly_event` dan `alert_feedback`, feature flag per tenant (shadow, per detektor, LLM), tombol Benar/Palsu dan `/jelaskan` di bot Telegram, antarmuka `explain(event)`.

[ASUMSI] 2 sensor nyata 14 hari untuk kalibrasi (± Rp 300 rb); kurs Rp 16.500/USD; 200 sensor, ≤ 600 alert/bulan. [BLOKIR] Tidak ada blokir baru; blokir lama (repo, klien pilot) tidak menghalangi Tahap 0.
