#!/bin/bash
# Matikan server dashboard lama (kalau ada) lalu nyalakan yang baru. Pakai ini daripada mengingat Ctrl+C.
PORT="${OFFICE_PORT:-4545}"
cd "$(dirname "$0")/.."
for p in $(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null); do
  echo "Mematikan server lama (PID $p)"; kill "$p"; sleep 1
done
exec node office/server.mjs
