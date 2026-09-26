---
name: perusahaan-baru
description: Tambah perusahaan baru ke Team Dimitri (folder companies/ baru). Argumen <slug>: <nama perusahaan>, misal "3d-print-usaha: Usaha 3D Printing Kustom". Bukan /kickoff — ini cuma menyiapkan wadahnya, belum ada project.
---
# Perusahaan Baru (scaffolding)

Tujuan: bikin folder perusahaan baru siap pakai dalam sekali panggilan, konsisten dengan struktur yang sudah ada.
Ini BUKAN membuat project — cuma menyiapkan tempatnya. Project baru tetap lewat /kickoff atau /ide setelah folder ini ada.

Langkah orkestrator:
1. Slug harus huruf kecil, angka, dan strip saja (contoh: `3d-print-usaha`). Kalau CEO kasih nama biasa, ubah jadi slug sendiri.
2. Cek companies/<slug>/ belum ada. Kalau sudah ada, jangan ditimpa — laporkan ke CEO.
3. Buat struktur ini persis seperti companies/xavortree dan companies/fleek-project:
   - companies/<slug>/CLAUDE.md — dari templates/CLAUDE-PERUSAHAAN.md, ganti <Nama Perusahaan> dengan nama asli, ganti "Nama perusahaan:" jadi terisi. SISANYA (produk, klien, stack, dst) TETAP KOSONG kecuali CEO sudah kasih detailnya di perintah awal — jangan mengarang isinya.
   - companies/<slug>/docs/.gitkeep, companies/<slug>/meetings/.gitkeep
   - companies/<slug>/docs/pengetahuan/BASIS.md — dari templates/BASIS-PENGETAHUAN.md
   - companies/<slug>/planning/ROADMAP.md, BACKLOG.md, KEPUTUSAN.md, DITUNDA.md — sama seperti perusahaan lain, tabel kosong dengan header saja
   - companies/<slug>/planning/plans/.gitkeep, companies/<slug>/planning/qa/bukti/.gitkeep
4. TIDAK perlu bikin team.json — kalau tidak ada, semua 12 peran dianggap aktif secara default (lihat CLAUDE.md bagian Formasi per perusahaan). CEO bisa mempersempit lewat halaman Pengaturan di dashboard kapan saja.
5. Daftarkan di lab/IDE.md TIDAK PERLU (itu untuk ide, bukan perusahaan). Cukup update companies/xavortree dan companies/fleek-project TIDAK disentuh sama sekali.
6. Ke CEO: konfirmasi 3-5 baris bahwa folder sudah siap, sebutkan apa yang masih perlu diisi di CLAUDE.md-nya sebelum /kickoff pertama bisa jalan maksimal (produk, klien, stack). JANGAN mengajukan ide project — itu keputusan CEO sepenuhnya.

Setelah ini selesai, dashboard dan kantor 3D otomatis menampilkan perusahaan baru ini (server membaca folder companies/ secara dinamis, tidak perlu ubah kode).
