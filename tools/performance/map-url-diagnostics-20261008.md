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
