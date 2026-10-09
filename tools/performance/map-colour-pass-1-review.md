# Map colour pass — 2026-10-09

The owner confirmed Runtime 2 fixes the month arrows, but both tab transitions
still feel slow. This update leaves that widget and all native actions intact.
It removes a measured cost in the full-resolution server renderer; it is not
an established fix for total native transition latency.

## Observed preview requests

Runtime 2 preview logs, 07:45–08:07 UTC, before this change:

- Seven prepared map responses: five MISS, two HIT. First-instance renders
  took 1456.8/1788.9 ms; subsequent coordinate-key misses took 725.9–892.4 ms.
- Both hits prepared in 0.7–1.5 ms but still sent approximately 4.08 MB.
  Their request URL changed only in the minute stamp; cached PNG was unchanged.
  Neither request had a conditional validator. Server cache hits alone do not
  remove download or native decode work.
- Cached Calendar today responses took 1.3–2.4 ms. Two provider misses took
  452.5/461.2 ms, including 391/396 ms waiting for providers. Cached dots took
  1.4/68.5 ms; new month offsets took 270.3/278.2 ms.
- The exact-coordinate city cache had 8 hits and 11 misses over 19 reads.
  These reads took 0.1–0.9 ms; they do not measure client geocoder latency.

Logs do not identify the active widget copy, tap instant, client download,
native execution order or decode cost. Coordinate changes are observed, but
the logs cannot distinguish real movement from GPS jitter. No location
rounding, freshness change, external geocoder replay or private data export
is part of this work.

## Implemented

The renderer already produces sRGB samples. The final full-size Sharp call
performed another sRGB-to-sRGB transform solely to attach its profile. The
new internal helper generates that same iCCP chunk once with the installed
Sharp build, then inserts its original bytes and CRC in the encoded PNG.
The identity transform across 5,150,748 pixels is avoided. The profile, pixels,
compression level, output dimensions and complete PNG remain identical.

The helper accepts only the expected internal 8-bit RGB/RGBA PNG layout and
rejects existing colour metadata. It is not for arbitrary images or uploads.
Smaller legacy output sizes keep their original pipeline. API diagnostics
identify this renderer as `perf-8-srgb-profile`.

## Measurements and verification

`map-colour-pass-1-benchmark.json` records six alternating warm pairs per solar
instant with changing precise synthetic coordinates and fresh rendering:

| Solar instant | Baseline median | Updated median | Reduction |
| --- | ---: | ---: | ---: |
| October 9, 08:00 UTC | 354.55 ms | 306.77 ms | 13.5% |
| March 20, 12:00 UTC | 354.39 ms | 303.73 ms | 14.3% |
| June 21, 00:00 UTC | 344.50 ms | 305.63 ms | 11.3% |

These are local Node 24 renderer measurements, not phone or network timings.
All 18 paired PNGs were byte-identical. Additional checks passed:

- All 16,777,216 RGB triplets are unchanged by the removed identity transform;
  sampled alpha values span all 256 values.
- Same complete PNG/profile, four concurrent profile requests, chunk CRCs,
  and rejection of malformed/already-tagged input.
- Twelve renderer fixtures preserve complete PNG and decoded pixels, including
  seasonal, location/label, diagnostic and legacy-size cases.
- Full configured build and API cache/304/HEAD/error/privacy regression.
- Isolated traced-module runtime includes the new helper and reproduces the
  original r6/f50 PNGs and the original-master fallback exactly.

Before declaring deployment verified, compare two synthetic preview responses
against stored PNGs from the previous Vercel deployment, including a city label.
Local and Vercel font rasterization can differ, so local-to-live city comparison
is not a valid byte-equivalence reference.

## Rejected alternatives

Lower PNG compression levels did not improve timings consistently and increased
payload size. Cropping the unchanged full-canvas SVG to a raw overlay had no
reliable useful gain. Joining a precomputed alpha channel changed pixel values
and failed a further composition check. None of these experiments is shipped.

Runtime 2 JSON, Calendar data handling, full native month actions, precise GPS,
city naming, native time/day gauge and approved design are untouched. Existing
imports use the preview branch endpoint and require no new import. Production
is outside the deployment scope.

Format references: <https://www.w3.org/TR/png/> (iCCP ordering) and
<https://sharp.pixelplumbing.com/api-output/> (PNG output).
