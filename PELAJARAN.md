# Pelajaran Team Dimitri

Satu baris per pelajaran. Terbaru di atas. Dibaca semua peran sebelum mulai kerja.
Cara kerja yang bisa diulang dipindah jadi SOP di `.claude/skills/sop-*/`. Ditambah lewat protokol /catat-pelajaran.

| Tanggal | Apa yang terjadi | Pelajaran | SOP |
|---|---|---|---|
| 2026-09-26 | BRD gocean-b2b dan ecommerce-d2c dua-duanya terpotong di tengah saat CEO paste teks panjang di chat, draft harus direvisi ulang saat lanjutan datang | Minta dokumen panjang sebagai file utuh (upload/Drive), bukan paste; kalau paste, tandai eksplisit bagian yang mungkin terpotong dan konfirmasi ke CEO | sop-dokumen-ceo |
| 2026-09-26 | QA plan 010 hanya bisa PASS bersyarat karena Docker tidak terpasang | Tandai AC yang butuh alat sebagai "TIDAK DAPAT DIUJI", jangan ditebak; pakai pemeriksaan pengganti | sop-qa-tanpa-alat |
| 2026-09-26 | Token GitHub dua kali ditempel di chat, harus di-revoke | Kredensial tidak pernah lewat chat; masuk lewat prompt terminal (Keychain) atau file .env | sop-kredensial |
| 2026-09-25 | Server dashboard gagal nyala karena port 4545 masih dipakai proses lama | Layanan dikelola launchd; restart pakai launchctl kickstart, bukan node manual | sop-layanan-kantor |
| 2026-09-25 | Dua project (Monitoring Gudang, SaaS AI IoT) ditolak CEO setelah dokumen lengkap ditulis | Project harus berasal dari kebutuhan nyata CEO; tim tidak mengusulkan project sendiri | sop-validasi-kebutuhan |
| 2026-09-25 | Satu perintah bebas di Telegram dan dashboard jalan di dua jalur terpisah | Semua perintah lewat satu antrean server supaya dua sesi tidak mengubah file yang sama | - |
| 2026-09-27 | Pertanyaan buat CEO dari kickoff (gocean-b2b, ecommerce-d2c) cuma ditulis di catatan rapat, tidak dimasukkan ke planning/KEPUTUSAN.md -- jadi tidak muncul di panel "Butuh Keputusan" dashboard walau nyatanya ada yang menunggu. | Setiap protokol yang menghasilkan pertanyaan buat CEO (kickoff, event, revisi) WAJIB juga menambah baris BLOKIR di KEPUTUSAN.md perusahaan terkait, bukan cuma di catatan rapat. |
| 2026-09-27 | ROADMAP.md tidak ikut diupdate walau 6 keputusan CEO (Q14-Q20) sudah dijawab di KEPUTUSAN.md -- CEO lihat halaman Roadmap masih kelihatan stuck padahal progres sudah jalan jauh. | Setiap kali sebuah BLOKIR di KEPUTUSAN.md dijawab dan itu mengubah status project (bukan cuma detail teknis kecil), baris ROADMAP.md perusahaan itu WAJIB diupdate di giliran yang sama, bukan ditunda. |
