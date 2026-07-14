# Upgrade to Aurora v3.4

No new Supabase migration is required for this release if v3.3 migrations are already installed.

After replacing project files:

```bash
npm install --no-audit --no-fund --progress=false
npm run build
bash scripts/restart-facilityos.sh
```

Verify:

```bash
node -p "require('./package.json').version"
```

Expected: `3.4.0`
