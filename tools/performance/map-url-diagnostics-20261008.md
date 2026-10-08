# Map request URL and image identity — 2026-10-08

The city-cache trial and subsequent Calendar structural reduction did not give
a substantial reported phone speed improvement. Repeated full-body PNG200
responses from a warm render cache remain visible. The old previous-key check
compares render inputs only: it cannot distinguish a new URL for the same
image from another unconditional request to an unchanged URL.

Add only three fixed-label fields to existing prepared map GET records when
reuse=60 is active. No widget JSON, extra client query, request, image content,
header, freshness policy, asset, renderer or Calendar provider changes.

- urlForRenderKey: first/same/changed versus the preceding successfully prepared
  GET with that render-input key in THIS process.
- imageForRenderKey: first/same/changed using the existing PNG ETag, never the
  timestamp alone. This does not execute another image hash/render.
- urlChangesForRenderKey: changed minute_stamp(t), city_observation_time,
  city_timing_trace, other_url_fields, or url_text_only. Values are never logged.

The recorder stores only SHA256digests for input keys, raw URLs, existing ETags
and selected URL components. No digest, raw URL, GPS, city, scope or credential
is logged. History is bounded to8entries with one-hour idle expiry. Oversized
URLs and diagnostic failures return no new fields; they never block delivery.
HEAD, fixed-time/bypassed maps, city-cache JSON reads and failed renders do not
update this comparison. This is diagnostic history, separate from render-cache
contents, eviction and expiry. It does not alter cache behavior.

Interpretation: same URL + same image + nonconditional200 demonstrates another
full-body response was prepared for the same request URL and image in that
process. It does not prove the bytes reached the phone, quantify decode time,
establish an app bug or identify why the client requested it. Changed URL + same
image identifies which URL component varied without exposing its value. Unknown
fields/encoding can be classified only broadly. No stable device identity is
available: multiple copies/devices with identical render inputs can share this
history, so correlate with the owner's controlled use and known agent probes.

Tests cover minute/observation/trace changes independently of image changes,
bounded LRU/expiry, instance isolation, fail-open behavior and privacy. Existing
actual-route comparisons retain parent-identical responses/headers/render counts
through cache hits/misses,304,HEAD,precise GPS changes, expiry and coalescing.
Current city-cache client/route tests and the full-size PNG regression pass.
Run the configured build before preview publication on f50-widget-test only.

Use the already imported Calendar Compact Stable Test1. No replacement import
or copy page is required. A normal Home–Calendar–Home pair provides a fresh
native window; do not claim the diagnostic itself improves speed. Production
is unchanged. Preserve this baseline's approved design and exact GPS.

## Deployment and synthetic verification

Preview deployment dpl_H6TEm9aMNRp6rifNDRaLUPbiLwyd is READY at runtime commit
d3be5a2eca01c0033cdb866220bbcb364d982658, branch f50-widget-test, target null.
The configured build and full-resolution PNG regression passed. Three agent
GETs at 21:34:16–21:34:49 Israel returned complete decodable 3306x1558 PNGs,
4,365,680 bytes each, identical by SHA256 comparison. The logs correctly record
first/first, same/same, then changed/same with minute_stamp only. Warm handlers
took 0.9 and 0.7 ms. This validates the observer, not phone speed.
Exclude request IDs qtlht-1791484455807-47ef8f851098,
wn6qc-1791484477917-7f09d267532f and g5rpx-1791484487845-fdb4b03bc42c from
native attribution. No owner coordinates or calendar credentials were replayed.

## Native result — owner completion at 21:36:52 Israel

The owner completed the requested two Home–Calendar–Home cycles on the installed
copy. They did not report new subjective timing or map appearance in this reply.
The 21:35–21:37 log window was queried again after indexing time; it contains
only one map image request, at 21:36:20.688, prepared at 21:36:21.565:
HTTP200, MISS, 876.8 ms, 4,362,688 bytes, conditional=false, same warm instance
227bb613-0fdb-481d-880c-b3310b47ffac. Its first/first comparison supplies no
native repeated-URL pair. The previous coordinates/city change is relative to
the synthetic agent request, not evidence of native location jitter.

There is therefore no observed origin image re-request on every transition in
this run. Do not infer that the image was never decoded/rendered again, that
all bytes reached the phone, or that changing URL timestamps is the culprit.

There were seven city-cache reads: two MISSes at 21:36:18.524/20.034, then five
HITs at 21:36:26.982/30.392/33.542/36.814/39.175. The HIT handler times were
0.1–0.4 ms. They establish continuing client-to-server city requests despite
warm city data, not seven external geocoder calls or seven unique taps. The
two MISSes preceded the first map write to the process city cache. No client
lookup duration trace is present, so its end-to-end wait remains unmeasured.

Calendar today returned one provider MISS (483.9 ms, including 416.5 ms provider
wait) followed by six REUSE responses (6.7–8.3 ms). One offset0 dots response
took 83.3 ms and contained 7,513 bytes. No all-month network fan-out is shown.

Code inspection confirms Calendar's synchronous city extraction depends on
the asynchronous map_request, whose server-cache HIT path still awaits fetch
and response.json before sendToWidgy. A source definition shared between tabs
is not a proven retained client value. City HTTP HITs already allow private
caching for the remaining original observation lifetime; simply adding cache
headers is not a new fix. No verified persistent native city-value API has yet
been established. Any next client change must preserve matching dynamic city,
exact GPS and approved appearance and avoid re-running earlier native/mixed
URL experiments without new evidence. No new export or runtime change follows
from this measurement alone; keep the current functional baseline.
