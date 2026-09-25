---
name: event
description: Protokol event tak terduga: permintaan klien, insiden, deadline berubah, bug produksi. Argumen: <perusahaan>: <apa yang terjadi>.
---
# Event (triage)

Peserta wajib: pm. Tambahan: analyst bila menyentuh kode atau arsitektur, ai-engineer bila menyentuh fitur AI.
Output wajib: notulen dengan catatan dampak, perubahan BACKLOG.md, keputusan perlu /revisi atau tidak.

Langkah:
1. Catat event apa adanya di meetings/YYYY-MM-DD-event-<slug>.md: sumber, waktu, isi.
2. pm menilai: dampak ke milestone mana, urgensi (P1 hari ini, P2 minggu ini, P3 backlog), opsi respons.
3. Bila insiden produksi: analyst menulis langkah mitigasi cepat. pemilik plan (backend atau frontend) boleh dipanggil untuk hotfix sebagai plan NNN-hotfix-<slug>, tetap lewat QA.
4. Keputusan:
   - Dampak paling banyak 1 milestone dan tidak mengubah scope: pm update BACKLOG.md, catat sebagai ASUMSI, lanjut.
   - Lebih dari itu: BLOKIR, jalankan /revisi setelah CEO memutuskan.
5. Ke CEO: 5 baris. Apa yang terjadi, dampak, rekomendasi.
