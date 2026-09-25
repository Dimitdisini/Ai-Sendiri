# Keputusan — Xavortree

| ID | Tanggal | Pertanyaan | Jenis (ASUMSI / BLOKIR) | Rekomendasi | Keputusan CEO | Status |
|---|---|---|---|---|---|---|
| Q1 | 2026-09-25 | Klien pilot pertama: klien nyata atau demo internal? | BLOKIR | A: klien nyata, supaya metrik kerusakan terukur | B: demo internal dulu | Dijawab |
| Q2 | 2026-09-25 | Model produk: SaaS multi-tenant atau on-premise per klien? | BLOKIR | A: SaaS multi-tenant, sesuai tujuan jual ulang | A: SaaS multi-tenant | Dijawab |
| Q3 | 2026-09-25 | Rilis pertama: ambang klasik dulu lalu AI, atau AI wajib sejak awal? | BLOKIR | A: bertahap, ambang dulu | B: AI wajib sejak awal | Dijawab |
| A1 | 2026-09-25 | Stack default: Node/Python, MQTT, TimescaleDB | ASUMSI | Pakai default CLAUDE.md | Dianggap disetujui | Dijawab |
| A2 | 2026-09-25 | Pilot 5 sampai 20 titik sensor, Wi-Fi tersedia, retensi data 12 bulan | ASUMSI | Lanjut dengan angka ini | Dianggap disetujui | Dijawab |
| A3 | 2026-09-25 | Model anomali awal: statistik sederhana, bukan ML berat | ASUMSI | Cukup untuk pilot | Dianggap disetujui | Dijawab |
| A4 | 2026-09-25 | Dataset sintetis menggantikan 2 sampai 4 minggu data nyata untuk kalibrasi AI; wajib kalibrasi ulang saat klien nyata masuk | ASUMSI | Terima untuk demo, catat sebagai risiko | Dianggap disetujui | Dijawab |
| A5 | 2026-09-25 | Lingkungan demo: Docker Compose lokal, tanpa VPS | ASUMSI | Hemat biaya untuk demo internal | Dianggap disetujui | Dijawab |
| A6 | 2026-09-25 | Hardware demo 3 sampai 4 set ESP32 plus SHT31, dipesan 29 Sep | ASUMSI | Cukup untuk dua zona demo | Dianggap disetujui | Dijawab |
| A7 | 2026-09-25 | Modul baru M09 simulator plus dataset dan M10 skenario demo | ASUMSI | Dikonfirmasi Architect di FD | Menunggu Architect | Dikerjakan |
| Q4 | 2026-09-25 | Repo GitHub Xavortree belum ada; MS0 tidak bisa mulai tanpa repo | BLOKIR | Buat repo kosong xavortree/monitoring-gudang, beri akses ke tim | | Menunggu |
| A8 | 2026-09-25 | Rilis pertama anomali tanpa ML: 6 detektor statistik plus aturan, parameter per tenant; ML menyusul setelah 2 tenant x 3 bulan data | ASUMSI | Terima, lebih bisa dipercaya tanpa data nyata | Dianggap disetujui | Dijawab |
| A9 | 2026-09-25 | LLM tidak dipakai di rilis 1; opsional rilis 1.1 untuk /jelaskan, sekitar US$15 per 1.000 alert | ASUMSI | Terima | Dianggap disetujui | Dijawab |
| A10 | 2026-09-25 | Beli 2 unit ESP32 plus SHT31 sekitar Rp300 ribu untuk kalibrasi simulator 14 hari di lokasi Xavortree | ASUMSI | Terima, biaya kecil | Menunggu CEO | Menunggu |
| Q5 | 2026-09-25 | Sinkron dokumen ke Google Drive (berlaku lintas perusahaan): A semua docs/ dan meetings/ otomatis, atau B hanya dokumen final yang disetujui CEO | BLOKIR | B: hanya dokumen final | B: hanya dokumen final (via Telegram "Ya okey B") | Direvisi 2026-09-25 sore: CEO ganti ke A (Telegram "untuk semua hal ke drive aja dulu") |
| A11 | 2026-09-25 | Struktur Drive: folder "Team Dimitri" dengan subfolder per perusahaan (belum ada folder Xavortree di Drive, jadi opsi B tidak berlaku) | ASUMSI | A: satu folder Team Dimitri | Dianggap disetujui, CEO bisa membatalkan | Dijawab |
| A12 | 2026-09-25 | Cakupan sinkron Drive setelah Q5=A: docs/, meetings/, dan planning/ (ROADMAP, BACKLOG, KEPUTUSAN, DITUNDA) disalin; judul draft diberi awalan [DRAFT]; CLAUDE.md perusahaan, kredensial, dan kode tidak disalin. Drive tetap salinan, companies/ tetap sumber | ASUMSI | Terima | Dianggap disetujui, CEO bisa membatalkan | Dijawab |
| A12 | 2026-09-25 | Repo: git lokal di companies/xavortree/code/monitoring-gudang sampai CEO memberi remote GitHub (Q4 tetap terbuka untuk remote) | ASUMSI | Mulai lokal, push saat remote ada | Dianggap disetujui | Dijawab |
| A13 | 2026-09-25 | M09 modul terpisah pemilik data; M10 bukan modul kode tapi integrasi demo milik devops di MS4 | ASUMSI | Terima usulan Architect | Dianggap disetujui | Dijawab |
| A14 | 2026-09-25 | Detektor ambang dan offline di alerter Node, bukan service AI; debounce default 2 | ASUMSI | Perlu konfirmasi AI Engineer saat plan MS1 | Menunggu AI Engineer | Dikerjakan |
| Q6 | 2026-09-25 | Docker belum terpasang di Mac CEO; AC1-AC5 plan 010 tidak bisa diuji. Pasang Docker Desktop (atau OrbStack) di Mac, atau uji di mesin lain? | BLOKIR | A: pasang OrbStack di Mac ini, ringan dan gratis untuk pribadi | | Menunggu |
| Q7 | 2026-09-25 | Monitoring Gudang Pintar dihentikan: bukan kebutuhan bisnis nyata, hanya project uji coba pipeline tim yang dipilih Orkestrator sendiri | Keputusan CEO | Hentikan, jangan lanjutkan detail teknis (MQTT/Supabase) | Dihentikan | Selesai |
| Q8 | 2026-09-25 | /kickoff berikutnya untuk perusahaan mana: A fleek-project atau B xavortree | BLOKIR | A: fleek-project, belum punya project | B: xavortree, project "SaaS AI IoT Cepat (eksplorasi)": gali AI IoT dan software supaya bisa bikin SaaS dengan waktu dev singkat (Telegram) | Dijawab |
