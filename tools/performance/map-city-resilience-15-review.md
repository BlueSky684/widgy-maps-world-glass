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
