# Catatan Kelayakan AI — SaaS AI IoT Cepat
Perusahaan: Xavortree | Penulis: AI Engineer (Naya) | Status: Draft v0.1 (2026-09-25) | Basis: BRD v0.1, AI-SPEC monitoring-gudang (§1-2, §5), BASIS.md

**Prinsip:** "AI" di rilis 1 = **detektor statistik** yang tidak memanggil model (biaya token nol, deterministik, bisa diaudit) + **LLM hanya untuk bahasa**: menjelaskan dan meringkas. Semua angka dan status patuh/tidak patuh dihitung kode, bukan oleh LLM. Tidak ada training, fine-tuning, atau RAG, jadi fitur AI tidak memperpanjang waktu dev secara berarti. [ASUMSI] tambahannya +1-2 minggu untuk 1 orang.

## 1. Fitur AI per arah (maks 2)
| Arah | Fitur | Butuh LLM? | Kenapa cepat |
|---|---|---|---|
| A Kepatuhan suhu | A1. Peringatan dini "suhu akan tembus batas dalam X menit" + sensor macet/drift | **Tidak.** Statistik + aturan (D2, D4, D5 AI-SPEC gudang) | Desain detektor dan parameternya sudah ada; langsung jalan tanpa data historis (0 hari) |
| | A2. Laporan kepatuhan bulanan: tabel log deterministik + narasi penyimpangan bahasa Indonesia | Ya untuk narasinya saja; tabel dan status audit tetap deterministik | Satu panggilan LLM API per laporan, lewat Batch API (lebih murah 50%) |
| B Hemat listrik | B1. Deteksi pemborosan: beban di luar jam operasional, beban dasar malam naik, puncak di jam WBP PLN | **Tidak.** Baseline median/MAD per jam-hari (D3 dipakai ulang) + aturan tarif | Logika D3 sama, hanya berganti sinyal. Butuh 14 hari data sebelum baseline berlaku |
| | B2. "Rekomendasi hemat Rp X/bulan" dalam kalimat | Ya untuk kalimatnya; nilai rupiah dihitung kode dari temuan B1 | Prompt dan validator sama dengan A2 |
| C White-label | Tidak ada fitur AI baru. C = model jual: modul A1/A2 atau B1/B2 yang sama, hanya template, istilah, dan logo per klien yang berbeda | - | Satu inti, beda konfigurasi. Memaksa AI khusus per klien justru menambah waktu dev |

## 2. Cara tercepat menghadirkan AI yang dirasakan klien, dan biayanya
Urutan nilai per usaha: (1) detektor statistik → (2) **penjelasan alert** lewat tombol "Jelaskan" (≤ 5 kalimat, angka dari data) → (3) **laporan bulanan dan ringkasan mingguan** → (4) tanya-jawab data via tool use. Nomor 4 ditunda ke rilis 2 karena desain tool, isolasi tenant, dan eval-nya paling berat.
Model: `claude-opus-5` ($5 input / $25 output per 1M token; sumber skill claude-api, cache 2026-06-24). Effort `low` untuk teks pendek. Turun ke `claude-sonnet-5` ($2/$10) atau `claude-haiku-4-5` ($1/$5) **hanya bila** eval §4 hasilnya sama baik. `claude-opus-5-5` ($4/$20) masih tahap peluncuran; dibandingkan di eval yang sama sebelum dipakai. Kurs [ASUMSI] Rp 16.500.

| Pemakaian (per tenant/bulan) [ASUMSI volume] | Token in / out per pakai | Biaya per pakai | Volume | Per tenant |
|---|---|---|---|---|
| Penjelasan alert (20 sensor × 3 alert) | 2.000 / 400 (output termasuk thinking) | 0,010 + 0,010 = $0,020 | 60 | $1,20 |
| Laporan bulanan (batch -50%) | 15.000 / 2.000 | (0,075 + 0,050) × 0,5 = $0,063 | 1 | $0,06 |
| Ringkasan mingguan | 6.000 / 800 | 0,030 + 0,020 = $0,050 | 4 | $0,20 |
| **Subtotal rilis 1** | | | | **$1,46** |
| Tanya-jawab data via tool use (rilis 2, ±3 putaran) | 12.000 / 1.200 | 0,060 + 0,030 = $0,090 | 30 (kuota) | $2,70 |

**10 tenant:** rilis 1 ≈ **$14,6/bulan ≈ Rp 241 rb**. Dengan tanya-jawab ≈ **$41,6 ≈ Rp 686 rb** (Rp 69 rb/tenant = 23% dari harga terendah BRD Rp 300 rb, jadi kuota wajib). Detektor statistik: Rp 0 token, muat di VPS 2 vCPU.

## 3. Risiko dan mitigasi
- **Halusinasi di dokumen kepatuhan:** LLM tidak pernah menjadi sumber angka atau status patuh. Validator otomatis menolak teks yang memuat angka yang tidak ada di input (lalu fallback ke template). Narasi diberi label "ringkasan AI"; bukti audit resmi tetap tabel log.
- **Data sensor nyata belum ada:** detektor jalan dengan default konservatif dan **mode shadow 14 hari** per tenant sebelum alert ke klien. Kalibrasi memakai simulator AI-SPEC gudang. Untuk arah B, [BLOKIR] kalibrasi realistis butuh data power meter nyata (design partner atau 1 unit uji).
- **Biaya membengkak:** kuota per tenant (tanya-jawab 30/bulan), effort `low`, Batch untuk laporan, prompt caching untuk prompt sistem. Pemakaian token dipantau per tenant.
- **Prompt injection / kebocoran antar tenant:** input LLM hanya JSON berisi ID. Nama buatan tenant disanitasi (maks 40 karakter). Rilis 1 tanpa tool dan tanpa memori.

## 4. Evaluasi minimal (ditetapkan sebelum dibangun; tanpa EVAL-REPORT fitur belum selesai)
| Komponen | Set uji | Metrik dan ambang lolos |
|---|---|---|
| Detektor A | Set sintetis AI-SPEC gudang (34 skenario × 3 seed = 102 run) | Recall kejadian ≥ 0,90; alarm palsu ≤ 1/sensor/minggu; median waktu peringatan sebelum tembus ≥ 15 menit |
| Detektor B | Set sintetis baru: 30 skenario beban × 3 seed (milik Data) | Recall pemborosan ≥ 0,85; alarm palsu ≤ 2/meter/bulan; selisih estimasi Rp vs label ≤ 15% |
| Penjelasan + laporan LLM | 50 alert + 10 laporan bulanan sintetis | Angka salah = **0** (validator); klaim di luar data ≤ 2% (LLM-judge + review manusia 20% sampel); bahasa Indonesia ≥ 4/5 dari 2 penilai; ≤ 5 kalimat 100% |
| Tanya-jawab (rilis 2) | 40 pertanyaan dengan jawaban emas + 10 uji serangan lintas tenant | Akurasi ≥ 90%; kebocoran = 0 |

## 5. Pertanyaan untuk CEO
1. **Cakupan AI rilis 1:** A: detektor statistik + penjelasan alert + laporan bulanan (≈ Rp 241 rb/bulan untuk 10 tenant, [ASUMSI] +1-2 minggu) | B: ditambah tanya-jawab data (≈ Rp 686 rb, [ASUMSI] +2-3 minggu, eval lebih berat). **Rekomendasi: A**, karena Q3=B terpenuhi dengan AI yang langsung terlihat klien tanpa menggeser target ≤ 8 minggu.
2. **Data kalibrasi:** A: beli 2 unit ESP32+SHT31 (± Rp 300 rb) untuk dipasang di kantor 14 hari sekarang, plus 1 power meter bila arah B dipilih | B: tunggu data dari design partner. **Rekomendasi: A**, karena biayanya kecil dan membuka kalibrasi detektor paralel dengan fase eksplorasi, bukan setelahnya.
