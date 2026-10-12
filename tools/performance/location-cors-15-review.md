# Weather 15 city-label CORS repair — 2026-10-12

## Evidence

The user reported `Location unavailable` on Calendar immediately after importing
the lighter Health artwork release (910f4ff). The city-label script fetches
`/api/fetch-probe?location_shared=1`; that dispatcher returns to locationHandler
before its generic CORS headers are set. locationHandler had no CORS headers and
returned 405 for OPTIONS.

Live pre-repair checks against the Preview branch alias confirmed:
- OPTIONS: 405, no Access-Control-Allow-Origin or Allow-Methods.
- Authorized GET at a public test landmark: 200, a nonempty city and country,
  matching coordinates, **no Access-Control-Allow-Origin**.
- A provider-incomplete test also returned 502 without the CORS header.

This is a confirmed endpoint defect that prevents a browser-context cross-origin
fetch from reading even a successful JSON response. The screenshot alone cannot
establish whether this was the only cause on the phone; native GPS availability
and the existing 4-second client deadline remain possible independent failures.
No native phone console is available. Test-machine timings include network/proxy
overhead and are not measurements of phone latency.

## Change

Only the shared city-label handler gains CORS headers on all responses and an
OPTIONS 204 response. GET still uses the original token, coordinate validation,
provider budget, exact-coordinate cache and private/no-store policy. No cookie
credentials are permitted. OPTIONS returns before authorization and resolution;
it returns no city data and consumes no provider budget. Other methods stay 405.

The widget JSON, live clock, map renderer, artwork and version are unchanged.
The existing widget uses the same branch alias and needs no replacement import.
This fixes city-label response access; it is not evidence that the intermittent
black-map problem is fully resolved.

## Validation

- `node tools/test-shared-location-cors.mjs`: dispatched endpoint, opaque Origin,
  preflight without provider configuration or credentials, CORS on 400/403/503
  errors, GET authorization retained, POST rejected, private response policy.
- `node tools/test-shared-location.mjs`: existing shared resolver/cache/auth and
  independent widget source regression suite passes.
- After Preview deployment, check OPTIONS 204, authorized GET 200 with matching
  public test coordinates and CORS, and unauthorized GET 403 with CORS.
- Native acceptance: one ordinary refresh of the current widget, then inspect
  Calendar's city label. No additional widget or import is required.

Browser reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
