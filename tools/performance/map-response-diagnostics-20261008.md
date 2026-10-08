# Intermittent blank map — 2026-10-08

## Native evidence and boundary

IMG_0091: the City Reuse Test 1 overview has an empty black map area while the
rest of Home and native day gauge render. The owner confirms that re-entering
the same widget in Widgy makes the map load. IMG_0092 shows an empty map in
the older Native Steps Ring copy as well. A rollback of the city-reuse change
alone would not explain or resolve a failure also present in the older copy.
No claim is made about all Home Screen transitions or an exact load duration.

Flow: native GPS → phone city lookup → map URL → night-map handler → PNG →
native decoding/display. The city fetch can delay creation of the image URL;
the server cannot observe that phone-side stage. Existing best-effort JS cache
persistence and native HTTP image cache behavior remain unmeasured.

## Existing evidence

- Preview error/fatal logs and grouped runtime errors expose no matching failure
  in the inspected windows. Two older info-level records contain the Fontconfig
  startup message `Cannot load default config file`; the records alone do not
  establish failed rendering, response status, body size or native display.
- The handler correctly serves cached PNGs and conditional 304s in tests. A 304
  intentionally has no body; a compliant client uses its saved representation.
  There is no evidence yet that a 304 caused the user's black frame. Do not
  disable caching or unconditionalize all downloads without the next evidence.
- Current night-map output does not enforce a maximum PNG size. Vercel documents
  a 4.5 MB function-response limit. Earlier sampled current-day images were under
  this budget, and no matching payload-size error has been observed. A separate
  live-map renderer has a lossless large-image fallback; this is a known design
  difference, not a demonstrated cause of these reports. No resolution,
  compression, pixel, delivery-mode or cache-policy change is part of this patch.

## Diagnostic change

Observed native follow-up: IMG_0093 at16:10 still shows blank map inside Widgy.
The owner clarified at16:13 that all map-disappearance checks so far were inside
the app, with no Home Screen check yet. At16:10:11.445 the handler started and at
16:10:13.146 prepared HTTP200/MISS with4,019,774 PNG/body bytes in1701.5ms, without
a conditional request. This is temporally correlated server preparation, not
proof of phone delivery or display. It rules out a304 for that recorded request.

At16:24 IMG_0094 shows Calendar city missing on the actual Home Screen. That
led to retirement of the separate city-sharing trial; see its recovery note.
Later the16:54 native export confirmed the owner still had that unchanged
trial installed, and IMG_0096 showed the Calendar city at16:56. The owner
reported no perceived speed improvement at17:08. These observations do not
prove which city source rendered or a successful recovery import. IMG_0094 does not show
the map, so Home Screen map disappearance remains unestablished. Between16:23:17
and16:23:47 the diagnostic recorded four200/MISS responses, each about4.02MB,
with preparation durations1454.1,793.7,840.4,810.3ms. Key/location changes versus
separate function instances are not distinguishable from the privacy-preserving
records. Do not claim GPS jitter, redundant same-key downloads, or cache failure
as proven causes from these counts.

Add structured `night_map_response_v1` records at request start and response
preparation/error. Record only the normalized method, elapsed milliseconds,
status, cache outcome, PNG/body byte counts, presence of a conditional request,
and precomputed-cache state, plus fixed error-reason codes. Never log URLs,
queries, coordinates, city text, request headers, tokens, ETags or image content.
Vercel's surrounding record provides request correlation. A start without a
completion can help locate failures during execution, subject to log retention.

"Prepared" means the function prepared a response; it does not prove platform
delivery, a successful phone download or native display. This diagnostic runs
on the existing preview endpoint, so existing widget imports require no change.
The stable and City Reuse copy pages remain unchanged. Production is untouched.

## Validation and next gate

`test-map-response-diagnostics.mjs` checks start/prepared/failed events, no private
data in log fields, unchanged cache MISS/HIT/304/HEAD responses, rejected inputs,
and recovery after a renderer error. The existing real-route/cache/expiry test
and pixel regression confirm the normal PNG is unchanged. The configured build
passes before preview publication. A deployed synthetic 0,0 / Example request
will verify both a full 3306x1558 PNG and the new server record.

After publication, observe an ordinary recurrence and correlate its time with
the server records. Full 200 PNG preparation, 304, server failure, or no observed
request narrow different parts of the path; no single outcome proves the whole
cause. Do not prescribe another JSON variation until the evidence justifies it.

Primary documentation reviewed:
https://vercel.com/docs/functions/limitations
https://vercel.com/docs/errors/function_response_payload_too_large

## Cache investigation after native transitions, 17:48 Asia/Jerusalem

On preview910cf71, the owner's transition window contains these map responses:

| Prepared time (Israel) | Preparation ms | PNG/body bytes | Cache | Conditional |
| --- | ---: | ---: | --- | --- |
| 17:45:49.233 | 1479.6 | 4066444 | MISS | false |
| 17:46:02.732 | 833.9 | 4066634 | MISS | false |
| 17:47:37.180 | 845.7 | 4068469 | MISS | false |
| 17:47:44.332 | 738.8 | 4068867 | MISS | false |
| 17:48:11.318 | 801.9 | 4069300 | MISS | false |
| 17:48:15.311 | 789.8 | 4069359 | MISS | false |

All prepared200 with precomputedHIT. Four responses occur within about39s.
The changing bytes alone do not prove changing GPS: a new rendering instant
also changes pixels. The minute `t` query is not part of the server cache key.
Exact coordinates, city, location source, revision and rendering options are.
Vercel request-ID prefixes are not established function-instance identifiers.

Add an opaque random per-process instance ID and request ordinal to the logs.
For reusable requests, compare the normalized key with the immediately previous
reusable request in that same instance. Log only first/same/changed, fixed
change labels (coordinates, city, availability, source, rendering options), and
the elapsed interval measured with the monotonic clock. Bypassed requests are
marked and do not replace the previous reusable key. Concurrent requests retain
their own comparison result and ordinal before awaiting rendering.

This comparison is NOT an inspection of all cache entries or a cache-miss reason.
A same-key MISS may follow expiry, eviction or a previous failed render. A new
instance cannot compare with another instance's preceding key. Only one previous
key is retained in process memory; no raw or hashed location/city/key, URL,
token, ETag or image content is logged or added to response headers. No cache,
TTL, coordinate precision, pixel, widget JSON or copy-page behavior is changed.

Validation: test-map-key-diagnostics.mjs compares all response bodies, statuses,
headers and render counts with910cf71 for minute crossing, exact GPS changes,
city changes, unavailable location, rendering options, expiry, bypass, HEAD,
304 and eight concurrent requests. It checks distinct per-instance IDs and
absence of sensitive sentinels in logs. Existing diagnostic tests and actual
full-size PNG regression must pass, followed by the configured build before
publishing only the f50-widget-test preview. A synthetic deployed pair will
check the new log fields; native observations remain necessary for attribution.

## Native follow-up reported done at18:10:11 Asia/Jerusalem

Diagnostics97d4b8b were published to previewdpl_6Qk7vwrAAiPR8Q74ts1qAGChRr51,
READY at18:07:10. Production remained3ff3cd9. Local response-equivalence,
concurrency, privacy, real full-size PNG regression and configured build passed.
Two separate agent probes at18:07:34/44 used synthetic0,0/Example: MISS869.6ms,
then HIT0.7ms, with identical delivered4,101,971-byte3306x1558 PNGs. These are
agent requests, not native evidence. They precede and affect the next-key
comparison; do not attribute their location differences to phone GPS jitter.

In the subsequent native-only18:08–18:10:25 window:

| Request start (Israel) | Prepared ms | Cache | Previous key | PNG/body bytes |
| --- | ---: | --- | --- | ---: |
| 18:09:45.431 | 860.9 | MISS | changed from agent synthetic request120.842s earlier | 4098212 |
| 18:10:03.075 | 0.5 | HIT | same,17.643s after preceding native request | 4098212 |

Both native requests used the same opaque instance ID. The second proves the
normalized coordinates, city and rendering options were identical for THIS
pair and that the existing render cache was used. It was still an unconditional
200 response with the full PNG body prepared. No phone transfer/decode time or
native display result is established by this. It neither explains the earlier
four-MISS window nor supports rounding GPS or increasing cache TTL now.

Calendar in this same window prepared its first today response in243.8ms
(providerMISS229.3ms wait), then fourREUSE responses in8.0–10.4ms. One current
month/grid dots response prepared in72.4ms,7,513bytes,REUSE. Only offset0 was
observed. No phone-side geocoder requests or duration can be inferred from
these server records. The owner has reported completing the transitions, but
has not yet said whether the second Home return remained slow in this round.
At18:13:50 the owner clarified that the second return was significantly slower.
This is a subjective native result despite server reuse, not a measured phone
duration. The next scoped city-stage timing copy is documented in
city-timing-1-review.md; do not ask this same completed question again.
