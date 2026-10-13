# Weather 15 — independent live map and location overlay

Scope: `BlueSky684/widgy-maps-world-glass`, `f50-widget-test`, Vercel Preview only.
The owner requested original **3306 × 1558** output for the first trial on
2026-10-13. There is one Weather 15 widget on the phone.

## Change

- `night-map?layer=base`: existing terrain/lights/day-night compositor, with
  location fixed to null. No GPS/IP lookup, city authorization, or geocoding is
  consulted, including if a caller accidentally supplies location parameters.
- `night-map?layer=location`: transparent full-canvas PNG using the existing
  marker, text, projection and clip. The owner's request retains shared-location
  authorization and exact coordinate validation. A city-provider failure yields
  the existing coordinate-only fallback, in this image alone.
- Missing `layer` preserves the previous composite path and cache keys.
  Transparent location cache entries cannot serve a composite request.
- The complete owner export gains one Image layer immediately above map 6170
  inside HOME 245, with identical frame and provider flags, and one URL variable.
  The map URL no longer references GPS or a location key. Both requests retain
  the existing minute token; this does not promise a one-minute iOS schedule.
- No edits to textures, mask/lights math, native clock, navigation, Health,
  Calendar or Weather. Version/name remains Widgy Weather 15.

## Verification

Run `node tools/verify-weather15-location-split.mjs <private-original-export>
<private-output-directory>` after building with
`tools/build-weather15-location-split.mjs`.

2026-10-13 local run, synthetic city/coordinates at 13:10:54 UTC:

| Check | Result |
| --- | --- |
| Base PNG | 3306 × 1558; 4,035,447 bytes |
| Location PNG | 3306 × 1558; 45,394 bytes |
| Location nontransparent area | 44,099 pixels; bounds [1868,465,2370,681] |
| Same sRGB ICC | SHA256 c56e1685d888f5edb92fe07f2750f387f8fe8e91b32ff8fb0b56bfbbb9458353 |
| Recombined vs existing composite | 368 pixels differ by at most 1/255 per channel; all inside location graphics |
| Map outside location | Pixel-identical |
| Complete export preservation | All unrelated fields deeply identical; 1205 layers, 75 variables |
| Route integration | 12 checks: base independence, legacy output, alpha output, auth/coordinates, city failure, invalid layer, cache separation/hit/304 |
| Missing location / projection boundaries | Transparent output / matching full frame |
| City deadline | Coordinate fallback after timeout |
| Copy page | Real AES-GCM/gzip/integrity, multiline formatting and copy-event payload; missing/wrong keys rejected |

The recombination check uses sharp, not CoreGraphics or Widgy. It verifies
geometry and pixel construction, not native installation or retention.

## Limits and owner handoff

This is a new separation trial, not a proven fix or a memory optimization.
Two full-size RGBA surfaces total **41,205,984 bytes (~39.30 MiB)** before native
overhead, versus 20,602,992 bytes for one original map. Transparency makes the
download small, not the decoded surface. Widgy may still fail or invalidate
images together. Two downloads are not an atomic native update.

The prior 1653-wide map disappeared before the owner changed to 2600. Server
HTTP 200 and finish events do not prove client receipt or display. Do not
attribute that disappearance conclusively to city lookup, image size or memory.

Only the encrypted envelope is public. The private key lives in a URL fragment;
the complete JSON and key must remain outside the repository and public output.
The owner imports the full JSON via the copy page and replaces the existing
slot, retaining the earlier imported widget inside Widgy as a backup.
First phone check: map, marker/city and live native clock appear together; then
ordinary use. No old A/B/C trial, forced refresh loop or terrain/lights split.
