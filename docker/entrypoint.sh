#!/usr/bin/env bash
set -euo pipefail

cd /opt/cookify/backend

java -jar quarkus-run.jar &
backend_pid=$!

shutdown() {
  if kill -0 "$backend_pid" >/dev/null 2>&1; then
    kill "$backend_pid"
    wait "$backend_pid" || true
  fi
}

trap shutdown EXIT INT TERM

exec nginx -g "daemon off;"
