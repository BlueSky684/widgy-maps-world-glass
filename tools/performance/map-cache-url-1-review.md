# Map Cache URL 1

2026-10-05, branch `f50-widget-test`, source parent `c4446c826a10930a55289d4632ec905daa68327f`.

## User priority and baseline

Lean 1 improved Home transitions according to the owner at 10:17 and reaffirmed 10:21, while intermittent stalls remain (10:18). Do not discard that perceived improvement or call it a measured/proven cause. At 10:22–10:23 the owner explicitly requested fixing map/location loading before restoring other Home data, then restoring components gradually after stability. Both source add-back drafts were removed before publication. Lean 1 stays the exact current control.

## Investigation

Current `api/night-map.js` uses server time for live maps. It ignores client t for rendering and cache identity. Full location, size, presentation, atlas and diagnostic flag key a warm-instance private cache. Lifetime is at most 60 seconds from render; conditional ETags and remaining max-age already exist. The current map script nevertheless changes URL at each wall-clock minute. URL churn can change HTTP cache identity even when server cache content remains valid; this is a code finding and HTTP inference, not evidence Widgy actually re-downloads per transition. Exact GPS changes can still change the URL.

Local profile, synthetic 0,0, fixed instant 2026-10-05T07:30Z, r6/glass/full-size:

| Run | Pixels ms | Overlays ms | Composite ms | Encode ms | Total ms | PNG bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| First | 295.7 | 22.6 | 218.7 | 249.9 | 786.9 | 4038323 |
| Warm 1 | 53.9 | 6.1 | 253.9 | 183.2 | 497.2 | 4038323 |
| Warm 2 | 43.9 | 7.3 | 231.3 | 173.2 | 455.7 | 4038323 |

These are execution-environment server-side CPU/pipeline timings, not Vercel or iPhone transition measurements. A local crop of the marker SVG changed 75 channel bytes by at most 1 at synthetic 0,0, and 633 by at most 8 at synthetic -23.12345,110.12345. It showed no consistent warm performance benefit. Rejected; no renderer changes published. Earlier high/adaptive PNG compression experiments already lacked a useful speed/size gain; do not repeat them as new findings.

Public synthetic check against the existing server, no real GPS/geocoder/calendar data:

- First canonical no-t URL request: HTTP 200, validated PNG 3306x1558, 4,038,806 bytes, map MISS, map duration 801.6 ms, private max-age=59/must-revalidate. Rendered at 2026-10-05T07:30:11.747Z.
- Same URL with its ETag in If-None-Match: HTTP 304, zero body bytes, private max-age=50, map duration 0.1 ms. X-Map-Cache/Rendered-At were absent from that returned 304; do not fabricate their values.

This verifies conditional delivery support, not that Widgy sends those headers, reuses decoded data, or avoids native stalls. Connected Vercel runtime logs remain inaccessible after the previously recorded 403; no alternate access bypass was attempted.

## Single change

`withMapCacheURL` starts from `withHomeSyncMapLean` and removes only the Date.now/minute stamp calculation and trailing t suffix in map_request. Name/description identify the test. All 69 variable definitions except that one script body, all 1289 layers, map options/frame, synchronous source mode, GPS precision/invalid handling, endpoint/reuse=60/private cache policy, PNG dimensions/pixels and remaining tabs are unchanged. No data sources are added back. Home still displays coordinates rather than city; restoring map city remains open.

A similar stable URL trial on the old full baseline produced only slight subjective improvement on October 4. This is a controlled combination with the current reduced-variable baseline, not a new discovery or a claimed resolution. Do not repeat it again without new evidence if inconclusive.

## Validation and gate

`node tools/test-map-cache-url.mjs` passes 55 synthetic coordinate/time cases including minute/hour boundaries, precise movement, limits, locale formats, empty/invalid/unresolved values and repeated evaluation. Output equals the exact control URL minus t; GPS changes still invalidate URL identity; no custom fetch/callback. Deep equality verifies the one-script-plus-metadata delta and immutable input. Actual copy/download/expired-session/retry/page-restoration flows pass with synthetic calendar endpoints.

Phone procedure: import separately, same slot/network as Lean. Confirm map and marker, compare several immediate Calendar-to-Home returns and a return after about two minutes. Report stalls/missing map separately. Automatic day/night refresh with a stable image URL and current location remain native gates: HTTP TTL does not prove Widgy requests a refresh on schedule. A visible map after two minutes alone is not proof its solar pixels refreshed. No production promotion or return of Home components until the requested stability gates are satisfied.

Page: `/tools/widgy-map-cache-url.html?v=map-cache-url-1`.

## References checked

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
- https://sharp.pixelplumbing.com/api-output/

These document general mechanisms; they do not establish Widgy behavior.
