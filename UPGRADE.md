# Upgrade to Aurora v3.4.1

No Supabase migration is required.

After replacing the project files:

```bash
npm install --no-audit --no-fund --progress=false
npm run build
bash scripts/restart-facilityos.sh
```

Expected version:

```bash
node -p "require('./package.json').version"
# 3.4.1
```
