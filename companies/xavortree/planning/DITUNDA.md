# Ditunda — Xavortree

| Plan | Item | Kenapa ditunda | Butuh apa untuk lanjut |
|---|---|---|---|
| 010 | Upgrade vitest 2.x → ≥4 (npm audit: 5 kerentanan moderate–critical di rantai dev vitest/vite/esbuild; dependensi produksi 0 kerentanan) | Major upgrade di luar scope fondasi; hanya memengaruhi tooling dev lokal | Plan kecil devops/backend: bump vitest, jalankan `make ci` |
| 010 | Role DB khusus `app_alerter` (sekarang alerter memakai `app_api`) | TDD §3 hanya mendefinisikan 5 role; menambah role = perubahan kontrak skema | Keputusan Analyst/Backend di plan 011/012 |
| 010 | Verifikasi runtime AC1–AC5 (compose up, TLS/dynsec, psql, demo-reset) | Mesin dev tanpa Docker; instruksi sesi: jangan instal Docker | Mesin dengan Docker ≥24 + Compose v2; QA jalankan langkah di Handback plan 010 |
