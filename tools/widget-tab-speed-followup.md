# Widget tab follow-up: city and adjacent-month reuse

Repeated tab visits can run the city label's asynchronous fetch again even when
the point is unchanged. Previously the endpoint prohibited client caching, and
a provider success waited up to 400 ms for optional shared-cache persistence.

This change adds a single-entry, at-most-60-second memory path to layer 83204,
keyed by exact numeric coordinates and the complete authenticated endpoint. It
is optional: a new JavaScript context, absent globalThis, or inaccessible cache
uses the existing fetch path. It uses no localStorage and records no history.
Successful HTTP responses also permit private reuse for at most 60 seconds.
Both caches remain bounded by the original observation's one-hour freshness.
Stale-on-error results, invalid timestamps, and failures are never retained by
the new paths. CDN caching remains disabled. Warm memory hits create no fetch,
timeout, or AbortController. Coordinate changes and credential changes bypass
the memory entry. The original four-second timeout and single callback remain.

Shared-cache persistence now runs under Vercel waitUntil, outside the response
dependency chain. Authentication, budget reservation, provider lookup, validation,
one-hour provider freshness, six-hour stale-on-error retention, spelling, and
same-instance request deduplication retain their existing behavior.

Validation:

- JavaScript simulation: 20 consecutive same-point calls in one reusable context
  issue one fetch instead of 20, with identical output. Expiry, movement, key
  rotation, clock rollback, a new/inaccessible context, malformed responses,
  failures, timeouts, and late callbacks are covered.
- Handler simulation: response resolves while cache persistence is unresolved;
  synchronous/asynchronous write failure and lifecycle-registration failure do
  not fail the city result. Shared reuse, single-flight, private TTL boundaries,
  authorization, CORS, method rejection, and stale/error no-store are covered.
- Widget mutations are the city script and an opt-in URL flag on 62 calendar
  source URLs. All other fields, tree order,
  65 internal actions, 500 objects (50 groups), four pages, map, and native Today
  circles are exactly preserved. ZIP/raw-deflate round-trip is checked.
- Rechecked 78 individual target removals across the tab buttons. None preserved
  visible behavior in both reset and persistent-state models. Baseline models
  visit 100 states/473 edges and 28 states/185 edges. These are structural checks,
  not an emulator of Widgy or proof of device behavior.

No iPhone timing improvement has been measured. Whether Widgy reuses JavaScript
contexts or honors HTTP caching must be established on the phone. This patch
reduces avoidable work where those paths are available; it does not promise
instant transitions or a particular percentage improvement. The count of
JavaScript sources remains 88. Native month-offset serialization and additive
button serialization were not established by the inspected exports, so this
patch does not invent either. In particular, month reset lists are preserved.

Run from repository root:

```sh
node tools/test-widget-city-fast-path.cjs /private/current-widget.json
node tools/test-location-tab-cache.mjs
python3 tools/build-widget-city-fast-path.py /private/current-widget.json /private/output
python3 tools/test-widget-city-fast-path.py /private/current-widget.json /private/output
```

Private widget inputs and outputs contain account-bound endpoint keys. They are
not repository fixtures and must not be committed.

## Adjacent-month navigation

The widget opts into `reuse=months-v1` for calendar sources. One provider read
covers at most three adjacent display months, including their overflow days.
The central bucket covers previous/current/next; all buckets remain inside the
existing offset range -12..12. No extra prefetch request is launched. Navigating
inside a fresh bucket uses the same provider result, while each month keeps its
own rendered PNG and prepared day index. Provider freshness stays at 60 seconds;
private device caching and timed TODAY/agenda transitions keep their prior
bounds. Cache keys include the exact sealed token and full window boundaries.
Legacy URLs keep their monthly behavior. Provider capacity failures retry the
original monthly range; ordinary provider failures remain failures.

Validation uses the pinned Luxon 3.7.2, ical.js 2.2.1 and sharp 0.34.5:

- 40,000 coverage cases span a full Gregorian leap-year cycle and all offsets.
- Jerusalem/New York/Kiritimati cases include DST, year transitions and leap day.
- Monthly and pooled iCalendar recurrence/all-day results produce identical
  requested day lists, TODAY snapshots, and 30 byte-identical PNG comparisons.
- Handler tests show 3 simultaneous adjacent months sharing 1 provider read;
  all 25 offsets use 9 provider reads within one freshness window. These are
  simulated provider counts, not measurements of phone switching time.
- Separate month PNG caches, exact legacy JSON/PNG equivalence, cross-instance
  reuse, token isolation, original TTL expiry, dense-calendar fallback,
  authentication-before-cache, HEAD requests and year rollover are checked.

Run the additional checks:

```sh
node tools/test-calendar-month-window.mjs
node tools/test-calendar-month-handler.mjs
node tools/test-calendar-tab-cache.cjs
node tools/test-calendar-provider-cache.mjs
```
