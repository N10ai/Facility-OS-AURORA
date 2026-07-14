# Upgrade to Aurora v3.6

Run the updated migration in Supabase SQL Editor:

`database/migrations/014_finance_engine.sql`

It is additive and safe to run again. This ensures existing finance tables contain all required columns.

Then:

```bash
npm install --no-audit --no-fund --progress=false
npm run build
bash scripts/restart-facilityos.sh
```

Expected version: `3.6.0`
