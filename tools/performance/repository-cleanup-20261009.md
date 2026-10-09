# Repository and preview cleanup — 2026-10-09

Owner authorized removal after the read-only inventory. Scope is `f50-widget-test` only.

- Recovery point: `ce97f6bb0c179e9e02ef13f9f015fad71c87aa86`.
- Removed 324 tracked files, 28,135,138 source bytes. See the adjacent manifest for paths and SHA-256 values.
- Includes superseded v-number exports/pages/generators, C1–C15/draft exports and obsolete dedicated tests, 23 encrypted trial payloads with dedicated copy controllers/pages, and 17 retired workflows. The approved dual-master v144 workflow remains.
- Preserve C16 (live exporter dependency), v113 (native-field regression evidence), v142 (day/night regression fixture), API/runtime code, fonts, licenses and approved assets.
- Current and four rollback/control encrypted payloads are byte-identical to the recovery point. No new widget import is needed.
- Replace root-directory static publication with an explicit 34-file public bundle. Browser imports, local links, JSON fetches and installed widget asset paths are checked before release. API source and function includeFiles are unchanged.
- Stop three diagnostic PNG generators in normal builds. Their nine outputs totaled about 24.8 MB. Reproduce locally with `npm run build:diagnostics`; diagnostic builders/tests/findings remain in source for unresolved map investigations.
- Retired test URLs intentionally cease to be public entry points. Supported current/backup URLs retain their paths and fragment-key protocol.
- No production change, history rewrite, credential/environment change, cache reset, provider change or branch deletion.

## Recover a removed file

Use `git restore --source=ce97f6bb0c179e9e02ef13f9f015fad71c87aa86 -- <exact-path>` in a reviewed working tree on `f50-widget-test`. Restore dependent files together; do not republish an old experiment inadvertently.

## Historical Vercel deployment candidates

Four duplicate previews were identified at the same source commits as newer previews. Each returned an empty assigned-alias list during the inventory:

- `dpl_G6E8DFTng7oQCpYGfZwGq1dswSZH`
- `dpl_4hYjftRe2eegiskr4TAUD817wwby`
- `dpl_9mCEt3z4ptZH2rJ7sfZbdXBTTqXi`
- `dpl_3oNN3dW9J31f4mGyshfAubiWTctS`

This is a candidate list, not a deletion receipt. The installed connector has no deployment-delete operation. Do not delete a project or alter protection/retention settings to approximate deployment deletion.
