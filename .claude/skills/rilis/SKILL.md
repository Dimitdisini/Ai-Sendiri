---
name: rilis
description: Go/No-Go sebelum rilis satu versi atau milestone. Argumen: <perusahaan>: <versi>.
---
# Rilis (go/no-go)

Peserta wajib: devops, qa. Tambahan: backend dan frontend untuk verifikasi, ai-engineer bila ada fitur AI, data bila ada migrasi.
Output: meetings/YYYY-MM-DD-rilis-<versi>.md berisi checklist dan verdict.

Checklist minimum:
- Semua plan dalam milestone: QA PASS, tautkan file qa.
- Test dan lint hijau di branch rilis.
- Migrasi data: ada langkah maju dan langkah mundur.
- Fitur AI: EVAL-REPORT ada dan lolos ambang di AI-SPEC.
- Catatan rilis (changelog) ditulis pm.
- Rencana rollback dan siapa memantau 24 jam pertama.

Verdict GO hanya bila semua tercentang. NO-GO wajib menyebut item yang kurang dan siapa yang mengerjakan.
Ke CEO: verdict dan checklist. Rilis produksi tetap menunggu "ya" dari CEO.
