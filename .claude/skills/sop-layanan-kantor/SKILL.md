---
name: sop-layanan-kantor
description: SOP menyalakan, merestart, dan mengecek dashboard serta bot Telegram Kantor AI. Pakai setelah mengubah office/server.mjs atau office/telegram.mjs, atau saat layanan tidak merespons.
---
# SOP: layanan kantor (dashboard dan bot Telegram)

## Kapan dipakai
Setelah mengubah kode server/bot, atau saat dashboard/bot tidak merespons.

## Langkah
1. Cek status: `launchctl list | grep kantorai`. Kolom pertama PID, kolom kedua kode keluar terakhir (0 = normal).
2. Restart setelah ubah kode: `launchctl kickstart -k gui/$(id -u)/com.kantorai.dashboard` (atau `.telegram`).
3. Verifikasi: `curl -s -o /dev/null -w "%{http_code}" http://localhost:4545/` harus 200.
4. Lihat log kalau gagal: `office/data/dashboard.log` dan `office/data/telegram-bridge.log`.
5. File statis (office/public/*) tidak perlu restart, cukup refresh browser.

## Jangan
- Jangan menjalankan `node office/server.mjs` atau `./office/restart.sh` manual. Itu bentrok port dengan proses launchd.
- Jangan mematikan layanan dengan `kill` lalu menganggapnya mati. launchd akan menghidupkannya lagi. Untuk mematikan total: `launchctl bootout`.

## Asal-usul
2026-09-25: beberapa kali server gagal nyala karena port 4545 dipakai proses lama. 2026-09-26: layanan dipindah ke launchd, auto-restart teruji dengan kill -9.
