# HANDOVER — Kantor AI / Team Dimitri

Dokumen serah terima lengkap. Ditulis 2026-09-25 oleh Orkestrator (Claude Code) untuk dibaca manusia atau agen lain, termasuk Antigravity.
Kalau kamu agen: baca ini dulu, lalu CLAUDE.md, lalu TEAM.md. Jangan mengubah struktur sebelum memahami bagian "Keputusan yang sudah diambil".

---

## 1. Tujuan sistem

Satu tim agen AI untuk satu orang: **Dimitri**, CEO dua perusahaan software (Xavortree dan Fleek Project) sekaligus GM AI.
Tim ini bernama **Team Dimitri**. Perusahaan di dalamnya adalah "klien" yang dilayani, bukan tim terpisah. Tidak ada tim manusia di dalam sistem ini.

Tujuan satu kalimat: **mengubah keputusan CEO menjadi pekerjaan selesai yang terverifikasi, tanpa CEO mengetik sendiri, dan memberi CEO gambaran semua project setiap pagi.**

Tiga hasil yang dikejar:
1. Dokumen produk (BRD, PRD, FD, TDD, AI-SPEC, Timeline) jadi dalam hitungan jam. CEO review dan memutuskan.
2. Software dibangun lewat estafet Architect → pemilik plan (Backend/Frontend/Data/AI/DevOps) → QA sampai PASS, dengan bukti.
3. CEO tahu status semua project lewat briefing pagi dan Telegram, tanpa rapat manusia.

Yang bukan tujuannya: menggantikan keputusan CEO (agen merekomendasikan A/B, CEO memutuskan), tim sales/HR/finance, dan "jalan 24 jam" tanpa antrean kerja.

Asal ide: postingan viral Threads (@teguhgunaw) tentang kantor 3D agen Claude Code. Riset menemukan itu rakitan sendiri: hooks Claude Code → server lokal → tampilan isometrik. Sistem ini adalah versi kami sendiri.

---

## 2. Keputusan yang sudah diambil (jangan diulang tanpa alasan)

| Keputusan | Pilihan CEO | Catatan |
|---|---|---|
| Untuk siapa web ini | CEO sendiri | Tidak perlu login, tidak untuk klien |
| Nilai utama web | "lihat sekilas" status | Visual lucu = bonus |
| Cakupan tim | Satu tim lengkap (Team Dimitri), fokus Xavortree dulu | Fleek Project ada tapi belum ada project |
| Paket langganan | Claude Max (terverifikasi `claude auth status` → subscriptionType max) | Sebelumnya Pro; CEO naik ke Max supaya tim bisa kerja lama |
| 9router + Antigravity untuk Claude Code | **DITOLAK** | Google memblokir akun yang pakai proxy pihak ketiga (gemini-cli discussion #20632, 9router issue #365, forum Google AI Dev). Antigravity dipakai langsung di IDE-nya, bukan lewat proxy |
| Ruang rapat | Visual saja | CEO tidak "duduk" di dalamnya |
| Perintah ke tim | Dari dalam web/Telegram | Bot Telegram sudah jalan |
| Notifikasi BLOKIR | Web + Telegram | Sudah jalan |
| Kode perusahaan | GitHub, semua | Repo Xavortree monitoring-gudang BELUM dibuat (BLOKIR Q4) |
| Alat tim manusia | Google Drive/Docs, spreadsheet | Folder Drive "Team Dimitri" sudah dibuat oleh sesi Telegram; hanya dokumen final yang disinkron (Q5=B) |
| n8n | Tidak ada rencana | Nama folder kebetulan |
| Waktu CEO | ~1 jam/hari | Semua laporan maks 10 baris, maks 3 pertanyaan per giliran |
| Wewenang AI tanpa tanya | Pilih library/tool teknis, urutan prioritas task | Ubah DB, scope, timeline, deploy prod, kirim pesan keluar = wajib CEO |
| Kode masuk repo tanpa dibaca CEO | Nyaman, asal QA ada bukti | Screenshot + hasil test wajib |

Keputusan project Monitoring Gudang Pintar (Xavortree): Q1=B demo internal (data simulasi), Q2=A SaaS multi-tenant, Q3=B AI anomali wajib di rilis pertama. Detail di `companies/xavortree/planning/KEPUTUSAN.md` (Q1–Q5, A1–A14).

---

## 3. Struktur folder

```
CLAUDE.md                aturan kantor untuk Orkestrator (sesi utama Claude Code) — WAJIB dibaca agen apa pun
TEAM.md                  formasi 11 peran, nama panggilan, dokumen yang dimiliki, model per peran
README.md                blueprint awal (Fase 1) + cara mulai
HANDOVER.md              dokumen ini
.claude/agents/*.md      definisi subagen (frontmatter name/description/model + instruksi peran)
.claude/skills/*/SKILL.md protokol: kickoff, event, revisi, briefing, review, rilis, riset
.claude/settings.json    hooks Claude Code → office/hooks/track.mjs
.claude/launch.json      konfigurasi preview dashboard (port 4545)
templates/*.md           13 template dokumen (BRD, PRD, FD, TDD, AI-SPEC, EVAL-REPORT, TIMELINE, PLAN, TEST-PLAN, QA-REPORT, MEETING-NOTES, CHANGE-REQUEST, BRIEFING)
companies/<slug>/        satu perusahaan = satu folder
  CLAUDE.md              konteks perusahaan (stack, batasan) — wajib dibaca sebelum kerja di situ
  docs/<project>/        dokumen per project
  planning/ROADMAP.md, BACKLOG.md, KEPUTUSAN.md, DITUNDA.md
  planning/plans/NNN-<slug>.md   satu plan = satu giliran satu pemilik
  planning/qa/NNN-qa-rN.md, qa/bukti/NNN/   laporan dan screenshot QA
  meetings/YYYY-MM-DD-<protokol>-<slug>.md  notulen
  code/<repo>/           kode (git lokal sampai ada remote)
hq/briefings/YYYY-MM-DD.md   briefing pagi lintas perusahaan
office/                  dashboard + hooks + Telegram (lihat bagian 6)
```

---

## 4. Tim: 11 peran

| Peran | Nama | id subagen | Pekerjaan | Model |
|---|---|---|---|---|
| Orkestrator | Kai | (sesi utama) | jalankan protokol, panggil peran, notulen, jaga planning/ | sesi utama |
| Business Analyst | Tari | business-analyst | BRD, business case, proses | opus |
| PM | Sari | pm | PRD, TIMELINE, BACKLOG, CHANGE | opus |
| System Analyst / Architect | Bima | analyst | FD, TDD, pecah PRD → plans, analisis dampak, /riset teknis | opus |
| AI Engineer | Naya | ai-engineer | AI-SPEC, EVAL-REPORT, review plan yang menyentuh AI | opus |
| Backend | Raka | backend | API, DB, integrasi perangkat | opus |
| Frontend | Gilang | frontend | dashboard web, UI, responsif HP, screenshot | opus |
| Data | Wulan | data | skema time-series, pipeline, simulator, laporan | opus |
| DevOps | Yoga | devops | env, CI, Docker, deploy, backup | sonnet |
| QA | Dewi | qa | uji per AC, bukti, verdict PASS/FAIL | sonnet |
| Chief of Staff | Arga | chief-of-staff | briefing pagi, keputusan tertahan, konflik prioritas | sonnet |

Prinsip inti (dari CLAUDE.md):
- Semua pekerjaan lewat file. Tidak ada file = pekerjaan belum ada.
- Orkestrator TIDAK mengerjakan sendiri; dia memanggil peran.
- Keputusan: **ASUMSI** (agen jalan dengan rekomendasi, dicatat, CEO bisa batalkan) vs **BLOKIR** (item berhenti, tunggu CEO).
- Ke CEO: ringkasan maks 10 baris + maks 3 pertanyaan, tiap pertanyaan opsi A/B + rekomendasi.
- Scope/timeline tidak berubah tanpa /revisi. QA yang memutuskan selesai. Maks 5 ronde QA per plan, ronde 6 = BLOKIR.
- Tindakan keluar (email, pesan, deploy prod, bayar) selalu menunggu "ya" eksplisit CEO.
- Peran yang tidak dipanggil tidak memakan kuota. Formasi lengkap ≠ semua bekerja tiap hari.

---

## 5. Protokol (skills) — "aturan meeting"

| Perintah | Pemicu | Peserta wajib | Output | Butuh CEO? |
|---|---|---|---|---|
| /kickoff | project baru | business-analyst, pm, analyst (+ai-engineer bila ada AI) | BRD draft, notulen, ≤3 BLOKIR; setelah BRD disetujui: PRD, TIMELINE, FD, TDD, AI-SPEC, plans | ya, approve BRD |
| /event | permintaan klien, insiden, deadline berubah | pm (+analyst/ai-engineer) | catatan dampak, backlog | hanya jika >1 milestone |
| /revisi | scope/desain/timeline berubah | pm, analyst (+pemilik plan) | CHANGE-NN, timeline usulan | ya: A terapkan / B tolak / C ubah |
| /briefing | tiap pagi | chief-of-staff | hq/briefings/YYYY-MM-DD.md | baca 5 menit |
| /review | mingguan per perusahaan | pm, qa | progres vs timeline, 3 prioritas | ya |
| /rilis | sebelum rilis | devops, qa (+backend, frontend, ai-engineer, data) | checklist go/no-go | ya, rilis prod tunggu "ya" |
| /riset | pertanyaan riset | satu peran (analyst / business-analyst / ai-engineer) | docs/riset/YYYY-MM-DD-<slug>.md | rekomendasi 5 baris |

Estafet modul: analyst menulis plan (dengan pemilik) → pemilik mengerjakan, isi Handback di file plan → qa menguji, tulis qa/NNN-qa-rN.md → FAIL kembali ke pemilik / PASS tandai selesai di ROADMAP.md.

---

## 6. Dashboard "Kantor AI" (office/)

Stack: Node.js murni (v24), tanpa dependency npm. Jalankan `./office/restart.sh` → http://localhost:4545

Komponen:
- `hooks/track.mjs` — dipanggil Claude Code lewat hooks (SessionStart, UserPromptSubmit, SubagentStart/Stop, PreToolUse, PostToolUse, Stop, StopFailure). Menulis 1 baris JSON per event ke `office/data/events.jsonl`: ts, hook, session_id, agent_type, agent_id, company, file, wrote, tool, summary. Perusahaan dideteksi dari path `companies/<slug>/` di file/perintah, fallback dari cwd. Hook wajib cepat dan tidak pernah gagal.
- `server.mjs` — HTTP server. Endpoint: `/api/state` (perusahaan, agen, status kerja/istirahat, aksi, sesi, rapat, kuota), `/api/roster`, `/api/company/<slug>/{roadmap,keputusan,backlog,output,bukti}`, `/events` (SSE), `/files/<slug>/...` (screenshot QA). Parser tabel Markdown untuk planning/*.md. Status agen di-replay dari events.jsonl tiap request (file kecil). Idle setelah 10 menit tanpa event. Peran subagen generik ("general-purpose") ditebak dari file yang DITULIS (BRD→BA, PRD/TIMELINE→PM, FD/TDD/plans→Architect, AI-SPEC→AI Eng, qa/→QA, hq/briefings→CoS). Rapat aktif bila notulen baru ditulis (12 menit) ATAU ≥2 peran bekerja bersamaan. Kuota: StopFailure tanpa aktivitas sukses setelahnya → banner "kuota habis, lanjut ±5 jam". Env: `OFFICE_PORT`, `OFFICE_EVENTS` (file lain untuk uji).
- `public/index.html, app.js, style.css` — panel: kartu agen, tab Roadmap / Keputusan / Output / Bukti QA, switch perusahaan, polling 5 detik + SSE.
- `public/office.js` — kantor isometrik canvas: ruang kerja 11 meja, ruang rapat kaca (kanan atas), sudut istirahat (kanan bawah), papan roadmap, papan ruang rapat, jam. Karakter: kerja = duduk mengetik + gelembung aktivitas; istirahat = ke sofa/kopi + obrolan; rapat = ke meja rapat; kuota habis = semua ngopi.
- `roster.json` — nama panggilan & warna per peran (dibaca ulang tiap request).
- `telegram.mjs` — bot Telegram long polling, tanpa dependency. Baca `office/.env` (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID). Hanya 1 chat id. Pesan → `claude -p "<pesan>" --dangerously-skip-permissions` di root proyek → balasan dikirim balik. `/status` → ringkasan dari /api/state. Tiap 60 detik memindai KEPUTUSAN.md semua perusahaan, BLOKIR baru berstatus Menunggu → kirim ke Telegram (dicatat di data/telegram-seen.json). Bot: @AsistenDim_Baru_bot. Jalankan `node office/telegram.mjs`.
- `restart.sh` — matikan server lama di port lalu jalankan server. Pakai ini, bukan `node office/server.mjs` langsung.

Tugas terjadwal (Desktop Scheduled Tasks aplikasi Claude, hanya jalan saat aplikasi terbuka):
- `kantor-ai-briefing-pagi`: Senin–Jumat 07.34, chief-of-staff menulis hq/briefings/.
- `kantor-ai-kerja-malam`: manual (belum dijadwalkan). Lanjutkan plan "Siap" lewat pemilik→qa, berhenti di BLOKIR, tidak deploy.

Rahasia: `office/.env` berisi token bot (mode 600, di .gitignore). Token pernah ditempel di chat; bisa diputar ulang via BotFather /revoke.

---

## 7. Status project nyata: Xavortree — Monitoring Gudang Pintar

Deskripsi: sensor suhu/kelembapan multi-titik (ESP32 + SHT31, MQTT) → dashboard web realtime & historis → deteksi anomali → alert Telegram dengan acknowledge. SaaS multi-tenant. Pilot = demo internal dengan simulator data sintetis.

Dokumen (semua v0.1, total ±9.700 kata) di `companies/xavortree/docs/monitoring-gudang/`:
- BRD.md — disetujui CEO 2026-09-25. Estimasi L (3–4 bulan sampai pilot stabil).
- ANALISIS-KICKOFF.md — 6 pertanyaan teknis, 5 risiko, modul M01–M08, hardware pilot.
- PRD.md — 15 fitur: 10 Must (F01 fondasi multi-tenant, F02 simulator, F03 dataset sintetis, F04 node fisik, F05 ingestion, F06 alert ambang+Telegram+Ack, F07 anomali AI, F08 dashboard realtime, F09 onboarding admin, F10 skenario demo), 3 Should, 2 Could. Menunggu review CEO.
- TIMELINE.md — usulan 6 minggu: MS0 fondasi+simulator 2026-10-04, MS1 data mengalir 10-11, MS2 alert+AI 10-18, MS3 dashboard+onboarding 10-25, MS4 integrasi demo 11-01, **MS5 demo internal 2026-11-06**.
- AI-SPEC.md — rilis 1 TANPA ML: 6 detektor statistik+aturan (ambang+histeresis, laju perubahan, deviasi pola harian, sensor macet, konsistensi peer, offline), parameter JSON per tenant/zona, shadow mode, tombol Benar/Palsu. Simulator termal orde-1. Eval 34 skenario × 3 seed; ambang: recall ≥90%, presisi ≥85%, alert palsu ≤0,5/sensor/minggu, deteksi mendadak ≤2 menit. LLM tidak dipakai di rilis 1 (opsional 1.1: /jelaskan, ±US$15 per 1.000 alert).
- FD.md — 6 layar + Telegram + CLI, 15 entitas, kontrak REST/MQTT/Telegram, matriks peran.
- TDD.md — monorepo, migrasi 0001–0006, RLS FORCE + view security_barrier, Mosquitto dynsec, Telegram long polling, Docker Compose, observabilitas, 14 keputusan teknis.

Plan MS0 (`planning/plans/`, semua status Siap): 010 repo+Docker Compose (devops, M) → 011 skema DB+RLS (backend, M) ∥ 013 simcore+generator (data, M) → 012 API auth+tenant+CLI (backend, M) → 014 simulator MQTT+skenario (data, M).

Kondisi terakhir: DevOps sempat mulai plan 010 (kerangka repo ada di `companies/xavortree/code/monitoring-gudang/`: package.json, Makefile, db/, deploy/, firmware/, packages/, pyproject.toml) lalu DIHENTIKAN atas perintah CEO "stop semua". Status plan masih "Siap", belum ada Handback → ulangi/lanjutkan 010 dari kondisi folder itu. Batasan mesin yang dicatat DevOps: Docker tidak terpasang, mosquitto_pub/psql tidak ada, Python lokal 3.9 (kontainer 3.12), Node 24 dan git ada.

Menunggu CEO: Q4 repo GitHub (rekomendasi buat repo kosong `monitoring-gudang`, tambahkan sebagai remote), A10 beli 2 unit ESP32+SHT31 (±Rp300 ribu) untuk kalibrasi simulator, review PRD+TIMELINE.

Fleek Project: folder ada, CLAUDE.md masih kosong, belum ada project.

---

## 8. Cara menjalankan (urutan)

1. Terminal A: `./office/restart.sh` → buka http://localhost:4545
2. Terminal B: `node office/telegram.mjs` (butuh `claude auth login` sekali; sudah login sebagai fleekprojects@gmail.com, paket max)
3. Terminal C: `claude` di root proyek, lalu misal `lanjut plan 010` atau `/briefing`, atau kirim perintah dari HP ke bot.
4. Hanya SATU dashboard dan SATU bot yang boleh jalan. Dua bot = konflik getUpdates Telegram.

Uji dashboard tanpa mengganggu data asli: `OFFICE_EVENTS=/path/uji.jsonl OFFICE_PORT=4546 node office/server.mjs`.

---

## 9. Batasan dan risiko yang jujur

- Hooks hanya untuk Claude Code. Agen dari Antigravity/Codex/Gemini TIDAK muncul di dashboard kecuali mem-POST event sendiri ke format events.jsonl (belum ada endpoint tulis; mudah ditambah: POST /api/event → append baris).
- Status "kerja/istirahat" = heuristik dari event, bukan sinyal presisi.
- Tebakan peran dari file yang ditulis hanya untuk subagen generik; subagen bernama (pm, qa, dst) terbaca langsung.
- Tugas terjadwal desktop hanya jalan saat aplikasi Claude terbuka. Untuk 24 jam tanpa laptop: Claude Code Routines (cloud) setelah proyek masuk GitHub, atau VPS.
- `--dangerously-skip-permissions` di jalur Telegram: bot hanya menerima 1 chat id, dan CLAUDE.md melarang deploy/kirim keluar tanpa "ya" CEO. Tetap risiko; `CLAUDE_SAFE=1` menonaktifkan bypass.
- Kualitas disiplin protokol bergantung pada model. Model lain bisa lebih longgar pada aturan CLAUDE.md.
- Sesi paralel (Telegram + desktop) bisa menulis file yang sama. Sudah terjadi sekali (KEPUTUSAN.md ditambah Q5/A11 oleh sesi Telegram) tanpa konflik, tapi tidak ada locking.
- Proyek ini sendiri BELUM di-git. Disarankan `git init` di root (office/.env dan office/data sudah di .gitignore).

---

## 10. Yang belum dibangun (backlog sistem)

- Endpoint POST /api/event supaya tool non-Claude bisa melapor ke dashboard.
- Loop kerja nyata pertama sampai QA PASS (plan 010 → 014).
- Kalibrasi hardware (A10) dan repo GitHub (Q4).
- Rumah "2 ruangan" per perusahaan: saat ini satu kantor dengan switch tab perusahaan; ruang rapat sudah ada. Visual 3D dengan aset Kenney sudah dibangun (office3d.js), lihat office/README.md.
- Kerja malam otomatis: aktifkan jadwal setelah satu plan pernah PASS.
- Memindahkan kredensial Telegram ke keychain.
- git init proyek ini.

---

## 11. Pertanyaan yang layak didiskusikan dengan agen lain (misal Antigravity)

1. Apakah peran Developer/Data sebaiknya dijalankan di Antigravity (IDE) sementara Orkestrator/PM/Architect/QA tetap di Claude Code? Bagaimana melaporkan progresnya ke dashboard (POST /api/event)?
2. Apakah pemisahan ASUMSI/BLOKIR cukup sebagai mekanisme kontrol, atau perlu gerbang tambahan sebelum kode masuk repo?
3. Format plan (PLAN.md) sudah cukup sebagai kontrak antar-agen lintas tool? Apa yang kurang untuk agen non-Claude?
4. Simulator data sintetis (AI-SPEC §2) — realistis atau perlu model termal yang lebih baik sebelum demo?
5. Apakah target demo 6 minggu masuk akal untuk 5 plan M di MS0 dengan maks 2 paralel?

---

## 12. Riwayat singkat hari ini (2026-09-25)

Riset postingan viral → analisis tujuan → Fase 1 (peran, protokol, template) → Fase 2 dashboard panel → Fase 2b kantor 3D → Fase 3 tugas terjadwal → wawancara 21 pertanyaan → 9router ditolak → Team Dimitri 11 peran → kickoff nyata Monitoring Gudang (6 dokumen, 5 plan) → kuota & Telegram → ruang rapat → DevOps mulai plan 010 → CEO minta stop semua.

Memori Claude Code untuk proyek ini ada di `~/.claude/projects/-Users-haimac-Dimitri-Ahmad-n8n-agent-Vscode/memory/`.
