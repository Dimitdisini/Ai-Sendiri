---
name: revisi
description: Protokol change request: perubahan scope, desain, prioritas, atau timeline. Argumen: <perusahaan>: <perubahan yang diminta>.
---
# Revisi (change request)

Peserta wajib: pm, analyst. Tambahan: pemilik plan (backend, frontend, data) bila ada plan yang sedang dikerjakan terdampak, ai-engineer bila menyentuh AI.
Output wajib: docs/<slug>/CHANGE-NN.md, TIMELINE.md usulan, notulen, persetujuan CEO.

Langkah:
1. pm menulis CHANGE-NN.md dari templates/CHANGE-REQUEST.md: apa yang berubah, kenapa, apa yang tidak berubah.
2. analyst menulis analisis dampak: dokumen (PRD/FD/TDD), plan terdampak, plan yang harus ditambah atau dibatalkan, estimasi ukuran.
3. Bila ada plan sedang dikerjakan: pemilik plan berhenti di titik aman dan menulis status di Handback.
4. pm memperbarui TIMELINE.md dengan tanggal baru, ditandai "usulan".
5. Ke CEO: sebelum vs sesudah dalam 5 baris, lalu satu pertanyaan: A terapkan, B tolak, C ubah. Berhenti, tunggu.
6. Setelah disetujui: analyst memperbarui FD/TDD dan plan, pm memperbarui PRD, tandai revisi di ROADMAP.md.
   Tanpa persetujuan, tidak ada dokumen utama yang berubah.
