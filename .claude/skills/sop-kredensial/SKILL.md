---
name: sop-kredensial
description: SOP menangani token, password, dan API key. Pakai setiap kali pekerjaan butuh kredensial (git push, API pihak ketiga, bot).
---
# SOP: kredensial

## Kapan dipakai
Setiap kali butuh token, password, atau API key.

## Langkah
1. Token command-line (GitHub dll): CEO memasukkannya sendiri lewat prompt terminal. Keychain menyimpannya (`credential.helper osxkeychain` sudah aktif).
2. Kredensial sistem Kantor AI: di `office/.env` (mode 600, di .gitignore).
3. Kredensial project klien: di `.env` dalam folder kode project itu, dengan `.env.example` tanpa nilai asli.
4. Sebelum commit: `git ls-files | grep -iE "\.env$|token|secret|\.key$"` harus kosong.

## Jangan
- Jangan meminta CEO menempel token di chat. Kalau CEO terlanjur menempel, sarankan revoke setelah dipakai.
- Jangan menaruh token di dalam perintah (misal URL git push berisi token) atau di file yang ikut commit.
- Jangan mencetak isi `.env` ke log atau ke laporan.

## Asal-usul
2026-09-26: token GitHub dua kali ditempel CEO di chat; push berhasil setelah CEO memasukkan token sendiri lewat prompt terminal.
