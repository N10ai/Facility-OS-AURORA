#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Preparing FacilityOS..."
npm config set registry https://registry.npmjs.org/
npm install --no-audit --no-fund --progress=false --prefer-offline
echo "FacilityOS dependencies installed."
