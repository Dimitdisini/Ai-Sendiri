# Pelajaran Team Dimitri

Satu baris per pelajaran. Terbaru di atas. Dibaca semua peran sebelum mulai kerja.
Cara kerja yang bisa diulang dipindah jadi SOP di `.claude/skills/sop-*/`. Ditambah lewat protokol /catat-pelajaran.

| Tanggal | Apa yang terjadi | Pelajaran | SOP |
|---|---|---|---|
| 2026-09-26 | QA plan 010 hanya bisa PASS bersyarat karena Docker tidak terpasang | Tandai AC yang butuh alat sebagai "TIDAK DAPAT DIUJI", jangan ditebak; pakai pemeriksaan pengganti | sop-qa-tanpa-alat |
| 2026-09-26 | Token GitHub dua kali ditempel di chat, harus di-revoke | Kredensial tidak pernah lewat chat; masuk lewat prompt terminal (Keychain) atau file .env | sop-kredensial |
| 2026-09-25 | Server dashboard gagal nyala karena port 4545 masih dipakai proses lama | Layanan dikelola launchd; restart pakai launchctl kickstart, bukan node manual | sop-layanan-kantor |
| 2026-09-25 | Dua project (Monitoring Gudang, SaaS AI IoT) ditolak CEO setelah dokumen lengkap ditulis | Project harus berasal dari kebutuhan nyata CEO; tim tidak mengusulkan project sendiri | sop-validasi-kebutuhan |
| 2026-09-25 | Satu perintah bebas di Telegram dan dashboard jalan di dua jalur terpisah | Semua perintah lewat satu antrean server supaya dua sesi tidak mengubah file yang sama | - |
