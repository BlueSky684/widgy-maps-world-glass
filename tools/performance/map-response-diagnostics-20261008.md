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
