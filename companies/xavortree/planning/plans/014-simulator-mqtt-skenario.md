# Plan 014 — simulator-mqtt-skenario
Perusahaan: Xavortree | Modul: M09 Simulator + dataset (MS0) | Ukuran: M | Status: Siap | Pemilik: data

## Tujuan
Simulator F02: N node virtual menerbitkan data dan heartbeat ke Mosquitto persis seperti firmware (kontrak FD §4), masing-masing dengan kredensial device dari API (plan 012), dan skenario per node dapat diubah saat berjalan lewat HTTP lokal atau CLI tanpa restart.

## Scope
### Termasuk
- `tools/simulator` (Python, paho-mqtt, simcore dari 013): konfigurasi YAML `nodes[] {tenant, slug, username, password, zone_preset, scenario}` atau `xt sim provision --tenant <slug> --count N --zone <id>` yang membuat device `kind=virtual` lewat API admin dan menulis YAML kredensial (di-gitignore).
- Publish data tiap `data_interval_s` (default 10 s, ≤30 s) ke `t/{tenant}/{slug}/data`, hb tiap 60 s ke `…/hb`, QoS 1, payload v1 FD §4, `seq` naik, `ts` UTC ISO-8601; koneksi 1883 di jaringan compose (profile `sim`), opsi 8883 + CA untuk uji dari host.
- Skenario: `normal`, `tren-naik {slope_c_per_min, duration_min}`, `spike {delta}`, `stuck {duration_min}`, `offline {duration_min}`; berlaku per node, kembali `normal` setelah durasi.
- HTTP kontrol bind `127.0.0.1:8090`: `GET /sim/nodes` (skenario aktif, seq, status koneksi per node), `POST /sim/nodes/{slug}/scenario`, `POST /sim/scenario` (semua node); CLI `xt sim scenario --node <slug> --scenario tren-naik --slope 0.3 --duration 30`, `xt sim status`.
- Mode `--clock virtual --speed k` untuk uji cepat (deterministik); default real-time. Log JSON per node; `/healthz`; service `simulator` di compose profile `sim`; `make sim-up`; `README.md`; pytest.
### Tidak termasuk
Skenario lanjutan AI-SPEC §4.1 (drift, pintu, RH hujan, paket telat/duplikat) → MS1; ingestion (M03); dashboard; skrip urutan demo (M10, MS4).

## Acceptance criteria
AC1. Diberikan `xt sim provision --tenant demo-a --count 20 --zone <rantai-dingin>` lalu `make sim-up`, ketika ≤60 detik berlalu, maka `mosquitto_sub -u svc-ingest -t 't/demo-a/#' -v` menunjukkan 20 node berbeda menerbitkan `data` dengan interval ≤30 detik dan `hb` ≤60 detik, semua payload lolos JSON schema v1 (`packages/shared/schema`), dan `seq` naik monoton per node.
AC2. Diberikan simulator berjalan (catat PID), ketika `POST /sim/nodes/a-05/scenario {"scenario":"tren-naik","params":{"slope_c_per_min":0.3,"duration_min":30}}`, maka dalam 10 menit nilai `t` node `a-05` naik ≥2,5 °C dari rata-rata sebelumnya, 19 node lain tetap dalam rentang preset, dan PID proses tidak berubah.
AC3. Diberikan node `a-07` `spike {delta: 6}`, maka tepat 1 sampel menyimpang ≥5 °C lalu kembali normal; `a-08` `stuck {duration_min: 5}` → semua sampel 5 menit identik (Δ<0,01) lalu bervariasi lagi; `a-09` `offline {duration_min: 4}` → tidak ada `data` maupun `hb` selama 4 menit, kemudian lanjut dengan `seq` melanjutkan hitungan sebelum offline.
AC4. Diberikan YAML dengan password satu node salah, ketika simulator dijalankan, maka node itu mencatat error koneksi dan retry backoff (5 s → 60 s) sementara 19 node lain terus menerbitkan; `GET /sim/nodes` menampilkan status `disconnected` untuk node itu.
AC5. Diberikan `--clock virtual --speed 60 --seed 42` dua kali dengan skenario yang sama, ketika log nilai dibandingkan, maka urutan `t`/`h` per node identik; dengan seed lain berbeda.
AC6. Diberikan 2 tenant × 20 node selama 5 menit real-time, ketika `docker stats` diamati, maka CPU simulator <1 core, memori <300 MB, tidak ada publish gagal di log, dan `GET /sim/nodes` menampilkan skenario aktif tiap node.
AC7. Diberikan `make ci`, ketika dijalankan, maka pytest simulator hijau; `README.md` memuat cara provision, daftar skenario dan parameter, contoh `curl` dan `xt sim`.

## Catatan teknis
Referensi FD §2 F02, §4 (payload, topik), TDD §1, §4, §8; AI-SPEC §3.4 (publisher MQTT identik firmware). Tergantung 010 (broker), 012 (API provisioning), 013 (simcore). Bila 012 belum PASS saat 014 mulai, QA boleh memakai client dynsec manual (`mosquitto_ctrl`) untuk AC1–AC6 dan menandai AC provisioning sebagai tertunda. Simulator tidak boleh memakai superuser MQTT. HTTP kontrol tanpa auth karena hanya `127.0.0.1`; jangan bind `0.0.0.0`. File: `tools/simulator/{sim.py,nodes.py,http.py,cli.py}`, `deploy/docker-compose.yml` (service `simulator`).

## Handback (diisi Developer)
Tanggal | File diubah | Cara menjalankan | Belum selesai | Catatan untuk QA

## Riwayat QA
| Ronde | Verdict | File |
|---|---|---|
