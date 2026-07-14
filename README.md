# FacilityOS v2.2 — Codespaces Auto Start

This cumulative release builds on v2.1 and removes the repeated manual startup work.

## Automatic startup

- Codespaces installs dependencies automatically.
- FacilityOS starts automatically on port 3000.
- Port 3000 is forwarded using HTTP.
- Codespaces is configured to open the app in the browser.
- The startup script checks whether the app is already running.
- No broad `pkill -f` commands are used.
- No environment-generated lockfile is included.

## One-time update procedure

Upload this complete version to the repository root, preserving `.env`.

Then use the Codespaces Command Palette once:

```text
Codespaces: Rebuild Container
```

The rebuilt Codespace will install and launch FacilityOS automatically. Future Codespace starts also launch the app automatically.

## Fallback

Use the VS Code task **FacilityOS: Restart**, or run:

```bash
bash scripts/restart-facilityos.sh
```

No SQL migration is required for v2.2. Keep migration 011 installed.
