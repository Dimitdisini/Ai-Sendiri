# Plan 013 — simcore-dan-generator-dataset
Perusahaan: Xavortree | Modul: M09 Simulator + dataset (MS0) | Ukuran: M | Status: Siap | Pemilik: data

## Tujuan
Paket Python `simcore` (model sinyal gudang + injeksi kejadian berlabel, reproducible per seed) dan generator dataset sintetis berlabel (F03) yang menjadi bahan kalibrasi/eval AI-SPEC dan sumber sinyal simulator MQTT (plan 014).

## Scope
### Termasuk
- `tools/simcore` (Python 3.12, numpy/pandas, tanpa dependensi berat): suhu luar sinusoid harian (rata-rata, amplitudo, fase, musim hujan menaikkan RH), suhu dalam model termal orde-1 dengan siklus AC histeresis, RH berbanding terbalik dengan suhu, noise AR(1), offset kalibrasi per sensor, korelasi sensor satu zona (AI-SPEC §3.4). Preset zona `rantai-dingin` (2–8 °C) dan `gudang-kering` (≤30 °C, RH ≤65 %).
- Injeksi kejadian v1 berlabel (jenis, mulai, selesai, sensor): `tren_naik` (AC mati / sumber panas, slope parametrik), `spike` (1 sampel), `stuck` (konstan atau varian rendah), `offline` (gap), plus variasi normal tak berlabel (pintu singkat, siklus AC) sesuai AI-SPEC N3/N4.
- API simcore: `Scenario(seed, zones, sensors, rate)` → generator per langkah waktu (dipakai simulator real-time) dan `run(days)` → DataFrame (dipakai generator dataset); perintah runtime `inject(sensor, event, params)` untuk skenario simulator.
- `tools/dataset` CLI `gen`: `--seed --days 14 --nodes 10 --zones 2 --rate 1min --out <dir>` → `data.csv`, `data.parquet`, `events.csv`, `meta.json` (seed, parameter, proporsi label); `gen verify <dir>` memeriksa konsistensi label vs events.
- Unit test pytest (reproducibility, rentang nilai, konsistensi label), `README.md` parameter dan proporsi default, masuk `make ci`.
### Tidak termasuk
Publisher MQTT dan HTTP kontrol (014), 34 skenario × 3 seed AI-SPEC §4.1 dan harness eval (MS1), kalibrasi dengan sensor nyata (AI-SPEC §3.4 [ASUMSI]), kejadian lanjutan (drift, pintu panjang, RH hujan, paket telat) dijadwalkan MS1.

## Acceptance criteria
AC1. Diberikan `gen --seed 42 --days 14 --nodes 10 --zones 2 --out out/`, ketika selesai (≤2 menit di laptop), maka `data.csv` dan `data.parquet` berisi kolom `ts, tenant, zone, device, temp_c, rh_pct, label` dengan label ∈ {normal, tren_naik, spike, stuck, offline}, jumlah baris ≥ 14 × 1440 × 10 dikurangi baris offline, `events.csv` berisi `jenis, mulai, selesai, device`, `meta.json` berisi seed, parameter, dan proporsi tiap label.
AC2. Diberikan perintah AC1 dijalankan dua kali, ketika `sha256sum` dibandingkan, maka `data.csv` dan `events.csv` identik; dengan `--seed 43` hasilnya berbeda.
AC3. Diberikan `out/`, ketika `gen verify out/`, maka PASS: setiap jenis kejadian muncul ≥3 kali dalam 14 hari, setiap baris berlabel non-normal berada di dalam rentang suatu event di `events.csv`, dan baris offline tidak ada di `data.*` tetapi tercatat di `events.csv`.
AC4. Diberikan baris berlabel `normal`, ketika diperiksa per zona, maka ≥99 % nilai suhu berada di rentang preset zona, siklus AC tampak sebagai osilasi ±1 °C, dan korelasi suhu antar sensor satu zona ≥0,7.
AC5. Diberikan `spike`, `stuck`, `tren_naik` di `events.csv`, ketika diperiksa, maka spike = tepat 1 sampel menyimpang ≥5 °C, stuck = Δ<0,01 °C sepanjang durasi, tren_naik = kenaikan sesuai slope ±10 % (default 0,3 °C/menit) sampai batas fisik.
AC6. Diberikan `--rate 10s`, ketika dijalankan, maka jumlah baris ×6 dan hasil tetap reproducible; `data.csv` dan `data.parquet` memuat isi identik.
AC7. Diberikan `make ci`, ketika dijalankan, maka pytest simcore/dataset hijau dan `README.md` mendokumentasikan semua parameter, preset, jenis kejadian, dan proporsi default (dikutip AI Engineer ke AI-SPEC §3.4).

## Catatan teknis
Referensi FD §2 F03, TDD §1, §8; AI-SPEC §3.4 dan "Kebutuhan ke peran lain" (Data Engineer). RNG: `numpy.random.default_rng(seed)` tunggal per skenario; iterasi waktu deterministik sehingga simulator (014) dan generator memberi urutan nilai yang sama untuk seed dan skenario yang sama. Skema kolom `data.*` harus sama dengan tabel `reading` (`temp_c`, `rh_pct`) agar harness eval MS1 bisa memuat langsung. File: `tools/simcore/simcore/{signal,events,scenario}.py`, `tools/dataset/gen.py`, `tools/simcore/tests/`.

## Handback (diisi Developer)
Tanggal | File diubah | Cara menjalankan | Belum selesai | Catatan untuk QA

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
