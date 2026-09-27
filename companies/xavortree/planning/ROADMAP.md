# Roadmap — Xavortree
Diperbarui: 2026-09-27

**Project aktif 1: Gocean B2B E-Commerce & Order Management System** (docs/gocean-b2b/) — klien PT Gocean Indonesia. Status: PRD v0.2 disetujui CEO (Q25=A, 2026-09-27). Analyst/Architect sudah menulis FD dan TDD, plus 7 plan (015-021): Scope 1 (F1-F3, plan 015-018) siap-plan, Scope 2 (F4-F6, plan 019-021) sampai kontrak internal. Plan 015 (fondasi repo/compose) sudah di-handback Developer (2026-09-27, belum pernah dieksekusi di mesin ber-Node/Docker — lihat catatan di plan), QA belum jalan (antre). Follow-up BA (FU-1): BRD v0.2 belum diperbarui agar konsisten dengan Q20/Q22/Q23 (masih tertulis traceability per-lot dan chat dibangun sendiri); tidak menahan FD karena PRD jadi acuan. Lihat meetings/2026-09-26-kickoff-gocean-b2b.md.

**Project aktif 2: Modern Web E-Commerce Platform (D2C & Retail)** (docs/ecommerce-d2c/) — untuk klien Xavortree (dikonfirmasi CEO 2026-09-27, identitas klien belum disebut). Status: BRD v0.2 Draft, FR-01–FR-22 (Modul 1-7) + NFR + rekomendasi stack + roadmap 8 minggu + acceptance criteria sudah lengkap dari teks CEO. PRD draft ditulis (docs/ecommerce-d2c/PRD.md v0.2: MoSCoW 22 FR, AC Diberikan/ketika/maka, 2 diagram Mermaid draft PM), menunggu keputusan CEO di meeting 2026-09-28 (identitas klien, budget, persona detail, persetujuan MoSCoW). Belum lanjut ke FD. Lihat meetings/2026-09-26-kickoff-ecommerce-d2c.md.

Dua eksplorasi sebelumnya dihentikan CEO:
- Monitoring Gudang Pintar (dihentikan, Q7) — pipeline BRD→PRD→FD→TDD→plan→QA terbukti jalan sampai QA PASS bersyarat.
- SaaS AI IoT Cepat (I01, ditolak, Q9) — BRD eksplorasi ada, tidak lanjut ke Fase 1 validasi.

| Fase | Modul | Plan | Progres | Status |
|---|---|---|---|---|
| PRD | gocean-b2b | - | PRD v0.2 disetujui CEO (Q25=A, 2026-09-27) | Selesai, dasar FD |
| FD/TDD | gocean-b2b | - | FD dan TDD ditulis Architect, turunan PRD v0.2 | Selesai |
| Plan | gocean-b2b | 015 fondasi repo/compose | Developer handback (2026-09-27), belum pernah dieksekusi (tanpa Node/Docker di mesin ini) | Menunggu QA |
| Plan | gocean-b2b | 016 identitas/RBAC | Ditulis Architect | Siap, belum dikerjakan |
| Plan | gocean-b2b | 017 API auth/2FA/RBAC guard | Ditulis Architect | Siap, belum dikerjakan |
| Plan | gocean-b2b | 018 registrasi/KYC | Ditulis Architect | Siap, belum dikerjakan |
| Plan | gocean-b2b | 019 master data/katalog | Ditulis Architect | Kontrak internal, belum dikerjakan |
| Plan | gocean-b2b | 020 RFQ/penawaran/PO | Ditulis Architect | Kontrak internal, belum dikerjakan |
| Plan | gocean-b2b | 021 lifecycle order/traceability | Ditulis Architect | Kontrak internal, belum dikerjakan |
| PRD | ecommerce-d2c | - | BRD v0.2 + PRD draft v0.2 ditulis | PRD draft v0.2 siap, menunggu keputusan CEO di meeting 2026-09-28 |
