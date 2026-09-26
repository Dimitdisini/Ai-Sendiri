---
name: briefing
description: Laporan pagi untuk CEO lintas semua perusahaan (prioritas, deadline, keputusan, kesehatan sistem). Dijadwalkan tiap pagi, bisa juga dipanggil manual lewat /briefing.
---
# Laporan pagi

Peserta: chief-of-staff saja.
Output: bagian "## Pagi" di hq/jurnal/YYYY-MM-DD.md (tanggal hari ini), dari templates/JURNAL.md.
Kalau file hari ini belum ada, buat dari template. Kalau bagian "## Pagi" sudah ada (dipanggil ulang), timpa bagian itu saja, jangan duplikat.

Langkah orkestrator:
1. Panggil chief-of-staff untuk menulis bagian Pagi. Sumber datanya hanya file, bukan ingatan:
   - companies/*/planning/{ROADMAP,BACKLOG,KEPUTUSAN,DITUNDA}.md dan companies/*/team.json
   - bagian "## Malam" di jurnal kemarin (usulan prioritas besok = bahan prioritas hari ini)
   - office/data/commands.jsonl (perintah yang masih antre atau macet)
   - hasil `launchctl list | grep kantorai` untuk kesehatan layanan
2. Format per perusahaan WAJIB 3 bagian saja: Selesai | Jalan | Butuh keputusan. Perusahaan tanpa aktivitas cukup satu baris: "tidak ada aktivitas".
3. Bagian "### Untuk CEO" maksimal 6 baris. Bagian ini otomatis dikirim ke Telegram, jadi tulis seperti pesan singkat ke atasan, bukan laporan resmi.
4. Kalau dipanggil manual (bukan terjadwal): tampilkan bagian "Untuk CEO" apa adanya ke CEO.
5. Kalau CEO menjawab keputusan di balasan berikutnya: catat ke planning/KEPUTUSAN.md perusahaan terkait dan buka blokirnya.

Jangan menambah pekerjaan baru, jangan mengusulkan project baru. Laporan pagi hanya melaporkan.
