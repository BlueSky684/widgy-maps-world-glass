# Compact Live Map 1 — 2026-10-07

Owner screenshot IMG_0064 at22:07 shows the map cut off at the lower edge and
lights inconsistent with current time. Compact Structure1 preserved the
experimental image82316 frame (x0,y300,w1600,h800), not the earlier approved
Home Hero frame. Its JSON provider intentionally selected the fixed C fixture.
These are two separate causes; Calendar consolidation is preserved.

## Changes

- Restore exactly image6170's b/c/d/e from the approved C16 template, keeping
  the current image ID82316, ordering and native JSON provider. At the1135x1184
  reference size the frame is x22,y154,w1090,h540; Aspect Fit contains the full
  3306x1558 image. The builder proves no other widget content changes except
  map frame/source/name and document title/description. Still1289layers/40vars.
- Add `/api/widgy-live-map`: queryless GET returns a small no-store JSON with
  `image`, `mapTime` and `revision`. The URL includes the current server UTC
  minute and renderer version. No Widgy variables, Base64 or client JS added.
- Image requests render the approved glass/r6 full-resolution master for that
  exact minute. Public pixel output is location-free and independent of all
  request IP/cookie/location headers. Invalid/extra/duplicate parameters are
  rejected. Existing private map/Calendar routes and the fixed A/B/C tests are
  unchanged. No personal marker is provided by this candidate.
- Successful minute-version PNG responses request immutable HTTP/CDN caching.
  Four completed images and concurrent renders share a bounded warm-instance
  cache. Small JSON is never cached. Bootstrap `?view=image` returns the current
  map without HTTP caching, so the native last-resolved field is not a stale
  fixed fixture. No new storage service or recurring job is provisioned.
- Source pixels and3306x1558 resolution are retained. Above4,400,000bytes,
  level9 PNG encoding with adaptive filtering is used; palette is disabled and metadata is preserved.
  Responses above4,500,000bytes are rejected before success caching. This is a
  lossless encoding fallback, not resizing or quantization.

## Validation

`node tools/test-widgy-live-map.mjs PRIVATE_OUTPUT --render` verifies the full
frame, source URL,40variables/1289layers, tiny metadata without texture rendering,
minute/year boundaries, same-minute cache reuse, concurrent request sharing,
ETag/HEAD, no personal inputs, invalid queries/methods and no-store failures.
The real2026-10-07T19:08Z renderer returned4371281bytes,3306x1558, byte-identical
to the unchanged approved renderer. Local first-call time was~0.6–0.8seconds,
repeat warm cache rounded to0ms; these are NOT Vercel or phone measurements.

A32-case seasonal/3-hour sweep found maximum4519906bytes at2026-12-21T00:00Z.
That case was4368370bytes with the lossless fallback. Decoded RGBA bytes, dimensions,
color space/channel depth and ICC profile were checked against the original.
The current-time path did not need re-encoding. All tests passed locally.

Public docs consulted:
- https://vercel.com/docs/caching/cache-control-headers
- https://vercel.com/docs/functions/limitations (4.5MB response limit)

## Native gate / limits

Images are generated on demand on a cache miss, not prepared by an independent
background producer. A new minute can still require rendering, download and
native decoding. Do not claim automatic one-minute refresh: the source selects
the current minute WHEN Widgy refreshes it. CDN HIT and deployed HTTP responses
have not yet been measured; a successful build alone does not verify them.

Import as a separate private copy; confirm complete map, current day/night,
and Home/Calendar return including after idle. Actual phone performance and
native refresh remain unverified. Full live personal marker/city integration
and further Today/day-progress layer redesign remain separate work.
