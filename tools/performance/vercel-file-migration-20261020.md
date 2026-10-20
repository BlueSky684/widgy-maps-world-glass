# Vercel saved-map migration — 2026-10-20

Scope: `f50-widget-test`, Vercel Preview only. Production, Google resources,
quota handoff, installed Scripting and Widgy have not been changed. The real
city verification uses the current provider/quota accounting normally.

## Implementation

- Opt-in `delivery=vercel-file-v1` authenticates all map variants using a
  branch-specific `WIDGY_MAP_FILE_ACCESS_TOKEN` before rendering or city calls.
  Missing configuration returns503; missing/wrong/duplicate keys return403;
  invalid coordinates and unsupported delivery modes return400.
- The existing permanent branch alias already has an `alias-protection-override`
  created before this work. An unauthenticated invalid-width probe returned
  JSON400 without a login redirect. No protection setting was changed here.
- City defaults to the fixed owned Cloud Run endpoint, using the existing map
  key. Redirects are refused; JSON is capped at8192bytes; total bridge work is
  bounded at5seconds. The existing1500ms city decision and `waitUntil` prevent
  slow city work from gating the whole map. Existing coordinate-only fallback
  still applies on city failure; this is not a guarantee of a city label on
  every request.
- The sole geocoder/quota authority remains the existing Google-hosted service.
  This bridge makes no independent provider calls or counter initialization.
- Server-only `WIDGY_MAP_FILE_CITY_BACKEND=vercel-bdc` is prepared for a later
  full handback. It uses the existing BigDataCloud resolver, Runtime Cache and
  Redis quota checks. Do not enable it before the current counters have been
  returned safely. The current default is `cloud-run`.
- Scripting0.6.0 uses the permanent branch URL and requires the response header
  `X-Map-Service: vercel-file-v1`. Full-resolution PNG validation, last-good-file
  behavior, schedule and Shortcut input stay intact. Owner secrets are excluded
  from the committed source. The package passed the live server verification
  below and is prepared for owner installation.

## Why BigDataCloud and Vercel are compatible

BigDataCloud supplies the coordinate-to-city data; Vercel or Cloud Run hosts the
application that calls it. The actual existing code already calls the keyed
server endpoint at `api-bdc.net`. The free client endpoint is a separate product
for calls directly from a device and must not be proxied from Vercel.

The existing migration tool supports the full handback:
`node tools/migrate-cloud-run-budget.mjs PROJECT_ID --return-to-upstash`.
It first fences the Firestore ledger using a conditional write, then imports
the current counters into the already-fenced Redis ledger. A retry cannot
overwrite newer Redis usage. Never reset the budget or restore its old October15
snapshot. Authenticated Google operator access and the existing Upstash operator
credentials are required; those capabilities are not available in this session.
Cached city results can still be served by old code, but new provider requests
must have exactly one active quota authority.

## Approval resolved

Automatic approval review initially rejected creation of the sensitive Preview
variable `WIDGY_MAP_FILE_ACCESS_TOKEN`. The user then explicitly approved copying
the existing map-access key into Vercel. Creation succeeded as a sensitive
variable in project `widgy-maps-world-glass`, Preview branch `f50-widget-test`
only. No alternative credential transfer or indirect workaround was attempted.
The key is not printed in reports or committed in Git.
It allows that server to validate the owner's map requests and call the existing
Google city endpoint. This is an app key, not the user's account password.

## Verification and release gates

Candidate code commit: `c9b7cbcdacabd5f199950681a39cc798547b1328`.
Vercel Preview `dpl_8gfR1yKx3pfNVEyjEvxWiGYRs64N` reached READY and received
the existing branch alias. The production alias still points to its prior
deployment `dpl_C7Y8Y38t7kZUo5b5oMfmWi2uwNpK`.
The permanent branch URL returned the expected JSON503 for the new delivery
mode without its configured secret, and JSON400 for the legacy invalid-width
probe, with no login redirects. This verifies a fail-closed deployed candidate,
not authenticated end-to-end map/city success. No live city lookup was made.

Ten new server cases passed. The client passed30 publication/input tests,
27 download/failure tests,5 module/menu tests and1 endpoint-contract check
(63 total). Beyond version labels, publication, bookmark, location-freshness,
schedule, lock and timing logic was verified unchanged against0.5.7.
A private 0.6.0 archive is assembled from the verified source and existing owner
configuration. The private archive is not committed in Git.

Local bridge/auth tests cover wrong keys, invalid coordinates, bad/oversized
upstream JSON, timeouts, wrong-coordinate city rejection, background completion,
and byte identity with the approved3306x1558 renderer. The existing Cloud Run
suite also passed, including both full-resolution baseline image oracles.
The Firestore/return-counter JavaScript tests passed. An optional repeat of the
unchanged Lua suite could not run because `lupa` is absent; this is not a live
ledger check. The normal application build passed.

## Authenticated Preview verification after approval

Preview `dpl_9SNh1e4Loa3URuY4ciG5jpW2k9wc` reached READY for source commit
`7444c210af49000881487c5fead1408c7f1b46e3`, and received the permanent branch
alias. Production still points to `dpl_C7Y8Y38t7kZUo5b5oMfmWi2uwNpK`.
Missing and incorrect keys returned 403. Three authenticated PNG downloads
returned HTTP 200, the required service marker, exact Content-Length and full
3306 x 1558 decoding. Measurements are from this workspace, not an iPhone.

| Request | Bytes | Render ms | Complete download ms | City |
| --- | ---: | ---: | ---: | --- |
| First, uncached London coordinates | 4,073,908 | 1392.7 | 9006.9 | TIMEOUT; coordinates only |
| Same fixed instant, repeated | 4,076,259 | 714.4 | 12877.7 | MEMORY; London visually verified |
| Exact live-client query shape | 4,072,468 | 722.1 | 7362.0 | MEMORY; city available |

Runtime logs confirm all three responses finished. The city stages took
1502.1 ms, 86.9 ms and 84.2 ms. The first request explicitly demonstrates the
coordinate-only fallback; no claim is made that every update has a city label.
The detailed HTTP results are in `vercel-file-authorized-20261020.json`.

The owner package is ready for a single normal Shortcut invocation after import,
while keeping automatic runs paused. Native import and cellular reliability are
not verified by these server tests. Full city migration still requires current
Firestore counters to be handed back to Redis with operator access. The traffic
scenario remains about 11.68–12.96 GB/month for a full map every 15 minutes
continuously; Hobby's 10 GB origin allowance must not be assumed sufficient.
No paid plan change has been performed.

Primary provider references checked:
- https://www.bigdatacloud.com/docs/api-domains
- https://www.bigdatacloud.com/docs/article/why-is-reverse-geocoding-api-free
