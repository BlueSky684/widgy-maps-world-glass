# Vercel saved-map migration candidate — 2026-10-20

Scope: `f50-widget-test`, Vercel Preview only. Production, Google resources,
quota ledgers, installed Scripting and Widgy have not been changed.

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
  from the committed source. The package is not released until live verification.

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

## Approval blocker

Automatic approval review rejected creation of the sensitive Preview variable
`WIDGY_MAP_FILE_ACCESS_TOKEN`: explicit user authorization is required to copy
this particular existing map-access key into Vercel. The value was not saved.
No alternative credential transfer or indirect workaround was attempted.
The concrete destination is project `widgy-maps-world-glass`, Preview branch
`f50-widget-test`; the value would be hidden/sensitive, never public or in Git.
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
A private0.6.0 archive was assembled and integrity-checked as an unreleased
intermediate; it is not committed or offered for installation before live checks.

Local bridge/auth tests cover wrong keys, invalid coordinates, bad/oversized
upstream JSON, timeouts, wrong-coordinate city rejection, background completion,
and byte identity with the approved3306x1558 renderer. The existing Cloud Run
suite also passed, including both full-resolution baseline image oracles.
The Firestore/return-counter JavaScript tests passed. An optional repeat of the
unchanged Lua suite could not run because `lupa` is absent; this is not a live
ledger check. The normal application build passed.

After the map-key approval: set only the scoped secret, build a new Preview,
verify real authenticated map delivery and city result with synthetic public
coordinates, reject missing/wrong keys, check last-good-file client guards,
then package and release0.6.0. No request should expose tokens or full authenticated
URLs in reports. The Vercel traffic scenario remains about11.68–12.96GB/month
for one full map every15minutes continuously; Hobby's10GB origin allowance
must not be assumed sufficient. No paid plan change has been performed.

Primary provider references checked:
- https://www.bigdatacloud.com/docs/api-domains
- https://www.bigdatacloud.com/docs/article/why-is-reverse-geocoding-api-free
