---
name: sop-sinkron-keputusan
description: SOP menyinkronkan ROADMAP.md dan BACKLOG.md setiap kali sebuah item di planning/KEPUTUSAN.md berubah status jadi "Dijawab" dan itu mengubah status project. Pakai di giliran yang sama saat menjawab BLOKIR, dan di giliran estafet modul berikutnya (analyst/developer) yang melanjutkan dari keputusan itu.
---
# SOP: sinkron KEPUTUSAN.md -> ROADMAP.md -> BACKLOG.md

## Kapan dipakai
- Setiap kali sebuah baris BLOKIR/ASUMSI di `companies/<p>/planning/KEPUTUSAN.md` diubah statusnya jadi "Dijawab", dan jawabannya mengubah status sebuah project (bukan cuma detail teknis kecil).
- Setiap giliran estafet modul (analyst menulis plan, developer mengerjakan, QA menguji) yang melanjutkan dari sebuah keputusan yang sudah dijawab -- cek ulang, jangan asumsikan sesi sebelumnya sudah menyinkronkan.
- Saat menulis rekap malam/briefing dan mengutip status project dari BACKLOG.md atau ROADMAP.md.

## Langkah
1. Begitu sebuah item KEPUTUSAN.md ditandai "Dijawab", DI GILIRAN YANG SAMA buka `ROADMAP.md` perusahaan itu dan perbarui baris project terkait (status, tahap berikutnya).
2. Di giliran yang sama juga, buka `BACKLOG.md` perusahaan itu dan cek apakah ada baris yang masih menyebut item itu sebagai "Menunggu CEO (Qnn)". Kalau ada, perbarui jadi status yang sesuai dengan ROADMAP.md (mis. "Siap dikerjakan", nomor plan, dsb).
3. Jangan percaya begitu saja bahwa ROADMAP.md dan BACKLOG.md sudah konsisten satu sama lain hanya karena salah satunya baru diupdate -- selalu buka DUA-duanya dan bandingkan, karena riwayat menunjukkan satu sering diupdate tanpa yang lain.
4. Kalau menemukan ketidaksinkronan saat rekap malam/briefing (bukan saat menjawab keputusan itu sendiri), perbaiki langsung sebagai koreksi data (bukan keputusan baru), lalu catat satu baris di PELAJARAN.md kalau ini kejadian berulang.

## Jangan
- Jangan menganggap update ROADMAP.md otomatis mengupdate BACKLOG.md (atau sebaliknya) -- keduanya file terpisah, harus diedit terpisah.
- Jangan menunda sinkronisasi ke "sesi berikutnya" -- pola yang sudah terjadi 3x (27 Sep, 4 Okt, 9 Okt) menunjukkan penundaan berarti tidak pernah terjadi.

## Asal-usul
2026-09-27: ROADMAP.md gocean-b2b tidak ikut diupdate walau 6 keputusan (Q14-Q20) sudah dijawab; diperbaiki manual saat rekap malam.
2026-09-27 (kejadian kedua di hari yang sama): setelah Q25 dijawab dan plan 015-021 ditulis, ROADMAP.md masih tertulis "menunggu persetujuan CEO (Q25)".
2026-10-04: BACKLOG.md Xavortree masih "Menunggu CEO (Q25)" padahal Q25 sudah Dijawab -- pola yang sama berpindah dari ROADMAP.md ke BACKLOG.md, dicatat di PELAJARAN.md tapi belum dijadikan SOP tetap.
2026-10-09: pola yang SAMA PERSIS terulang lagi di BACKLOG.md Xavortree (P1 gocean-b2b, Q25) -- tiga kejadian cukup untuk jadi SOP tetap, karena pencatatan di PELAJARAN.md saja terbukti tidak cukup melekat.
