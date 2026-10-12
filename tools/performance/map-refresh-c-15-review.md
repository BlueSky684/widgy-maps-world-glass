# Weather 15 — changing-URL control C, 2026-10-12

## Evidence and decision

See map-blank-20261012.md for the incident and recovery. Fixed full-widget A
and B remained visible while the dynamic map was absent. A uses the same
Vercel preview host as the dynamic map. Both fixed controls may be displaying
cached images; their visibility does not establish new successful transfers.
The dynamic map recovered following Calendar -> Home near a new successful
10:21 map response. A failed 09:58 display also coincided with a successful
server response. No recorded render error or 304 accounts for those incidents.

The original host comparison changes URL variability, image generation,
location lookup, delivery/cache behavior and pixels relative to the daily map.
It cannot establish that changing hosts fixes the issue. The next bounded
comparison keeps A's exact completed PNG and adds the current native location
and minute placeholders to that static image URL.

This differs from the historical stable-URL speed trials: it tests a changing
URL against the now-observed stable full-widget A, without asking a dynamic
image at an unchanged URL to prove both cache reuse and freshness at once.
It is not a permanent fix and does not implement a last-good-image store.

## Exact exported difference from A

Only the title (C), description and map_request Custom Text URL change.
The URL is A's identical preview static asset path plus lat, lon and t, using
the exact three variable placeholders from daily Weather 15. No service key
is included in the static-image request. These native variable definitions
already exist in A and are verified identical to daily Weather 15. Their use
by the image can change native dependency evaluation as well as URL identity;
this trial cannot distinguish those two mechanisms alone.

All 1204 recursive layers, bindings, geometry, image provider/cache flags,
navigation, other data and A's cosmetics are preserved by whole-document
restoration/equality. A predates the daily footer/Health background cleanup;
C intentionally keeps A's appearance for this comparison. Daily 15 and A/B
exports/pages are unchanged. No map backend, image asset, host, response header,
GPS formatting, render interval, global refresh policy or live renderer changes.

The full lossless 3306x1558 image and fixed public Ashdod example are exactly
the same bytes as A: 4,038,763 bytes, SHA-256
ac1a690089d666cd65c2f5b49784dd0781c2ee1b8cacd5e36bf1fa1fcfdc93fb.
Coordinates affect C's URL, not its fixed map/marker. No claim of one actual
download per minute: sources change only when Widgy evaluates them, and
native/HTTP caches may reuse responses.

Private JSON remains private. C is encrypted with AES-256-GCM and the existing
A/B private key, distinct AAD map-host-ab-15:C:v1. The unchanged generic A/B
copy controller decrypts and validates C from its separate one-card page.

## Validation

- Generator verifies decrypted A equals its published envelope, native
  dependencies match daily 15, and restoring three changed fields yields A.
- C JSON: 921448 bytes, SHA-256
  d48c4b2afe1005c42273d61a6e34875ed05da523e5ecc7ede65fb560f3e77972.
- Actual browser controller with WebCrypto/gzip produces the complete exact
  clipboard content. Missing/wrong key and failed load keep copying disabled;
  blocked clipboard exposes the complete manual fallback.
- Synthetic zero/signed/edge/empty coordinates and successive minute tokens
  preserve the static image path and change only the expected query values.
- Live static GETs with no query, lat=0/lon=0/t=100 and t=101 all returned
  HTTP200 image/png and the exact approved snapshot digest. These are agent
  checks of static delivery, not native scheduling or phone performance.

## Device gate and how to use the result

Place C in B's Home Screen slot; retain B inside Widgy and keep A plus dynamic
15. Do not add a fourth simultaneous widget. Use the phone normally, observe
which maps disappear before interacting, and note the time. No forced timed
idle or repeated import exercises. Fixed Ashdod/daylight is intentional in C.

- If C also becomes blank while A stays visible, changing native dependencies,
  URL identity and repeated image loading can produce the symptom without live
  rendering/geocoding. Focus on native image acquisition/cache/retention; a
  server-only last-good cache would not address that entire path.
- If dynamic 15 fails while C remains stable across comparable natural use,
  investigate live-function delivery, latency, headers and changing pixels,
  including a completed-image storage delivery path. One good display is not
  a pass; even multiple observations narrow rather than prove causation.
- If all stay visible, there is no reproduced discriminator. Do not declare
  a repair or keep extending random intervals and replacing templates.

## What a durable repair must prove

1. A complete new frame is validated before replacing a known-good frame.
2. Failed requests preserve a usable previous frame; stale time/location is
   distinguishable, and old location is not silently claimed as current.
3. Map time and location genuinely advance during normal use, without manual
   Calendar/Home round trips, and approved single-image quality is preserved.

Server persistence can enforce the first condition at the server. It cannot
guarantee native retention if the phone never receives or decodes the new
response. No verified arbitrary background/atomic swap/last-good-image API
exposed by Widgy's template JSON has been identified. App-author WidgetKit
APIs are not assumed available inside Widgy JS. Previous Files/album/mask
tests remain contrary evidence, not fallback solutions to promise again.

Publish only f50-widget-test Preview, on the latest remote tree with a guarded
ref update. Preserve concurrent Device Glass work. Production is out of scope.
