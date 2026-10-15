---
name: sop-status-plan-siap
description: SOP penulisan dan pembaruan field Status di header planning/plans/NNN-*.md supaya kerja-malam (automasi malam) bisa menemukan plan yang sudah siap dikerjakan. Pakai saat Analyst/Architect menulis plan baru dengan prasyarat, dan saat sebuah plan prasyarat PASS QA.
---

# SOP: Status plan harus persis "Siap" saat sudah siap dikerjakan

## Kapan dipakai
- Analyst/Architect menulis plan baru di planning/plans/ yang baru bisa dikerjakan setelah plan lain PASS QA.
- Sebuah plan PASS QA (status jadi "Selesai") -- cek apakah ada plan turunan yang prasyaratnya baru terpenuhi.
- Setiap /rekap-malam atau /briefing yang mengecek kerja-malam melapor "tidak ada plan siap" -- cek apakah ini gejala dari masalah ini, bukan benar-benar tidak ada kerjaan.

## Masalah
Instruksi kerja-malam mencari plan dengan Status TEPAT "Siap" (match literal), bukan prefix. Kalau Analyst/Architect menulis Status dengan embel-embel kondisi, misal:

`Status: Siap (mulai setelah 015 PASS)`

maka plan itu TIDAK PERNAH cocok dengan filter, walau prasyaratnya ("015 PASS") sudah terpenuhi sejak lama. Kerja-malam akan terus melapor "tidak ada plan siap" tanpa ada yang menyadari plan itu sebenarnya sudah bisa dikerjakan.

Ditemukan 2026-10-15: plan 016-021 gocean-b2b (Xavortree) semua ditulis dengan format "Siap (mulai setelah NNN PASS)" dan tidak pernah tereksekusi kerja-malam meski plan 015 sudah PASS QA sejak 2026-09-27 (hampir 3 minggu terlewat).

## Langkah
1. Saat menulis plan baru dengan prasyarat, field Status BOLEH memuat catatan kondisi untuk manusia (misal "Siap (mulai setelah 015 PASS)"), tapi catat juga di tempat lain (ROADMAP.md atau isi plan) bahwa Status ini perlu diperbarui manual begitu prasyaratnya terpenuhi.
2. Begitu plan prasyarat dinyatakan "Selesai"/PASS QA, SEGERA cek apakah ada plan turunan dengan Status bersyarat yang prasyaratnya baru terpenuhi. Kalau ada, update Status plan turunan itu jadi PERSIS "Siap" (hilangkan embel-embel kondisi) di giliran yang sama -- jangan ditunda.
3. Siapa yang mengubah: Analyst/Architect (pemilik dokumen plan), bukan orkestrator atau chief-of-staff. Kalau ditemukan saat /rekap-malam atau /briefing, catat sebagai temuan di planning/KEPUTUSAN.md (ASUMSI, bisa langsung dikerjakan) supaya Analyst menindaklanjuti giliran berikutnya.
4. Alternatif jangka panjang (butuh keputusan devops/CEO): ubah instruksi kerja-malam supaya menerima match prefix "Siap" alih-alih match eksak, sehingga embel-embel kondisi tidak lagi jadi jebakan. Ini mengubah instruksi terjadwal, jadi perlu persetujuan sebelum diubah.

## Jangan
- Jangan biarkan Status plan dengan embel-embel kondisi dibiarkan begitu saja setelah prasyaratnya terpenuhi -- itu membuat plan tak kasat mata bagi automasi malam tanpa ada error yang terlihat (kerja-malam melapor "tidak ada plan siap", bukan error).
- Jangan asumsikan "tidak ada plan siap" dari kerja-malam selalu berarti benar-benar tidak ada kerjaan -- cek dulu apakah ada plan dengan Status bersyarat yang prasyaratnya sudah terpenuhi.

## Asal-usul
2026-10-15: plan 016-021 gocean-b2b (Xavortree) ditemukan tidak pernah tereksekusi kerja-malam sejak ditulis karena Status-nya "Siap (mulai setelah NNN PASS)" bukan persis "Siap", walau plan 015 sudah PASS QA sejak 2026-09-27. Dicatat sebagai Q29 di companies/xavortree/planning/KEPUTUSAN.md.
