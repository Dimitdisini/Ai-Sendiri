---
name: kickoff
description: Protokol project baru. Jalankan saat CEO menyebut project, klien, atau produk baru. Argumen: <perusahaan-a|perusahaan-b>: <deskripsi project>.
---
# Kickoff (project baru)

Peserta wajib: business-analyst, pm, analyst. Tambahan: ai-engineer bila ada komponen AI.
Output wajib: BRD draft, notulen, maks 3 pertanyaan BLOKIR ke CEO.

Langkah orkestrator:
1. Tentukan perusahaan dan slug project. Pastikan companies/<p>/CLAUDE.md sudah terisi; kalau kosong, minta CEO mengisi dulu.
2. Buat companies/<p>/docs/<slug>/.
3. Panggil business-analyst: tulis docs/<slug>/BRD.md dari templates/BRD.md berdasarkan deskripsi CEO dan CLAUDE.md perusahaan.
4. Panggil analyst: baca BRD draft, tulis pertanyaan teknis, risiko, dan estimasi ukuran kasar (S/M/L/XL).
5. Bila ada AI: panggil ai-engineer untuk catatan kelayakan dan estimasi biaya kasar.
6. Tulis notulen companies/<p>/meetings/YYYY-MM-DD-kickoff-<slug>.md dari templates/MEETING-NOTES.md.
7. Ke CEO: ringkasan maks 10 baris, lalu maks 3 pertanyaan BLOKIR dengan rekomendasi A/B. Berhenti, tunggu jawaban.

Setelah CEO menyetujui BRD:
8. pm: PRD.md dan TIMELINE.md. analyst: FD.md dan TDD.md. ai-engineer bila ada: AI-SPEC.md.
9. analyst: pecah PRD menjadi plans/NNN-<slug>.md, tiap plan menyebut pemilik (backend, frontend, data, ai-engineer, devops). Daftarkan di planning/ROADMAP.md dan BACKLOG.md.
10. Lapor CEO: dokumen siap review, plan pertama siap dikerjakan.
