---
name: catat-pelajaran
description: Ubah cara kerja yang terbukti bagus atau kesalahan yang terjadi menjadi SOP (skill) atau catatan, supaya tim tidak mengulang dari nol. Argumen: <pelajaran singkat>. Dipanggil dari rekap malam atau manual lewat /catat.
---
# Catat pelajaran

Tujuan: tim makin pintar tiap hari dan tidak kehilangan konteks. Semua pelajaran jadi file, bukan ingatan.

Langkah orkestrator:
1. Tambahkan satu baris ke PELAJARAN.md (root): tanggal, apa yang terjadi, pelajarannya, file SOP terkait.
2. Putuskan jenisnya:
   - **Cara kerja yang bisa diulang** (langkah-langkah jelas, akan terjadi lagi): buat atau perbarui skill `.claude/skills/sop-<topik>/SKILL.md`.
     Cek dulu `ls .claude/skills/ | grep sop-` — kalau sudah ada SOP dengan topik mirip, PERBARUI yang itu, jangan bikin duplikat.
   - **Kesalahan sekali atau fakta kecil**: cukup baris di PELAJARAN.md, tidak perlu skill.
3. Format SOP: frontmatter (name, description yang jelas kapan dipakai), lalu "Kapan dipakai", "Langkah", "Jangan", "Asal-usul" (tanggal + kejadian yang melahirkan SOP ini).
4. SOP harus lahir dari kejadian nyata. Jangan menulis SOP spekulatif "siapa tahu perlu".
5. Ke CEO (kalau manual): satu baris, nama file yang dibuat atau diperbarui.
