#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

LOG_FILE="/tmp/facilityos-vite.log"
PID_FILE="/tmp/facilityos-vite.pid"

is_port_ready() {
  node -e "
    const net=require('net');
    const socket=net.createConnection({host:'127.0.0.1',port:3000});
    socket.on('connect',()=>{socket.end();process.exit(0)});
    socket.on('error',()=>process.exit(1));
    setTimeout(()=>process.exit(1),800);
  " >/dev/null 2>&1
}

if is_port_ready; then
  echo "FacilityOS is already running on port 3000."
  exit 0
fi

if [[ ! -x node_modules/.bin/vite ]]; then
  bash scripts/codespaces-install.sh
fi

nohup npm run dev:strict >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"

for _ in $(seq 1 30); do
  if is_port_ready; then
    echo "FacilityOS is ready on port 3000."
    exit 0
  fi
  sleep 1
done

echo "FacilityOS did not start. Recent log:"
tail -n 50 "$LOG_FILE" || true
exit 1
