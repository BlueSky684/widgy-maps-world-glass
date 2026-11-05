# Fast annual navigation with bounded refresh and last-good data

`reuse=year-v2` retains a complete private annual snapshot for up to 15 minutes
after its provider read begins. It is considered fresh for 60 seconds. A month
request within the retained interval receives the existing snapshot immediately
and starts one background refresh when stale. A TODAY request joins/waits for
that refresh instead of normally returning stale event details. Both routes
share the annual generation and its twelve per-month renders.

This is request-driven. There is no every-minute background schedule and no
server push to Widgy. A background refresh becomes visible on a later widget
request. iOS/Widgy refresh scheduling still controls what the phone displays.
The first cold request, or one beyond retention, must wait for provider data.

## Correctness and failures

- Authentication remains before all cache access. Keys include the exact
  sealed credential, local timezone and full annual window. Old monthly,
  three-month and year-v1 URLs keep their earlier behavior.
- Only a successful complete provider read can replace the snapshot. The
  existing provider aggregation/pagination fails as a whole rather than
  returning partial results. Annual event/date/color indexing validates the
  candidate before it is published to memory or the shared cache.
- Edits, added events, cancellations and genuine empty calendars replace the
  complete old generation. There is no merge that could resurrect deletions.
- A failed or invalid refresh preserves the last complete valid data while it
  is under 15 minutes old. It is returned as `STALE-ERROR`, with
  `X-Calendar-Data-State: refresh-failed` and `Cache-Control: private, no-store`.
  Stale month data during refresh is similarly no-store and marked refreshing.
  These diagnostic headers do not add a new status label to the widget design.
- After the retention limit, a failed read returns the existing explicit
  unavailable/error state, not a fabricated empty calendar. Neither failed
  refreshes nor cache hits extend the previous snapshot's deadline.
- A 15-second non-sliding error backoff avoids repeated failing reads during
  rapid navigation. Capacity-limit failures bypass stale-error fallback and
  retain the annual reader's bounded monthly fallback policy.
- Original calendar sources are read-only; no calendar write operation is
  introduced. Retention of cached display data is not a backup of those sources.

## Avoided work

The complete provider result is hashed after each successful read. When it is
byte-identical, the new freshness metadata retains the existing event objects,
annual day index and up to 12 month PNGs. A changed result starts a new set of
views. In-flight responses retain their own freshness metadata. Shared records
contain only events, checksums and deadlines, never render promises or maps.

The cache has at most 50 memory entries, 16 pending provider refreshes, bounded
cache I/O and bounded failures. Shared writes and refreshes run under waitUntil;
cache/lifecycle failures remain optional optimizations. Cross-instance shared
reuse preserves original timestamps. Runtime Cache supplies no distributed
lock, so simultaneous cold misses on different instances may still duplicate
a provider read. A cache eviction may also require a cold read.

## Verification

Cache tests cover immediate stale returns with an unresolved provider, TODAY
waiting on the same operation, single-flight, cross-instance retention,
unchanged rendering reuse, edits/additions/deletions, real empty results,
provider/validation failures, expiry, backoff, corruption, optional-cache
failure and bounded memory. Handler tests check twelve independent month
images, all 37 widget selectors, exact prior PNG output, unchanged refresh
avoiding twelve PNG renders, failed refresh retaining data, explicit expired
errors, monthly capacity fallback, authorization and HEAD. Existing year-v1,
three-month and legacy handler suites continue to pass.

The widget edit changes exactly 62 URL flags from year-v1 to year-v2. All other
fields, scripts, 500 objects, map, Today circles, design and navigation actions
remain identical. Private widget files contain credentials and are excluded
from repository fixtures. No phone transition time is claimed from these tests.

```sh
node tools/test-calendar-annual-cache.mjs
node tools/test-calendar-fast-year-handler.mjs
node tools/test-calendar-year-handler.mjs
node tools/test-calendar-month-handler.mjs
node tools/test-calendar-provider-cache.mjs
node tools/test-calendar-tab-cache.cjs
python3 tools/build-widget-fast-year.py /private/version6.json /private/output
python3 tools/test-widget-fast-year.py /private/version6.json /private/output
```
