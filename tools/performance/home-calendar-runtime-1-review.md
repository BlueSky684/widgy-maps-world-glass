# Second comprehensive transition audit — 2026-10-09

The owner reports no satisfactory improvement with Shared Home Calendar
Cleanup 1 and requests autonomous investigation without more phone timing.
Baseline: `7f768cafdebf46e1f9d878c5934dd54372cef05f`, full approved widget.
Scope remains preview branch `f50-widget-test`; production is excluded.

## Current evidence

Read-only logs from the latest preview deployment, 06:40–06:48 UTC, filtered
to prepared responses (no agent-generated image requests inside this window):

| Component | Sample | Server preparation |
| --- | ---: | --- |
| Calendar today, reused provider | 19 | 1.2–3.4 ms, median 1.4 ms |
| Calendar today, provider miss | 2 | 234.2 / 445 ms |
| Calendar dots, reused provider | 2 | 1.5 / 70.3 ms |
| Calendar dots, provider miss | 1 | 266.9 ms, offset +1 |
| Map | 6 misses | 842.5–964.2 ms; roughly 4.08 MB each |

The first map establishes its cache key; each subsequent map changes exact
coordinates. Rounding GPS would improve hit rate by changing the contract,
so it is not applied. These requests have no conditional 304 response.
Separate city-cache reads continue between image requests; this is evidence
of network work, not proof of which visible tab or variable scheduled it.
Logs cannot identify individual imported copies, actual touch instants,
network completion, image decode, SwiftUI rendering, or total transition time.

## Native computation and navigation

Fifty direct scripts independently produced 25 month names and 25 years.
Month names repeat with period 12. The +/-12-month range spans only the
previous, current and following year. The candidate uses 12 shared month
String variables and three shared year String variables. The existing month
layout calculation appends independent year-selection flags. Its original
layout tokens remain present and unchanged. Native Contains predicates select
the year; the three fixed offsets -12/0/+12 need no predicate.

All original caption fonts, colors, frames, sources' resolved English text,
and paint position are retained. Twenty-two extra year alternatives each
share their counterpart's exact frame; exactly one is selected. This uses
existing native variable/text/visibility schemas, not guessed date-edit or
dynamic-position fields. Live clock, all month grids, 95 Today badges,
native date weight and all events are retained.

The 48 month arrows previously assigned 33 visibility targets each. A visible
arrow already identifies its source month. Its replacement changes only the
source/destination panes and boundary-arrow state when necessary: two targets
normally, four at boundaries. Main tab and reset actions remain exact.
Every one of 100 reachable manual states and 473 valid button transitions has
the same resulting state in the model. This is not a native concurrency test.

| Inventory | Before | After complete candidate |
| --- | ---: | ---: |
| JavaScript definitions/occurrences | 61 | 26 |
| Global variable definitions | 52 | 67 |
| Stored native nodes | 1180 | 1194 |
| Month-arrow visibility assignments across 48 actions | 1584 | 104 |
| Navigable month panes / native grids | 25 / 75 | 25 / 75 |
| Native Today positions | 95 | 95 |
| Tap marker dots | 0 | 0 |

**Fewer script definitions is not measured execution count.** If Widgy only
evaluates visible direct scripts, it may have executed only two caption scripts
per view already. Shared global evaluation/caching is not instrumented. Extra
variable dependencies and conditional labels could offset the benefit. This
is a functional-parity optimization candidate, not a demonstrated phone speedup.

## Home drawing work

Five runs of contiguous, disjoint native vector shapes share the same parent,
condition, material and style: light-rain strokes, heavy-rain strokes, fog
lines and two Calendar navigation bindings on each tab. Join their exact
original contours with reversed zero-winding connectors, using the same
custom-polygon representation already working for week separators. This
removes eight drawing nodes (seven Home, one Calendar). No SF Symbol, source
art, resolution, font or visual setting is substituted.

All 20 local raster comparisons are byte-identical at 367, 707, 1134 and
1600 px. Whole-document restoration verifies only these five runs changed.
This validates geometry and a reference rasterizer, not the native renderer.

## Map drawing resources

The latest renderer still rasterizes identical text and rounded-corner alpha
on each new GPS image. A bounded deterministic resource cache now retains
those resources only: at most 32 entries / 4 MiB, with at most four tracked
pending keys. Failed and oversized resources are not cached. Key includes
text, font weight, size and color. These immutable resource buffers do not
change GPS, solar instants, marker position, city selection or response TTL.
No entire live map or private calendar snapshot gains extra freshness.

Twelve approved fixtures retain exact PNG bytes, decoded pixels, dimensions
and color profile. Five tests cover key separation, LRU entry/byte bounds,
coalescing, failures and pending bounds. Alternating six-run local comparisons
are recorded in `render-resources-1-benchmark.json`; two cases improve modestly
and the long-label case is slightly slower. Do not promote this as a universal
speed increase or extrapolate it to the phone.

## Investigated but rejected / unresolved

- **Crop the full-canvas marker SVG:** eight of 12 fixtures stayed exact but
  four changed PNG pixels/bytes. Rejected despite lower processing cost.
- **Round GPS or reuse a nearby location:** not applied. Exact position is a
  requirement; proximity alone does not establish city-boundary equivalence.
- **Use Calendar's native city immediately in the map:** promising way to
  avoid cache/geocoder requests, but native City is not tied to an exported
  coordinate/observation pair. Existing schemas also do not establish safe
  escaping of arbitrary city names into script/URL sources. Do not replace
  the verified coordinate-matched fallback with an unverified substitution.
- **Remove hidden months / alternate weather / Today clones:** these are
  needed for supported states. No native scheduling evidence says all are
  drawn at once. No verified dynamic-position binding was found in the
  current exports; no guessed fields or smaller month window is introduced.
- **Native month/date format instead of JS:** MMMM/yyyy examples exist, but
  no observed exported text date-offset/forced-English configuration supports
  the whole +/-12-month contract. No guessed date-edit field is published.
- **One shared data script for every Calendar field:** earlier native source
  ordering issues and unverified caching make it inappropriate here. All
  39 JSON bindings and their exact URLs remain; bindings are not request counts.
- **Paid hosting, smaller/lossy map, independent map layer, static replacement,
  changed refresh interval, transparent native day/night split:** existing
  investigations do not establish a faithful faster solution. No purchase,
  protocol change, new polling, or rerun of these phone trials is requested.

## Verification

- 9630 date fixtures covering the full 400-year Gregorian cycle (first/last
  day of every month) and five timezones around DST/year/leap-day boundaries:
  240750 month/year pairs resolve identically; each year has one visible label.
- 100 reachable navigation states, 473 visible-button transitions identical.
- Exact style/frame checks and whole-document change whitelist for captions,
  variables and buttons; separate whole-document check for vector merging.
- 26 scripts parse, all variable references and navigation targets resolve,
  IDs unique, full widget and native Day Gauge retained, no tap markers.
- Copy page verifies complete bytes, hash, authenticated decryption,
  missing/wrong keys, tampering and clipboard/manual fallback.
- Configured Vercel build must finish successfully before preview publication.

The user is not asked to perform a timing exercise, supply another video, or
import multiple experiments. Deliver one complete optional candidate, preserve
the previous copy as fallback, and state that device latency is unmeasured.
The black-map issue is not declared resolved.
