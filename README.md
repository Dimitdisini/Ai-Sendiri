# Kantor AI — Blueprint

Kantor AI adalah tim agen Claude Code yang bekerja untuk satu orang: CEO (kamu).
Kamu memutuskan "apa" dan "kenapa". Tim mengerjakan "bagaimana" dan mengembalikan bukti.

## Tujuan

Mengubah keputusan CEO menjadi pekerjaan selesai yang terverifikasi, tanpa CEO mengetik sendiri,
dan memberi CEO gambaran dua perusahaan setiap pagi.

Tiga hasil yang dikejar:
1. Dokumen produk (BRD, PRD, FD, TDD, AI-SPEC, Timeline) jadi dalam hitungan jam. CEO tinggal review dan memutuskan.
2. Software dibangun lewat estafet Analyst → Developer → QA, dengan bukti uji, bukan klaim.
3. CEO tahu status dua perusahaan lewat briefing pagi, tanpa rapat manusia.

Yang BUKAN tujuannya:
- Menggantikan keputusan CEO. Agen merekomendasikan A/B, CEO memutuskan.
- Tim sales, HR, finance. Tanpa data dan tool nyata, agen hanya mengarang.
- Jalan 24 jam tanpa antrean kerja. Tim ini hanya sesibuk backlog yang CEO isi.

## Struktur folder

```
CLAUDE.md                  aturan kantor untuk Orkestrator (sesi utama Claude Code)
.claude/agents/            peran: pm, analyst, ai-engineer, developer, qa, chief-of-staff
.claude/skills/            protokol: /kickoff /event /revisi /briefing /review /rilis
templates/                 template semua dokumen
companies/perusahaan-a/    satu perusahaan = satu folder (CLAUDE.md, docs/, planning/, meetings/)
companies/perusahaan-b/
hq/briefings/              briefing pagi lintas perusahaan
```

## Siapa mengerjakan apa

| Peran | Pekerjaan | Dokumen yang dimiliki |
|---|---|---|
| CEO (kamu) | prioritas, keputusan A/B, approve dokumen & rilis | — |
| Orkestrator (sesi utama) | jalankan protokol, panggil peran, notulen | meetings/ |
| PM | kebutuhan bisnis & produk, backlog, change request | BRD, PRD, TIMELINE, CHANGE |
| Analyst / Architect | desain fungsional & teknis, pecah jadi plan | FD, TDD, plans/ |
| AI Engineer | fitur berbasis LLM: model, prompt, eval, biaya | AI-SPEC, EVAL-REPORT |
| Developer | implementasi satu plan sampai siap QA | Handback di plan |
| QA | uji terhadap acceptance criteria, bukti, verdict | TEST-PLAN, QA-REPORT |
| Chief of Staff | briefing pagi, keputusan tertahan, konflik prioritas | hq/briefings/ |

## Alur kerja

1. CEO memberi project / event / revisi lewat protokol (/kickoff, /event, /revisi).
2. Orkestrator memanggil peran yang wajib hadir, menulis notulen, mengembalikan maks 3 pertanyaan.
3. Dokumen → roadmap → plan per modul → Developer → QA sampai PASS.
4. Chief of Staff membaca semua planning/ dan menulis briefing pagi di hq/briefings/.

## Cara mulai (10 menit)

1. Isi `companies/perusahaan-a/CLAUDE.md` (nama, produk, stack, repo). Ganti nama folder kalau mau.
2. Di terminal: masuk ke folder ini, jalankan `claude`.
3. Ketik: `/kickoff perusahaan-a: <deskripsi project>`
4. Jawab pertanyaan BLOKIR yang muncul. Sisanya biar tim jalan.
5. Besok pagi: `/briefing`.

## Tahap berikutnya

- Fase 2: dashboard kantor 3D (hooks → server lokal → web) yang membaca folder planning/.
- Fase 3: Routines di cloud untuk kerja malam (QA regresi, briefing otomatis).
