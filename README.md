# Widgy World Glass

Working branch: `f50-widget-test`. Production (`main`) requires separate owner approval.

Current widget: **Widgy Lean Clock and Data 1**. Keep the approved live 3306×1558 lossless map, exact GPS, dynamic city, native clock/gauges, design and complete 25-month Calendar.

## Build and supported pages

`npm run build` prepares the required map render cache and copies supported browser files to `public/`. Vercel bundles the unchanged root `api/` functions separately. Static publication is listed in `tools/public-site-files.json`; browser import/asset changes must update that list and pass `npm run test:cleanup`.

Supported copy pages:

- `tools/widgy-lean-clock-data-copy.html` — current
- `tools/widgy-calendar-city-country-copy.html` — immediate backup
- `tools/widgy-home-direct-data-copy.html` — earlier performance control
- `tools/widgy-home-calendar-runtime-navfix-copy.html` — verified month-navigation control
- `tools/widgy-stable-copy.html` — stable map/native day gauge control

Private copy links require the original fragment key supplied in the owner's conversation. Never commit keys or decrypted/personalized JSON. The current and immediate-backup pages retain the verified multiline format.

Calendar connection, privacy, terms and the C16-based generic exporter remain available. C16 is an active template dependency, not an obsolete export.

## Diagnostics and history

`npm run build:diagnostics` generates comparison PNGs locally when explicitly needed. They are excluded from normal publication. Retired trial pages and diagnostic sources are not public entry points.

The 2026-10-09 cleanup removed superseded exports, their dedicated generators/copy pages and retired workflows. Removed paths/hashes and the recovery commit are recorded in `tools/performance/repository-cleanup-20261009-manifest.json`. Git history is preserved; no history rewrite or branch deletion is part of cleanup.

Keep current server tests, map-response diagnostics and performance findings: intermittent native map disappearance remains unresolved. Infrastructure size/build savings do not establish faster native Home/Calendar transitions.
