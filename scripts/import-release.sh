#!/usr/bin/env bash
set -euo pipefail

RELEASE_ZIP="${1:-FacilityOS_v3_3_Operations_Verification.zip}"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cd "$ROOT"
[[ -f "$RELEASE_ZIP" ]] || { echo "Cannot find $RELEASE_ZIP in $ROOT"; exit 1; }

ENV_BACKUP=""
if [[ -f .env ]]; then
  ENV_BACKUP="$TMP/.env"
  cp .env "$ENV_BACKUP"
fi

unzip -q "$RELEASE_ZIP" -d "$TMP/release"
SOURCE="$TMP/release/FacilityOS_v3_3_Operations_Verification"
[[ -d "$SOURCE" ]] || { echo "Release folder not found inside ZIP."; exit 1; }

find . -mindepth 1 -maxdepth 1 \
  ! -name .git \
  ! -name .env \
  ! -name "$RELEASE_ZIP" \
  -exec rm -rf {} +

cp -a "$SOURCE"/. .
[[ -n "$ENV_BACKUP" ]] && cp "$ENV_BACKUP" .env
rm -f "$RELEASE_ZIP"

npm install --no-audit --no-fund --progress=false
npm run build

echo "Aurora v3.3 imported and build-verified."
echo "Next: run migration 013 in Supabase, then git add/commit/push."
