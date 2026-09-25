---
name: briefing
description: Briefing pagi untuk CEO lintas semua perusahaan. Jalankan tiap pagi atau saat CEO minta status semua.
---
# Briefing pagi

Peserta: chief-of-staff.
Output: hq/briefings/YYYY-MM-DD.md.

Langkah:
1. Panggil chief-of-staff: tulis briefing hari ini dari templates/BRIEFING.md.
2. Tampilkan ke CEO bagian "Butuh keputusan CEO hari ini" apa adanya, lalu path file briefing.
3. Kalau CEO menjawab keputusan di sini: catat ke planning/KEPUTUSAN.md perusahaan terkait dan buka blokirnya.
