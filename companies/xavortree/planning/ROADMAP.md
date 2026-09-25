# Roadmap — Xavortree
Diperbarui: 2026-09-25 (mengikuti TIMELINE.md v0.1, status usulan; target demo internal 2026-11-06). Plan MS0 010–014 ditulis Analyst dari FD/TDD v0.1; M09 dan M10 dikonfirmasi di FD §6.

| Fase | Modul | Plan | Progres | Status |
|---|---|---|---|---|
| 0 | M01 Fondasi data dan tooling (TimescaleDB, tenant/device/zone, RLS, Docker Compose) | 010 (devops), 011 (backend), 012 (backend) | 10% | 010 dikerjakan devops (lanjutan 2026-09-25); 011, 012 menunggu 010 |
| 0 | M09 Simulator data sensor + dataset sintetis berlabel | 013 (data), 014 (data) | 5% | 013 dikerjakan data (2026-09-25); 014 menunggu 013 |
| 0 | M07a Anomali AI: AI-SPEC + kalibrasi offline pada dataset sintetis (jalur paralel) | AI-SPEC v0.1 ada (dok); plan kalibrasi di MS1 | 0% | Belum |
| 1 | M03 Ingestion MQTT ke TimescaleDB + status online/offline | - | 0% | Belum |
| 1 | M02 Firmware node sensor fisik (ESP32 + SHT31) | - | 0% | Belum |
| 2 | M04 Alert ambang + Telegram + acknowledge | - | 0% | Belum |
| 2 | M07b Anomali AI: service mode observasi → alert Telegram + EVAL-REPORT | - | 0% | Belum |
| 3 | M05a Dashboard realtime (auth tenant, daftar node, grafik, panel alert) | - | 0% | Belum |
| 3 | M06 Onboarding admin multi-tenant | - | 0% | Belum |
| 4 | M10 Skenario demo terskrip + runbook DEMO.md | - (FD: diterima sebagai integrasi, pemilik devops, plan di MS4) | 0% | Belum |
| 4 | M05b Dashboard historis + konfigurasi ambang per zona (Should) | - | 0% | Belum |
| 5 | Demo internal: /rilis go/no-go, target 2026-11-06 | - | 0% | Belum |
| 6 | M08 Laporan bulanan CSV/PDF (pasca demo) | - | 0% | Belum |
