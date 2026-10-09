# Transient blank map on the Home Screen — 2026-10-09

At 14:19 Asia/Jerusalem the owner reports the map disappeared for a few seconds
on the actual Home Screen and returned without intervention. IMG_0110.jpeg
shows the native clock at 14:18, a black map panel and the rest of Home present.
Unlike the earlier import/editor reports, this establishes a Home Screen
occurrence. It does not establish the installed copy name, exact start/end,
whether iOS refreshed the widget, or the cause of the blank frame.

## Correlated server evidence

Read-only logs for preview `dpl_F2b2u121meUbU3xhFrDUEjBtzP2b`, branch
`f50-widget-test`, 11:10–11:20 UTC. No agent-generated requests in this window.

| Israel time | Record | Measured server work |
| --- | --- | --- |
| 14:18:19.893 | Calendar today prepared 200, provider MISS | 499.4 ms, including 443.1 ms provider wait |
| 14:18:20.872 | Exact-coordinate city cache MISS | 0.9 ms |
| 14:18:21.462 | First map request in this process started | — |
| 14:18:22.814 | Map prepared 200/MISS | 1352.7 ms; 4,027,170 PNG/body bytes |
| 14:18:23.755 | Calendar today prepared 200, provider REUSE | 1.9 ms |
| 14:18:24.158 | Exact-coordinate city cache MISS | 0.3 ms |
| 14:18:24.707 | Second map request started | 3244 ms after preceding map start |
| 14:18:25.410 | Map prepared 200/MISS | 704.3 ms; 4,027,085 PNG/body bytes |

Both maps used the same process, precomputed raster HIT, no conditional request
and full response bodies. The second normalized render key changed only in
coordinates. That does not distinguish real movement from GPS jitter, prove
both calls came from one widget, or justify reusing an old coordinate pair.

The grouped map runtime-error query found no error clusters in this window.
Two Fontconfig startup messages appeared during the first render, which then
prepared a PNG successfully. They are not evidence that the entire image was
black or delivered incorrectly. Do not claim the absence of an error cluster
proves successful phone delivery.

These records support investigating the refresh/download/display interval.
They do not prove that Widgy clears its last image, identify the downstream
failure, or establish that the image actually reached the device. The current
`prepared` event precedes `res.send` and cannot answer that question.

The screenshot's 53% day value also differs from the existing formula's 59%
for 14:18. Native live time and script-derived values can reflect different
update instants; the screenshot alone does not identify why or date the last
successful update. The day-gauge behavior is not changed as part of this patch.

## Narrow instrumentation

Observe Node response `finish` and `close` on the existing map endpoint.
Record one terminal event per response: `finished`, `closed_early`, or
`closed_after_flush` when close is observed with a flushed response but no
finish event was recorded. Record status and booleans for headers sent,
writable ended and writable finished. Existing opaque process/request identity
and elapsed time correlate the event with preparation. Diagnostic failures
cannot interrupt delivery.

A Node `finish` is transport handoff on the server, not proof of Vercel edge
receipt, full phone download, PNG decoding or display. An early close likewise
does not identify who caused the disconnection. No socket/IP, URL, coordinates,
city, request headers, tokens, ETags or body content is added to logs. No
provider call, image, cache, response header, native widget or copy-page change.

## Verification and publication

- Real local Node HTTP: complete GET, HEAD, 304 and client disconnect before
  response end; no false early-close after normal finish.
- Early close before headers, duplicate lifecycle events, unsupported mock
  responses and a failing logger.
- Existing response/privacy regression and response-equivalence against
  parent `7edf1016331e233dcb3ccdf02fe541d51b10345c`, including exact-coordinate
  invalidation, cache expiry, 304 and eight concurrent requests.
- City-cache/renderer isolation and fallback regression.
- Full configured build before preview publication; verify a synthetic fixed
  map's PNG against the stored prior Vercel PNG and observe its terminal log.

This is a diagnostic update, not a fix or a retained-last-good-image mechanism.
The existing imported Home Direct Data 1 continues to work with no reimport.
No new phone timing exercise or copy is requested. No production deployment.

Primary lifecycle reference:
<https://nodejs.org/docs/latest-v24.x/api/http.html#class-httpserverresponse>
