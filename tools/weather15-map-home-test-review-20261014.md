# Weather 15 — Home map removal comparison

Requested October 14, 2026, after the owner confirmed that the latest image
loss/recovery measurements were on Widgy 27.0.1 (public), not the earlier beta.
JSON export was blocked across multiple widgets, including after relaunch and
restart attempts. The owner approved use of the previous private JSON, with
manual re-addition of the native Memory Used text layer.

## Scope

Branch `f50-widget-test`, Preview only. No renderer, API, image pixel, resolution,
format, caching, location, city, refresh, or server configuration changes.
The current phone state is not claimed to be captured by this older export.

Input: the private WebP handoff already available locally. Removing only its
codec suffix and restoring its name reconstructs the original Home Start PNG
export exactly, verified against its previously recorded SHA-256:
`cf0a272cf7b1477bbf322f0ae4c49a3bdbe6ec05c351458d317c63841725f137`.

Output: `Widgy Weather 15 - Map Home Test`.

- Completely delete 32 direct Home children, totaling 106 layers/groups.
  This includes the clock, greetings, agenda, weather conditions, fitness,
  both progress indicators, glass/frame image, and full graphite background.
- Keep Home's original composite PNG map layer 6170 and its original URL
  variable, native GPS variables, refresh dependency and all map fields.
  Its server-generated day/night mask and city remain part of the same image.
- Keep all four navigation tap actions and visible navigation symbols/labels.
- Preserve the six shared date layers exclusively for Calendar. Their original
  group frame and child fields are retained in a new subgroup of Calendar,
  whose parent frame is the same full 1600x1600 canvas. Original Calendar
  children remain identical. Weather and Health subtrees remain identical.
- Delete the now-unreferenced `wx_status` variable (UUID and name references
  both audited). Keep dependencies used elsewhere, including step count.
- Preserve three unrelated variables that were already unreachable before the
  change; their cleanup would introduce another difference into the trial.
- Keep all shared fonts/colors and metadata. They remain used by other tabs.
- Do not invent the native Debug serialization. The owner adds Memory Used
  manually after import, as agreed.

106 nodes deleted and one Calendar-only wrapper added: 1204 → 1099 total tree
nodes, including groups. Variables: 74 → 73. These tree counts are not a claim
about native Widgy's displayed active-layer count or resident memory.

## Verification

`build-weather15-map-home-test.mjs` verifies baseline identity, full deletion,
unique IDs, preserved map/GPS/time fields, unchanged navigation, surviving
button targets, variable references, other tabs, metadata and encryption.
`verify-weather15-map-home-copy.mjs` executes the actual copy controller and
checks decrypt/integrity, multiline and compact clipboard payloads, invalid
keys and corrupt envelopes. The public-site build succeeds with the three
new copy-page dependencies allowlisted. Private plaintext and keys remain
outside the repository; the published payload is AES-256-GCM encrypted.

The existing broad cleanup verifier fails on an unrelated dynamic filename
in `tools/map-host-ab-15.js`: `map-host-ab-15-${name}.enc.json`. That file and
the verifier are unchanged. The new page's concrete dependencies are present
and its focused controller verification passes.

Native iPhone import, visual positions after regrouping, and sustained map
stability remain to be verified on-device. One successful load is not proof.
Compare repeated Calendar/Home transitions and returns after idle periods.
A stable reduced Home would implicate removed content or cumulative load,
not identify a single offending component; reintroduce groups to isolate it.
If disappearance remains, removal of Home content has not eliminated it.
