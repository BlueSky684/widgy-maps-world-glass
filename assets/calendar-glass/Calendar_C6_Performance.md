# Calendar C6 — map reuse comparison

C5 fixed the month-button visibility reset and the user confirmed that months
now change on the phone. The remaining complaint is the delay after tapping.
No device timing has been recorded, so the dominant cause is not established.

## Focused change

- C6 generates the same map URL within a UTC minute for identical precise GPS
  coordinates, city and render options. C5 used a different millisecond timestamp
  on every evaluation.
- The new `reuse=60` opt-in on `/api/night-map` enables private HTTP caching only
  when both coordinate query parameters are explicit. Shared CDN caching stays
  disabled. Existing C5 and other callers retain `no-store` behavior.
- A bounded warm-instance cache retains at most four rendered PNGs / 32 MiB.
  Its key contains the server minute, full resolved location (including city and
  source), revision, dimensions, presentation, atlas and diagnostic mode.
- Entries expire at the end of their server minute. Hits never renew the expiry.
  Slow renders that cross that boundary are not retained. Identical simultaneous
  requests can share a pending render. Failures are not cached.
- ETags allow an unchanged image to return 304. `X-Map-Cache` and
  `X-Map-Rendered-At` expose actual cache behavior without logging coordinates.
- The solar instant is still computed from server time. The client's `t` value
  only differentiates URLs; fixed `at` test requests bypass reuse.

## Preserved

The entire native layer tree is byte-equivalent as structured data to C5:
month actions, 25-month range, 75 calendar components, fonts, graphics, clock,
date, native agenda and 10,000-step goal. The only changed widget variable is
the map URL script. The approved 3306×1558 lossless renderer/assets are untouched.
The importer keeps the exact C5 copy script apart from the C6 filename/name.

## Validation and limits

Run `node tools/build_widgy_calendar_c6.mjs`,
`node tools/test_widgy_calendar_c6.mjs` and
`node tools/test_widgy_calendar_c5.mjs`.

Tests cover widget equality, URL stability / new minute / precise location
changes, client lookup success/failure (simulated only), cache expiry,
coalescing, eviction, memory bounds, failed renders, route variant isolation,
private headers, ETags/HEAD, and legacy/fixed/IP-based bypasses. C5's 75
navigation cases and 8,100 month-layout cases remain applicable unchanged.

Cold renders, minute boundaries, GPS jitter, city changes and different server
instances can still miss. The on-device city lookup still runs on each script
evaluation; no unsupported persistent storage or timer API was introduced.
The 2,000-layer native layout and iOS/Widgy reload overhead remain. This release
does not claim immediate interaction or a measured device speed-up.

On the phone, import C6 as a separate copy, let Home load once, then compare
several Calendar month changes and tab switches against C5. Keep the same slot
and conditions. Report approximate seconds from tap to visible result, and
whether repeated transitions are faster than the first one.
