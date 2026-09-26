---
name: rekap-malam
description: Rekap malam untuk CEO: apa yang selesai hari ini, usulan prioritas besok, keputusan yang menunggu, dan pelajaran hari ini. Dijadwalkan tiap malam, bisa juga dipanggil manual lewat /rekap.
---
# Rekap malam

Peserta: chief-of-staff, lalu orkestrator untuk mencatat pelajaran.
Output: bagian "## Malam" di hq/jurnal/YYYY-MM-DD.md (tanggal hari ini). Tambahkan di bawah bagian Pagi, jangan menimpa Pagi.

Langkah orkestrator:
1. Panggil chief-of-staff untuk menulis bagian Malam dari templates/JURNAL.md. Sumber data hanya file:
   - perubahan hari ini: `git log --since=midnight --stat` di root proyek
   - office/data/commands.jsonl (perintah hari ini: selesai, gagal, masih jalan)
   - companies/*/planning/*.md dan companies/*/planning/qa/*.md yang berubah hari ini
2. "Rekap hari ini" hanya berisi yang BENAR-BENAR selesai dengan bukti file. Jangan menulis "sedang progres baik" tanpa bukti.
3. "Usulan prioritas besok" maksimal 3, diambil dari BACKLOG dan plan berstatus Siap. Jangan mengarang pekerjaan baru.
4. "Pelajaran hari ini": kalau ada cara kerja bagus atau kesalahan hari ini, orkestrator menjalankan protokol /catat-pelajaran untuk tiap pelajaran. Kalau tidak ada, tulis "tidak ada" — jangan dipaksa.
5. Bagian "### Untuk CEO" maksimal 6 baris, otomatis dikirim ke Telegram.

Rekap malam jalan sebelum kerja malam. Hasil kerja malam masuk ke laporan pagi besok.
