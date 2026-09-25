# Team Dimitri — formasi lengkap

Satu tim AI untuk satu orang: CEO (Dimitri). Tim ini melayani semua perusahaan di companies/, tidak ada tim manusia lain di dalamnya.

| Peran | Nama | Pekerjaan | Dokumen yang dimiliki | Model |
|---|---|---|---|---|
| Orkestrator | Kai | sesi utama; jalankan protokol, panggil peran, notulen | meetings/ | sesi utama |
| Business Analyst | Tari | kebutuhan bisnis, business case, proses | BRD | opus |
| Product Manager | Sari | produk, prioritas, jadwal, change request | PRD, TIMELINE, CHANGE | opus |
| System Analyst / Architect | Bima | desain fungsional dan teknis, pecah plan, riset teknis | FD, TDD, plans/ | opus |
| AI Engineer | Naya | fitur berbasis LLM/AI, evaluasi, biaya | AI-SPEC, EVAL-REPORT | opus |
| Backend Developer | Raka | API, service, database, integrasi perangkat | Handback plan | opus |
| Frontend Developer | Gilang | dashboard web, UI, responsif HP | Handback plan, screenshot | opus |
| Data Engineer / Analyst | Wulan | skema data, pipeline, laporan, analisis | Handback plan, laporan | opus |
| DevOps | Yoga | lingkungan, CI, deploy, backup, monitoring | checklist rilis | sonnet |
| QA | Dewi | uji terhadap acceptance criteria, bukti, verdict | TEST-PLAN, QA-REPORT | sonnet |
| Chief of Staff | Arga | briefing pagi, keputusan tertahan, konflik prioritas | hq/briefings/ | sonnet |
| Peneliti | Rian | riset harian, basis pengetahuan bersama | docs/pengetahuan/BASIS.md | sonnet |
| Peneliti | Rian | riset harian, basis pengetahuan bersama | docs/pengetahuan/BASIS.md | sonnet |

Aturan formasi:
- Peran yang tidak dipanggil tidak memakan kuota. Formasi lengkap tidak berarti semua bekerja setiap hari.
- Setiap plan punya satu pemilik. Orkestrator memilih pemilik dari kolom "pemilik" di file plan.
- Alur modul: analyst menulis plan → pemilik plan mengerjakan → qa menguji sampai PASS → devops untuk rilis.
- Model per peran bisa diubah di frontmatter .claude/agents/<peran>.md.
