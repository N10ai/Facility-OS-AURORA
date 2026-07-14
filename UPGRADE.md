# Upgrade to Aurora v3.5

Run this migration in Supabase SQL Editor:

`database/migrations/014_finance_engine.sql`

Then:

```bash
npm install --no-audit --no-fund --progress=false
npm run build
bash scripts/restart-facilityos.sh
```

Expected version: `3.5.0`
