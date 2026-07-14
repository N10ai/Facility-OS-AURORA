#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Preparing FacilityOS..."
rm -rf node_modules
rm -f package-lock.json
npm config set registry https://registry.npmjs.org/
npm install --no-audit --no-fund --progress=false
echo "FacilityOS dependencies installed."
