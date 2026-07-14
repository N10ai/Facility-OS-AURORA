#!/usr/bin/env bash
set -euo pipefail

PID_FILE="/tmp/facilityos-vite.pid"
if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE" || true)"
  if [[ -n "${PID:-}" ]] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" || true
    sleep 1
  fi
  rm -f "$PID_FILE"
fi

bash "$(dirname "$0")/codespaces-start.sh"
