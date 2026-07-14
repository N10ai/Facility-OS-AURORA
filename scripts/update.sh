#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
npm install --no-audit --no-fund --progress=false
bash scripts/restart-facilityos.sh
