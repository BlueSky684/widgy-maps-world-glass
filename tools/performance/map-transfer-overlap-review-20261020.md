# Overlap prepared PNG transfer with remaining city work

Status: candidate verified locally, not deployed to Cloud Run and not verified
on the phone. Target remains `f50-widget-test` and the separate map trial.

## Evidence and scope

The phone's two 0.5.6 notifications at 14:11 and 14:27 report
`DOWNLOAD_TIMEOUT`, 20.0 seconds, before a new image replacement began.
They do not expose whether the download was waiting for headers or image data.
The 0.5.7 manual success does not establish that intermittent failures are fixed.

At base commit `8fb3aa7d806d1e8bac85fdf9915fd72cc6157384`, the Cloud Run adapter
waits for all deferred city/cache work before calling `res.end(body)`. That
prevents any PNG transfer during this remaining wait, even after rendering has
finished. The city decision itself is capped at 1500ms, and the later drain at
6500ms. The latter is a ceiling, not a measured delay on the phone.

A controlled local HTTP regression reproduced this sequence: the renderer
finished while a fake city provider was held; no PNG bytes arrived, and the
transfer-before-city-completion assertion failed after 1200ms. This identifies
an avoidable serial wait. It does **not** attribute either phone timeout to it.
Live request logs were not available in this investigation.

## Change

Track only unresolved city tasks. For a successful GET PNG with one still
pending, start sending the already-rendered image, retaining its last byte
until the bounded drain completes. This overlaps transmission with city work
while keeping the HTTP request open. Request-based CPU remains available while
the request is active; removing the drain entirely would change that lifecycle.

Use chunked HTTP/1.1 framing for that response, as Cloud Run's streaming
documentation requires; do not send Content-Length simultaneously. Count the
prepared body separately for existing safe completion logs. Error responses,
HEAD, 304, resolved-city responses and non-PNG formats keep their old path.

The renderer, PNG bytes, dimensions, city fallback policy, provider quota/cache,
client's 20-second deadline, bookmark and publication logic are unchanged.
The client source accepts absent Content-Length and still validates the full PNG
before publication. Native chunked-response handling is not established here.

## Verification

`node tools/test-map-transfer-overlap.mjs` passed against the candidate:

- Real loopback HTTP; actual 3306 by 1558 PNG, 4,081,915 bytes.
- SHA-256: `0b813eeddbb446be582057255773a31120967e74718f321e45b07511819e507e`.
- All but the last byte arrived while the fake city task was still pending;
  the complete response arrived after release. The image matched the
  coordinate-only fallback byte for byte and decoded successfully.
- In the recorded local run the prefix arrived 17ms after PNG preparation.
  This is **not** a network or phone speed estimate.
- A deliberately hung provider still hit the configured drain ceiling and
  returned a valid fallback PNG, with the existing timeout diagnostic.
- A client disconnected during the pending drain; after the server observed
  it, the response was recorded as `closed_early`, never as finished. The test
  does not claim that Node's `finish` event proves delivery to any phone.
- HEAD/304/error framing, full body-byte diagnostics and sanitized logs passed.

`node --experimental-vm-modules tools/test-cloud-run-map.mjs` also passed:
two full-resolution PNGs identical to the pinned pre-migration route; access
guards; city work lifecycle; provider-outage fallback; cache/304/HEAD; TTL;
fixture-backed Firestore lookup reuse and one quota reservation; city endpoint
and CORS. No real provider requests, quota mutations or cloud writes were made.

The controlled test proves overlap, not a reduction in real end-to-end latency.
TLS, the hosted proxy, mobile networking, Scripting and iOS scheduling remain
outside this local verification. Existing app settings and automation are not
changed by this candidate. No additional phone test is requested.

## Next acceptance gate and rollback

Before activating this change, compare baseline and candidate through the
Cloud Run trial ingress using synthetic requests, record first-byte and full
body times, verify exact PNG bytes and check headers/body completion. Include a
delayed-city fixture in an isolated test deployment if ordinary requests do
not exercise the pending path. Use existing authorization without logging URLs
or credentials. A local pass alone is insufficient to mark the incident fixed.

No authenticated Cloud Run management connection or `gcloud` is available in
this workspace. Deployment and hosted verification have not been performed.
Do not ask the user to compensate with another timed phone experiment. If the
hosted gate fails, retain the existing revision; if deployed later, rollback is
to the previously serving Cloud Run revision. No client reinstall is part of
this patch.

## Primary references

- [Cloud Run response streaming](https://docs.cloud.google.com/run/docs/triggering/https-request#response_streaming): chunked response requirement.
- [Cloud Run billing settings](https://docs.cloud.google.com/run/docs/configuring/billing-settings): request-based CPU allocation.
- [Node HTTP response API](https://nodejs.org/api/http.html#responsewritechunk-encoding-callback): write, end and backpressure semantics.
