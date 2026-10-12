# Weather 15 — city lookup resilience — 2026-10-12

## Scope and evidence

Owner asked to continue after identifying the city-loading dependency. Work is
restricted to `f50-widget-test` Preview. Daily name remains `Widgy Weather 15`.
This fixes a reproduced server failure path; it does not claim every native
black-map incident has the same cause or that long-term iPhone stability passed.

Base commit: `d26fa3917f71c603a4750486ad94533d7b68fb45`.
The reviewed map, shared-location module, widget generator, copy page/JS and
encrypted daily export matched that commit before editing. Unrelated dirty
files and the local stale Vercel configuration are excluded from publication.

## Changes

- Authenticate the existing map access token and validate coordinates before
  optional city resolution. Wrong/missing credentials and invalid/duplicate
  coordinates still fail; no auth bypass or new public capability.
- City enrichment has a 1,500 ms deadline. Provider, budget or cache failure,
  absent provider configuration, invalid city results and deadline expiry
  render the map at its requested valid coordinates with no invented city.
  Existing renderer displays marker + coordinates when the name is unavailable.
- Keep lookup completion registered through Vercel `waitUntil` so it can fill
  the existing exact-coordinate cache after the map stops waiting. Failures are
  consumed. The provider's existing quota reservation and timeout stay intact.
- An incoming `city` parameter cannot override the authenticated shared lookup
  or survive a failed lookup. No old city is transferred to different coordinates.
- Privacy-safe location outcome logging and `X-Location-Cache` distinguish
  TIMEOUT/UNAVAILABLE from cached/successful lookup. No coordinates, names,
  access tokens or URLs are logged by the new code.
- The native city script has a 4,000 ms deadline and completes once. Late
  responses are ignored; AbortController is optional. If native timers are not
  available it immediately returns the existing `Location unavailable` label.
  Runtime scheduling and timer availability still require actual Widgy use.

## Verification

`node --experimental-vm-modules tools/test-map-city-resilience-15.mjs` passed.
The actual route and approved full-resolution renderer ran with injected
synthetic lookup failures, without external network calls or provider quota.

| Case | Result |
| --- | --- |
| Lookup failure, empty cache | HTTP 200, completely decoded PNG 3306×1558 |
| Lookup never settles | HTTP 200, completely decoded PNG 3306×1558 |
| City belongs to other coordinates | Coordinate-only PNG; wrong city rejected |
| Caller-supplied city + failed lookup | Caller city discarded, valid PNG |
| Provider unconfigured, map access valid | Valid PNG without a city name |
| City lookup succeeds | PNG byte-identical to pre-fix route |
| Bad/missing access, bad/duplicate coordinates, no access config | Existing 403/400/503 rejection; no city lookup |
| JS success, reject, synchronous throw, mismatched coordinates | Exactly one completion; timer cleared |
| JS stalled fetch/body, late success | Deadline fallback; no second completion |
| JS no timer/abort API, unresolved GPS placeholders | Safe completion; no unbounded fetch when timers absent |

Coordinate-only fixture: 4,046,091 bytes,
SHA-256 `d89582bec961ceef33bbf7621f2c8faa15dea43aa28777497b32eb85ee4f235e`.
Healthy-city fixture: 4,044,291 bytes,
SHA-256 `af8ea525377e4abd7966cbfeb4e0423fc02e60f1c8b7796783d41c5fa30a4718`.
Synthetic coordinates 1,2; instant 2026-10-12T12:00:00Z. No private GPS used.

Existing `tools/test-shared-location.mjs` passed: shared cache, exact-coordinate
isolation, stale fallback, quota-independent injected provider failure and
unchanged default auth requirements. Syntax checks passed.

## Full widget delivery

`tools/build-city-resilience-15.mjs` verified and preserved the prior private
daily export, checked it against the existing encrypted public envelope, and
changed only `calendar_location_pair` JavaScript and the document description.
All 1,204 layers, all other variables, data bindings, image URLs, map geometry,
approved art and 500-Cal activity goal remain unchanged. Name stays version 15.
AES-GCM round trip passed; public artifact contains encrypted JSON only. The
existing Chrome copy page and key remain the delivery method.

Updated export: 922,407 bytes,
SHA-256 `a37852981a3c3a9b66a26449688792531ed47c2cc82394342ed8d81161f77f8a`.

Native test state remains healthy image B; no deliberate fault or image-mode
change during this repair. The owner needs only one full widget in the existing
screen slot. No further synthetic refresh/import sequence is requested.

## Remaining limit

The server can now return a valid map when city enrichment fails. This does not
guarantee iPhone transport, decoding, snapshot retention, or OS update cadence.
The old full Stability candidate failed even without a direct map/geocoder
dependency, while its independent native city script remained active. A normal
use observation of this actual repair is still needed; do not claim a proven
root cause for every earlier incident or a completed multi-day stability run.

## Published Preview verification

Commit `2b722f167072f1e0245aa9c65461d80b2ae26636` deployed READY as
`dpl_3sTRnSxHJ2mZoVtMzpGCudyaJPWp` on `f50-widget-test` Preview. The existing
branch alias now serves the updated daily copy page.

One agent-originated authenticated live probe at synthetic coordinates 0,0
(no user GPS) returned X-Location-Cache UNAVAILABLE while delivering HTTP 200
image/png. Full pixel decode passed at 3306×1558, with 4,042,961 bytes.
Probe timestamp: 2026-10-12T13:05:35.278Z; elapsed 8,165 ms including transport
and full response. This is not a claim about city-only duration or iPhone timing.
No global failure mode or native test image state was changed.

The updated copy page loaded and decrypted successfully in Chrome. Clicking
Copy Full JSON showed “כל תוכן הקובץ הועתק. אפשר להדביק ישירות ב־Widgy.” and
“Copied ✓”. Native clipboard bytes were not read and are not asserted here.
Only actual iPhone normal-use stability remains unverified.

## Native initial-load failure — 2026-10-12 16:30 Asia/Jerusalem

Owner reports the map black on first loading of the new city-resilience daily
export. IMG_0307 shows the Widgy overview preview with the new description,
not a confirmed Home Screen capture. Other Home layers remain visible. Native
UI counts 947 layers + 257 groups, consistent with 1204 recursive nodes. No
persistently blank duration after this first capture is established yet.

Read-only runtime correlation (no investigator image fetch during this window):
request 6j49q-1791811811612-5ab7ef793496 on the published 2b722f Preview:
- 16:30:12.400 started.
- 16:30:12.518 city SHARED, cityAvailable true, elapsed 121 ms.
- 16:30:13.946 prepared HTTP200/MISS, PNG/body 4,041,709 bytes,
  conditional false, precomputed HIT, elapsed 1549.7 ms.
- 16:30:13.955 Node response finished HTTP200, all three completion flags true,
  elapsed 1557.9 ms.
- Two Fontconfig default-config warnings preceded completion; no thrown render
  failure is recorded. These warnings alone do not explain a missing whole map.

This incident did not take the city-error/timeout fallback. Reject city-lookup
failure as the explanation for this specific correlated request. The server
resilience bug was real and its repair remains useful, but native initial
appearance failed; there is no basis for a multi-day acceptance soak yet.
Node finish is not receipt at the phone, decode, successful native image cache
replacement, or displayed snapshot. Do not claim a proven memory/cache bug.

The delivered private JSON was inspected without exposing credentials: exactly
one map Image6170 under Home245, Web URL sourced from map_request. map_request
uses the expected shared-location route with existing GPS/minute bindings. The
repair did not change source type, geometry, effects, layer order or URL. No
new malformed URL or overlay change was found in this export.

No extra variant, deployment, global cache clear, synthetic failure, remote
image probe, resolution change or repeated refresh was performed this turn.
Next missing evidence is native editor state (image-memory indicator and any
load warning) while the map is absent. A screenshot after Edit Widget is a
read-only observation of that missing surface, not a claim it will diagnose
memory by itself. The current exact installed app version remains unknown.
Official publisher version history documents editor image-memory accounting
and prior image-resizing/async fixes, but does not establish which applies:
https://apps.apple.com/us/app/widgy-widgets-home-lock-watch/id1524540481

## Native editor observations — 2026-10-12 16:44–16:45 Asia/Jerusalem

IMG_0308–0311 show the same city-resilience Weather15 with map visible in the
editor. Header: Layers1204, Images104.6MB. Warnings: Images memory usage48MB,
data fetch time0.65, rendering time0.11, missing Health permissions, macOS
availability notes, and Hero Time timer/automation warning saying15 instances
are created during reload and increase memory/reload work. No supplied view
shows a map-specific loading failure or process-memory crash.

Treat104.6 and48 as two app-reported counters of unspecified scope; do not add
or multiply them.15 instances does not prove15 separate RGBA copies of each
image,15 downloads, or a particular OS limit. Current editor timing is a
successful-state observation, not a measurement of the16:30 black preview.
MacOS source-availability warnings are not iPhone source failures. Health
permissions are a separate Health-data issue, not proof of map causality.

No investigator image requests were issued. Correlated native map responses:
16:44:04 HTTP200,4043722bytes, city LOOKUP274.2ms, finish1749.6ms;
16:45:35 HTTP200,4044080bytes, city MEMORY0.9ms, finish724.6ms.
The visible recovery plus those responses is consistent with a subsequent
successful load; it does not establish spontaneous recovery or exact trigger.

Audited assets and source inventory are in
weather15-native-memory-audit-20261012.json.31 Image nodes include25 distinct
Calendar month-dot sources; these are intentional months, not duplicate nodes
to delete. Residency of hidden tabs/months is unknown. Current Hero Time already
uses Live Timer (24 hours, No Seconds); do not suggest merely removing seconds.
An earlier HH:mm substitution had no perceived speed improvement and minute
freshness remained a device concern. Do not silently downgrade the live clock.

Image-size opportunities outside the locked3306x1558 map: Health chrome is
2270x2368 (~20.505MiB RGBA), while approved Home/Calendar chrome is1320x1377
(~6.934MiB each). A Health chrome candidate at the same1320x1377 raster size
would reduce that one theoretical input allocation by~13.57MiB, not prove an
actual native memory saving or unchanged quality. It would preserve logical
layout and require a rendered appearance comparison and native validation.
Weather data panel is2270x1608 (~13.924MiB RGBA). Do not change both variables
plus clock together or claim these estimates explain either app counter.

Next engineering candidate should target a measured image workload outside
the full-resolution map, with actual editor counters/visibility as its gate.
No asset, widget, source, backend, permission, deployment or test state was
modified in this observation turn; no new purported fixed import is released.
