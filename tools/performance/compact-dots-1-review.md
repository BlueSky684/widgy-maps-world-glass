# Compact calendar-dot images — candidate 1

2026-10-04, `f50-widget-test`, parent `af2588f1e56bb8687bd3dd5602c12cb3fa517969`.

The user cannot conveniently film the phone with a second device and finds small subjective speed differences difficult to judge. They clarify that Home-to-Calendar is faster than Calendar-to-Home, but the Direct Dots candidate did not substantially change the latter and feels similar to their previous JSON export. This step uses an independently verifiable reduction, not a stopwatch or a claimed native latency measurement.

## Measured waste and bounded change

The original event-dot PNG occupies the full **2270×2368** canvas. Every visible dot, including all four colors on each possible day, fits inside an **1108×1120** rectangle starting at source pixel `(96,846)`.

The new optional `/api/calendar-widget?view=dots&bounds=grid` output rasterizes the original SVG at the original density and extracts that rectangle. There is no resizing, lossy encoding, recoloring or redrawing of dots. The existing full-canvas output remains the default for all existing imported widgets.

| Per dot image | Full | Cropped |
|---|---:|---:|
| Source pixels | 5,375,360 | 1,240,960 |
| Decoded 4-byte RGBA buffer | 21,501,440 bytes | 4,963,840 bytes |
| Empty synthetic PNG | 21,028 bytes | 4,925 bytes |
| Six-week synthetic PNG, four dots in every cell | 59,712 bytes | 41,960 bytes |

Source pixel count and a corresponding raw RGBA buffer shrink by **76.91%**. Actual Widgy memory, whether hidden month images are decoded, and transition latency were **not** measured. Do not multiply this by 25 and claim measured memory savings. Compressed PNG savings depend on event content and are not a uniform 77%.

The separate **Widgy Compact Dots 1** export is built from Consolidated 1. It retains its proven Web URL provider, all 81 variables, all 25 navigable months and all 1613 layers. Only the 25 event-dot URL scripts acquire `bounds=grid`; their native image frames use the matching logical grid coordinates. Minute refresh buckets, token bytes, offsets and other query parameters remain the same. Home, map resolution/city, fonts, original clock, weather, fitness, calendar field sources, navigation and other artwork are unchanged.

The image-frame calculation preserves source-pixel scale and placement in the existing 1135×1184 design coordinate system. Current native Widgy aspect-fit/resampling and on-phone alignment are still a device gate; offline PNG equivalence is not a claim that the native renderer was executed.

## Server behavior

- `bounds` accepts only `full` and `grid`; `today` rejects the grid option.
- Full and cropped PNG promises use separate cache fields while sharing the same existing per-token/month provider read.
- Authorization audience, private device cache duration and shared/CDN `no-store` policy are retained.
- No public endpoint exposing calendar data, new logging, GPS request, hosting migration or new service is introduced.
- Full SVG rasterization still occurs on the server before cropping. This does not claim a faster provider lookup or server render.

## Verification

`node tools/test-calendar-compact-dots.mjs --write`:

- Reinsert cropped raw RGBA into a transparent full canvas: exact byte equality for empty and fully populated 4-, 5- and 6-week layouts, including edge cells and anti-aliasing.
- Restore only the declared frame/URL changes: complete document equality with Consolidated 1, apart from name/description.
- All 25 URL scripts preserve tokens, offsets and minute boundaries; image frames map back to the exact logical crop bounds.
- Fail closed on changed frame/provider/script or duplicate month offset.
- Actual copy-page controller tested with a synthetic export response, download/clipboard, failure cleanup, retry and back-navigation behavior.

`node --test tools/test_calendar_unified.mjs tools/test-home-steps-ring.mjs`: all 22 existing tests pass, including added cropped/full cache isolation, single provider read, HEAD, invalid bounds, privacy and wrong-token-audience checks. The existing Consolidated 1 equivalence test also passes.

All calendar and provider data used in these checks are synthetic/mocked. No private owner export, real location or authenticated calendar was fetched by the agent. Detailed reproducible counts are in `compact-dots-1-audit.json`.

## Simple phone check

Copy `tools/widgy-compact-dots.html?v=compact-dots-1`, import separately and check that the event dots still line up below the same dates. No second phone, filming or stopwatch is required. An obvious speed difference can be reported, but a subtle/unnoticed difference remains unmeasured. Keep Consolidated 1 available; do not promote this candidate before native appearance/function validation.

No verified native tap-start/display-finished timing hook was found in the inspected export or the available developer documentation. Existing scripts can time their own work, which is not the complete Home transition. A fabricated internal timer would therefore mislabel a partial measurement.
